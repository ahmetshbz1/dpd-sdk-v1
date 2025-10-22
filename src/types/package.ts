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

export const PackageServicesSchema = z.object({
  cod: z.object({ amount: z.number().positive() }).optional(),
  cud: z.boolean().optional(),
  rod: z.boolean().optional(),
  self: z.boolean().optional(),
  guarantee: z.boolean().optional(),
  pudoReturn: z.boolean().optional(),
});

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
