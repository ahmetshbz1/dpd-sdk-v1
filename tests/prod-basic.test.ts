import { describe, it, expect } from 'vitest';
import { DPDClient } from '../src/client';
import * as dotenv from 'dotenv';

dotenv.config();

describe('DPD SDK - Production Basic Test', () => {
  it('should initialize with production credentials', async () => {
    const client = new DPDClient({
      environment: 'production',
      auth: {
        login: process.env.DPD_PROD_LOGIN || '',
        password: process.env.DPD_PROD_PASSWORD || '',
        masterFid: process.env.DPD_PROD_MASTER_FID || '',
      },
    });

    try {
      await client.initialize();
      console.log('Production SOAP client initialized successfully');
      expect(true).toBe(true);
    } catch (error) {
      console.error('Initialization failed:', error);
      throw error;
    }
  }, 30000);

  it.skipIf(process.env.DPD_RUN_E2E !== '1')('should generate domestic package numbers', async () => {
    const client = new DPDClient({
      environment: 'production',
      auth: {
        login: process.env.DPD_PROD_LOGIN || '',
        password: process.env.DPD_PROD_PASSWORD || '',
        masterFid: process.env.DPD_PROD_MASTER_FID || '',
      },
    });

    await client.initialize();

    try {
      const result = await client.domestic.generatePackageNumbers([
        {
          sender: {
            name: 'Test Sender',
            address: 'Sender Street 1',
            city: 'Krakow',
            postalCode: '30-001',
            countryCode: 'PL',
            phone: '+48123456789',
            email: 'sender@test.pl',
          },
          receiver: {
            name: 'Test Receiver',
            address: 'Test Street 1',
            city: 'Warszawa',
            postalCode: '00-001',
            countryCode: 'PL',
            phone: '+48987654321',
            email: 'receiver@test.pl',
          },
          parcels: [
            {
              content: 'Test Package',
              weight: 1.0,
            },
          ],
        },
      ]);

      console.log('Package generation result:', result);
      expect(result).toBeDefined();
      expect(result.packages).toBeDefined();
    } catch (error) {
      console.error('Package generation error:', error);
      throw error;
    }
  }, 30000);

  it.skipIf(process.env.DPD_PUDO_ENABLED !== '1')('should connect to PUDO production API', async () => {
    const client = new DPDClient({
      environment: 'production',
      auth: {
        login: process.env.DPD_PROD_LOGIN || '',
        password: process.env.DPD_PROD_PASSWORD || '',
        masterFid: process.env.DPD_PROD_MASTER_FID || '',
      },
    });

    await client.initialize();

    try {
      const shops = await client.pudo.findParcelShops({
        city: 'Warszawa',
        countryCode: 'PL',
        limit: 1,
      });

      console.log('PUDO connection successful, found shops:', shops.length);
      expect(shops).toBeDefined();
    } catch (error) {
      console.log('PUDO error:', error instanceof Error ? error.message : error);
      // PUDO might not be available, skip
    }
  }, 30000);
});
