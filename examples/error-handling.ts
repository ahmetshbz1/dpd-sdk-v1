import {
  DPDClient,
  DPDServiceError,
  DPDNetworkError,
  ValidationError,
} from '@ematu/dpd-sdk';

/**
 * Error Handling Example
 *
 * DPD SDK'da hata yönetimi best practices
 */

async function errorHandlingExample() {
  const client = new DPDClient({
    environment: 'demo',
    auth: {
      login: 'invalid-login',
      password: 'invalid-password',
      masterFid: 'invalid-fid',
    },
  });

  // 1. Network Error Handling
  try {
    await client.initialize();
    console.log('Client initialized successfully');
  } catch (error) {
    if (error instanceof DPDNetworkError) {
      console.error('Network error occurred:');
      console.error(`  Message: ${error.message}`);
      console.error(`  Code: ${error.code}`);
      // Retry logic veya fallback
      return;
    }
    throw error;
  }

  // 2. Service Error Handling
  try {
    await client.domestic.generatePackageNumbers([
      {
        sender: {
          name: 'Invalid Sender',
          // Eksik zorunlu alanlar
        } as any,
        receiver: {
          name: 'Invalid Receiver',
        } as any,
        parcels: [],
      } as any,
    ]);
  } catch (error) {
    if (error instanceof DPDServiceError) {
      console.error('Service error occurred:');
      console.error(`  Message: ${error.message}`);
      console.error(`  Code: ${error.code}`);
      console.error(`  Details:`, error.details);
      // Log to monitoring service
      // Send alert
      return;
    }
    throw error;
  }

  // 3. Validation Error Handling
  try {
    await client.domestic.generatePackageNumbers([
      {
        sender: {
          name: 'Test',
          postalCode: 'INVALID', // Invalid format
        } as any,
        receiver: {} as any,
        parcels: [],
      } as any,
    ]);
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error('Validation error occurred:');
      console.error(`  Message: ${error.message}`);
      console.error(`  Field: ${error.field}`);
      console.error(`  Value: ${error.value}`);
      // Return user-friendly error message
      return;
    }
    throw error;
  }

  // 4. Comprehensive Error Handler
  async function safeGeneratePackage() {
    try {
      const result = await client.domestic.generatePackageNumbers([
        {
          sender: {
            name: 'Sender',
            address: 'Street 1',
            city: 'Warsaw',
            postalCode: '00-001',
            countryCode: 'PL',
          },
          receiver: {
            name: 'Receiver',
            address: 'Street 2',
            city: 'Krakow',
            postalCode: '30-001',
            countryCode: 'PL',
          },
          parcels: [{ weight: 1.0, content: 'Test' }],
          payerType: 'SENDER',
        },
      ]);

      return { success: true, data: result };
    } catch (error) {
      // Network error - retry
      if (error instanceof DPDNetworkError) {
        console.error('Network error, retrying...');
        return { success: false, error: 'network', retry: true };
      }

      // Service error - check if recoverable
      if (error instanceof DPDServiceError) {
        console.error('Service error:', error.code);

        // Auth error - get new credentials
        if (error.code === 'AUTH_FAILED') {
          return { success: false, error: 'auth', retry: false };
        }

        // Invalid data - fix and retry
        if (error.code === 'INVALID_RESPONSE') {
          return { success: false, error: 'invalid_data', retry: false };
        }

        return { success: false, error: 'service', retry: false };
      }

      // Validation error - user input problem
      if (error instanceof ValidationError) {
        console.error('Validation error:', error.field);
        return {
          success: false,
          error: 'validation',
          field: error.field,
          retry: false,
        };
      }

      // Unknown error
      console.error('Unknown error:', error);
      return { success: false, error: 'unknown', retry: false };
    }
  }

  const result = await safeGeneratePackage();
  console.log('Result:', result);

  // 5. Retry Logic with Exponential Backoff
  async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) throw error;

        if (error instanceof DPDNetworkError) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.log(`Retry ${attempt}/${maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw error; // Non-retryable error
      }
    }
    throw new Error('Max retries exceeded');
  }

  // Usage
  try {
    const status = await retryWithBackoff(() =>
      client.tracking.getParcelStatus('1234567890')
    );
    console.log('Status:', status);
  } catch (error) {
    console.error('Failed after retries:', error);
  }
}

errorHandlingExample().catch(console.error);
