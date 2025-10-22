# DPD Poland SDK

[![npm version](https://img.shields.io/npm/v/@ematu/dpd-sdk.svg)](https://www.npmjs.com/package/@ematu/dpd-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Enterprise-grade TypeScript SDK for DPD Poland API integration with full type safety, runtime validation, and comprehensive error handling.

## Features

- **Full TypeScript Support** - Strict type checking with IntelliSense
- **Runtime Validation** - Zod schema validation for API responses
- **Automatic Retry Logic** - Exponential backoff for network errors
- **Complete Service Coverage**
  - Domestic & International shipping
  - Return label generation
  - Parcel tracking & status
  - PUDO/ParcelShop finder
- **Extended Services** - COD, Insurance, Guarantee, DPD Pickup
- **Error Handling** - Custom error types with recovery patterns
- **Tree-shakeable** - Zero-config bundling with tsup
- **Comprehensive Examples** - Production-ready code samples

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

// 1. Create client
const client = new DPDClient({
  environment: 'demo', // or 'production'
  auth: {
    login: process.env.DPD_LOGIN,
    password: process.env.DPD_PASSWORD,
    masterFid: process.env.DPD_MASTER_FID,
  },
});

// 2. Initialize SOAP connection
await client.initialize();

// 3. Generate domestic shipment
const result = await client.domestic.generatePackageNumbers([
  {
    sender: {
      name: 'Your Company',
      address: 'Marszalkowska 1',
      city: 'Warsaw',
      postalCode: '00-001',
      countryCode: 'PL',
    },
    receiver: {
      name: 'Jan Kowalski',
      address: 'Krakowska 10',
      city: 'Krakow',
      postalCode: '30-001',
      countryCode: 'PL',
    },
    parcels: [{ weight: 2.5, content: 'Electronics' }],
    payerType: 'SENDER',
  },
]);

// 4. Get waybill
console.log('Waybill:', result.packages[0].waybill);

// 5. Generate label
const label = await client.domestic.generateLabels(
  [result.packages[0].waybill],
  { format: 'PDF', pageFormat: 'A4' }
);
```

## Documentation

- [Examples](./examples) - Real-world usage examples
- [API Reference](#api-reference) - Complete API documentation
- [Error Handling](#error-handling) - Error management best practices
- [DPD API Docs](https://docs.dpd.com.pl/) - Official DPD documentation

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

- `initialize()` - Initialize SOAP client connection

### Domestic Service

Access via `client.domestic`

#### generatePackageNumbers(packages)

Generate domestic shipment numbers.

```typescript
const result = await client.domestic.generatePackageNumbers([
  {
    sender: Address,
    receiver: Address,
    parcels: [
      {
        weight: number,
        content?: string,
        sizeX?: number,
        sizeY?: number,
        sizeZ?: number,
      },
    ],
    payerType?: 'SENDER' | 'RECEIVER' | 'THIRD_PARTY',
    thirdPartyFid?: string,
    ref1?: string,
    services?: {
      cod?: { amount: number; currency: string },
      declaredValue?: { amount: number; currency: string },
      guarantee?: { type: '12:00' | '18:00' | 'SATURDAY' },
    },
  },
]);
```

#### generateLabels(waybills, options?)

Generate shipping labels.

```typescript
const label = await client.domestic.generateLabels(['1234567890'], {
  format: 'PDF', // 'PDF' | 'ZPL' | 'EPL'
  pageFormat: 'A4', // 'A4' | 'A6' | 'LBL'
  variant: 'BIC3',
});
```

#### generateProtocol(waybills)

Generate handover protocol.

```typescript
const protocol = await client.domestic.generateProtocol(['1234567890']);
```

#### pickupCall(params)

Order courier pickup.

```typescript
await client.domestic.pickupCall({
  pickupDate: '2025-10-23',
  pickupTimeFrom: '09:00',
  pickupTimeTo: '17:00',
  waybills: ['1234567890'],
});
```

### International Service

Access via `client.international`

#### generatePackageNumbers(packages)

Generate international shipment numbers.

```typescript
const result = await client.international.generatePackageNumbers([
  {
    sender: Address,
    receiver: Address,
    parcels: Parcel[],
    payerType: 'SENDER' | 'RECEIVER' | 'THIRD_PARTY',
    thirdPartyFid?: string,
  },
]);
```

### Return Service

Access via `client.returns`

#### generateDomesticReturnLabel(waybills, receiver, options?)

Generate domestic return label.

```typescript
const label = await client.returns.generateDomesticReturnLabel(
  ['1234567890'],
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

Track parcel status and events.

```typescript
const status = await client.tracking.getParcelStatus('1234567890');
console.log(status.status, status.events);
```

#### getPostcodeInfo(postcode, countryCode?)

Lookup postcode information.

```typescript
const info = await client.tracking.getPostcodeInfo('00-001', 'PL');
console.log(info.city, info.depot);
```

### PUDO Service

Access via `client.pudo`

#### findParcelShops(params)

Search for nearby ParcelShop locations.

```typescript
const shops = await client.pudo.findParcelShops({
  city: 'Warsaw',
  countryCode: 'PL',
  limit: 10,
});
```

#### getParcelShop(pudoId)

Get specific ParcelShop details.

```typescript
const shop = await client.pudo.getParcelShop('PL12345');
if (shop) {
  console.log(shop.name, shop.address);
}
```

## Error Handling

The SDK provides custom error types for different scenarios:

```typescript
import {
  DPDClient,
  DPDServiceError,
  DPDNetworkError,
  ValidationError,
} from '@ematu/dpd-sdk';

try {
  await client.domestic.generatePackageNumbers(packages);
} catch (error) {
  // Network error - retry
  if (error instanceof DPDNetworkError) {
    console.error('Network error:', error.message);
    // Implement retry logic
  }

  // Service error - check error code
  if (error instanceof DPDServiceError) {
    console.error('Service error:', error.code);
    if (error.code === 'AUTH_FAILED') {
      // Handle auth error
    }
  }

  // Validation error - user input problem
  if (error instanceof ValidationError) {
    console.error('Validation error:', error.field, error.value);
  }
}
```

### Retry Logic Example

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      if (error instanceof DPDNetworkError) {
        const delay = 1000 * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

// Usage
const result = await retryWithBackoff(() =>
  client.domestic.generatePackageNumbers(packages)
);
```

## Extended Services

### COD (Cash on Delivery)

```typescript
const package = {
  // ... sender, receiver, parcels
  services: {
    cod: {
      amount: 250.0,
      currency: 'PLN',
    },
  },
};
```

### Declared Value Insurance

```typescript
const package = {
  // ... sender, receiver, parcels
  services: {
    declaredValue: {
      amount: 500.0,
      currency: 'PLN',
    },
  },
};
```

### Guarantee Services

```typescript
const package = {
  // ... sender, receiver, parcels
  services: {
    guarantee: {
      type: '12:00', // '12:00' | '18:00' | 'SATURDAY'
    },
  },
};
```

## Environment Configuration

```typescript
// Demo/Test Environment
const demoClient = new DPDClient({
  environment: 'demo',
  auth: {
    login: process.env.DPD_DEMO_LOGIN,
    password: process.env.DPD_DEMO_PASSWORD,
    masterFid: process.env.DPD_DEMO_MASTER_FID,
  },
});

// Production Environment
const prodClient = new DPDClient({
  environment: 'production',
  auth: {
    login: process.env.DPD_PROD_LOGIN,
    password: process.env.DPD_PROD_PASSWORD,
    masterFid: process.env.DPD_PROD_MASTER_FID,
  },
  timeout: 45000,
  maxRetries: 5,
});
```

## Development

```bash
# Install dependencies
npm install

# Run typecheck
npm run typecheck

# Run linter
npm run lint

# Format code
npm run format

# Run tests
npm test

# Build
npm run build

# Full validation
npm run validate
```

## License

MIT

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Links

- [NPM Package](https://www.npmjs.com/package/@ematu/dpd-sdk)
- [GitHub Repository](https://github.com/ematu/dpd-sdk)
- [Examples](./examples)
- [DPD API Documentation](https://docs.dpd.com.pl/)
