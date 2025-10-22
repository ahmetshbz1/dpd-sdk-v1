import { DPDClient } from './src/index.js';

async function testAllFeatures() {
  console.log('='.repeat(60));
  console.log('DPD SDK - COMPREHENSIVE TEST');
  console.log('='.repeat(60));
  console.log();

  const client = new DPDClient({
    auth: {
      login: '43130401',
      password: 'c75Bz6tAqMRDKOfm',
      masterFid: '431304',
    },
    environment: 'production',
    timeout: 30000,
    maxRetries: 2,
  });

  console.log('🔧 Initializing client...');
  await client.initialize();
  console.log('✅ Client initialized\n');

  // Test 1: Domestic Package Numbers
  console.log('📦 TEST 1: Domestic Package Numbers (generatePackagesNumbersV9)');
  console.log('-'.repeat(60));
  try {
    const domesticResult = await client.domestic.generatePackageNumbers([
      {
        sender: {
          name: 'Ematu Sp. z o.o.',
          address: 'ul. Testowa 123',
          city: 'Warszawa',
          postalCode: '02-274',
          countryCode: 'PL',
          email: 'test@ematu.com',
          phone: '+48123456789',
        },
        receiver: {
          name: 'Jan Kowalski',
          address: 'ul. Testowa 456',
          city: 'Krakow',
          postalCode: '30-001',
          countryCode: 'PL',
          email: 'jan@test.pl',
          phone: '+48987654321',
        },
        parcels: [{ weight: 5.0 }],
        payerType: 'SENDER',
      },
    ]);
    console.log('✅ SUCCESS');
    console.log('Response:', JSON.stringify(domesticResult, null, 2));
  } catch (error: unknown) {
    console.log('❌ FAILED');
    if (error instanceof Error) {
      console.log('Error:', error.message);
    }
  }
  console.log();

  // Test 2: International Package Numbers
  console.log('🌍 TEST 2: International Package (generateInternationalPackageNumbersV1)');
  console.log('-'.repeat(60));
  try {
    const intResult = await client.international.generatePackageNumbers([
      {
        sender: {
          name: 'Polish Company',
          address: 'ul. Warszawska 1',
          city: 'Warszawa',
          postalCode: '02-274',
          countryCode: 'PL',
          email: 'pl@test.com',
        },
        receiver: {
          name: 'German Customer',
          address: 'Hauptstrasse 100',
          city: 'Berlin',
          postalCode: '10115',
          countryCode: 'DE',
          email: 'de@test.com',
        },
        parcels: [{ weight: 3.5, content: 'Books' }],
        payerType: 'THIRD_PARTY',
        thirdPartyFid: '431305',
      },
    ]);
    console.log('✅ SUCCESS');
    console.log('Response:', JSON.stringify(intResult, null, 2));
  } catch (error: unknown) {
    console.log('❌ FAILED');
    if (error instanceof Error) {
      console.log('Error:', error.message);
    }
  }
  console.log();

  // Test 3: Domestic Return Label
  console.log('🔄 TEST 3: Domestic Return Label (generateDomesticReturnLabelV1)');
  console.log('-'.repeat(60));
  try {
    const returnLabel = await client.returns.generateDomesticReturnLabel(
      ['1000635967411U'], // Test waybill z maila
      {
        name: 'Return Center Ematu',
        address: 'ul. Zwrotowa 99',
        city: 'Warszawa',
        postalCode: '02-274',
        countryCode: 'PL',
        email: 'returns@ematu.com',
        phone: '+48111222333',
      },
      { format: 'PDF', pageFormat: 'A4' }
    );
    console.log('✅ SUCCESS');
    console.log('Label format:', returnLabel.format);
    console.log('Page format:', returnLabel.pageFormat);
    console.log('Label data length:', returnLabel.labelData.length, 'bytes');
  } catch (error: unknown) {
    console.log('❌ FAILED');
    if (error instanceof Error) {
      console.log('Error:', error.message);
    }
  }
  console.log();

  // Test 4: International Return Label
  console.log('🌍🔄 TEST 4: International Return Label (generateReturnLabelV1)');
  console.log('-'.repeat(60));
  try {
    const intReturnLabel = await client.returns.generateInternationalReturnLabel(
      ['13059301268613'], // International waybill z maila
      {
        name: 'Ematu Returns',
        address: 'ul. Magazynowa 1',
        city: 'Warszawa',
        postalCode: '02-274',
        countryCode: 'PL',
        email: 'returns@ematu.com',
      }
    );
    console.log('✅ SUCCESS');
    console.log('Label format:', intReturnLabel.format);
    console.log('Label data length:', intReturnLabel.labelData.length, 'bytes');
  } catch (error: unknown) {
    console.log('❌ FAILED');
    if (error instanceof Error) {
      console.log('Error:', error.message);
    }
  }
  console.log();

  // Test 5: Generate Labels (for existing shipment)
  console.log('🏷️  TEST 5: Generate Shipping Label (generateSpedLabelsV4)');
  console.log('-'.repeat(60));
  try {
    const label = await client.domestic.generateLabels(['1000635967411U'], {
      format: 'PDF',
      pageFormat: 'A4',
    });
    console.log('✅ SUCCESS');
    console.log('Label format:', label.format);
    console.log('Label data length:', label.labelData.length, 'bytes');
  } catch (error: unknown) {
    console.log('❌ FAILED');
    if (error instanceof Error) {
      console.log('Error:', error.message);
    }
  }
  console.log();

  // Test 6: Generate Protocol
  console.log('📋 TEST 6: Handover Protocol (generateProtocolV2)');
  console.log('-'.repeat(60));
  try {
    const protocol = await client.domestic.generateProtocol(['1000635967411U']);
    console.log('✅ SUCCESS');
    console.log('Protocol session ID:', protocol.sessionId || 'N/A');
    console.log('Protocol data length:', protocol.protocolData.length, 'bytes');
  } catch (error: unknown) {
    console.log('❌ FAILED');
    if (error instanceof Error) {
      console.log('Error:', error.message);
    }
  }
  console.log();

  // Test 7: Courier Pickup
  console.log('🚚 TEST 7: Courier Pickup (packagesPickupCallV4)');
  console.log('-'.repeat(60));
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const pickupDate = tomorrow.toISOString().split('T')[0];

    const pickup = await client.domestic.pickupCall({
      pickupDate,
      pickupTimeFrom: '09:00',
      pickupTimeTo: '17:00',
      waybills: ['1000635967411U'],
    });
    console.log('✅ SUCCESS');
    console.log('Pickup ID:', pickup.pickupId);
    console.log('Status:', pickup.status);
    console.log('Date:', pickup.pickupDate);
  } catch (error: unknown) {
    console.log('❌ FAILED');
    if (error instanceof Error) {
      console.log('Error:', error.message);
    }
  }
  console.log();

  console.log('='.repeat(60));
  console.log('TEST SUITE COMPLETED');
  console.log('='.repeat(60));
}

testAllFeatures().catch(console.error);
