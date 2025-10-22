import { DPDClient } from '@ematu/dpd-sdk';

/**
 * Environment Setup Example
 *
 * Farklı environment'lar için client configuration
 */

// 1. Demo Environment (Test/Development)
export function createDemoClient() {
  return new DPDClient({
    environment: 'demo',
    auth: {
      login: process.env.DPD_DEMO_LOGIN || '',
      password: process.env.DPD_DEMO_PASSWORD || '',
      masterFid: process.env.DPD_DEMO_MASTER_FID || '',
    },
    timeout: 30000,
    maxRetries: 3,
  });
}

// 2. Production Environment
export function createProductionClient() {
  // Production credentials - ASLA hardcode etme!
  const login = process.env.DPD_PROD_LOGIN;
  const password = process.env.DPD_PROD_PASSWORD;
  const masterFid = process.env.DPD_PROD_MASTER_FID;

  if (!login || !password || !masterFid) {
    throw new Error('Missing DPD production credentials in environment');
  }

  return new DPDClient({
    environment: 'production',
    auth: { login, password, masterFid },
    timeout: 45000, // Production'da daha uzun timeout
    maxRetries: 5, // Production'da daha fazla retry
  });
}

// 3. Environment-aware Factory
export function createDPDClient() {
  const env = process.env.NODE_ENV || 'development';

  switch (env) {
    case 'production':
      return createProductionClient();
    case 'development':
    case 'test':
    default:
      return createDemoClient();
  }
}

// 4. Usage Examples

// Development
async function developmentUsage() {
  const client = createDemoClient();
  await client.initialize();

  // Test shipment
  const result = await client.domestic.generatePackageNumbers([
    {
      sender: {
        name: 'Test Sender',
        address: 'Test St 1',
        city: 'Warsaw',
        postalCode: '00-001',
        countryCode: 'PL',
      },
      receiver: {
        name: 'Test Receiver',
        address: 'Test St 2',
        city: 'Krakow',
        postalCode: '30-001',
        countryCode: 'PL',
      },
      parcels: [{ weight: 1.0, content: 'Test' }],
      payerType: 'SENDER',
    },
  ]);

  console.log('Demo waybill:', result.packages[0].waybill);
}

// Production
async function productionUsage() {
  const client = createProductionClient();
  await client.initialize();

  // Real shipment
  const result = await client.domestic.generatePackageNumbers([
    {
      sender: {
        name: 'Real Company',
        address: 'Main St 100',
        city: 'Warsaw',
        postalCode: '00-001',
        countryCode: 'PL',
        phone: '+48223456789',
        email: 'shipping@company.com',
      },
      receiver: {
        name: 'Customer Name',
        address: 'Customer St 50',
        city: 'Krakow',
        postalCode: '30-001',
        countryCode: 'PL',
        phone: '+48123456789',
        email: 'customer@example.com',
      },
      parcels: [
        {
          weight: 2.5,
          content: 'Product',
          sizeX: 30,
          sizeY: 20,
          sizeZ: 15,
        },
      ],
      payerType: 'SENDER',
      ref1: 'ORDER-12345',
      services: {
        cod: { amount: 250.0, currency: 'PLN' },
        declaredValue: { amount: 500.0, currency: 'PLN' },
      },
    },
  ]);

  console.log('Production waybill:', result.packages[0].waybill);
}

// Environment-aware usage
async function main() {
  const client = createDPDClient();
  await client.initialize();

  console.log('Running in:', process.env.NODE_ENV || 'development');

  // Your shipping logic here
}

// Example .env file structure:
/*
# .env.development
DPD_DEMO_LOGIN=your-demo-fid
DPD_DEMO_PASSWORD=your-demo-password
DPD_DEMO_MASTER_FID=your-demo-master-fid

# .env.production
DPD_PROD_LOGIN=your-prod-fid
DPD_PROD_PASSWORD=your-prod-password
DPD_PROD_MASTER_FID=your-prod-master-fid
NODE_ENV=production
*/

// Export for use in other modules
export { developmentUsage, productionUsage, main };
