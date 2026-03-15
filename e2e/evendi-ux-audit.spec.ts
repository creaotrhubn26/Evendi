import { test, expect } from '@playwright/test';

const COUPLE = {
  email: 'qazifotoreel@gmail.com',
  password: 'test1234',
};

const VENDOR = {
  email: 'workflow-test@evendi.no',
  password: 'Test@1234',
};

const ADMIN_SECRET = 'evendi-admin-2024-secure';

function startIssueCapture(page: any) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const badResponses: Array<{ url: string; status: number }> = [];

  page.on('console', (msg: any) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err: Error) => {
    pageErrors.push(err.message);
  });

  page.on('response', (res: any) => {
    const status = res.status();
    if (status < 400) return;
    const url = res.url();
    if (url.includes('/favicon')) return;
    if (url.includes('fonts.googleapis')) return;
    if (url.includes('fonts.gstatic')) return;
    badResponses.push({ url, status });
  });

  return { consoleErrors, pageErrors, badResponses };
}

type VisualIssue = { message: string; sample?: string };

async function scanContrastIssues(page: any, label: string) {
  const issues: VisualIssue[] = await page.evaluate((scanLabel: string) => {
    const iconOnlyRegex = /^[\uE000-\uF8FF]+$/;

    function parseColor(color: string) {
      const match = color.match(/rgba?\(([^)]+)\)/i);
      if (!match) return null;
      const parts = match[1].split(',').map((part) => Number(part.trim()));
      const [r, g, b, a = 1] = parts;
      if ([r, g, b, a].some((value) => Number.isNaN(value))) return null;
      return { r, g, b, a };
    }

    function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }) {
      const toLinear = (value: number) => {
        const channel = value / 255;
        return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
      };
      const red = toLinear(r);
      const green = toLinear(g);
      const blue = toLinear(b);
      return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    }

    function contrastRatio(foreground: { r: number; g: number; b: number }, background: { r: number; g: number; b: number }) {
      const lum1 = relativeLuminance(foreground);
      const lum2 = relativeLuminance(background);
      const lighter = Math.max(lum1, lum2);
      const darker = Math.min(lum1, lum2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    function isLargeText(style: CSSStyleDeclaration) {
      const size = Number.parseFloat(style.fontSize || '0');
      const weight = Number.parseFloat(style.fontWeight || '400');
      if (size >= 24) return true;
      return size >= 18.66 && weight >= 700;
    }

    function getBackgroundColor(el: Element) {
      let current: Element | null = el;
      while (current && current !== document.documentElement) {
        const style = window.getComputedStyle(current);
        if (style.backgroundImage && style.backgroundImage !== 'none') {
          return { type: 'image' as const };
        }
        const color = parseColor(style.backgroundColor || '');
        if (color && color.a > 0.05) {
          return { type: 'color' as const, color };
        }
        current = current.parentElement;
      }
      const bodyStyle = window.getComputedStyle(document.body);
      const bodyColor = parseColor(bodyStyle.backgroundColor || 'rgb(255,255,255)');
      return bodyColor ? { type: 'color' as const, color: bodyColor } : { type: 'unknown' as const };
    }

    const results: VisualIssue[] = [];
    const elements = Array.from(document.querySelectorAll<HTMLElement>('body *'))
      .filter((el) => el.childElementCount === 0)
      .filter((el) => (el.textContent || '').trim().length > 0);

    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      if (rect.bottom < 0 || rect.top > window.innerHeight) continue;

      const textContent = (el.textContent || '').trim();
      if (iconOnlyRegex.test(textContent)) continue;
      if (el.getAttribute('aria-hidden') === 'true') continue;
      if (el.getAttribute('role') === 'img') continue;
      if (el.className && String(el.className).toLowerCase().includes('icon')) continue;

      const style = window.getComputedStyle(el);
      const color = parseColor(style.color || '');
      if (!color || color.a < 0.1) continue;

      const background = getBackgroundColor(el);
      if (background.type !== 'color') continue;
      const ratio = contrastRatio(color, background.color);
      const threshold = isLargeText(style) ? 3 : 4.5;
      if (ratio < threshold) {
        const sample = textContent.slice(0, 60);
        results.push({
          message: `Low contrast ratio ${ratio.toFixed(2)} (< ${threshold})`,
          sample,
        });
      }
      if (results.length >= 20) break;
    }

    if (results.length > 0) {
      results.unshift({ message: `Contrast scan (${scanLabel}) found ${results.length} issues` });
    }
    return results;
  }, label);

  return issues;
}

async function scanBrandingIssues(
  page: any,
  label: string,
  options: { requireLogo?: boolean; requireBrandText?: boolean; requireBrandPresence?: boolean },
) {
  const issues: VisualIssue[] = [];
  const hasTestLogo = await page.locator('[data-testid="evendi-logo"]').first().isVisible().catch(() => false);
  const hasLabeledLogo = await page.locator('[aria-label="Evendi logo"]').first().isVisible().catch(() => false);
  const hasRoleLogo = await page.getByRole('img', { name: 'Evendi logo' }).first().isVisible().catch(() => false);
  const hasLogoAsset = await page.locator('img[src*="Evendi_logo" i]').first().isVisible().catch(() => false);
  const hasLogo = hasTestLogo || hasLabeledLogo || hasRoleLogo || hasLogoAsset;
  const hasText = await page.getByText('Evendi').first().isVisible().catch(() => false);

  if (options.requireLogo && !hasLogo) {
    issues.push({ message: `Missing Evendi logo on ${label}` });
  }
  if (options.requireBrandText && !hasText) {
    issues.push({ message: `Missing Evendi brand text on ${label}` });
  }
  if (options.requireBrandPresence && !hasLogo && !hasText) {
    issues.push({ message: `Missing Evendi branding on ${label}` });
  }
  return issues;
}

async function auditVisuals(
  page: any,
  label: string,
  options: { requireLogo?: boolean; requireBrandText?: boolean; requireBrandPresence?: boolean },
) {
  const contrastIssues = await scanContrastIssues(page, label);
  const brandingIssues = await scanBrandingIssues(page, label, options);
  return { contrastIssues, brandingIssues };
}

async function auditLanding(page: any) {
  await page.goto('/');
  await expect(page.getByText('Velkommen til Evendi')).toBeVisible();
}

async function auditCoupleFlow(page: any) {
  await expect(page.getByText('Velkommen til Evendi')).toBeVisible();
  await page.getByPlaceholder('E-postadresse').fill(COUPLE.email);
  await page.getByPlaceholder('Passord').fill(COUPLE.password);
    await page.getByText('Logg inn', { exact: true }).first().click();

  await expect(page.getByRole('tab', { name: /Planlegging/ })).toBeVisible();
  await page.mouse.wheel(0, 1200);
  await page.getByText('Viktige personer', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Viktige personer' })).toBeVisible();
  await page.goBack();
}

async function auditVendorFlow(page: any) {
  await openVendorLogin(page);
  await completeVendorLogin(page);
}

async function openVendorLogin(page: any) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.getByText('Er du leverandør?').click();
  await expect(page.getByText('Leverandørportal')).toBeVisible();
}

async function completeVendorLogin(page: any) {
  await page.locator('input[placeholder="E-post"]:visible').fill(VENDOR.email);
  await page.locator('input[placeholder="Passord"]:visible').fill(VENDOR.password);
  await page.keyboard.press('Enter');
  await expect(page.getByText('Leveranser')).toBeVisible();
}

async function openAdminLogin(page: any) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.getByText('Admin-portal').first().click();
  await expect(page.getByPlaceholder('Admin-nøkkel')).toBeVisible();
}

async function auditAdminFlow(page: any) {
  await openAdminLogin(page);
  await page.getByPlaceholder('Admin-nøkkel').fill(ADMIN_SECRET);
}

async function assertNoCriticalIssues(
  issues: {
    consoleErrors: string[];
    pageErrors: string[];
    badResponses: Array<{ url: string; status: number }>;
    contrastIssues?: VisualIssue[];
    brandingIssues?: VisualIssue[];
  },
  label: string,
) {
  expect.soft(issues.pageErrors, `${label} page errors`).toEqual([]);
  expect.soft(issues.consoleErrors, `${label} console errors`).toEqual([]);
  expect.soft(issues.badResponses, `${label} bad network responses`).toEqual([]);
  if (issues.contrastIssues) {
    expect.soft(issues.contrastIssues, `${label} contrast issues`).toEqual([]);
  }
  if (issues.brandingIssues) {
    expect.soft(issues.brandingIssues, `${label} branding issues`).toEqual([]);
  }
}

test.describe('UX audit - desktop', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('Couple, vendor, admin flows', async ({ page }) => {
    const issues = startIssueCapture(page);
    await auditLanding(page);
    const landingVisuals = await auditVisuals(page, 'landing', { requireBrandPresence: true });
    await auditCoupleFlow(page);
    const coupleVisuals = await auditVisuals(page, 'couple dashboard', {});
    await openVendorLogin(page);
    const vendorVisuals = await auditVisuals(page, 'vendor login', { requireBrandPresence: true });
    await completeVendorLogin(page);
    await openAdminLogin(page);
    const adminVisuals = await auditVisuals(page, 'admin login', { requireBrandPresence: true });
    await auditAdminFlow(page);
    await assertNoCriticalIssues(
      {
        ...issues,
        contrastIssues: [
          ...landingVisuals.contrastIssues,
          ...coupleVisuals.contrastIssues,
          ...vendorVisuals.contrastIssues,
          ...adminVisuals.contrastIssues,
        ],
        brandingIssues: [
          ...landingVisuals.brandingIssues,
          ...coupleVisuals.brandingIssues,
          ...vendorVisuals.brandingIssues,
          ...adminVisuals.brandingIssues,
        ],
      },
      'desktop',
    );
  });
});

test.describe('UX audit - mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('Couple, vendor, admin flows', async ({ page }) => {
    const issues = startIssueCapture(page);
    await auditLanding(page);
    const landingVisuals = await auditVisuals(page, 'landing', { requireBrandPresence: true });
    await auditCoupleFlow(page);
    const coupleVisuals = await auditVisuals(page, 'couple dashboard', {});
    await openVendorLogin(page);
    const vendorVisuals = await auditVisuals(page, 'vendor login', { requireBrandPresence: true });
    await completeVendorLogin(page);
    await openAdminLogin(page);
    const adminVisuals = await auditVisuals(page, 'admin login', { requireBrandPresence: true });
    await auditAdminFlow(page);
    await assertNoCriticalIssues(
      {
        ...issues,
        contrastIssues: [
          ...landingVisuals.contrastIssues,
          ...coupleVisuals.contrastIssues,
          ...vendorVisuals.contrastIssues,
          ...adminVisuals.contrastIssues,
        ],
        brandingIssues: [
          ...landingVisuals.brandingIssues,
          ...coupleVisuals.brandingIssues,
          ...vendorVisuals.brandingIssues,
          ...adminVisuals.brandingIssues,
        ],
      },
      'mobile',
    );
  });
});

// ─── Vendor Flow Smoke Test ──────────────────────────────────────

test.describe('Vendor login smoke test', () => {
  test('auditVendorFlow logs in successfully', async ({ page }) => {
    await auditVendorFlow(page);
    await expect(page.getByText('Leveranser')).toBeVisible();
  });
});
