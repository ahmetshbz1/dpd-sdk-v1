import type { DPDClient } from '../client.js';
import { invokeSoapMethod } from '../utils/soap-client.js';
import { z } from 'zod';

// Gönderi durum bilgisi
export interface ParcelStatus {
  waybill: string;
  status: string;
  statusCode?: string;
  statusDescription?: string;
  lastUpdate?: string;
  events?: Array<{
    date: string;
    description: string;
    location?: string;
  }>;
}

// Posta kodu bilgisi
export interface PostcodeInfo {
  postcode: string;
  city: string;
  countryCode: string;
  depot?: string;
}

// SOAP response validation schemas
const ParcelEventSchema = z.object({
  date: z.string(),
  description: z.string(),
  location: z.string().optional(),
});

const ParcelStatusResponseSchema = z.object({
  parcel: z.object({
    waybill: z.string(),
    status: z.string(),
    statusCode: z.string().optional(),
    statusDescription: z.string().optional(),
    lastUpdate: z.string().optional(),
    events: z.array(ParcelEventSchema).optional(),
  }),
});

const PostcodeInfoResponseSchema = z.object({
  postcode: z.string(),
  city: z.string(),
  countryCode: z.string(),
  depot: z.string().optional(),
});

export class TrackingService {
  constructor(private readonly client: DPDClient) {}

  async getParcelStatus(waybill: string): Promise<ParcelStatus> {
    const soapClient = this.client.getSoapClient();
    const config = this.client.getConfig();

    const result = await invokeSoapMethod<unknown>(
      soapClient,
      'getParcelStatus',
      {
        waybill,
        authDataV1: config.auth,
      }
    );

    const parsed = ParcelStatusResponseSchema.safeParse(result);

    if (!parsed.success) {
      throw new Error(
        `Invalid parcel status response format: ${parsed.error.message}`
      );
    }

    return {
      waybill: parsed.data.parcel.waybill,
      status: parsed.data.parcel.status,
      statusCode: parsed.data.parcel.statusCode,
      statusDescription: parsed.data.parcel.statusDescription,
      lastUpdate: parsed.data.parcel.lastUpdate,
      events: parsed.data.parcel.events,
    };
  }

  async getPostcodeInfo(
    postcode: string,
    countryCode: string = 'PL'
  ): Promise<PostcodeInfo> {
    const soapClient = this.client.getSoapClient();
    const config = this.client.getConfig();

    const result = await invokeSoapMethod<unknown>(
      soapClient,
      'getPostcodeInfo',
      {
        postcode,
        countryCode,
        authDataV1: config.auth,
      }
    );

    const parsed = PostcodeInfoResponseSchema.safeParse(result);

    if (!parsed.success) {
      throw new Error(
        `Invalid postcode info response format: ${parsed.error.message}`
      );
    }

    return parsed.data;
  }
}
