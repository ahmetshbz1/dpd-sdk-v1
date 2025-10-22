import soap from 'soap';
import type { Client as SoapClient } from 'soap';
import { DPDNetworkError, DPDServiceError } from '../types/errors.js';

export interface RetryOptions {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
};

// Genel utility fonksiyonları 200 satır limiti için ayrı dosyada olacak
export async function createSoapClient(
  wsdlUrl: string,
  _options?: Partial<RetryOptions>
): Promise<SoapClient> {
  try {
    return await soap.createClientAsync(wsdlUrl, {
      disableCache: true,
    });
  } catch (error) {
    throw new DPDNetworkError(
      `Failed to create SOAP client: ${wsdlUrl}`,
      error
    );
  }
}

export async function invokeSoapMethod<T>(
  client: SoapClient,
  methodName: string,
  args: unknown,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const method = client[methodName];
      if (typeof method !== 'function') {
        throw new DPDServiceError(`SOAP method not found: ${methodName}`);
      }

      // Debug: Log SOAP request
      console.log(`\n🔵 SOAP Request: ${methodName}`);
      console.log(JSON.stringify(args, null, 2));

      const result = await new Promise<T>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        method.call(client, args, (err: Error | null, res: T) => {
          if (err) {
            console.log(`\n🔴 SOAP Error: ${methodName}`);
            console.log(err);
            reject(err);
          } else {
            console.log(`\n🟢 SOAP Response: ${methodName}`);
            console.log(JSON.stringify(res, null, 2));
            resolve(res);
          }
        });
      });

      return result;
    } catch (error) {
      lastError = error;

      if (attempt < opts.maxRetries) {
        await sleep(opts.retryDelay * (attempt + 1));
        continue;
      }
    }
  }

  throw new DPDServiceError(
    `SOAP method failed after ${opts.maxRetries} retries: ${methodName}`,
    undefined,
    lastError
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
