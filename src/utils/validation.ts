import type { ZodSchema } from 'zod';
import { DPDValidationError } from '../types/errors.js';

export function validateInput<T>(
  schema: ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    throw new DPDValidationError(
      'Input validation failed',
      result.error.errors,
      'VALIDATION_ERROR'
    );
  }
  
  return result.data;
}

