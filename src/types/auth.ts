import { z } from 'zod';

export const AuthDataSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
  masterFid: z.string().min(1),
});

export type AuthData = z.infer<typeof AuthDataSchema>;

export const DPDConfigSchema = z.object({
  auth: AuthDataSchema,
  environment: z.enum(['production', 'demo']).default('production'),
  timeout: z.number().min(1000).max(60000).default(30000),
  maxRetries: z.number().min(0).max(5).default(3),
});

export type DPDConfig = z.infer<typeof DPDConfigSchema>;

export const ENDPOINTS = {
  production: {
    objServices: 'https://dpdservices.dpd.com.pl/DPDPackageObjServicesService/DPDPackageObjServices?WSDL',
    xmlServices: 'https://dpdservices.dpd.com.pl/DPDPackageXmlServicesService/DPDPackageXmlServices?WSDL',
  },
  demo: {
    objServices: 'https://dpdservicesdemo.dpd.com.pl/DPDPackageObjServicesService/DPDPackageObjServices?WSDL',
    xmlServices: 'https://dpdservicesdemo.dpd.com.pl/DPDPackageXmlServicesService/DPDPackageXmlServices?WSDL',
  },
} as const;
