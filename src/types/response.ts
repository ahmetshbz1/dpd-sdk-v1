import { z } from 'zod';

export const PackageStatusSchema = z.object({
  status: z.string(),
  statusDescription: z.string().optional(),
});

export type PackageStatus = z.infer<typeof PackageStatusSchema>;

export const GeneratedPackageSchema = z.object({
  sessionId: z.string().optional(),
  packageId: z.string(),
  parcelIds: z.array(z.string()),
  waybill: z.string(),
  status: PackageStatusSchema.optional(),
});

export type GeneratedPackage = z.infer<typeof GeneratedPackageSchema>;

export const PackageGenerationResponseSchema = z.object({
  packages: z.array(GeneratedPackageSchema),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
  })).optional(),
});

export type PackageGenerationResponse = z.infer<typeof PackageGenerationResponseSchema>;

export const LabelFormatSchema = z.enum(['PDF', 'ZPL', 'EPL']);
export type LabelFormat = z.infer<typeof LabelFormatSchema>;

export const PageFormatSchema = z.enum(['A4', 'A6', 'LBL']);
export type PageFormat = z.infer<typeof PageFormatSchema>;

export const LabelResponseSchema = z.object({
  labelData: z.string(),
  format: LabelFormatSchema,
  pageFormat: PageFormatSchema,
});

export type LabelResponse = z.infer<typeof LabelResponseSchema>;

export const ProtocolResponseSchema = z.object({
  protocolData: z.string(),
  sessionId: z.string().optional(),
});

export type ProtocolResponse = z.infer<typeof ProtocolResponseSchema>;

export const CourierPickupResponseSchema = z.object({
  pickupId: z.string(),
  status: z.string(),
  pickupDate: z.string(),
});

export type CourierPickupResponse = z.infer<typeof CourierPickupResponseSchema>;
