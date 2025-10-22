import { z } from 'zod';
import { DPDClient } from './client.js';
import type { DPDConfig } from './types/auth.js';
import type { LabelFormat, PageFormat } from './types/index.js';

// High-level SDK types (kept minimal and within 300 lines)
export interface CreateLabelRequest {
  sender: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    countryCode: string;
    phone?: string;
    email?: string;
  };
  receiver: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    countryCode: string;
    phone?: string;
    email?: string;
  };
  pkg: {
    weight: number;
    content?: string;
  };
  label?: {
    format?: LabelFormat;
    pageFormat?: PageFormat;
    variant?: string;
  };
}

export interface LabelResult {
  waybill: string;
  pdfBase64: string;
  trackingUrl: string;
  createdAt: string;
}

const AddressSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  countryCode: z.string().length(2),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

const CreateLabelRequestSchema: z.ZodType<CreateLabelRequest> = z.object({
  sender: AddressSchema as z.ZodType<CreateLabelRequest['sender']>,
  receiver: AddressSchema as z.ZodType<CreateLabelRequest['receiver']>,
  pkg: z.object({
    weight: z.number().positive(),
    content: z.string().optional(),
  }) as z.ZodType<CreateLabelRequest['pkg']>,
  label: z
    .object({
      format: z.custom<LabelFormat>().optional(),
      pageFormat: z.custom<PageFormat>().optional(),
      variant: z.string().optional(),
    })
    .optional() as z.ZodType<CreateLabelRequest['label']>,
});

export class DPDSDK {
  private readonly client: DPDClient;

  constructor(config: DPDConfig) {
    this.client = new DPDClient(config);
  }

  // Labels: 2-step flow (generatePackagesNumbersV9 -> generateSpedLabelsV4)
  async createLabel(req: CreateLabelRequest): Promise<LabelResult> {
    const r = CreateLabelRequestSchema.parse(req);

    // Build domestic package
    const domesticPkg = {
      sender: r.sender,
      receiver: r.receiver,
      parcels: [
        {
          weight: r.pkg.weight,
          content: r.pkg.content,
        },
      ],
      payerType: 'SENDER' as const,
    };

    // Step 1: generate package number
    const gen = await this.client.domestic.generatePackageNumbers([
      domesticPkg,
    ]);
    const pkg = gen.packages?.[0];
    if (!pkg?.waybill) {
      throw new Error('Waybill not returned by DPD API');
    }

    // Step 2: generate label PDF
    const label = await this.client.domestic.generateLabels([pkg.waybill], {
      format: (r.label?.format || 'PDF') as LabelFormat,
      pageFormat: (r.label?.pageFormat || 'A4') as PageFormat,
      variant: r.label?.variant || 'BIC3',
    });

    return {
      waybill: pkg.waybill,
      pdfBase64: label.labelData,
      trackingUrl: `https://tracktrace.dpd.com.pl/findPackage?q=${pkg.waybill}`,
      createdAt: new Date().toISOString(),
    };
  }

  async createLabelsBatch(
    reqs: CreateLabelRequest[]
  ): Promise<{
    labels: LabelResult[];
    errors: { index: number; error: string }[];
  }> {
    const labels: LabelResult[] = [];
    const errors: { index: number; error: string }[] = [];

    for (let i = 0; i < reqs.length; i++) {
      try {
        const res = await this.createLabel(reqs[i]);
        labels.push(res);
      } catch (e) {
        errors.push({
          index: i,
          error: e instanceof Error ? e.message : 'Unknown error',
        });
      }
    }
    return { labels, errors };
  }

  // Tracking (simple wrapper)
  async getTracking(
    waybill: string
  ): Promise<{ waybill: string; status: string }> {
    const st = await this.client.tracking.getParcelStatus(waybill);
    return { waybill: st.waybill, status: st.status };
  }

  // Pickups (simple wrapper)
  async createPickup(params: {
    pickupDate: string;
    pickupTimeFrom: string;
    pickupTimeTo: string;
    waybills?: string[];
  }): Promise<{ pickupId: string; status: string; pickupDate: string }> {
    const res = await this.client.domestic.pickupCall(params);
    return res;
  }

  getConfig(): DPDConfig {
    return this.client.getConfig();
  }
}
