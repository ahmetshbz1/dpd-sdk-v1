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

    const result = await invokeSoapMethod<{ documentData?: string }>(
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

    const result = await invokeSoapMethod<{ documentData?: string }>(
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
    result: { documentData?: string },
    format?: LabelFormat,
    pageFormat?: PageFormat
  ): LabelResponse {
    return {
      labelData: result.documentData || '',
      format: format || 'PDF',
      pageFormat: pageFormat || 'A4',
    };
  }
}
