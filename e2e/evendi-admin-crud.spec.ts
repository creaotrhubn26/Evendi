/**
 * Evendi Admin CRUD E2E Tests
 *
 * Tests admin operations: FAQ management, app-settings, whats-new,
 * video-guides, vendor approve/reject, admin checklists, and admin categories.
 */
import { test, expect } from '@playwright/test';
import {
  EVENDI_URL,
  adminHeaders,
  ADMIN_SECRET,
} from './helpers';

const BASE = EVENDI_URL;
const LINKED_VENDOR_ID = '9a66f202-6f55-4021-aaa3-c90a923f99bf';

function adminSecretOnly() {
  return { 'x-admin-secret': ADMIN_SECRET };
}

// ─── FAQ Management ──────────────────────────────────────────────

test.describe('Admin FAQ', () => {
  test('GET /api/admin/faq/vendor returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/faq/vendor`, {
      headers: adminHeaders(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /api/admin/faq/couple returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/faq/couple`, {
      headers: adminHeaders(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  let faqId: string;

  test('POST /api/admin/faq creates FAQ entry', async ({ request }) => {
    const res = await request.post(`${BASE}/api/admin/faq`, {
      headers: adminHeaders(),
      data: {
        category: 'vendor',
        question: 'E2E Test FAQ?',
        answer: 'This is a test answer.',
        icon: 'help',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.id).toBeTruthy();
    faqId = body.id;
  });

  test('PATCH /api/admin/faq/:id updates FAQ', async ({ request }) => {
    if (!faqId) test.skip();
    const res = await request.patch(`${BASE}/api/admin/faq/${faqId}`, {
      headers: adminHeaders(),
      data: { answer: 'Updated test answer.' },
    });
    expect(res.status()).toBe(200);
  });

  test('DELETE /api/admin/faq/:id removes FAQ', async ({ request }) => {
    if (!faqId) test.skip();
    const res = await request.delete(`${BASE}/api/admin/faq/${faqId}`, {
      headers: adminHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── App Settings ────────────────────────────────────────────────

test.describe('Admin App Settings', () => {
  test('GET /api/admin/app-settings returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/app-settings`, {
      headers: adminHeaders(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /api/app-settings returns public settings', async ({ request }) => {
    const res = await request.get(`${BASE}/api/app-settings`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /api/app-settings/:key returns specific setting', async ({ request }) => {
    const res = await request.get(`${BASE}/api/app-settings/enable_vendor_registration`);
    expect([200, 404]).toContain(res.status());
  });

  test('PATCH /api/admin/app-settings/:key updates setting', async ({ request }) => {
    const res = await request.patch(`${BASE}/api/admin/app-settings/enable_vendor_registration`, {
      headers: adminHeaders(),
      data: { value: 'true' },
    });
    expect([200, 404]).toContain(res.status());
  });
});

// ─── Whats New ───────────────────────────────────────────────────

test.describe('Admin Whats New', () => {
  test('GET /api/whats-new/vendor returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/whats-new/vendor`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /api/whats-new/couple returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/whats-new/couple`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /api/admin/whats-new/vendor returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/whats-new/vendor`, {
      headers: adminHeaders(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  let whatsNewId: string;

  test('POST /api/admin/whats-new creates entry', async ({ request }) => {
    const res = await request.post(`${BASE}/api/admin/whats-new`, {
      headers: adminHeaders(),
      data: {
        category: 'vendor',
        title: 'E2E Test Feature',
        description: 'A new feature for testing.',
        icon: 'star',
        minAppVersion: '1.0.0',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.id).toBeTruthy();
    whatsNewId = body.id;
  });

  test('PATCH /api/admin/whats-new/:id updates', async ({ request }) => {
    if (!whatsNewId) test.skip();
    const res = await request.patch(`${BASE}/api/admin/whats-new/${whatsNewId}`, {
      headers: adminHeaders(),
      data: {
        category: 'vendor',
        title: 'Updated E2E Feature',
        description: 'A new feature for testing.',
        icon: 'star',
        minAppVersion: '1.0.0',
        isActive: true,
        sortOrder: 0,
      },
    });
    expect(res.status()).toBe(200);
  });

  test('DELETE /api/admin/whats-new/:id removes', async ({ request }) => {
    if (!whatsNewId) test.skip();
    const res = await request.delete(`${BASE}/api/admin/whats-new/${whatsNewId}`, {
      headers: adminHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Video Guides ────────────────────────────────────────────────

test.describe('Admin Video Guides', () => {
  test('GET /api/video-guides returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/video-guides`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /api/video-guides/:category returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/video-guides/vendor`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /api/admin/video-guides/:category returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/video-guides/vendor`, {
      headers: adminHeaders(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  let guideId: string;

  test('POST /api/admin/video-guides creates guide', async ({ request }) => {
    const res = await request.post(`${BASE}/api/admin/video-guides`, {
      headers: adminHeaders(),
      data: {
        category: 'vendor',
        title: 'E2E Test Guide',
        description: 'A test video guide.',
        videoUrl: 'https://example.com/video.mp4',
        thumbnail: 'https://example.com/thumb.jpg',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.id).toBeTruthy();
    guideId = body.id;
  });

  test('PATCH /api/admin/video-guides/:id updates', async ({ request }) => {
    if (!guideId) test.skip();
    const res = await request.patch(`${BASE}/api/admin/video-guides/${guideId}`, {
      headers: adminHeaders(),
      data: {
        title: 'Updated E2E Guide',
        description: 'A test video guide.',
        videoUrl: 'https://example.com/video.mp4',
        category: 'vendor',
        icon: 'video',
        sortOrder: 0,
        isActive: true,
      },
    });
    expect(res.status()).toBe(200);
  });

  test('DELETE /api/admin/video-guides/:id removes', async ({ request }) => {
    if (!guideId) test.skip();
    const res = await request.delete(`${BASE}/api/admin/video-guides/${guideId}`, {
      headers: adminHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Admin Settings ─────────────────────────────────────────────

test.describe('Admin Settings CRUD', () => {
  test('GET /api/admin/settings returns settings', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/settings`, {
      headers: adminHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('PUT /api/admin/settings updates settings', async ({ request }) => {
    const res = await request.put(`${BASE}/api/admin/settings`, {
      headers: adminHeaders(),
      data: { settings: [{ key: 'maintenanceMode', value: 'false', category: 'general' }] },
    });
    expect([200, 204]).toContain(res.status());
  });
});

// ─── Admin Vendor Management ────────────────────────────────────

test.describe('Admin Vendor Management', () => {
  test('GET /api/admin/vendors returns vendor list', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/vendors`, {
      headers: adminHeaders(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /api/admin/vendors/:id/features returns features', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/vendors/${LINKED_VENDOR_ID}/features`, {
      headers: adminHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/admin/vendors/:id/inspiration-categories returns categories', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/vendors/${LINKED_VENDOR_ID}/inspiration-categories`, {
      headers: adminHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Admin Inspiration Categories ───────────────────────────────

test.describe('Admin Category Management', () => {
  let catId: string;

  test('POST /api/admin/inspiration-categories creates', async ({ request }) => {
    const res = await request.post(`${BASE}/api/admin/inspiration-categories`, {
      headers: adminHeaders(),
      data: {
        name: 'E2E Test Category',
        icon: 'camera',
        sortOrder: 99,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.id).toBeTruthy();
    catId = body.id;
  });

  test('PUT /api/admin/inspiration-categories/:id updates', async ({ request }) => {
    if (!catId) test.skip();
    const res = await request.put(`${BASE}/api/admin/inspiration-categories/${catId}`, {
      headers: adminHeaders(),
      data: { name: 'Updated E2E Category' },
    });
    expect(res.status()).toBe(200);
  });

  test('DELETE /api/admin/inspiration-categories/:id removes', async ({ request }) => {
    if (!catId) test.skip();
    const res = await request.delete(`${BASE}/api/admin/inspiration-categories/${catId}`, {
      headers: adminHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Admin Checklists ───────────────────────────────────────────

test.describe('Admin Checklists', () => {
  test('GET /api/admin/checklists returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/checklists`, {
      headers: adminSecretOnly(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

// ─── Subscriptions Admin ─────────────────────────────────────────

test.describe('Admin Subscriptions', () => {
  test('POST /api/admin/subscriptions/check-expired-trials', async ({ request }) => {
    const res = await request.post(`${BASE}/api/admin/subscriptions/check-expired-trials`, {
      headers: adminHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('POST /api/admin/subscriptions/send-trial-reminders', async ({ request }) => {
    const res = await request.post(`${BASE}/api/admin/subscriptions/send-trial-reminders`, {
      headers: adminHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});

// ─── Admin Jobs ─────────────────────────────────────────────────

test.describe('Admin Jobs', () => {
  test('POST /api/admin/jobs/expire-offers runs', async ({ request }) => {
    const res = await request.post(`${BASE}/api/admin/jobs/expire-offers`, {
      headers: adminHeaders(),
    });
    expect(res.status()).toBe(200);
  });

  test('POST /api/admin/jobs/process-message-reminders runs', async ({ request }) => {
    const res = await request.post(`${BASE}/api/admin/jobs/process-message-reminders`, {
      headers: adminHeaders(),
    });
    expect(res.status()).toBe(200);
  });
});
