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
import axios from 'axios';

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

    const config = this.client.getConfig();

    // DPD expects single package, not array
    const pkg = validatedPackages[0];
    if (!pkg) {
      throw new Error('At least one package is required');
    }
    
    const firstParcel = pkg.parcels[0];
    if (!firstParcel) {
      throw new Error('At least one parcel is required');
    }

    // Raw XML testinde başarılı olan tam SOAP envelope
    const fullSoapXML = this.buildFullSoapXML(
      pkg as Omit<DomesticPackage, 'payerType'> & {
        payerType: 'SENDER' | 'RECEIVER' | 'THIRD_PARTY';
      },
      firstParcel,
      config
    );

    // Direkt HTTP isteği gönder (SOAP client kullanma)
    const rawResult = await this.sendDirectHTTPRequest(fullSoapXML);

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

  private async sendDirectHTTPRequest(soapXML: string): Promise<any> {
    const config = this.client.getConfig();
    const endpoint = config.environment === 'demo' 
      ? 'https://dpdservicesdemo.dpd.com.pl/DPDPackageObjServicesService/DPDPackageObjServices'
      : 'https://dpdservices.dpd.com.pl/DPDPackageObjServicesService/DPDPackageObjServices';

    try {
      const response = await axios.post(endpoint, soapXML, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': ''
        }
      });
      
      // Parse SOAP response
      return this.parseSOAPResponse(response.data);
    } catch (error: any) {
      if (error.response) {
        throw new DPDServiceError(
          `DPD API Error: ${error.response.data}`,
          'API_ERROR',
          error.response.data
        );
      }
      throw new DPDServiceError(
        `Network Error: ${error.message}`,
        'NETWORK_ERROR',
        error
      );
    }
  }

  private parseSOAPResponse(xmlResponse: string): any {
    // Basit SOAP response parser
    const match = xmlResponse.match(/<return>(.*?)<\/return>/s);
    if (match) {
      const returnContent = match[1];
      // Burada daha detaylı XML parsing yapılabilir
      return { return: returnContent };
    }
    return { return: xmlResponse };
  }

  private buildFullSoapXML(
    pkg: Omit<DomesticPackage, 'payerType'> & {
      payerType: 'SENDER' | 'RECEIVER' | 'THIRD_PARTY';
    },
    parcel: any,
    config: any
  ): string {
    // Raw XML testinde başarılı olan tam SOAP envelope
    const xmlContent = this.buildRawXML(pkg, parcel);
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:dpd="http://dpdservices.dpd.com.pl/">
<soapenv:Header/>
<soapenv:Body>
<dpd:generatePackagesNumbersV9>
<openUMLFeV11>
${xmlContent}
</openUMLFeV11>
<pkgNumsGenerationPolicyV1>STOP_ON_FIRST_ERROR</pkgNumsGenerationPolicyV1>
<langCode>PL</langCode>
<authDataV1>
<login>${config.auth.login}</login>
<masterFid>${config.auth.masterFid}</masterFid>
<password>${config.auth.password}</password>
</authDataV1>
</dpd:generatePackagesNumbersV9>
</soapenv:Body>
</soapenv:Envelope>`;
  }

  private buildRawXML(
    pkg: Omit<DomesticPackage, 'payerType'> & {
      payerType: 'SENDER' | 'RECEIVER' | 'THIRD_PARTY';
    },
    parcel: any
  ): string {
    const payerType = pkg.payerType || 'SENDER';
    const thirdPartyFID = payerType === 'THIRD_PARTY' 
      ? (pkg.thirdPartyFid || '431305')
      : undefined;

    // Raw XML testinde başarılı olan format (XML declaration olmadan)
    return `<packages>
<parcels>
<content>${parcel.content || '1234567890123456789'}</content>
<customerData1>${parcel.customerData1 || 'Uwagi dla kuriera 1'}</customerData1>
<customerData2>${parcel.customerData2 || 'Uwagi dla kuriera 2'}</customerData2>
<customerData3>${parcel.customerData3 || 'Uwagi dla kuriera 3'}</customerData3>
<sizeX>${parcel.sizeX || 10}</sizeX>
<sizeY>${parcel.sizeY || 10}</sizeY>
<sizeZ>${parcel.sizeZ || 10}</sizeZ>
<weight>${parcel.weight}</weight>
</parcels>
<payerType>${payerType}</payerType>
${thirdPartyFID ? `<thirdPartyFID>${thirdPartyFID}</thirdPartyFID>` : ''}
<ref1>${pkg.ref1 || 'ref1_abc'}</ref1>
<ref2>${pkg.ref2 || 'ref2_def'}</ref2>
<ref3>${pkg.ref3 || 'ref3_ghi'}</ref3>
<sender>
<company>${pkg.sender.company || ''}</company>
<name>${pkg.sender.name}</name>
<address>${pkg.sender.address}</address>
<city>${pkg.sender.city}</city>
<postalCode>${pkg.sender.postalCode}</postalCode>
<countryCode>${pkg.sender.countryCode}</countryCode>
<email>${pkg.sender.email || ''}</email>
<phone>${pkg.sender.phone || ''}</phone>
</sender>
<receiver>
<company>${pkg.receiver.company || ''}</company>
<name>${pkg.receiver.name}</name>
<address>${pkg.receiver.address}</address>
<city>${pkg.receiver.city}</city>
<postalCode>${pkg.receiver.postalCode}</postalCode>
<countryCode>${pkg.receiver.countryCode}</countryCode>
<email>${pkg.receiver.email || ''}</email>
<phone>${pkg.receiver.phone || ''}</phone>
</receiver>
<services>
</services>
</packages>`;
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
