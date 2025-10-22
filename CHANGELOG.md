# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-22

### Added

- Initial release of DPD Poland SDK
- Full TypeScript support with strict type checking
- Runtime schema validation using Zod
- Domestic shipping service
  - Package number generation
  - Label generation (PDF, ZPL, EPL)
  - Collection protocol
  - Courier pickup requests
- International shipping service
  - Package number generation for international shipments
- Return service
  - Domestic return labels
  - International return labels
- Tracking service
  - Parcel status and event tracking
  - Postcode information lookup
- PUDO service
  - ParcelShop search by location
  - Specific ParcelShop details
- Extended services support
  - COD (Cash on Delivery) with multi-currency
  - Declared Value Insurance
  - Guarantee services (12:00, 18:00, Saturday)
  - DPD Pickup options
- Comprehensive error handling
  - Custom error types (DPDServiceError, DPDNetworkError, ValidationError)
  - Automatic retry logic with exponential backoff
- Production-ready examples
- Complete API documentation
- JSDoc comments for IntelliSense support

### Infrastructure

- ESM and CommonJS support
- Tree-shakeable exports
- TypeScript declaration files
- Automated build pipeline
- Code formatting with Prettier
- Linting with ESLint
- Type checking with TypeScript compiler

[1.0.0]: https://github.com/ematu/dpd-sdk/releases/tag/v1.0.0
