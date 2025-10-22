import { z } from 'zod';
import { ReceiverSchema, SenderSchema } from './address.js';

export const ParcelSchema = z.object({
  content: z.string().max(20).optional(),
  customerData1: z.string().max(35).optional(),
  customerData2: z.string().max(35).optional(),
  customerData3: z.string().max(35).optional(),
  sizeX: z.number().positive().optional(),
  sizeY: z.number().positive().optional(),
  sizeZ: z.number().positive().optional(),
  weight: z.number().positive(),
});

export type Parcel = z.infer<typeof ParcelSchema>;

export const PayerTypeSchema = z.enum(['SENDER', 'RECEIVER', 'THIRD_PARTY']);
export type PayerType = z.infer<typeof PayerTypeSchema>;

// Additional service type schemas
export const CODSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['PLN', 'EUR', 'RON', 'CZK']).default('PLN'),
});

export const DeclaredValueSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['PLN', 'EUR']).default('PLN'),
});

export const GuaranteeSchema = z.object({
  type: z.enum(['TIME0930', 'TIME1200', 'SATURDAY', 'TIMEFIXED', 'DPDTODAY']),
  value: z.string().optional(), // For TIMEFIXED: HH:MM format
});

export const DPDPickupSchema = z.object({
  pudo: z.string(), // PUDO ID (e.g., PL14187)
});

export const PackageServicesSchema = z.object({
  cod: CODSchema.optional(),
  declaredValue: DeclaredValueSchema.optional(),
  cud: z.boolean().optional(), // Kurier dostarcza i pobiera
  rod: z.boolean().optional(), // Return on delivery
  self: z.boolean().optional(), // Odbiór osobisty
  guarantee: GuaranteeSchema.optional(),
  pudoReturn: z.boolean().optional(),
  dpdPickup: DPDPickupSchema.optional(), // Odbiór w punkcie
  carryIn: z.boolean().optional(), // Wniesienie
  dpdLQ: z.boolean().optional(), // Dangerous goods
  dpdFood: z.boolean().optional(), // Food delivery
});

export type COD = z.infer<typeof CODSchema>;
export type DeclaredValue = z.infer<typeof DeclaredValueSchema>;
export type Guarantee = z.infer<typeof GuaranteeSchema>;
export type DPDPickup = z.infer<typeof DPDPickupSchema>;
export type PackageServices = z.infer<typeof PackageServicesSchema>;

export const DomesticPackageSchema = z.object({
  sender: SenderSchema,
  receiver: ReceiverSchema,
  parcels: z.array(ParcelSchema).min(1),
  payerType: PayerTypeSchema.optional().default('SENDER'),
  thirdPartyFid: z.string().optional(),
  ref1: z.string().max(50).optional(),
  ref2: z.string().max(50).optional(),
  ref3: z.string().max(50).optional(),
  services: PackageServicesSchema.optional(),
});

export type DomesticPackage = z.infer<typeof DomesticPackageSchema>;

export const InternationalPackageSchema = DomesticPackageSchema;
export type InternationalPackage = z.infer<typeof InternationalPackageSchema>;
