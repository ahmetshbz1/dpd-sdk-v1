import soap from 'soap';

async function checkXMLMethods() {
  console.log('🔵 Checking XML Services methods...');
  
  const wsdlUrl = 'https://dpdservices.dpd.com.pl/DPDPackageXmlServicesService/DPDPackageXmlServices?WSDL';
  
  try {
    const client = await soap.createClientAsync(wsdlUrl);
    console.log('✅ XML SOAP Client created');
    
    // List all available methods
    console.log('📋 Available methods:');
    const methods = Object.keys(client).filter(key => typeof client[key] === 'function');
    methods.forEach(method => {
      console.log(`  - ${method}`);
    });
    
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
}

checkXMLMethods();
