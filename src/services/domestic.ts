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

/**
 * Domestic shipping service for Poland
 */
export class DomesticService {
  constructor(private readonly client: DPDClient) {}

  /**
   * Generates package numbers and waybills for domestic shipments
   *
   * @param packages - Array of domestic packages to process
   * @returns Package generation response with waybills and parcel IDs
   * @throws {DPDServiceError} When SOAP API call fails or response is invalid
   * @example
   * ```typescript
   * const result = await client.domestic.generatePackageNumbers([
   *   {
   *     sender: { name: 'Sender', postalCode: '00-001', city: 'Warsaw' },
   *     receiver: { name: 'Receiver', postalCode: '01-001', city: 'Krakow' },
   *     parcels: [{ weight: 1.5, content: 'Documents' }]
   *   }
   * ]);
   * console.log(result.packages[0].waybill);
   * ```
   */
  async generatePackageNumbers(
    packages: DomesticPackage[]
  ): Promise<PackageGenerationResponse> {
    const validatedPackages = packages.map(pkg =>
      validateInput(DomesticPackageSchema, pkg)
    );

    const soapClient = this.client.getSoapClient();
    const config = this.client.getConfig();

    const payload = {
      authDataV1: config.auth,
      openUMLFeV11: this.buildOpenUMLPayload(
        validatedPackages as Array<
          Omit<DomesticPackage, 'payerType'> & {
            payerType: 'SENDER' | 'RECEIVER' | 'THIRD_PARTY';
          }
        >
      ),
      pkgNumsGenerationPolicyV1: 'STOP_ON_FIRST_ERROR',
      langCode: 'PL',
    };

    const rawResult = await invokeSoapMethod(
      soapClient,
      'generatePackagesNumbersV9',
      payload
    );

    // Check for API-level errors
    if (rawResult && typeof rawResult === 'object' && 'return' in rawResult) {
      const response = rawResult.return as Record<string, unknown>;
      if (response.Status && response.Status !== 'OK') {
        const errorMsg =
          response.StatusInfo || response.Status || 'Unknown error';
        throw new DPDServiceError(
          `DPD API Error: ${String(errorMsg)}`,
          'API_ERROR',
          response
        );
      }
    }

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

  /**
   * Generates shipping labels for existing waybills
   *
   * @param waybills - Array of waybill numbers
   * @param options - Label generation options (format, page format, variant)
   * @returns Label response with base64-encoded document data
   * @throws {DPDServiceError} When SOAP API call fails or response is invalid
   * @example
   * ```typescript
   * const label = await client.domestic.generateLabels(
   *   ['1234567890'],
   *   { format: 'PDF', pageFormat: 'A4' }
   * );
   * // Save or display label.labelData
   * ```
   */
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
        authDataV1: config.auth,
        dpdServicesParamsV1: { waybills },
        outputDocFormatV1: options.format || 'PDF',
        outputDocPageFormatV1: options.pageFormat || 'A4',
        outputLabelType: 'LABEL',
        labelVariant: options.variant || 'BIC3',
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

  /**
   * Generates collection protocol for waybills
   *
   * @param waybills - Array of waybill numbers
   * @returns Protocol response with document data and session ID
   * @throws {DPDServiceError} When SOAP API call fails or response is invalid
   */
  async generateProtocol(waybills: string[]): Promise<ProtocolResponse> {
    const soapClient = this.client.getSoapClient();
    const config = this.client.getConfig();

    const rawResult = await invokeSoapMethod(soapClient, 'generateProtocolV2', {
      authDataV1: config.auth,
      dpdServicesParamsV1: { waybills },
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

  /**
   * Requests courier pickup for packages
   *
   * @param params - Pickup parameters (date, time window, optional waybills)
   * @returns Pickup call response with pickup ID and status
   * @throws {DPDServiceError} When SOAP API call fails or response is invalid
   * @example
   * ```typescript
   * const pickup = await client.domestic.pickupCall({
   *   pickupDate: '2025-10-23',
   *   pickupTimeFrom: '09:00',
   *   pickupTimeTo: '12:00'
   * });
   * console.log(pickup.pickupId);
   * ```
   */
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
        authDataV1: config.auth,
        ...params,
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
    const config = this.client.getConfig();
    // DPD expects single package, not array
    const pkg = packages[0];
    if (!pkg) {
      throw new Error('At least one package is required');
    }
    
    // DPD expects single parcel object, not array
    const firstParcel = pkg.parcels[0];
    if (!firstParcel) {
      throw new Error('At least one parcel is required');
    }
    
    return {
      packages: {
        parcels: {
          content: firstParcel.content || '1234567890123456789',
          customerData1: firstParcel.customerData1 || 'Uwagi dla kuriera 1',
          customerData2: firstParcel.customerData2 || 'Uwagi dla kuriera 2',
          customerData3: firstParcel.customerData3 || 'Uwagi dla kuriera 3',
          sizeX: firstParcel.sizeX || 10,
          sizeY: firstParcel.sizeY || 10,
          sizeZ: firstParcel.sizeZ || 10,
          weight: firstParcel.weight,
        },
        payerType: pkg.payerType || 'SENDER',
        thirdPartyFID:
          pkg.payerType === 'THIRD_PARTY'
            ? pkg.thirdPartyFid || config.auth.masterFid
            : undefined,
        ref1: pkg.ref1 || 'ref1_abc',
        ref2: pkg.ref2 || 'ref2_def',
        ref3: pkg.ref3 || 'ref3_ghi',
        sender: pkg.sender,
        receiver: pkg.receiver,
        services: {},
      },
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
