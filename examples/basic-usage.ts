import { DPDClient } from '@ematu/dpd-sdk';

/**
 * Basic Usage Example
 *
 * Bu örnek DPD SDK'nın temel kullanımını gösterir.
 */

async function main() {
  // 1. Client oluştur
  const client = new DPDClient({
    environment: 'demo', // 'demo' veya 'production'
    auth: {
      login: 'your-fid',
      password: 'your-password',
      masterFid: 'your-master-fid',
    },
    timeout: 30000,
    maxRetries: 3,
  });

  // 2. SOAP client'ı başlat
  await client.initialize();

  // 3. Domestic package oluştur
  const packages = [
    {
      sender: {
        name: 'Sender Company',
        address: 'Street 1',
        city: 'Warsaw',
        postalCode: '00-001',
        countryCode: 'PL',
        phone: '+48123456789',
        email: 'sender@example.com',
      },
      receiver: {
        name: 'Receiver Name',
        address: 'Street 2',
        city: 'Krakow',
        postalCode: '30-001',
        countryCode: 'PL',
        phone: '+48987654321',
        email: 'receiver@example.com',
      },
      parcels: [
        {
          weight: 1.5,
          content: 'Documents',
        },
      ],
      payerType: 'SENDER' as const,
    },
  ];

  // 4. Package number generate et
  const result = await client.domestic.generatePackageNumbers(packages);
  console.log('Generated waybill:', result.packages[0].waybill);

  // 5. Label generate et
  const label = await client.domestic.generateLabels(
    [result.packages[0].waybill],
    { format: 'PDF', pageFormat: 'A4' }
  );
  console.log('Label generated:', label.labelData.substring(0, 50));

  // 6. Tracking
  const status = await client.tracking.getParcelStatus(
    result.packages[0].waybill
  );
  console.log('Parcel status:', status.status);

  // 7. PUDO search
  const shops = await client.pudo.findParcelShops({
    city: 'Warsaw',
    countryCode: 'PL',
    limit: 5,
  });
  console.log(`Found ${shops.length} ParcelShops`);
}

main().catch(console.error);
