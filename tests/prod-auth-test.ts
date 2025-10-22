import { describe, it, expect } from 'vitest';
import { DPDClient } from '../src/client';
import * as dotenv from 'dotenv';

dotenv.config();

describe('DPD SDK - Production Authentication Test', () => {
  it('should authenticate with production credentials', async () => {
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
      console.log('✅ Authentication successful');
      expect(true).toBe(true);
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      throw error;
    }
  }, 30000);

  it('should test basic SOAP connection', async () => {
    const client = new DPDClient({
      environment: 'production',
      auth: {
        login: process.env.DPD_PROD_LOGIN || '',
        password: process.env.DPD_PROD_PASSWORD || '',
        masterFid: process.env.DPD_PROD_MASTER_FID || '',
      },
    });

    await client.initialize();
    
    // Test basic SOAP method call
    const soapClient = client.getSoapClient();
    console.log('SOAP Client methods:', Object.keys(soapClient));
    
    expect(soapClient).toBeDefined();
  }, 30000);
});
