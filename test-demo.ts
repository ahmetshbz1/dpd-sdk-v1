import { DPDClient } from './src/index.js';

async function testDemoEnvironment() {
  console.log('='.repeat(60));
  console.log('DPD SDK - DEMO ENVIRONMENT TEST');
  console.log('Demo Credentials: test / 1495 / thetu4Ee');
  console.log('='.repeat(60));
  console.log();

  const client = new DPDClient({
    auth: {
      login: 'test',
      password: 'thetu4Ee',
      masterFid: '1495',
    },
    environment: 'demo',
    timeout: 30000,
    maxRetries: 2,
  });

  console.log('🔧 Initializing demo client...');
  await client.initialize();
  console.log('✅ Demo client initialized\n');

  // Test 1: Domestic Package
  console.log('📦 TEST 1: Domestic Package (generatePackagesNumbersV9)');
  console.log('-'.repeat(60));
  try {
    const result = await client.domestic.generatePackageNumbers([
      {
        sender: {
          name: 'Demo Sender Company',
          address: 'ul. Nadawcy 123',
          city: 'Warszawa',
          postalCode: '02-274',
          countryCode: 'PL',
          email: 'sender@demo.pl',
        },
        receiver: {
          name: 'Demo Receiver',
          address: 'ul. Odbiorcy 456',
          city: 'Krakow',
          postalCode: '30-001',
          countryCode: 'PL',
          email: 'receiver@demo.pl',
        },
        parcels: [{ weight: 5.0 }],
      },
    ]);
    console.log('✅ SUCCESS');
    console.log('Packages:', result.packages.length);
    if (result.packages.length > 0) {
      console.log('First package:', JSON.stringify(result.packages[0], null, 2));
    }
  } catch (error: unknown) {
    console.log('❌ FAILED');
    if (error instanceof Error) {
      console.log('Error:', error.message);
    }
  }
  console.log();

  // Test 2: International Package
  console.log('🌍 TEST 2: International Package');
  console.log('-'.repeat(60));
  try {
    const result = await client.international.generatePackageNumbers([
      {
        sender: {
          name: 'Demo PL Sender',
          address: 'ul. Export 1',
          city: 'Warszawa',
          postalCode: '02-274',
          countryCode: 'PL',
        },
        receiver: {
          name: 'Demo DE Receiver',
          address: 'Hauptstr 100',
          city: 'Berlin',
          postalCode: '10115',
          countryCode: 'DE',
        },
        parcels: [{ weight: 3.0 }],
        payerType: 'THIRD_PARTY',
        thirdPartyFid: '1495',
      },
    ]);
    console.log('✅ SUCCESS');
    console.log('Packages:', result.packages.length);
    if (result.packages.length > 0) {
      console.log('First package:', JSON.stringify(result.packages[0], null, 2));
    }
  } catch (error: unknown) {
    console.log('❌ FAILED');
    if (error instanceof Error) {
      console.log('Error:', error.message);
    }
  }
  console.log();

  // Test 3: Domestic Return Label (using demo waybill from email)
  console.log('🔄 TEST 3: Domestic Return Label');
  console.log('-'.repeat(60));
  try {
    const result = await client.returns.generateDomesticReturnLabel(
      ['1000635967411U'],
      {
        name: 'Demo Return Center',
        address: 'ul. Zwroty 99',
        city: 'Warszawa',
        postalCode: '02-274',
        countryCode: 'PL',
      }
    );
    console.log('✅ SUCCESS');
    console.log('Label format:', result.format);
    console.log('Label data length:', result.labelData.length);
  } catch (error: unknown) {
    console.log('❌ FAILED');
    if (error instanceof Error) {
      console.log('Error:', error.message);
    }
  }
  console.log();

  // Test 4: International Return Label
  console.log('🌍🔄 TEST 4: International Return Label');
  console.log('-'.repeat(60));
  try {
    const result = await client.returns.generateInternationalReturnLabel(
      ['13059301268613'],
      {
        name: 'Demo Int Return',
        address: 'ul. Returns 1',
        city: 'Warszawa',
        postalCode: '02-274',
        countryCode: 'PL',
      }
    );
    console.log('✅ SUCCESS');
    console.log('Label format:', result.format);
    console.log('Label data length:', result.labelData.length);
  } catch (error: unknown) {
    console.log('❌ FAILED');
    if (error instanceof Error) {
      console.log('Error:', error.message);
    }
  }
  console.log();

  console.log('='.repeat(60));
  console.log('DEMO TEST COMPLETED');
  console.log('='.repeat(60));
}

testDemoEnvironment().catch(console.error);
