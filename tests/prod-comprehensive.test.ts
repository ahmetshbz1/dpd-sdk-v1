import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DPDClient } from '../src/client';
import { DPDSDK } from '../src/sdk';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  data?: any;
  timestamp: string;
}

interface ComprehensiveTestResults {
  testStartTime: string;
  testEndTime: string;
  totalDuration: number;
  environment: string;
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    successRate: number;
  };
}

describe('DPD SDK - Production Comprehensive Test', () => {
  let client: DPDClient;
  let sdk: DPDSDK;
  let testResults: ComprehensiveTestResults;
  let resultsDir: string;

  beforeAll(async () => {
    // Test sonuçları için klasör oluştur
    resultsDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    // Test başlangıç zamanı
    const startTime = new Date().toISOString();
    testResults = {
      testStartTime: startTime,
      testEndTime: '',
      totalDuration: 0,
      environment: 'production',
      results: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        successRate: 0,
      },
    };

    // Client ve SDK initialize
    client = new DPDClient({
      environment: 'production',
      auth: {
        login: '43130401',
        password: 'c75Bz6tAqMRDKOfm',
        masterFid: '431304',
      },
    });

    sdk = new DPDSDK({
      environment: 'production',
      auth: {
        login: '43130401',
        password: 'c75Bz6tAqMRDKOfm',
        masterFid: '431304',
      },
    });

    await client.initialize();
    await sdk.initialize();
    console.log('Production SOAP client and SDK initialized successfully');
  }, 30000);

  afterAll(async () => {
    // Test bitiş zamanı ve özet hesaplama
    const endTime = new Date().toISOString();
    testResults.testEndTime = endTime;
    testResults.totalDuration = new Date(endTime).getTime() - new Date(testResults.testStartTime).getTime();
    
    // Özet hesaplama
    testResults.summary.total = testResults.results.length;
    testResults.summary.passed = testResults.results.filter(r => r.success).length;
    testResults.summary.failed = testResults.results.filter(r => !r.success).length;
    testResults.summary.successRate = testResults.summary.total > 0 
      ? (testResults.summary.passed / testResults.summary.total) * 100 
      : 0;

    // Sonuçları dosyaya kaydet
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = path.join(resultsDir, `production-test-${timestamp}.json`);
    fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
    
    console.log(`\n=== TEST SUMMARY ===`);
    console.log(`Total Tests: ${testResults.summary.total}`);
    console.log(`Passed: ${testResults.summary.passed}`);
    console.log(`Failed: ${testResults.summary.failed}`);
    console.log(`Success Rate: ${testResults.summary.successRate.toFixed(2)}%`);
    console.log(`Results saved to: ${resultsFile}`);
  });

  // Helper function to run test and record results
  const runTest = async (testName: string, testFn: () => Promise<any>): Promise<void> => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      testResults.results.push({
        testName,
        success: true,
        duration,
        data: result,
        timestamp,
      });
      
      console.log(`✅ ${testName} - ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      testResults.results.push({
        testName,
        success: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
        timestamp,
      });
      
      console.log(`❌ ${testName} - ${duration}ms - Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // ===== DOMESTIC SERVICE TESTS =====
  
  it('Domestic: Generate Package Numbers', async () => {
    await runTest('Domestic: Generate Package Numbers', async () => {
      const result = await client.domestic.generatePackageNumbers([
        {
          sender: {
            name: 'Test Sender Company',
            address: 'Test Sender Street 123',
            city: 'Krakow',
            postalCode: '30-001',
            countryCode: 'PL',
            phone: '+48123456789',
            email: 'sender@test.pl',
          },
          receiver: {
            name: 'Test Receiver Company',
            address: 'Test Receiver Street 456',
            city: 'Warszawa',
            postalCode: '00-001',
            countryCode: 'PL',
            phone: '+48987654321',
            email: 'receiver@test.pl',
          },
          parcels: [
            {
              content: 'Test Package Content',
              weight: 1.5,
            },
          ],
        },
      ]);

      expect(result).toBeDefined();
      expect(result.packages).toBeDefined();
      expect(result.packages.length).toBeGreaterThan(0);
      expect(result.packages[0].waybill).toBeDefined();
      
      return {
        waybill: result.packages[0].waybill,
        packageId: result.packages[0].packageId,
        parcelIds: result.packages[0].parcelIds,
      };
    });
  }, 30000);

  it('Domestic: Generate Labels', async () => {
    await runTest('Domestic: Generate Labels', async () => {
      // Önce package number oluştur
      const pkgResult = await client.domestic.generatePackageNumbers([
        {
          sender: {
            name: 'Label Test Sender',
            address: 'Label Sender Street 1',
            city: 'Gdansk',
            postalCode: '80-001',
            countryCode: 'PL',
          },
          receiver: {
            name: 'Label Test Receiver',
            address: 'Label Receiver Street 2',
            city: 'Poznan',
            postalCode: '60-001',
            countryCode: 'PL',
          },
          parcels: [{ weight: 2.0, content: 'Label Test Package' }],
        },
      ]);

      const waybill = pkgResult.packages[0].waybill;
      
      // Label oluştur
      const labelResult = await client.domestic.generateLabels([waybill], {
        format: 'PDF',
        pageFormat: 'A4',
        variant: 'BIC3',
      });

      expect(labelResult).toBeDefined();
      expect(labelResult.labelData).toBeDefined();
      expect(labelResult.format).toBe('PDF');
      
      return {
        waybill,
        labelFormat: labelResult.format,
        labelSize: labelResult.labelData.length,
      };
    });
  }, 30000);

  it('Domestic: Generate Protocol', async () => {
    await runTest('Domestic: Generate Protocol', async () => {
      // Önce package number oluştur
      const pkgResult = await client.domestic.generatePackageNumbers([
        {
          sender: {
            name: 'Protocol Test Sender',
            address: 'Protocol Sender Street 1',
            city: 'Wroclaw',
            postalCode: '50-001',
            countryCode: 'PL',
          },
          receiver: {
            name: 'Protocol Test Receiver',
            address: 'Protocol Receiver Street 2',
            city: 'Lodz',
            postalCode: '90-001',
            countryCode: 'PL',
          },
          parcels: [{ weight: 1.0, content: 'Protocol Test Package' }],
        },
      ]);

      const waybill = pkgResult.packages[0].waybill;
      
      // Protocol oluştur
      const protocolResult = await client.domestic.generateProtocol([waybill]);

      expect(protocolResult).toBeDefined();
      expect(protocolResult.protocolData).toBeDefined();
      expect(protocolResult.sessionId).toBeDefined();
      
      return {
        waybill,
        sessionId: protocolResult.sessionId,
        protocolSize: protocolResult.protocolData.length,
      };
    });
  }, 30000);

  it('Domestic: Pickup Call', async () => {
    await runTest('Domestic: Pickup Call', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const pickupDate = tomorrow.toISOString().split('T')[0];

      const pickupResult = await client.domestic.pickupCall({
        pickupDate,
        pickupTimeFrom: '09:00',
        pickupTimeTo: '12:00',
      });

      expect(pickupResult).toBeDefined();
      expect(pickupResult.pickupId).toBeDefined();
      expect(pickupResult.status).toBeDefined();
      
      return {
        pickupId: pickupResult.pickupId,
        status: pickupResult.status,
        pickupDate: pickupResult.pickupDate,
      };
    });
  }, 30000);

  // ===== INTERNATIONAL SERVICE TESTS =====

  it('International: Generate Package Numbers', async () => {
    await runTest('International: Generate Package Numbers', async () => {
      const result = await client.international.generatePackageNumbers([
        {
          sender: {
            name: 'International Sender',
            address: 'International Sender Street 1',
            city: 'Warszawa',
            postalCode: '00-001',
            countryCode: 'PL',
          },
          receiver: {
            name: 'International Receiver',
            address: 'International Receiver Street 1',
            city: 'Berlin',
            postalCode: '10115',
            countryCode: 'DE',
          },
          parcels: [
            {
              content: 'International Test Package',
              weight: 2.5,
              sizeX: 30,
              sizeY: 20,
              sizeZ: 10,
              customerData1: 'Test Data 1',
              customerData2: 'Test Data 2',
              customerData3: 'Test Data 3',
            },
          ],
        },
      ]);

      expect(result).toBeDefined();
      expect(result.packages).toBeDefined();
      expect(result.packages.length).toBeGreaterThan(0);
      expect(result.packages[0].waybill).toBeDefined();
      
      return {
        waybill: result.packages[0].waybill,
        packageId: result.packages[0].packageId,
        parcelIds: result.packages[0].parcelIds,
      };
    });
  }, 30000);

  // ===== TRACKING SERVICE TESTS =====

  it('Tracking: Get Parcel Status', async () => {
    await runTest('Tracking: Get Parcel Status', async () => {
      // Önce bir waybill oluştur
      const pkgResult = await client.domestic.generatePackageNumbers([
        {
          sender: {
            name: 'Tracking Test Sender',
            address: 'Tracking Sender Street 1',
            city: 'Krakow',
            postalCode: '30-001',
            countryCode: 'PL',
          },
          receiver: {
            name: 'Tracking Test Receiver',
            address: 'Tracking Receiver Street 1',
            city: 'Warszawa',
            postalCode: '00-001',
            countryCode: 'PL',
          },
          parcels: [{ weight: 1.0, content: 'Tracking Test Package' }],
        },
      ]);

      const waybill = pkgResult.packages[0].waybill;
      
      // Tracking sorgula
      const statusResult = await client.tracking.getParcelStatus(waybill);

      expect(statusResult).toBeDefined();
      expect(statusResult.waybill).toBe(waybill);
      expect(statusResult.status).toBeDefined();
      
      return {
        waybill: statusResult.waybill,
        status: statusResult.status,
        statusCode: statusResult.statusCode,
        lastUpdate: statusResult.lastUpdate,
        eventsCount: statusResult.events?.length || 0,
      };
    });
  }, 30000);

  it('Tracking: Get Postcode Info', async () => {
    await runTest('Tracking: Get Postcode Info', async () => {
      const postcodeResult = await client.tracking.getPostcodeInfo('00-001', 'PL');

      expect(postcodeResult).toBeDefined();
      expect(postcodeResult.postcode).toBe('00-001');
      expect(postcodeResult.city).toBeDefined();
      expect(postcodeResult.countryCode).toBe('PL');
      
      return {
        postcode: postcodeResult.postcode,
        city: postcodeResult.city,
        countryCode: postcodeResult.countryCode,
        depot: postcodeResult.depot,
      };
    });
  }, 30000);

  // ===== PUDO SERVICE TESTS =====

  it('PUDO: Find Parcel Shops', async () => {
    await runTest('PUDO: Find Parcel Shops', async () => {
      const shopsResult = await client.pudo.findParcelShops({
        city: 'Warszawa',
        countryCode: 'PL',
        limit: 5,
      });

      expect(shopsResult).toBeDefined();
      expect(Array.isArray(shopsResult)).toBe(true);
      
      return {
        shopsFound: shopsResult.length,
        firstShop: shopsResult[0] ? {
          name: shopsResult[0].name,
          city: shopsResult[0].city,
          postalCode: shopsResult[0].postalCode,
        } : null,
      };
    });
  }, 30000);

  it('PUDO: Get Specific Parcel Shop', async () => {
    await runTest('PUDO: Get Specific Parcel Shop', async () => {
      // Önce shops listesi al
      const shops = await client.pudo.findParcelShops({
        city: 'Warszawa',
        countryCode: 'PL',
        limit: 1,
      });

      if (shops.length > 0) {
        const shopDetails = await client.pudo.getParcelShop(shops[0].pudoId);
        
        expect(shopDetails).toBeDefined();
        expect(shopDetails?.pudoId).toBe(shops[0].pudoId);
        
        return {
          pudoId: shopDetails?.pudoId,
          name: shopDetails?.name,
          city: shopDetails?.city,
          address: shopDetails?.address,
        };
      } else {
        return { message: 'No shops found for detailed lookup' };
      }
    });
  }, 30000);

  // ===== RETURN SERVICE TESTS =====

  it('Return: Generate Domestic Return Label', async () => {
    await runTest('Return: Generate Domestic Return Label', async () => {
      // Önce bir waybill oluştur
      const pkgResult = await client.domestic.generatePackageNumbers([
        {
          sender: {
            name: 'Return Test Sender',
            address: 'Return Sender Street 1',
            city: 'Gdansk',
            postalCode: '80-001',
            countryCode: 'PL',
          },
          receiver: {
            name: 'Return Test Receiver',
            address: 'Return Receiver Street 1',
            city: 'Szczecin',
            postalCode: '70-001',
            countryCode: 'PL',
          },
          parcels: [{ weight: 1.5, content: 'Return Test Package' }],
        },
      ]);

      const waybill = pkgResult.packages[0].waybill;
      
      // Return label oluştur
      const returnLabel = await client.returns.generateDomesticReturnLabel(
        [waybill],
        {
          name: 'Return Receiver',
          address: 'Return Address 123',
          city: 'Warszawa',
          postalCode: '00-001',
          countryCode: 'PL',
        },
        {
          format: 'PDF',
          pageFormat: 'A4',
        }
      );

      expect(returnLabel).toBeDefined();
      expect(returnLabel.labelData).toBeDefined();
      expect(returnLabel.format).toBe('PDF');
      
      return {
        waybill,
        labelFormat: returnLabel.format,
        labelSize: returnLabel.labelData.length,
      };
    });
  }, 30000);

  it('Return: Generate International Return Label', async () => {
    await runTest('Return: Generate International Return Label', async () => {
      // Önce international waybill oluştur
      const pkgResult = await client.international.generatePackageNumbers([
        {
          sender: {
            name: 'Int Return Sender',
            address: 'Int Return Sender Street 1',
            city: 'Warszawa',
            postalCode: '00-001',
            countryCode: 'PL',
          },
          receiver: {
            name: 'Int Return Receiver',
            address: 'Int Return Receiver Street 1',
            city: 'Prague',
            postalCode: '11000',
            countryCode: 'CZ',
          },
          parcels: [
            {
              content: 'International Return Test',
              weight: 1.0,
              sizeX: 25,
              sizeY: 15,
              sizeZ: 5,
            },
          ],
        },
      ]);

      const waybill = pkgResult.packages[0].waybill;
      
      // International return label oluştur
      const returnLabel = await client.returns.generateInternationalReturnLabel(
        [waybill],
        {
          name: 'International Return Receiver',
          address: 'International Return Address 456',
          city: 'Warszawa',
          postalCode: '00-001',
          countryCode: 'PL',
        },
        {
          format: 'PDF',
          pageFormat: 'A4',
        }
      );

      expect(returnLabel).toBeDefined();
      expect(returnLabel.labelData).toBeDefined();
      expect(returnLabel.format).toBe('PDF');
      
      return {
        waybill,
        labelFormat: returnLabel.format,
        labelSize: returnLabel.labelData.length,
      };
    });
  }, 30000);

  // ===== HIGH-LEVEL SDK TESTS =====

  it('High-Level SDK: Create Label (2-step flow)', async () => {
    await runTest('High-Level SDK: Create Label', async () => {
      const labelResult = await sdk.createLabel({
        sender: {
          name: 'SDK Test Sender',
          address: 'SDK Sender Street 1',
          city: 'Krakow',
          postalCode: '30-001',
          countryCode: 'PL',
          phone: '+48123456789',
          email: 'sdk-sender@test.pl',
        },
        receiver: {
          name: 'SDK Test Receiver',
          address: 'SDK Receiver Street 1',
          city: 'Warszawa',
          postalCode: '00-001',
          countryCode: 'PL',
          phone: '+48987654321',
          email: 'sdk-receiver@test.pl',
        },
        pkg: {
          weight: 2.0,
          content: 'SDK Test Package',
        },
        label: {
          format: 'PDF',
          pageFormat: 'A4',
          variant: 'BIC3',
        },
      });

      expect(labelResult).toBeDefined();
      expect(labelResult.waybill).toBeDefined();
      expect(labelResult.pdfBase64).toBeDefined();
      expect(labelResult.trackingUrl).toBeDefined();
      expect(labelResult.createdAt).toBeDefined();
      
      return {
        waybill: labelResult.waybill,
        trackingUrl: labelResult.trackingUrl,
        createdAt: labelResult.createdAt,
        pdfSize: labelResult.pdfBase64.length,
      };
    });
  }, 30000);

  it('High-Level SDK: Get Tracking', async () => {
    await runTest('High-Level SDK: Get Tracking', async () => {
      // Önce bir waybill oluştur
      const labelResult = await sdk.createLabel({
        sender: {
          name: 'SDK Tracking Sender',
          address: 'SDK Tracking Sender Street 1',
          city: 'Gdansk',
          postalCode: '80-001',
          countryCode: 'PL',
        },
        receiver: {
          name: 'SDK Tracking Receiver',
          address: 'SDK Tracking Receiver Street 1',
          city: 'Poznan',
          postalCode: '60-001',
          countryCode: 'PL',
        },
        pkg: {
          weight: 1.0,
          content: 'SDK Tracking Test Package',
        },
      });

      const waybill = labelResult.waybill;
      
      // Tracking sorgula
      const trackingResult = await sdk.getTracking(waybill);

      expect(trackingResult).toBeDefined();
      expect(trackingResult.waybill).toBe(waybill);
      expect(trackingResult.status).toBeDefined();
      
      return {
        waybill: trackingResult.waybill,
        status: trackingResult.status,
        lastUpdate: trackingResult.lastUpdate,
        eventsCount: trackingResult.events?.length || 0,
      };
    });
  }, 30000);

  it('High-Level SDK: Create Pickup', async () => {
    await runTest('High-Level SDK: Create Pickup', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const pickupDate = tomorrow.toISOString().split('T')[0];

      const pickupResult = await sdk.createPickup({
        pickupDate,
        pickupTimeFrom: '10:00',
        pickupTimeTo: '14:00',
      });

      expect(pickupResult).toBeDefined();
      expect(pickupResult.pickupId).toBeDefined();
      expect(pickupResult.status).toBeDefined();
      expect(pickupResult.pickupDate).toBe(pickupDate);
      
      return {
        pickupId: pickupResult.pickupId,
        status: pickupResult.status,
        pickupDate: pickupResult.pickupDate,
      };
    });
  }, 30000);

  it('High-Level SDK: Batch Operations', async () => {
    await runTest('High-Level SDK: Batch Operations', async () => {
      // Batch label creation
      const batchLabels = await sdk.createLabelsBatch([
        {
          sender: {
            name: 'Batch Sender 1',
            address: 'Batch Sender Street 1',
            city: 'Warszawa',
            postalCode: '00-001',
            countryCode: 'PL',
          },
          receiver: {
            name: 'Batch Receiver 1',
            address: 'Batch Receiver Street 1',
            city: 'Krakow',
            postalCode: '30-001',
            countryCode: 'PL',
          },
          pkg: { weight: 1.0, content: 'Batch Test 1' },
        },
        {
          sender: {
            name: 'Batch Sender 2',
            address: 'Batch Sender Street 2',
            city: 'Gdansk',
            postalCode: '80-001',
            countryCode: 'PL',
          },
          receiver: {
            name: 'Batch Receiver 2',
            address: 'Batch Receiver Street 2',
            city: 'Poznan',
            postalCode: '60-001',
            countryCode: 'PL',
          },
          pkg: { weight: 1.5, content: 'Batch Test 2' },
        },
      ]);

      expect(batchLabels).toBeDefined();
      expect(batchLabels.labels).toBeDefined();
      expect(batchLabels.errors).toBeDefined();
      
      return {
        labelsCreated: batchLabels.labels.length,
        errorsCount: batchLabels.errors.length,
        waybills: batchLabels.labels.map(l => l.waybill),
        errors: batchLabels.errors,
      };
    });
  }, 30000);
});
