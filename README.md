# DPD Poland SDK

Enterprise-grade TypeScript SDK for DPD Poland API integration with full type safety, runtime validation, and RAG documentation support.

## Features

- Full TypeScript support with strict type checking
- Runtime schema validation using Zod
- SOAP service integration with automatic retry logic
- Support for domestic and international shipments
- Return label generation
- Parcel tracking and status queries
- PUDO/ParcelShop finder (pickup points)
- Extended services (COD, Insurance, Guarantee, DPD Pickup)
- Comprehensive error handling
- Zero-config bundling with tsup
- Tree-shakeable exports

## Installation

```bash
npm install @ematu/dpd-sdk
# or
yarn add @ematu/dpd-sdk
# or
pnpm add @ematu/dpd-sdk
```

## Quick Start

```typescript
import { DPDClient } from '@ematu/dpd-sdk';

const client = new DPDClient({
  auth: {
    login: '43130401',
    password: 'your-password',
    masterFid: '431304',
  },
  environment: 'demo', // or 'production'
});

await client.initialize();

// Generate domestic shipment
const result = await client.domestic.generatePackageNumbers([{
  sender: {
    name: 'Your Company',
    address: 'Street 123',
    city: 'Warsaw',
    postalCode: '00-001',
    countryCode: 'PL',
  },
  receiver: {
    name: 'Customer Name',
    address: 'Customer Street 456',
    city: 'Krakow',
    postalCode: '30-001',
    countryCode: 'PL',
  },
  parcels: [{
    weight: 5.5,
  }],
}]);

console.log(result.packages[0].waybill);
```

## API Reference

### DPDClient

Main SDK client class.

#### Constructor Options

```typescript
interface DPDConfig {
  auth: {
    login: string;
    password: string;
    masterFid: string;
  };
  environment?: 'production' | 'demo';
  timeout?: number; // Default: 30000ms
  maxRetries?: number; // Default: 3
}
```

#### Methods

- `initialize()` - Initialize SOAP client

### Domestic Service

Access via `client.domestic`

#### generatePackageNumbers(packages)

Generate domestic shipment numbers.

```typescript
const result = await client.domestic.generatePackageNumbers([{
  sender: Address,
  receiver: Address,
  parcels: [{
    weight: number,
    content?: string,
    sizeX?: number,
    sizeY?: number,
    sizeZ?: number,
  }],
  payerType?: 'SENDER' | 'RECEIVER' | 'THIRD_PARTY',
  thirdPartyFid?: string,
  ref1?: string,
  services?: {
    cod?: { amount: number },
    cud?: boolean,
    pudoReturn?: boolean,
  },
}]);
```

#### generateLabels(waybills, options?)

Generate shipping labels.

```typescript
const label = await client.domestic.generateLabels(
  ['1000635967411U'],
  {
    format: 'PDF', // 'PDF' | 'ZPL' | 'EPL'
    pageFormat: 'A4', // 'A4' | 'A6' | 'LBL'
    variant: 'BIC3',
  }
);
```

#### generateProtocol(waybills)

Generate handover protocol.

#### pickupCall(params)

Order courier pickup.

```typescript
await client.domestic.pickupCall({
  pickupDate: '2025-01-22',
  pickupTimeFrom: '09:00',
  pickupTimeTo: '17:00',
  waybills: ['1000635967411U'],
});
```

### International Service

Access via `client.international`

#### generatePackageNumbers(packages)

Generate international shipment numbers.

```typescript
const result = await client.international.generatePackageNumbers([{
  sender: Address,
  receiver: Address,
  parcels: Parcel[],
  payerType: 'THIRD_PARTY',
  thirdPartyFid: '431305',
}]);
```

### Return Service

Access via `client.returns`

#### generateDomesticReturnLabel(waybills, receiver, options?)

Generate domestic return label.

```typescript
const label = await client.returns.generateDomesticReturnLabel(
  ['1000635967411U'],
  {
    name: 'Your Company',
    address: 'Return Address',
    city: 'Warsaw',
    postalCode: '00-001',
    countryCode: 'PL',
  }
);
```

#### generateInternationalReturnLabel(waybills, receiver, options?)

Generate international return label.

### Tracking Service

Access via `client.tracking`

#### getParcelStatus(waybill)

Get parcel tracking information.

```typescript
const status = await client.tracking.getParcelStatus('1000635967411U');
console.log(status.status); // Current status
console.log(status.events); // Tracking events
```

#### getPostcodeInfo(postcode, countryCode?)

Get postcode information and depot.

```typescript
const info = await client.tracking.getPostcodeInfo('02-274', 'PL');
console.log(info.city); // Warszawa
```

### PUDO Service

Access via `client.pudo`

#### findParcelShops(params)

Find nearby pickup points.

```typescript
const shops = await client.pudo.findParcelShops({
  city: 'Warszawa',
  postalCode: '02-274',
  countryCode: 'PL',
  limit: 10,
  hideClosed: true,
});

shops.forEach(shop => {
  console.log(shop.name, shop.pudoId);
});
```

#### getParcelShop(pudoId)

Get specific pickup point details.

```typescript
const shop = await client.pudo.getParcelShop('PL14187');
if (shop) {
  console.log(shop.address, shop.openingHours);
}
```

## Error Handling

The SDK provides typed error classes:

```typescript
import {
  DPDError,
  DPDAuthError,
  DPDValidationError,
  DPDServiceError,
  DPDNetworkError,
} from '@ematu/dpd-sdk';

try {
  await client.domestic.generatePackageNumbers(packages);
} catch (error) {
  if (error instanceof DPDValidationError) {
    console.error('Validation failed:', error.validationErrors);
  } else if (error instanceof DPDAuthError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof DPDNetworkError) {
    console.error('Network error:', error.message);
  }
}
```

## Testing

```bash
npm run test
npm run test:coverage
```

## Development

```bash
# Install dependencies
npm install

# Type checking
npm run typecheck

# Build
npm run build

# Lint
npm run lint
```

## License

MIT

## Support

- DPD FID: 431304 / 43130401
- Email: support@ematu.com
- Documentation: https://docs.ematu.com/dpd-sdk
