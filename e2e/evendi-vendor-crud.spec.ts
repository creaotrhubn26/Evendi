/**
 * E2E: Vendor CRUD Operations
 * 9 operations: register, login, delivery C/U/D, product C/U/D, availability C/R/D
 */
import { test, expect } from '@playwright/test';
import {
  TEST_VENDOR_EMAIL,
  TEST_VENDOR_PASSWORD,
  getVendorToken,
  vendorHeaders,
} from './helpers';

let token: string;

test.beforeAll(async ({ request }) => {
  token = await getVendorToken(request);
});

test.describe('Vendor Registration & Login', () => {

  test('POST /api/vendors/register → 200 or 409 (exists)', async ({ request }) => {
    const res = await request.post('/api/vendors/register', {
      data: {
        email: `e2e-test-${Date.now()}@evendi.no`,
        password: 'Test@1234',
        businessName: 'E2E Test Vendor',
        categoryId: 'cbe95bca-c7a8-4a69-b819-ee9126c7bb17',
      },
    });
    expect([200, 201, 409]).toContain(res.status());
  });

  test('POST /api/vendors/login → 200', async ({ request }) => {
    const res = await request.post('/api/vendors/login', {
      data: { email: TEST_VENDOR_EMAIL, password: TEST_VENDOR_PASSWORD },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.sessionToken || body.token).toBeTruthy();
  });
});

test.describe('Vendor Delivery CRUD', () => {
  let deliveryId: string;

  test('POST /api/vendor/deliveries → 200/201 (create)', async ({ request }) => {
    const res = await request.post('/api/vendor/deliveries', {
      headers: vendorHeaders(token),
      data: {
        coupleName: 'E2E Test Couple',
        title: `E2E Delivery ${Date.now()}`,
        description: 'Playwright test delivery',
        items: [
          { type: 'gallery', label: 'Photos', url: 'https://example.com/gallery' },
        ],
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    deliveryId = body.id || body.delivery?.id;
  });

  test('PATCH /api/vendor/deliveries/:id → 200 (update)', async ({ request }) => {
    if (!deliveryId) test.skip();
    const res = await request.patch(`/api/vendor/deliveries/${deliveryId}`, {
      headers: vendorHeaders(token),
      data: { title: 'E2E Updated Delivery' },
    });
    expect(res.status()).toBe(200);
  });

  test('DELETE /api/vendor/deliveries/:id → 200 (delete)', async ({ request }) => {
    if (!deliveryId) test.skip();
    const res = await request.delete(`/api/vendor/deliveries/${deliveryId}`, {
      headers: vendorHeaders(token),
    });
    expect(res.status()).toBe(200);
  });
});

test.describe('Vendor Product CRUD', () => {
  let productId: string;

  test('POST /api/vendor/products → 200/201 (create)', async ({ request }) => {
    const res = await request.post('/api/vendor/products', {
      headers: vendorHeaders(token),
      data: {
        title: `E2E Product ${Date.now()}`,
        description: 'Playwright test product',
        unitPrice: 500,
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    productId = body.id || body.product?.id;
  });

  test('PATCH /api/vendor/products/:id → 200 (update)', async ({ request }) => {
    if (!productId) test.skip();
    const res = await request.patch(`/api/vendor/products/${productId}`, {
      headers: vendorHeaders(token),
      data: { title: 'E2E Updated Product', unitPrice: 600 },
    });
    expect(res.status()).toBe(200);
  });

  test('DELETE /api/vendor/products/:id → 200 (delete)', async ({ request }) => {
    if (!productId) test.skip();
    const res = await request.delete(`/api/vendor/products/${productId}`, {
      headers: vendorHeaders(token),
    });
    expect(res.status()).toBe(200);
  });
});

test.describe('Vendor Availability CRUD', () => {

  test('POST /api/vendor/availability → 200/201 (create)', async ({ request }) => {
    const res = await request.post('/api/vendor/availability', {
      headers: vendorHeaders(token),
      data: {
        date: '2026-06-15',
        status: 'available',
      },
    });
    expect([200, 201]).toContain(res.status());
  });

  test('GET /api/vendor/availability → 200 (read)', async ({ request }) => {
    const res = await request.get('/api/vendor/availability', {
      headers: vendorHeaders(token),
    });
    expect(res.status()).toBe(200);
  });

  test('DELETE /api/vendor/availability/:date → 200 (delete)', async ({ request }) => {
    const res = await request.delete('/api/vendor/availability/2026-06-15', {
      headers: vendorHeaders(token),
    });
    expect([200, 204]).toContain(res.status());
  });
});
