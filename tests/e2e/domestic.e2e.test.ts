import { describe, it, expect, vi } from 'vitest';
import { DPDClient } from '../../src/client';

const E2E = process.env.DPD_RUN_E2E === '1';

// Real credentials required for running against live SOAP
const creds = {
  login: process.env.DPD_PROD_LOGIN || process.env.DPD_DEMO_LOGIN || '',
  password: process.env.DPD_PROD_PASSWORD || process.env.DPD_DEMO_PASSWORD || '',
  masterFid: process.env.DPD_PROD_MASTER_FID || process.env.DPD_DEMO_MASTER_FID || '',
};

const hasCreds = creds.login && creds.password && creds.masterFid;

describe.skipIf(!E2E || !hasCreds)('E2E: Domestic (live SOAP)', () => {
  it('should initialize and attempt package generation', async () => {
    const client = new DPDClient({
      environment: process.env.DPD_RUN_E2E_ENV === 'demo' ? 'demo' : 'production',
      auth: creds,
      timeout: 20000,
      maxRetries: 1,
    });

    await client.initialize();

    // Minimal realistic package (DPD backend may still reject without full account permissions)
    const result = await client.domestic.generatePackageNumbers([
      {
        sender: {
          name: 'E2E Sender',
          address: 'Marszalkowska 1',
          city: 'Warszawa',
          postalCode: '00-001',
          countryCode: 'PL',
          phone: '+48123456789',
          email: 'e2e@sender.pl',
        },
        receiver: {
          name: 'E2E Receiver',
          address: 'Krakowska 10',
          city: 'Krakow',
          postalCode: '30-001',
          countryCode: 'PL',
          phone: '+48987654321',
          email: 'e2e@receiver.pl',
        },
        parcels: [
          { weight: 1.0, content: 'Test' },
        ],
        payerType: 'SENDER',
      },
    ]);

    expect(result).toBeDefined();
  }, 60000);
});