import { z } from 'zod';

// SOAP response validation schemas - runtime type safety için

// Package generation response schema
export const PackageGenerationSoapResponseSchema = z.object({
  packages: z
    .array(
      z.object({
        packageId: z.string(),
        parcels: z.array(
          z.object({
            parcelId: z.string(),
          })
        ),
        waybill: z.string(),
        status: z.string().optional(),
      })
    )
    .optional(),
});

export type PackageGenerationSoapResponse = z.infer<
  typeof PackageGenerationSoapResponseSchema
>;

// Label generation response schema
export const LabelGenerationSoapResponseSchema = z.object({
  documentData: z.string(),
});

export type LabelGenerationSoapResponse = z.infer<
  typeof LabelGenerationSoapResponseSchema
>;

// Protocol response schema
export const ProtocolSoapResponseSchema = z.object({
  documentData: z.string(),
  sessionId: z.string().optional(),
});

export type ProtocolSoapResponse = z.infer<typeof ProtocolSoapResponseSchema>;

// Courier pickup response schema
export const CourierPickupSoapResponseSchema = z.object({
  pickupCallId: z.string(),
  status: z.string(),
});

export type CourierPickupSoapResponse = z.infer<
  typeof CourierPickupSoapResponseSchema
>;

// Tracking response schema
export const ParcelStatusSoapResponseSchema = z.object({
  parcel: z
    .object({
      waybill: z.string(),
      status: z.string(),
      statusCode: z.string().optional(),
      statusDescription: z.string().optional(),
      lastUpdate: z.string().optional(),
      events: z
        .array(
          z.object({
            date: z.string(),
            description: z.string(),
            location: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional(),
});

export type ParcelStatusSoapResponse = z.infer<
  typeof ParcelStatusSoapResponseSchema
>;

// Postcode info response schema
export const PostcodeInfoSoapResponseSchema = z.object({
  postcode: z.string(),
  city: z.string(),
  countryCode: z.string(),
  depot: z.string().optional(),
});

export type PostcodeInfoSoapResponse = z.infer<
  typeof PostcodeInfoSoapResponseSchema
>;
