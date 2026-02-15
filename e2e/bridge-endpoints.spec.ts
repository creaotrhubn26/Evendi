/**
 * E2E: Bridge Endpoints (Evendi→CreatorHub, x-api-key auth on :5000)
 * 6 endpoints: statistics, vendors, couples, analytics/summary, conversations, projects
 */
import { test, expect } from '@playwright/test';
import {
  bridgeHeaders,
  adminHeaders,
  LINKED_VENDOR_ID,
} from './helpers';

test.describe('Bridge API-Key Endpoints', () => {

  test('GET /api/creatorhub/evendi/statistics → 200', async ({ request }) => {
    const res = await request.get('/api/creatorhub/evendi/statistics', { headers: bridgeHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/creatorhub/evendi/vendors → 200', async ({ request }) => {
    const res = await request.get('/api/creatorhub/evendi/vendors', { headers: bridgeHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/creatorhub/evendi/couples → 200', async ({ request }) => {
    const res = await request.get('/api/creatorhub/evendi/couples', { headers: bridgeHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/creatorhub/analytics/summary → 200', async ({ request }) => {
    const res = await request.get(
      '/api/creatorhub/analytics/summary',
      { headers: bridgeHeaders() }
    );
    expect(res.status()).toBe(200);
  });

  test('GET /api/creatorhub/evendi/conversations?vendorId=... → 200', async ({ request }) => {
    const res = await request.get(
      `/api/creatorhub/evendi/conversations?vendorId=${LINKED_VENDOR_ID}`,
      { headers: bridgeHeaders() }
    );
    expect(res.status()).toBe(200);
  });
});

test.describe('Bridge Admin Endpoints', () => {

  test('GET /api/creatorhub/projects → 200 (admin auth)', async ({ request }) => {
    const res = await request.get('/api/creatorhub/projects', {
      headers: { 'X-Admin-Secret': 'evendi-admin-2024-secure' },
    });
    expect(res.status()).toBe(200);
  });
});
