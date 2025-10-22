import { describe, it, expect } from 'vitest';
import { DPDClient } from '../src/client';
import * as dotenv from 'dotenv';

// Load .env file
dotenv.config();

describe('DPD SDK - Real API Integration', () => {
  const client = new DPDClient({
    environment: 'production',
    auth: {
      login: process.env.DPD_PROD_LOGIN || '',
      password: process.env.DPD_PROD_PASSWORD || '',
      masterFid: process.env.DPD_PROD_MASTER_FID || '',
    },
  });

  it('should initialize SOAP client', async () => {
    await expect(client.initialize()).resolves.not.toThrow();
  });

  it('should generate domestic package numbers', async () => {
    await client.initialize();

    const packages = [
      {
        sender: {
          name: 'Ematu Test Sender',
          address: 'Marszalkowska 1',
          city: 'Warszawa',
          postalCode: '00-001',
          countryCode: 'PL',
          phone: '+48223456789',
          email: 'test@ematu.com',
        },
        receiver: {
          name: 'Test Receiver',
          address: 'Krakowska 10',
          city: 'Krakow',
          postalCode: '30-001',
          countryCode: 'PL',
          phone: '+48123456789',
          email: 'receiver@test.com',
        },
        parcels: [
          {
            weight: 1.5,
            content: 'Test Package',
          },
        ],
        payerType: 'SENDER' as const,
      },
    ];

    const result = await client.domestic.generatePackageNumbers(packages);

    expect(result.packages).toBeDefined();
    expect(result.packages.length).toBeGreaterThan(0);
    expect(result.packages[0].waybill).toBeDefined();
    expect(result.packages[0].packageId).toBeDefined();

    console.log('Generated waybill:', result.packages[0].waybill);
    console.log('Package ID:', result.packages[0].packageId);
  }, 30000);

  it('should get postcode info', async () => {
    await client.initialize();

    const info = await client.tracking.getPostcodeInfo('00-001', 'PL');

    expect(info.postcode).toBe('00-001');
    expect(info.city).toBeDefined();
    expect(info.countryCode).toBe('PL');

    console.log('City:', info.city);
    console.log('Depot:', info.depot);
  }, 30000);

  it('should find PUDO parcel shops', async () => {
    await client.initialize();

    const shops = await client.pudo.findParcelShops({
      city: 'Warszawa',
      countryCode: 'PL',
      limit: 5,
    });

    expect(shops).toBeDefined();
    expect(shops.length).toBeGreaterThan(0);
    expect(shops[0].name).toBeDefined();
    expect(shops[0].address).toBeDefined();

    console.log('Found shops:', shops.length);
    console.log('First shop:', shops[0].name);
  }, 30000);
});
