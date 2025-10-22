import type { DPDClient } from '../client.js';
import { z } from 'zod';

// PUDO pickup point bilgisi
export interface ParcelShop {
  parcelShopId: number;
  pudoId: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  countryCode: string;
  latitude?: number;
  longitude?: number;
  openingHours?: string;
  services?: string[];
  distance?: number;
}

// SOAP response validation schemas
const ParcelShopSchema = z.object({
  parcelShopId: z.number(),
  pudoId: z.string(),
  name: z.string(),
  address: z.string(),
  city: z.string(),
  postalCode: z.string(),
  countryCode: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  openingHours: z.string().optional(),
  services: z.array(z.string()).optional(),
  distance: z.number().optional(),
});

const ParcelShopsResponseSchema = z.object({
  parcelShops: z.array(z.unknown()),
});

// PUDO arama parametreleri
export interface ParcelShopSearchParams {
  address?: string;
  city?: string;
  postalCode?: string;
  countryCode: string;
  limit?: number;
  services?: string[];
  hideClosed?: boolean;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

export class PudoService {
  private readonly baseUrl: string;

  constructor(private readonly client: DPDClient) {
    const config = this.client.getConfig();
    this.baseUrl =
      config.environment === 'demo'
        ? 'https://mypudo-demo.dpd.com.pl/api/v2'
        : 'https://mypudo.dpd.com.pl/api/v2';
  }

  async findParcelShops(params: ParcelShopSearchParams): Promise<ParcelShop[]> {
    const config = this.client.getConfig();

    // API parametrelerini hazırla
    const searchParams = new URLSearchParams();
    if (params.address) searchParams.set('address', params.address);
    if (params.city) searchParams.set('city', params.city);
    if (params.postalCode) searchParams.set('postalCode', params.postalCode);
    searchParams.set('countryCode', params.countryCode);
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.hideClosed !== undefined)
      searchParams.set('hideClosed', params.hideClosed.toString());
    if (params.latitude)
      searchParams.set('latitude', params.latitude.toString());
    if (params.longitude)
      searchParams.set('longitude', params.longitude.toString());
    if (params.radius) searchParams.set('radius', params.radius.toString());

    const response = await fetch(
      `${this.baseUrl}/parcelshops?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.auth.login}:${config.auth.password}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `PUDO API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const parsed = ParcelShopsResponseSchema.safeParse(data);

    if (!parsed.success) {
      throw new Error(
        `Invalid PUDO parcel shops response format: ${parsed.error.message}`
      );
    }

    return this.parseParcelShops(parsed.data.parcelShops);
  }

  async getParcelShop(pudoId: string): Promise<ParcelShop | null> {
    const config = this.client.getConfig();

    const response = await fetch(`${this.baseUrl}/parcelshops/${pudoId}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.auth.login}:${config.auth.password}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(
        `PUDO API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const shops = this.parseParcelShops([data]);
    return shops[0] || null;
  }

  private parseParcelShops(data: unknown[]): ParcelShop[] {
    return data.map((item: unknown) => {
      const parsed = ParcelShopSchema.safeParse(item);

      if (!parsed.success) {
        throw new Error(
          `Invalid parcel shop data format: ${parsed.error.message}`
        );
      }

      return parsed.data;
    });
  }
}
