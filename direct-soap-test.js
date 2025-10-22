import soap from 'soap';

async function testDirectSOAP() {
  console.log('🔵 DPD Direct SOAP Test');
  
  const wsdlUrl = 'https://dpdservices.dpd.com.pl/DPDPackageObjServicesService/DPDPackageObjServices?WSDL';
  
  try {
    // SOAP client oluştur
    const client = await soap.createClientAsync(wsdlUrl);
    console.log('✅ SOAP Client created');
    
    // DPD'nin beklediği format - Packages (çoğul) + Package (tekil)
    const xmlPayload = `<Packages>
<Package>
<receiver>
<company>firma odbiorcy</company>
<name>imie i nazwisko odbiorcy</name>
<address>adres odbiorcy</address>
<city>miasto odbiorcy</city>
<postalCode>02274</postalCode>
<countryCode>PL</countryCode>
<email>nazwa@domena-odbiorcy.pl</email>
<phone>123123123</phone>
</receiver>
<sender>
<company>firma nadawcy</company>
<name>imie i nazwisko nadawcy</name>
<address>adres nadawcy</address>
<city>miasto nadawcy</city>
<postalCode>02274</postalCode>
<countryCode>PL</countryCode>
<email>nazwa@domena-nadawcy.pl</email>
<phone>123123123</phone>
</sender>
<ref1>ref1_abc</ref1>
<ref2>ref2_def</ref2>
<ref3>ref3_ghi</ref3>
<parcels>
<parcel>
<content>1234567890123456789</content>
<customerData1>Uwagi dla kuriera 1</customerData1>
<customerData2>Uwagi dla kuriera 2</customerData2>
<customerData3>Uwagi dla kuriera 3</customerData3>
<sizeX>10</sizeX>
<sizeY>10</sizeY>
<sizeZ>10</sizeZ>
<weight>10</weight>
</parcel>
</parcels>
<payerType>THIRD_PARTY</payerType>
<thirdPartyFID>431305</thirdPartyFID>
<services>
</services>
</Package>
</Packages>`;

    // Base64 encode
    const base64XML = Buffer.from(xmlPayload, 'utf8').toString('base64');
    console.log('📦 Base64 XML:', base64XML.substring(0, 100) + '...');
    
    // SOAP isteği
    const args = {
      authDataV1: {
        login: '43130401',
        password: 'c75Bz6tAqMRDKOfm',
        masterFid: '431304'
      },
      openUMLFeV11: base64XML,
      pkgNumsGenerationPolicyV1: 'STOP_ON_FIRST_ERROR',
      langCode: 'PL'
    };
    
    console.log('🚀 Sending SOAP request...');
    console.log('Args:', JSON.stringify(args, null, 2));
    
    // Method çağır
    const result = await client.generatePackagesNumbersV9Async(args);
    
    console.log('✅ SUCCESS!');
    console.log('Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    if (error.response) {
      console.log('Response body:', error.response.body);
    }
  }
}

testDirectSOAP();
