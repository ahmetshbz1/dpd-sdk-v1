# DPD SDK Examples

Gerçek kullanım senaryoları ve best practices.

## Çalıştırma

```bash
# TypeScript dosyalarını çalıştırmak için:
npm install -g tsx

# Environment variables ayarla
export DPD_LOGIN="your-fid"
export DPD_PASSWORD="your-password"
export DPD_MASTER_FID="your-master-fid"

# Örneği çalıştır
tsx examples/basic-usage.ts
```

## Örnekler

### 1. [basic-usage.ts](./basic-usage.ts)
**Temel kullanım** - SDK'nın tüm özelliklerine hızlı giriş.

- Client initialization
- Package generation
- Label creation
- Tracking
- PUDO search

### 2. [domestic-shipping.ts](./domestic-shipping.ts)
**Complete domestic flow** - Tam bir domestic shipping süreci.

- COD (Cash on Delivery) ile package oluşturma
- Insurance (Declared Value)
- Label generation
- Collection protocol
- Courier pickup request
- Status tracking

### 3. [error-handling.ts](./error-handling.ts)
**Error management** - Production-ready hata yönetimi.

- Network error handling
- Service error handling
- Validation error handling
- Retry logic with exponential backoff
- Comprehensive error recovery patterns

### 4. [environment-setup.ts](./environment-setup.ts)
**Environment configuration** - Demo ve Production ortam kurulumu.

- Demo environment setup
- Production environment setup
- Environment-aware factory pattern
- .env file structure

## En Sık Kullanılan Senaryolar

### Domestic Shipment
```typescript
const result = await client.domestic.generatePackageNumbers([package]);
const label = await client.domestic.generateLabels([result.packages[0].waybill]);
```

### COD Shipment
```typescript
const package = {
  // ... sender, receiver, parcels
  services: {
    cod: { amount: 250.0, currency: 'PLN' }
  }
};
```

### Tracking
```typescript
const status = await client.tracking.getParcelStatus(waybill);
console.log(status.status, status.events);
```

### PUDO Search
```typescript
const shops = await client.pudo.findParcelShops({
  city: 'Warsaw',
  countryCode: 'PL',
  limit: 10
});
```

## Best Practices

1. **Her zaman environment variables kullan**
   ```bash
   # ASLA credentials'ları hardcode etme
   export DPD_LOGIN="..."
   ```

2. **Error handling implement et**
   ```typescript
   try {
     await client.domestic.generatePackageNumbers(packages);
   } catch (error) {
     if (error instanceof DPDServiceError) {
       // Handle service error
     }
   }
   ```

3. **Client initialization tek seferlik**
   ```typescript
   const client = new DPDClient(config);
   await client.initialize(); // Bir kere
   // Sonra tüm servisleri kullan
   ```

4. **Type safety kullan**
   ```typescript
   import type { DomesticPackage } from '@ematu/dpd-sdk';
   const packages: DomesticPackage[] = [...]
   ```

## Daha Fazla Bilgi

- [Ana README](../README.md)
- [API Documentation](../README.md#api-reference)
- [DPD API Docs](https://docs.dpd.com.pl/)
