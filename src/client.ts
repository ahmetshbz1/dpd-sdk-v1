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

/**
 * DPD Poland API Client
 *
 * Enterprise-grade TypeScript SDK for DPD Poland shipping services.
 * Supports domestic/international shipping, returns, tracking, and PUDO services.
 *
 * @example
 * ```typescript
 * const client = new DPDClient({
 *   environment: 'demo',
 *   auth: {
 *     login: 'your-fid',
 *     password: 'your-password',
 *     masterFid: 'your-master-fid'
 *   }
 * });
 *
 * await client.initialize();
 *
 * const result = await client.domestic.generatePackageNumbers([package]);
 * ```
 */
export class DPDClient {
  private soapClient: SoapClient | null = null;
  private xmlSoapClient: SoapClient | null = null;
  private config: DPDConfig;

  /** Domestic shipping operations */
  public readonly domestic: DomesticService;
  /** International shipping operations */
  public readonly international: InternationalService;
  /** Return label generation */
  public readonly returns: ReturnService;
  /** Parcel tracking and postcode lookup */
  public readonly tracking: TrackingService;
  /** PUDO/ParcelShop search and details */
  public readonly pudo: PudoService;

  /**
   * Creates a new DPD API client instance
   *
   * @param config - Client configuration with auth credentials and environment
   * @throws {ValidationError} When config validation fails
   */
  constructor(config: DPDConfig) {
    this.config = validateInput(DPDConfigSchema, config) as DPDConfig;

    this.domestic = new DomesticService(this);
    this.international = new InternationalService(this);
    this.returns = new ReturnService(this);
    this.tracking = new TrackingService(this);
    this.pudo = new PudoService(this);
  }

  /**
   * Initializes SOAP client connection
   *
   * Must be called before using any service methods.
   *
   * @throws {DPDNetworkError} When SOAP client creation fails
   * @example
   * ```typescript
   * await client.initialize();
   * ```
   */
  async initialize(): Promise<void> {
    const objEndpoint = ENDPOINTS[this.config.environment].objServices;
    const xmlEndpoint = ENDPOINTS[this.config.environment].xmlServices;
    
    this.soapClient = await createSoapClient(objEndpoint, {
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      retryDelay: 1000,
    });
    
    this.xmlSoapClient = await createSoapClient(xmlEndpoint, {
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      retryDelay: 1000,
    });
  }

  /**
   * @internal
   * Returns initialized SOAP client
   */
  getSoapClient(): SoapClient {
    if (!this.soapClient) {
      throw new Error(
        'DPD Client not initialized. Call initialize() method first.'
      );
    }
    return this.soapClient;
  }

  /**
   * @internal
   * Returns initialized XML SOAP client
   */
  getXmlSoapClient(): SoapClient {
    if (!this.xmlSoapClient) {
      throw new Error(
        'DPD XML Client not initialized. Call initialize() method first.'
      );
    }
    return this.xmlSoapClient;
  }

  /**
   * @internal
   * Returns current client configuration
   */
  getConfig(): DPDConfig {
    return this.config;
  }
}
