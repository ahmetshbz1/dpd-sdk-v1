import { DPDClient, type DomesticPackage } from '@ematu/dpd-sdk';

/**
 * Domestic Shipping Example
 *
 * Tam domestic shipping flow: package generation, label, protocol, pickup
 */

async function domesticShippingFlow() {
  const client = new DPDClient({
    environment: 'demo',
    auth: {
      login: process.env.DPD_LOGIN || '',
      password: process.env.DPD_PASSWORD || '',
      masterFid: process.env.DPD_MASTER_FID || '',
    },
  });

  await client.initialize();

  // 1. Domestic package hazırla (COD ve Insurance ile)
  const packages: DomesticPackage[] = [
    {
      sender: {
        name: 'Ematu Store',
        address: 'Marszalkowska 1',
        city: 'Warsaw',
        postalCode: '00-001',
        countryCode: 'PL',
        phone: '+48223456789',
        email: 'shop@ematu.com',
      },
      receiver: {
        name: 'Jan Kowalski',
        address: 'Krakowska 10',
        city: 'Krakow',
        postalCode: '30-001',
        countryCode: 'PL',
        phone: '+48123456789',
        email: 'jan@example.com',
      },
      parcels: [
        {
          weight: 2.5,
          content: 'Electronics',
          sizeX: 30,
          sizeY: 20,
          sizeZ: 15,
          customerData1: 'Order #12345',
          customerData2: 'Priority',
        },
      ],
      payerType: 'SENDER',
      ref1: 'ORDER-12345',
      ref2: 'CUSTOMER-ABC',
      services: {
        cod: {
          amount: 250.0,
          currency: 'PLN',
        },
        declaredValue: {
          amount: 500.0,
          currency: 'PLN',
        },
      },
    },
  ];

  // 2. Package number ve waybill generate et
  console.log('Generating package numbers...');
  const result = await client.domestic.generatePackageNumbers(packages);

  const waybill = result.packages[0].waybill;
  const parcelIds = result.packages[0].parcelIds;

  console.log('✓ Package generated:');
  console.log(`  Waybill: ${waybill}`);
  console.log(`  Parcel IDs: ${parcelIds.join(', ')}`);

  // 3. Shipping label oluştur
  console.log('\nGenerating shipping label...');
  const label = await client.domestic.generateLabels([waybill], {
    format: 'PDF',
    pageFormat: 'A4',
    variant: 'BIC3',
  });

  console.log('✓ Label generated (base64):', label.labelData.substring(0, 50));

  // 4. Collection protocol oluştur
  console.log('\nGenerating collection protocol...');
  const protocol = await client.domestic.generateProtocol([waybill]);

  console.log('✓ Protocol generated');
  console.log(`  Session ID: ${protocol.sessionId}`);

  // 5. Courier pickup call
  console.log('\nRequesting courier pickup...');
  const pickup = await client.domestic.pickupCall({
    pickupDate: '2025-10-23',
    pickupTimeFrom: '09:00',
    pickupTimeTo: '12:00',
    waybills: [waybill],
  });

  console.log('✓ Pickup requested');
  console.log(`  Pickup ID: ${pickup.pickupId}`);
  console.log(`  Status: ${pickup.status}`);

  // 6. Tracking status check
  console.log('\nChecking parcel status...');
  const status = await client.tracking.getParcelStatus(waybill);

  console.log('✓ Parcel status:');
  console.log(`  Status: ${status.status}`);
  console.log(`  Status Code: ${status.statusCode || 'N/A'}`);
  console.log(`  Last Update: ${status.lastUpdate || 'N/A'}`);

  if (status.events && status.events.length > 0) {
    console.log('  Recent events:');
    status.events.slice(0, 3).forEach(event => {
      console.log(`    - ${event.date}: ${event.description}`);
    });
  }
}

domesticShippingFlow().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
