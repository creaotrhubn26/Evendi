/**
 * E2E: Evendi Public Endpoints (no auth required)
 * 9 endpoints
 */
import { test, expect } from '@playwright/test';

test.describe('Evendi Public Endpoints', () => {
  
  test('GET /api/weather?lat=59.91&lon=10.75 → 200', async ({ request }) => {
    const res = await request.get('/api/weather?lat=59.91&lon=10.75');
    expect(res.status()).toBe(200);
  });

  test('GET /api/brreg/search?name=test → 200', async ({ request }) => {
    const res = await request.get('/api/brreg/search?name=test');
    expect(res.status()).toBe(200);
  });

  test('GET /api/vendor-categories → 200', async ({ request }) => {
    const res = await request.get('/api/vendor-categories');
    expect(res.status()).toBe(200);
  });

  test('GET /api/subscription/tiers → 200', async ({ request }) => {
    const res = await request.get('/api/subscription/tiers');
    expect(res.status()).toBe(200);
  });

  test('GET /api/vendors → 200', async ({ request }) => {
    const res = await request.get('/api/vendors');
    expect(res.status()).toBe(200);
  });

  test('GET /api/vendors/matching → 200', async ({ request }) => {
    const res = await request.get('/api/vendors/matching');
    expect(res.status()).toBe(200);
  });

  test('GET /api/inspiration-categories → 200', async ({ request }) => {
    const res = await request.get('/api/inspiration-categories');
    expect(res.status()).toBe(200);
  });

  test('GET /api/inspirations → 200', async ({ request }) => {
    const res = await request.get('/api/inspirations');
    expect(res.status()).toBe(200);
  });

  test('GET /api/faq/couple → 200', async ({ request }) => {
    const res = await request.get('/api/faq/couple');
    expect(res.status()).toBe(200);
  });
});
