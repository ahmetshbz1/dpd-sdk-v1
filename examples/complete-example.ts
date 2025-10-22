import { DPDClient } from '@ematu/dpd-sdk';

async function main() {
  // 1. SDK başlatma
  const client = new DPDClient({
    auth: {
      login: '43130401',
      password: 'c75Bz6tAqMRDKOfm',
      masterFid: '431304',
    },
    environment: 'demo',
    timeout: 30000,
    maxRetries: 3,
  });

  await client.initialize();
  console.log('DPD Client initialized successfully');

  // 2. Krajowe przesyłki - Domestic shipment
  try {
    const domesticResult = await client.domestic.generatePackageNumbers([
      {
        sender: {
          name: 'Ematu Sp. z o.o.',
          address: 'ul. Testowa 123',
          city: 'Warszawa',
          postalCode: '02-274',
          countryCode: 'PL',
          email: 'sender@ematu.com',
          phone: '+48123456789',
        },
        receiver: {
          name: 'Jan Kowalski',
          address: 'ul. Główna 456',
          city: 'Kraków',
          postalCode: '30-001',
          countryCode: 'PL',
          email: 'receiver@example.com',
          phone: '+48987654321',
        },
        parcels: [
          {
            weight: 5.5,
            content: 'Electronics',
            sizeX: 30,
            sizeY: 20,
            sizeZ: 10,
            customerData1: 'Handling instructions',
          },
        ],
        payerType: 'SENDER',
        ref1: 'ORDER-2025-001',
        services: {
          cod: { amount: 250.50 },
        },
      },
    ]);

    console.log('Domestic shipment created:');
    console.log('Waybill:', domesticResult.packages[0].waybill);
    console.log('Package ID:', domesticResult.packages[0].packageId);

    // 3. Etykieta generowania
    const waybill = domesticResult.packages[0].waybill;
    const label = await client.domestic.generateLabels([waybill], {
      format: 'PDF',
      pageFormat: 'A4',
      variant: 'BIC3',
    });

    console.log('Label generated (base64):', label.labelData.substring(0, 50) + '...');

    // 4. Protokół przekazania
    const protocol = await client.domestic.generateProtocol([waybill]);
    console.log('Protocol generated:', protocol.sessionId);

    // 5. Zamówienie kuriera
    const pickup = await client.domestic.pickupCall({
      pickupDate: '2025-01-23',
      pickupTimeFrom: '09:00',
      pickupTimeTo: '17:00',
      waybills: [waybill],
    });

    console.log('Courier pickup ordered:', pickup.pickupId);
  } catch (error) {
    console.error('Domestic shipment error:', error);
  }

  // 6. Międzynarodowe przesyłki - International shipment
  try {
    const internationalResult = await client.international.generatePackageNumbers([
      {
        sender: {
          name: 'Ematu Sp. z o.o.',
          address: 'ul. Testowa 123',
          city: 'Warszawa',
          postalCode: '02-274',
          countryCode: 'PL',
          email: 'sender@ematu.com',
        },
        receiver: {
          name: 'Max Mustermann',
          address: 'Hauptstrasse 789',
          city: 'Berlin',
          postalCode: '10115',
          countryCode: 'DE',
          email: 'receiver@example.de',
        },
        parcels: [
          {
            weight: 3.2,
            content: 'Books',
          },
        ],
        payerType: 'THIRD_PARTY',
        thirdPartyFid: '431305',
        services: {
          pudoReturn: true,
        },
      },
    ]);

    console.log('International shipment created:');
    console.log('Waybill:', internationalResult.packages[0].waybill);
  } catch (error) {
    console.error('International shipment error:', error);
  }

  // 7. Etykieta zwrotna - Return label
  try {
    const returnLabel = await client.returns.generateDomesticReturnLabel(
      ['1000635967411U'],
      {
        name: 'Ematu Sp. z o.o.',
        address: 'ul. Testowa 123',
        city: 'Warszawa',
        postalCode: '02-274',
        countryCode: 'PL',
        email: 'returns@ematu.com',
      },
      {
        format: 'PDF',
        pageFormat: 'A4',
      }
    );

    console.log('Return label generated:', returnLabel.format);
  } catch (error) {
    console.error('Return label error:', error);
  }
}

main().catch(console.error);
