/**
 * E2E: Admin Endpoints (ADMIN_SECRET auth)
 * 10 endpoints
 */
import { test, expect } from '@playwright/test';
import { adminHeaders, adminSecretHeaders } from './helpers';

test.describe('Admin Endpoints', () => {

  test('GET /api/admin/settings → 200', async ({ request }) => {
    const res = await request.get('/api/admin/settings', { headers: adminHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/admin/statistics → 200', async ({ request }) => {
    const res = await request.get('/api/admin/statistics', { headers: adminHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/admin/vendors → 200', async ({ request }) => {
    const res = await request.get('/api/admin/vendors', { headers: adminHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/admin/couples → 200', async ({ request }) => {
    const res = await request.get('/api/admin/couples', { headers: adminHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/admin/inspirations → 200', async ({ request }) => {
    const res = await request.get('/api/admin/inspirations', { headers: adminHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/admin/preview/couple/users → 200', async ({ request }) => {
    const res = await request.get('/api/admin/preview/couple/users', { headers: adminHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/admin/preview/vendor/users → 200', async ({ request }) => {
    const res = await request.get('/api/admin/preview/vendor/users', { headers: adminHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/admin/vendor-admin-conversations → 200', async ({ request }) => {
    const res = await request.get('/api/admin/vendor-admin-conversations', { headers: adminHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/admin/checklists → 200', async ({ request }) => {
    const res = await request.get('/api/admin/checklists', { headers: adminSecretHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/admin/feedback → 200', async ({ request }) => {
    const res = await request.get('/api/admin/feedback', { headers: adminSecretHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/admin/reviews/pending → 200', async ({ request }) => {
    const res = await request.get('/api/admin/reviews/pending', { headers: adminSecretHeaders() });
    expect(res.status()).toBe(200);
  });
});
