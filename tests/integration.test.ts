import { describe, it, expect, beforeAll } from 'vitest';
import { DPDClient } from '../src/index.js';

describe('DPD SDK Integration Tests', () => {
  let client: DPDClient;

  beforeAll(async () => {
    client = new DPDClient({
      auth: {
        login: '43130401',
        password: 'c75Bz6tAqMRDKOfm',
        masterFid: '431304',
      },
      environment: 'demo',
      timeout: 30000,
    });

    await client.initialize();
  });

  describe('Domestic Service', () => {
    it('should generate domestic package numbers', async () => {
      const result = await client.domestic.generatePackageNumbers([
        {
          sender: {
            name: 'Test Sender',
            address: 'Test Street 1',
            city: 'Warsaw',
            postalCode: '02-274',
            countryCode: 'PL',
          },
          receiver: {
            name: 'Test Receiver',
            address: 'Receiver Street 2',
            city: 'Krakow',
            postalCode: '30-001',
            countryCode: 'PL',
          },
          parcels: [
            {
              weight: 5.0,
            },
          ],
        },
      ]);

      expect(result.packages).toBeDefined();
      expect(result.packages.length).toBeGreaterThan(0);
      expect(result.packages[0].waybill).toBeTruthy();
    });
  });

  describe('International Service', () => {
    it('should generate international package numbers', async () => {
      const result = await client.international.generatePackageNumbers([
        {
          sender: {
            name: 'Polish Sender',
            address: 'PL Street 123',
            city: 'Warsaw',
            postalCode: '02-274',
            countryCode: 'PL',
          },
          receiver: {
            name: 'German Receiver',
            address: 'DE Strasse 456',
            city: 'Berlin',
            postalCode: '10115',
            countryCode: 'DE',
          },
          parcels: [
            {
              weight: 3.5,
            },
          ],
          payerType: 'THIRD_PARTY',
          thirdPartyFid: '431305',
        },
      ]);

      expect(result.packages).toBeDefined();
      expect(result.packages.length).toBeGreaterThan(0);
      expect(result.packages[0].waybill).toBeTruthy();
    });
  });

  describe('Return Service', () => {
    it('should generate domestic return label', async () => {
      const result = await client.returns.generateDomesticReturnLabel(
        ['1000635967411U'],
        {
          name: 'Return Address',
          address: 'Return Street 789',
          city: 'Warsaw',
          postalCode: '02-274',
          countryCode: 'PL',
        }
      );

      expect(result.labelData).toBeDefined();
      expect(result.format).toBe('PDF');
      expect(result.pageFormat).toBe('A4');
    });
  });
});
