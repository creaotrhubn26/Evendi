/**
 * E2E: CreatorHub BI Dashboard Endpoints (x-user-id auth on :3001)
 * 7 endpoints
 */
import { test, expect } from '@playwright/test';
import { creatorhubHeaders } from './helpers';

test.describe('BI Dashboard Endpoints', () => {

  test('GET /api/bi/dashboard → 200', async ({ request }) => {
    const res = await request.get('/api/bi/dashboard', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/bi/market-analysis → 200', async ({ request }) => {
    const res = await request.get('/api/bi/market-analysis', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/bi/regional-analysis → 200', async ({ request }) => {
    const res = await request.get('/api/bi/regional-analysis', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/bi/intelligence/status → 200', async ({ request }) => {
    const res = await request.get('/api/bi/intelligence/status', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/bi/revenue-analytics → 200', async ({ request }) => {
    const res = await request.get('/api/bi/revenue-analytics', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/bi/payment-analytics → 200', async ({ request }) => {
    const res = await request.get('/api/bi/payment-analytics', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/bi/market-insights → 200', async ({ request }) => {
    const res = await request.get('/api/bi/market-insights', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });
});
