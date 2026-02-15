/**
 * E2E: CreatorHub Core Endpoints (x-user-id auth on :3001)
 * 24 endpoints including the fixed equipment endpoint
 */
import { test, expect } from '@playwright/test';
import { creatorhubHeaders } from './helpers';

test.describe('CreatorHub Health & Config', () => {

  test('GET /api/health → 200', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
  });

  test('GET /api/professions → 200', async ({ request }) => {
    const res = await request.get('/api/professions', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/profession-configs → 200', async ({ request }) => {
    const res = await request.get('/api/profession-configs', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });
});

test.describe('CreatorHub Workflows & Documents', () => {

  test('GET /api/editing-workflows → 200', async ({ request }) => {
    const res = await request.get('/api/editing-workflows', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/contracts → 200', async ({ request }) => {
    const res = await request.get('/api/contracts', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/invoices → 200', async ({ request }) => {
    const res = await request.get('/api/invoices', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });
});

test.describe('CreatorHub Communication & Scheduling', () => {

  test('GET /api/google-meet → 200', async ({ request }) => {
    const res = await request.get('/api/google-meet', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/notifications → 200', async ({ request }) => {
    const res = await request.get('/api/notifications', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/calendar → 200', async ({ request }) => {
    const res = await request.get('/api/calendar', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/push-subscriptions → 200', async ({ request }) => {
    const res = await request.get('/api/push-subscriptions', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });
});

test.describe('CreatorHub Project Management', () => {

  test('GET /api/analytics → 200', async ({ request }) => {
    const res = await request.get('/api/analytics', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/projects → 200', async ({ request }) => {
    const res = await request.get('/api/projects', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/tasks → 200', async ({ request }) => {
    const res = await request.get('/api/tasks', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/clients → 200', async ({ request }) => {
    const res = await request.get('/api/clients', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/templates → 200', async ({ request }) => {
    const res = await request.get('/api/templates', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/presets → 200', async ({ request }) => {
    const res = await request.get('/api/presets', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/deliverables → 200', async ({ request }) => {
    const res = await request.get('/api/deliverables', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/checklists → 200', async ({ request }) => {
    const res = await request.get('/api/checklists', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });
});

test.describe('CreatorHub Financial & Content', () => {

  test('GET /api/split-sheets → 200', async ({ request }) => {
    const res = await request.get('/api/split-sheets', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/moodboards → 200', async ({ request }) => {
    const res = await request.get('/api/moodboards', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/time-tracking → 200', async ({ request }) => {
    const res = await request.get('/api/time-tracking', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/expenses → 200', async ({ request }) => {
    const res = await request.get('/api/expenses', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/tags → 200', async ({ request }) => {
    const res = await request.get('/api/tags', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });
});

test.describe('CreatorHub Equipment (previously failing)', () => {

  test('GET /api/equipment → 200', async ({ request }) => {
    const res = await request.get('/api/equipment', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
