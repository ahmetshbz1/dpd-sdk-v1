import { DPDClient } from './src/index.js';

async function testLiveAPI() {
  console.log('DPD SDK Live Test - Demo Environment');
  console.log('=====================================\n');

  try {
    const client = new DPDClient({
      auth: {
        login: '43130401',
        password: 'c75Bz6tAqMRDKOfm',
        masterFid: '431304',
      },
      environment: 'production', // Senin production credentials
      timeout: 30000,
      maxRetries: 3,
    });

    console.log('1. Initializing client...');
    await client.initialize();
    console.log('✓ Client initialized successfully\n');

    console.log('2. Testing domestic package generation...');
    const result = await client.domestic.generatePackageNumbers([
      {
        sender: {
          name: 'Test Sender Company',
          address: 'ul. Testowa 123',
          city: 'Warszawa',
          postalCode: '02-274',
          countryCode: 'PL',
          email: 'sender@test.pl',
          phone: '+48123456789',
        },
        receiver: {
          name: 'Test Receiver',
          address: 'ul. Odbiorcza 456',
          city: 'Krakow',
          postalCode: '30-001',
          countryCode: 'PL',
          email: 'receiver@test.pl',
          phone: '+48987654321',
        },
        parcels: [
          {
            weight: 5.0,
            content: 'Test package',
          },
        ],
        payerType: 'SENDER',
        ref1: 'TEST-001',
      },
    ]);

    console.log('✓ Package generated successfully!');
    console.log('Response:', JSON.stringify(result, null, 2));
    console.log('\n✅ SDK IS FULLY WORKING!\n');
  } catch (error) {
    console.error('❌ Error occurred:');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Name:', error.name);
      if ('cause' in error) {
        console.error('Cause:', error.cause);
      }
    } else {
      console.error(error);
    }
    console.log('\n⚠️  SDK needs debugging\n');
    process.exit(1);
  }
}

testLiveAPI();
