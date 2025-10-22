import { DPDClient } from '../src/client';

async function testGenerate() {
  const client = new DPDClient({
    environment: 'production',
    auth: {
      login: '43130401',
      password: 'c75Bz6tAqMRDKOfm',
      masterFid: '431304',
    },
  });

  await client.initialize();
  console.log('✅ Client initialized');

  try {
    const result = await client.domestic.generatePackageNumbers([
      {
        sender: {
          name: 'Test Sender',
          address: 'Sender Street 1',
          city: 'Warszawa',
          postalCode: '02274',
          countryCode: 'PL',
        },
        receiver: {
          name: 'Test Receiver',
          address: 'Receiver Street 1',
          city: 'Krakow',
          postalCode: '30-001',
          countryCode: 'PL',
        },
        parcels: [
          {
            weight: 10,
            content: 'Test Package',
          },
        ],
      },
    ]);

    console.log('\n✅ SUCCESS:', result);
  } catch (error) {
    console.log('\n❌ ERROR:', error);
  }
}

testGenerate().catch(console.error);

