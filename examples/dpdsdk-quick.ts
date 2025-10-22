import { DPDSDK, setLogLevel } from '../src';

async function main() {
  setLogLevel('info');

  const dpd = new DPDSDK({
    auth: {
      login: process.env.DPD_LOGIN!,
      password: process.env.DPD_PASSWORD!,
      masterFid: process.env.DPD_MASTER_FID!,
    },
    environment: (process.env.DPD_ENV as 'production' | 'demo') || 'production',
  });

  // High-level label creation
  const label = await dpd.createLabel({
    sender: { name: 'Acme', address: 'Marszalkowska 1', city: 'Warszawa', postalCode: '00-001', countryCode: 'PL', phone: '+48123456789', email: 'ship@acme.com' },
    receiver: { name: 'Jan', address: 'Krakowska 10', city: 'Krakow', postalCode: '30-001', countryCode: 'PL', phone: '+48987654321', email: 'jan@example.com' },
    pkg: { weight: 1.2, content: 'Books' },
    label: { format: 'PDF', pageFormat: 'A4', variant: 'BIC3' },
  });

  console.log('Waybill:', label.waybill);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});