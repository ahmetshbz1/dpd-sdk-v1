import axios from 'axios';

async function testRawXML() {
  console.log('🔵 DPD Raw XML Test (WITHOUT Base64)');
  
  const soapXML = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:dpd="http://dpdservices.dpd.com.pl/">
<soapenv:Header/>
<soapenv:Body>
<dpd:generatePackagesNumbersV9>
<openUMLFeV11>
<packages>
<parcels>
<content>1234567890123456789</content>
<customerData1>Uwagi dla kuriera 1</customerData1>
<customerData2>Uwagi dla kuriera 2</customerData2>
<customerData3>Uwagi dla kuriera 3</customerData3>
<sizeX>10</sizeX>
<sizeY>10</sizeY>
<sizeZ>10</sizeZ>
<weight>10</weight>
</parcels>
<payerType>THIRD_PARTY</payerType>
<thirdPartyFID>431305</thirdPartyFID>
<ref1>ref1_abc</ref1>
<ref2>ref2_def</ref2>
<ref3>ref3_ghi</ref3>
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
<services>
</services>
</packages>
</openUMLFeV11>
<pkgNumsGenerationPolicyV1>STOP_ON_FIRST_ERROR</pkgNumsGenerationPolicyV1>
<langCode>PL</langCode>
<authDataV1>
<login>43130401</login>
<masterFid>431304</masterFid>
<password>c75Bz6tAqMRDKOfm</password>
</authDataV1>
</dpd:generatePackagesNumbersV9>
</soapenv:Body>
</soapenv:Envelope>`;

  try {
    console.log('🚀 Sending raw SOAP XML...');
    
    const response = await axios.post(
      'https://dpdservices.dpd.com.pl/DPDPackageObjServicesService/DPDPackageObjServices',
      soapXML,
      {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': ''
        }
      }
    );
    
    console.log('✅ SUCCESS!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testRawXML();
