/**
 * E2E: CreatorHub Universal CRM (x-user-id auth on :3001)
 * 9 endpoints
 */
import { test, expect } from '@playwright/test';
import { creatorhubHeaders } from './helpers';

test.describe('Universal CRM Endpoints', () => {

  test('GET /api/universal-crm/dashboard → 200', async ({ request }) => {
    const res = await request.get('/api/universal-crm/dashboard', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/universal-crm/customers → 200', async ({ request }) => {
    const res = await request.get('/api/universal-crm/customers', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('POST /api/universal-crm/customers → 200/201 (create)', async ({ request }) => {
    const res = await request.post('/api/universal-crm/customers', {
      headers: creatorhubHeaders(),
      data: {
        name: `E2E Customer ${Date.now()}`,
        email: `e2e-${Date.now()}@test.com`,
        type: 'individual',
      },
    });
    expect([200, 201]).toContain(res.status());
  });

  test('GET /api/universal-crm/activities → 200', async ({ request }) => {
    const res = await request.get('/api/universal-crm/activities', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/universal-crm/pipelines → 200', async ({ request }) => {
    const res = await request.get('/api/universal-crm/pipelines', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/universal-crm/contracts → 200', async ({ request }) => {
    const res = await request.get('/api/universal-crm/contracts', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/universal-crm/invoices → 200', async ({ request }) => {
    const res = await request.get('/api/universal-crm/invoices', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/universal-crm/tasks → 200', async ({ request }) => {
    const res = await request.get('/api/universal-crm/tasks', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });
});
