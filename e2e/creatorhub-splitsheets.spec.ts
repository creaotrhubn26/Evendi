/**
 * E2E: CreatorHub Split-Sheet CRUD (x-user-id auth on :3001)
 * 6 operations: list, stats, create, get-by-id, update, delete
 */
import { test, expect } from '@playwright/test';
import { creatorhubHeaders } from './helpers';

test.describe('Split-Sheet CRUD', () => {
  let splitSheetId: string;

  test('GET /api/split-sheets → 200 (list)', async ({ request }) => {
    const res = await request.get('/api/split-sheets', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/split-sheets/stats → 200', async ({ request }) => {
    const res = await request.get('/api/split-sheets/stats', { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('POST /api/split-sheets → 200/201 (create)', async ({ request }) => {
    const res = await request.post('/api/split-sheets', {
      headers: creatorhubHeaders(),
      data: {
        title: `E2E Split ${Date.now()}`,
        projectName: 'E2E Test Project',
        splits: [
          { name: 'Artist A', percentage: 60, role: 'Producer' },
          { name: 'Artist B', percentage: 40, role: 'Writer' },
        ],
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    splitSheetId = body.data?.id || body.id || body.splitSheet?.id;
  });

  test('GET /api/split-sheets/:id → 200 (read)', async ({ request }) => {
    if (!splitSheetId) test.skip();
    const res = await request.get(`/api/split-sheets/${splitSheetId}`, { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });

  test('PUT /api/split-sheets/:id → 200 (update)', async ({ request }) => {
    if (!splitSheetId) test.skip();
    const res = await request.put(`/api/split-sheets/${splitSheetId}`, {
      headers: creatorhubHeaders(),
      data: { title: 'E2E Updated Split Sheet' },
    });
    expect(res.status()).toBe(200);
  });

  test('DELETE /api/split-sheets/:id → 200 (delete)', async ({ request }) => {
    if (!splitSheetId) test.skip();
    const res = await request.delete(`/api/split-sheets/${splitSheetId}`, { headers: creatorhubHeaders() });
    expect(res.status()).toBe(200);
  });
});
