/**
 * E2E: Vendor Auth + Session Endpoints (Bearer token auth)
 * 20 endpoints: session check + 19 authenticated reads
 */
import { test, expect } from '@playwright/test';
import {
  EVENDI_URL,
  TEST_VENDOR_EMAIL,
  TEST_VENDOR_PASSWORD,
  getVendorToken,
  vendorHeaders,
} from './helpers';

let token: string;

test.beforeAll(async ({ request }) => {
  token = await getVendorToken(request);
});

test.describe('Vendor Auth & Session', () => {

  test('GET /api/vendor/session → 200', async ({ request }) => {
    const res = await request.get('/api/vendor/session', { headers: vendorHeaders(token) });
    expect(res.status()).toBe(200);
  });

  test('GET /api/vendor/profile → 200', async ({ request }) => {
    const res = await request.get('/api/vendor/profile', { headers: vendorHeaders(token) });
    expect(res.status()).toBe(200);
  });

  test('GET /api/vendor/subscription/status → 200', async ({ request }) => {
    const res = await request.get('/api/vendor/subscription/status', { headers: vendorHeaders(token) });
    expect(res.status()).toBe(200);
  });

  test('GET /api/vendor/category-details → 200', async ({ request }) => {
    const res = await request.get('/api/vendor/category-details', { headers: vendorHeaders(token) });
    expect(res.status()).toBe(200);
  });

  test('GET /api/vendor/deliveries → 200', async ({ request }) => {
    const res = await request.get('/api/vendor/deliveries', { headers: vendorHeaders(token) });
    expect(res.status()).toBe(200);
  });

  test('GET /api/vendor/inspirations → 200', async ({ request }) => {
    const res = await request.get('/api/vendor/inspirations', { headers: vendorHeaders(token) });
    expect(res.status()).toBe(200);
  });

  test('GET /api/vendor/inquiries → 200', async ({ request }) => {
    const res = await request.get('/api/vendor/inquiries', { headers: vendorHeaders(token) });
    expect(res.status()).toBe(200);
  });

  test('GET /api/vendor/conversations → 200', async ({ request }) => {
    const res = await request.get('/api/vendor/conversations', { headers: vendorHeaders(token) });
    expect(res.status()).toBe(200);
  });

  test('GET /api/vendor/products → 200', async ({ request }) => {
    const res = await request.get('/api/vendor/products', { headers: vendorHeaders(token) });
    expect(res.status()).toBe(200);
  });

  test('GET /api/vendor/offers → 200', async ({ request }) => {
    const res = await request.get('/api/vendor/offers', { headers: vendorHeaders(token) });
    expect(res.status()).toBe(200);
  });

  test('GET /api/vendor/availability → 200', async ({ request }) => {
    const res = await request.get('/api/vendor/availability', { headers: vendorHeaders(token) });
    expect(res.status()).toBe(200);
  });

  test('GET /api/vendor/notifications → 200', async ({ request }) => {
    const res = await request.get('/api/vendor/notifications', { headers: vendorHeaders(token) });
    expect(res.status()).toBe(200);
  });

  test('GET /api/vendor/notifications/unread-count → 200', async ({ request }) => {
    const res = await request.get('/api/vendor/notifications/unread-count', { headers: vendorHeaders(token) });
    expect(res.status()).toBe(200);
  });

  test('GET /api/vendor/couple-contracts → 200', async ({ request }) => {
    const res = await request.get('/api/vendor/couple-contracts', { headers: vendorHeaders(token) });
    expect(res.status()).toBe(200);
  });

  test('GET /api/vendor/contracts → 200', async ({ request }) => {
    const res = await request.get('/api/vendor/contracts', { headers: vendorHeaders(token) });
    expect(res.status()).toBe(200);
  });

  test('GET /api/vendor/reviews → 200', async ({ request }) => {
    const res = await request.get('/api/vendor/reviews', { headers: vendorHeaders(token) });
    expect(res.status()).toBe(200);
  });

  test('GET /api/vendor/features → 200', async ({ request }) => {
    const res = await request.get('/api/vendor/features', { headers: vendorHeaders(token) });
    expect(res.status()).toBe(200);
  });

  test('GET /api/vendor/allowed-categories → 200', async ({ request }) => {
    const res = await request.get('/api/vendor/allowed-categories', { headers: vendorHeaders(token) });
    expect(res.status()).toBe(200);
  });

  test('GET /api/vendor/message-reminders → 200', async ({ request }) => {
    const res = await request.get('/api/vendor/message-reminders', { headers: vendorHeaders(token) });
    expect(res.status()).toBe(200);
  });

  test('GET /api/vendor/contacts → 200', async ({ request }) => {
    const res = await request.get('/api/vendor/contacts', { headers: vendorHeaders(token) });
    expect(res.status()).toBe(200);
  });
});
