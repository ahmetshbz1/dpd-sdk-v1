import type { DPDClient } from '../client.js';
import type {
  Address,
  LabelFormat,
  PageFormat,
  LabelResponse,
} from '../types/index.js';
import { AddressSchema } from '../types/address.js';
import { validateInput } from '../utils/validation.js';
import { invokeSoapMethod } from '../utils/soap-client.js';
import { z } from 'zod';

// SOAP response validation schema
const LabelResponseSchema = z.object({
  documentData: z.string(),
});

export class ReturnService {
  constructor(private readonly client: DPDClient) {}

  async generateDomesticReturnLabel(
    waybills: string[],
    receiver: Address,
    options: {
      format?: LabelFormat;
      pageFormat?: PageFormat;
      variant?: string;
    } = {}
  ): Promise<LabelResponse> {
    const validatedReceiver = validateInput(AddressSchema, receiver);
    const soapClient = this.client.getSoapClient();
    const config = this.client.getConfig();

    const result = await invokeSoapMethod<unknown>(
      soapClient,
      'generateDomesticReturnLabelV1',
      {
        returnedWaybillsV1: { waybill: waybills },
        receiver: validatedReceiver,
        outputDocFormatV1: options.format || 'PDF',
        outputDocPageFormatV1: options.pageFormat || 'A4',
        outputLabelType: 'RETURN',
        labelVariant: options.variant,
        authDataV1: config.auth,
      }
    );

    return this.parseLabelResponse(result, options.format, options.pageFormat);
  }

  async generateInternationalReturnLabel(
    waybills: string[],
    receiver: Address,
    options: {
      format?: LabelFormat;
      pageFormat?: PageFormat;
      variant?: string;
    } = {}
  ): Promise<LabelResponse> {
    const validatedReceiver = validateInput(AddressSchema, receiver);
    const soapClient = this.client.getSoapClient();
    const config = this.client.getConfig();

    const result = await invokeSoapMethod<unknown>(
      soapClient,
      'generateReturnLabelV1',
      {
        returnedWaybillsV1: { waybill: waybills },
        receiver: validatedReceiver,
        outputDocFormatV1: options.format || 'PDF',
        outputDocPageFormatV1: options.pageFormat || 'A4',
        outputLabelType: 'RETURN',
        labelVariant: options.variant,
        authDataV1: config.auth,
      }
    );

    return this.parseLabelResponse(result, options.format, options.pageFormat);
  }

  private parseLabelResponse(
    result: unknown,
    format?: LabelFormat,
    pageFormat?: PageFormat
  ): LabelResponse {
    const parsed = LabelResponseSchema.safeParse(result);

    if (!parsed.success) {
      throw new Error(
        `Invalid return label response format: ${parsed.error.message}`
      );
    }

    return {
      labelData: parsed.data.documentData,
      format: format || 'PDF',
      pageFormat: pageFormat || 'A4',
    };
  }
}
