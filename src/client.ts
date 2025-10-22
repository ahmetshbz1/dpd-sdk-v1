import type { Client as SoapClient } from 'soap';
import type { DPDConfig } from './types/auth.js';
import { DPDConfigSchema, ENDPOINTS } from './types/auth.js';
import { createSoapClient } from './utils/soap-client.js';
import { validateInput } from './utils/validation.js';
import { DomesticService } from './services/domestic.js';
import { InternationalService } from './services/international.js';
import { ReturnService } from './services/return.js';
import { TrackingService } from './services/tracking.js';
import { PudoService } from './services/pudo.js';

export class DPDClient {
  private soapClient: SoapClient | null = null;
  private config: DPDConfig;

  public readonly domestic: DomesticService;
  public readonly international: InternationalService;
  public readonly returns: ReturnService;
  public readonly tracking: TrackingService;
  public readonly pudo: PudoService;

  constructor(config: DPDConfig) {
    this.config = validateInput(DPDConfigSchema, config) as DPDConfig;

    this.domestic = new DomesticService(this);
    this.international = new InternationalService(this);
    this.returns = new ReturnService(this);
    this.tracking = new TrackingService(this);
    this.pudo = new PudoService(this);
  }

  async initialize(): Promise<void> {
    const endpoint = ENDPOINTS[this.config.environment].objServices;
    this.soapClient = await createSoapClient(endpoint, {
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      retryDelay: 1000,
    });
  }

  getSoapClient(): SoapClient {
    if (!this.soapClient) {
      throw new Error(
        'DPD Client not initialized. Call initialize() method first.'
      );
    }
    return this.soapClient;
  }

  getConfig(): DPDConfig {
    return this.config;
  }
}
