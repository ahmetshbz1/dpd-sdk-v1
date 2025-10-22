import type { DPDClient } from '../client.js';
import type {
  DomesticPackage,
  LabelFormat,
  PageFormat,
  PackageGenerationResponse,
  LabelResponse,
  ProtocolResponse,
  CourierPickupResponse,
} from '../types/index.js';
import { DomesticPackageSchema } from '../types/package.js';
import {
  PackageGenerationSoapResponseSchema,
  LabelGenerationSoapResponseSchema,
  ProtocolSoapResponseSchema,
  CourierPickupSoapResponseSchema,
} from '../types/soap-responses.js';
import { validateInput } from '../utils/validation.js';
import { invokeSoapMethod } from '../utils/soap-client.js';
import { DPDServiceError } from '../types/errors.js';

export class DomesticService {
  constructor(private readonly client: DPDClient) {}

  async generatePackageNumbers(
    packages: DomesticPackage[]
  ): Promise<PackageGenerationResponse> {
    const validatedPackages = packages.map(pkg =>
      validateInput(DomesticPackageSchema, pkg)
    );

    const soapClient = this.client.getSoapClient();
    const config = this.client.getConfig();

    const rawResult = await invokeSoapMethod(
      soapClient,
      'generatePackagesNumbersV9',
      {
        openUMLFeV11: this.buildOpenUMLPayload(
          validatedPackages as Array<
            Omit<DomesticPackage, 'payerType'> & {
              payerType: 'SENDER' | 'RECEIVER' | 'THIRD_PARTY';
            }
          >
        ),
        pkgNumsGenerationPolicyV1: 'STOP_ON_FIRST_ERROR',
        langCode: 'PL',
        authDataV1: config.auth,
      }
    );

    // Runtime validation with Zod
    const parseResult =
      PackageGenerationSoapResponseSchema.safeParse(rawResult);
    if (!parseResult.success) {
      throw new DPDServiceError(
        'Invalid SOAP response format',
        'INVALID_RESPONSE',
        parseResult.error
      );
    }

    return this.parsePackageGenerationResponse(parseResult.data);
  }

  async generateLabels(
    waybills: string[],
    options: {
      format?: LabelFormat;
      pageFormat?: PageFormat;
      variant?: string;
    } = {}
  ): Promise<LabelResponse> {
    const soapClient = this.client.getSoapClient();
    const config = this.client.getConfig();

    const rawResult = await invokeSoapMethod(
      soapClient,
      'generateSpedLabelsV4',
      {
        dpdServicesParamsV1: { waybills },
        outputDocFormatV1: options.format || 'PDF',
        outputDocPageFormatV1: options.pageFormat || 'A4',
        outputLabelType: 'LABEL',
        labelVariant: options.variant || 'BIC3',
        authDataV1: config.auth,
      }
    );

    const parseResult = LabelGenerationSoapResponseSchema.safeParse(rawResult);
    if (!parseResult.success) {
      throw new DPDServiceError(
        'Invalid label response format',
        'INVALID_RESPONSE',
        parseResult.error
      );
    }

    return this.parseLabelResponse(
      parseResult.data,
      options.format,
      options.pageFormat
    );
  }

  async generateProtocol(waybills: string[]): Promise<ProtocolResponse> {
    const soapClient = this.client.getSoapClient();
    const config = this.client.getConfig();

    const rawResult = await invokeSoapMethod(soapClient, 'generateProtocolV2', {
      dpdServicesParamsV1: { waybills },
      authDataV1: config.auth,
    });

    const parseResult = ProtocolSoapResponseSchema.safeParse(rawResult);
    if (!parseResult.success) {
      throw new DPDServiceError(
        'Invalid protocol response format',
        'INVALID_RESPONSE',
        parseResult.error
      );
    }

    return {
      protocolData: parseResult.data.documentData,
      sessionId: parseResult.data.sessionId,
    };
  }

  async pickupCall(params: {
    pickupDate: string;
    pickupTimeFrom: string;
    pickupTimeTo: string;
    waybills?: string[];
  }): Promise<CourierPickupResponse> {
    const soapClient = this.client.getSoapClient();
    const config = this.client.getConfig();

    const rawResult = await invokeSoapMethod(
      soapClient,
      'packagesPickupCallV4',
      {
        ...params,
        authDataV1: config.auth,
      }
    );

    const parseResult = CourierPickupSoapResponseSchema.safeParse(rawResult);
    if (!parseResult.success) {
      throw new DPDServiceError(
        'Invalid pickup response format',
        'INVALID_RESPONSE',
        parseResult.error
      );
    }

    return {
      pickupId: parseResult.data.pickupCallId,
      status: parseResult.data.status,
      pickupDate: params.pickupDate,
    };
  }

  private buildOpenUMLPayload(
    packages: Array<
      Omit<DomesticPackage, 'payerType'> & {
        payerType: 'SENDER' | 'RECEIVER' | 'THIRD_PARTY';
      }
    >
  ): unknown {
    return {
      packages: packages.map(pkg => ({
        sender: pkg.sender,
        receiver: pkg.receiver,
        parcels: pkg.parcels,
        payerType: pkg.payerType || 'SENDER',
        thirdPartyFID: pkg.thirdPartyFid,
        ref1: pkg.ref1,
        ref2: pkg.ref2,
        ref3: pkg.ref3,
        services: pkg.services,
      })),
    };
  }

  private parsePackageGenerationResponse(result: {
    packages?: Array<{
      packageId: string;
      parcels: Array<{ parcelId: string }>;
      waybill: string;
      status?: string;
    }>;
  }): PackageGenerationResponse {
    return {
      packages: (result.packages || []).map(pkg => ({
        packageId: pkg.packageId,
        parcelIds: pkg.parcels.map(p => p.parcelId),
        waybill: pkg.waybill,
        status: pkg.status ? { status: pkg.status } : undefined,
        sessionId: undefined,
      })),
    };
  }

  private parseLabelResponse(
    result: { documentData: string },
    format?: LabelFormat,
    pageFormat?: PageFormat
  ): LabelResponse {
    return {
      labelData: result.documentData,
      format: format || 'PDF',
      pageFormat: pageFormat || 'A4',
    };
  }
}
