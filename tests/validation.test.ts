import { describe, it, expect } from 'vitest';
import { DomesticPackageSchema } from '../src/types/package';
import { AddressSchema } from '../src/types/address';

describe('Validation', () => {
  describe('AddressSchema', () => {
    it('should validate valid address', () => {
      const validAddress = {
        name: 'Test Company',
        address: 'Test Street 123',
        city: 'Warsaw',
        postalCode: '00-001',
        countryCode: 'PL',
      };

      const result = AddressSchema.safeParse(validAddress);
      expect(result.success).toBe(true);
    });

    it('should reject invalid postal code', () => {
      const invalidAddress = {
        name: 'Test',
        address: 'Test',
        city: 'Warsaw',
        postalCode: '', // Invalid
        countryCode: 'PL',
      };

      const result = AddressSchema.safeParse(invalidAddress);
      expect(result.success).toBe(false);
    });
  });

  describe('DomesticPackageSchema', () => {
    it('should validate valid package', () => {
      const validPackage = {
        sender: {
          name: 'Sender',
          address: 'Address 1',
          city: 'Warsaw',
          postalCode: '00-001',
          countryCode: 'PL',
        },
        receiver: {
          name: 'Receiver',
          address: 'Address 2',
          city: 'Krakow',
          postalCode: '30-001',
          countryCode: 'PL',
        },
        parcels: [{ weight: 1.5 }],
        payerType: 'SENDER',
      };

      const result = DomesticPackageSchema.safeParse(validPackage);
      expect(result.success).toBe(true);
    });

    it('should reject package without parcels', () => {
      const invalidPackage = {
        sender: {
          name: 'Sender',
          address: 'Address',
          city: 'Warsaw',
          postalCode: '00-001',
          countryCode: 'PL',
        },
        receiver: {
          name: 'Receiver',
          address: 'Address',
          city: 'Krakow',
          postalCode: '30-001',
          countryCode: 'PL',
        },
        parcels: [], // Invalid
      };

      const result = DomesticPackageSchema.safeParse(invalidPackage);
      expect(result.success).toBe(false);
    });
  });
});
