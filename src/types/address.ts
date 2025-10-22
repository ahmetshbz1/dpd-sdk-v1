import { z } from 'zod';

export const AddressSchema = z.object({
  company: z.string().optional(),
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  countryCode: z.string().length(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export type Address = z.infer<typeof AddressSchema>;

export const SenderSchema = AddressSchema;
export type Sender = Address;

export const ReceiverSchema = AddressSchema;
export type Receiver = Address;
