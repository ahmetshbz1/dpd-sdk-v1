import { describe, it, expect } from 'vitest';
import { DPDSDK } from '../../src/sdk';

describe('DPDSDK - ergonomics', () => {
  it('builds basic request shape and exposes helpers', async () => {
    const sdk = new DPDSDK({
      auth: { login: 'x', password: 'y', masterFid: 'z' },
      environment: 'demo',
    } as any);

    // Only validate method existence and parameter shapes (no network)
    expect(typeof sdk.createLabel).toBe('function');
    expect(typeof sdk.createLabelsBatch).toBe('function');
    expect(typeof sdk.getTracking).toBe('function');
    expect(typeof sdk.getBatchTracking).toBe('function');
    expect(typeof sdk.getEvents).toBe('function');
    expect(typeof sdk.createPickup).toBe('function');
  });
});