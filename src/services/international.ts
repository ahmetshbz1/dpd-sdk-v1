import type { DPDClient } from '../client.js';
import type {
  InternationalPackage,
  PackageGenerationResponse,
} from '../types/index.js';
import { InternationalPackageSchema } from '../types/package.js';
import { validateInput } from '../utils/validation.js';
import { invokeSoapMethod } from '../utils/soap-client.js';

export class InternationalService {
  constructor(private readonly client: DPDClient) {}

  async generatePackageNumbers(
    packages: InternationalPackage[]
  ): Promise<PackageGenerationResponse> {
    const validatedPackages = packages.map(pkg =>
      validateInput(InternationalPackageSchema, pkg)
    );

    const soapClient = this.client.getSoapClient();
    const config = this.client.getConfig();

    const result = await invokeSoapMethod<{
      packages?: Array<{
        packageId?: string;
        parcels?: Array<{ parcelId?: string }>;
        waybill?: string;
        status?: string;
      }>;
    }>(
      soapClient,
      'generateInternationalPackageNumbersV1',
      {
        internationalOpenUMLFeV1: this.buildInternationalPayload(
          validatedPackages as Array<Omit<InternationalPackage, 'payerType'> & { payerType: 'SENDER' | 'RECEIVER' | 'THIRD_PARTY' }>
        ),
        authDataV1: config.auth,
      }
    );

    return this.parsePackageGenerationResponse(result);
  }

  private buildInternationalPayload(packages: Array<Omit<InternationalPackage, 'payerType'> & { payerType: 'SENDER' | 'RECEIVER' | 'THIRD_PARTY' }>): unknown {
    return {
      packages: packages.map(pkg => ({
        sender: pkg.sender,
        receiver: pkg.receiver,
        parcels: pkg.parcels.map(parcel => ({
          content: parcel.content,
          customerData1: parcel.customerData1,
          customerData2: parcel.customerData2,
          customerData3: parcel.customerData3,
          sizeX: parcel.sizeX,
          sizeY: parcel.sizeY,
          sizeZ: parcel.sizeZ,
          weight: parcel.weight,
        })),
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
      packageId?: string;
      parcels?: Array<{ parcelId?: string }>;
      waybill?: string;
      status?: string;
    }>;
  }): PackageGenerationResponse {
    return {
      packages: result.packages?.map(pkg => ({
        packageId: pkg.packageId || '',
        parcelIds: pkg.parcels?.map(p => p.parcelId || '') || [],
        waybill: pkg.waybill || '',
        status: pkg.status ? { status: pkg.status } : undefined,
        sessionId: undefined,
      })) || [],
    };
  }
}
