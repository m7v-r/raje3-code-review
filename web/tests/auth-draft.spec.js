// Browser integration with the real Supabase SDK and an intercepted HTTP fixture.
// This does not execute migrations or claim to test live Supabase Auth / PostgreSQL RLS.
import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const base = 'https://raje3-test.supabase.co';
const uid = email => email === 'a@example.test' ? '00000000-0000-4000-8000-000000000001' : '00000000-0000-4000-8000-000000000002';
const user = email => ({ id: uid(email), email, aud: 'authenticated', role: 'authenticated', email_confirmed_at: new Date().toISOString(), app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, created_at: new Date().toISOString(), identities: [] });
const token = email => `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: uid(email), email, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) })).toString('base64url')}.fixture`;

async function mockBackend(page) {
  // Inject dummy public configuration into the served module, never into .env.local.
  // All Supabase requests below are intercepted; no test data reaches a remote server.
  await page.route('**/src/lib/supabaseClient.js', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace('readSupabaseConfig(import.meta.env)',
      'readSupabaseConfig({VITE_SUPABASE_URL: "https://raje3-test.supabase.co", VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local_browser_fixture"})');
    await route.fulfill({ response, body });
  });
  const db = new Map(); const calls = []; const control = { conflict: false, offline: false, failLoad: false };
  await page.route(`${base}/**`, async route => {
    const request = route.request(); const path = new URL(request.url()).pathname;
    const body = request.postDataJSON() || {};
    const send = (status, value) => route.fulfill({ status, contentType: 'application/json', headers: { 'X-Supabase-Api-Version': '2024-01-01' }, body: JSON.stringify(value) });
    if (path === '/auth/v1/signup') return send(200, user(body.email));
    if (path === '/auth/v1/token') {
      if (body.password !== 'ValidPass123!') return send(400, { code: 'invalid_credentials', msg: 'Invalid login credentials' });
      return send(200, { access_token: token(body.email), refresh_token: `fixture-refresh-${uid(body.email)}`, expires_in: 3600, token_type: 'bearer', user: user(body.email) });
    }
    if (path === '/auth/v1/logout') return route.fulfill({ status: 204, body: '' });
    if (path === '/auth/v1/user') return send(200, user('a@example.test'));
    if (path.startsWith('/rest/v1/rpc/')) {
      const bearer = request.headers().authorization?.split(' ')[1];
      let id;
      try { id = JSON.parse(Buffer.from(bearer.split('.')[1], 'base64url').toString()).sub; } catch { return send(401, { code: 'PT401' }); }
      const action = path.split('/').at(-1); calls.push({ action, body, id });
      if (action === 'get_review_draft') return control.failLoad ? send(404, { code: 'PGRST202' }) : send(200, db.get(id) || { draft: null });
      if (action === 'save_review_draft') {
        if (control.offline) return route.abort('internetdisconnected');
        const current = db.get(id);
        if (control.conflict || (body.p_expected_revision !== (current?.revision ?? null))) return send(409, { code: 'PT409', message: 'Conflict' });
        const saved = { id: `draft-${id}`, revision: (current?.revision ?? 0) + 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          draft: { name: body.p_name, requirements: body.p_requirements, files: body.p_files } };
        db.set(id, saved); return send(200, saved);
      }
    }
    throw new Error(`Unexpected fixture request: ${path}`);
  });
  return { db, calls, control };
}

async function login(page, email = 'a@example.test') {
  await page.goto('/#/sign-in');
  await page.getByLabel('البريد الإلكتروني').fill(email);
  await page.getByLabel('كلمة المرور', { exact: true }).fill('ValidPass123!');
  await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'راجع كودك، وافهم ما ينقصه.' })).toBeVisible();
}
const saved = page => expect(page.getByText('حُفظت المسودة في حسابك.', { exact: true })).toBeVisible();

for (const width of [320, 375, 1280]) {
  test(`signed-out guard, RTL and account screens at ${width}px`, async ({ page }) => {
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await mockBackend(page); await page.setViewportSize({ width, height: 900 });
    await page.goto('/#/review');
    await expect(page).toHaveURL(/#\/sign-in$/);
    await expect(page.getByRole('heading', { name: 'تسجيل الدخول', exact: true })).toBeVisible();
    expect(await page.locator('html').getAttribute('dir')).toBe('rtl');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (width !== 320) { await mkdir('../design/shots', { recursive: true }); await page.screenshot({ path: `../design/shots/auth-sign-in-${width}.png`, fullPage: true }); }
    await page.getByRole('link', { name: 'أنشئ حسابًا' }).click();
    await expect(page.getByRole('heading', { name: 'إنشاء حساب', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (width !== 320) await page.screenshot({ path: `../design/shots/auth-sign-up-${width}.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
}

test('sign up requires email confirmation; wrong password is a clear Arabic error', async ({ page }) => {
  await mockBackend(page); await page.goto('/#/sign-up');
  await page.getByLabel('البريد الإلكتروني').fill('a@example.test');
  await page.getByLabel('كلمة المرور', { exact: true }).fill('ValidPass123!');
  await page.getByRole('button', { name: 'إنشاء حساب', exact: true }).click();
  await expect(page.getByText('تحقق من بريدك', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'راجع كودك، وافهم ما ينقصه.' })).toHaveCount(0);
  await page.getByRole('link', { name: 'تسجيل الدخول', exact: true }).click();
  await page.getByLabel('البريد الإلكتروني').fill('a@example.test');
  await page.getByLabel('كلمة المرور', { exact: true }).fill('wrong');
  await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('البريد أو كلمة المرور غير صحيحة.');
});

test('save, actual browser reload, sign out/in and account isolation; legacy draft is untouched', async ({ page }) => {
  const fixture = await mockBackend(page);
  await page.goto('/');
  const legacy = JSON.stringify({ version: 1, draft: { name: 'private guest draft', requirements: '', files: [] } });
  await page.evaluate(value => localStorage.setItem('raje3.review-draft.v1', value), legacy);
  await login(page);
  await expect(page.getByLabel(/اسم المراجعة/)).toHaveValue('');
  await page.getByLabel(/اسم المراجعة/).fill('مراجعة محفوظة'); await saved(page);
  await page.locator('#requirements').fill('قبول البريد\nرفض القيم الفارغة'); await saved(page);
  await page.locator('input[type=file]').setInputFiles({ name: 'login.js', mimeType: 'text/javascript', buffer: Buffer.from('not read or uploaded') }); await saved(page);
  expect(fixture.db.get(uid('a@example.test')).draft.files).toEqual([{ name: 'login.js', demo: false }]);
  expect(JSON.stringify(fixture.calls)).not.toContain('not read or uploaded');
  await page.reload();
  await expect(page.getByLabel(/اسم المراجعة/)).toHaveValue('مراجعة محفوظة');
  await expect(page.locator('#requirements')).toHaveValue('قبول البريد\nرفض القيم الفارغة');
  await expect(page.getByText('login.js', { exact: true }).first()).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('raje3.review-draft.v1'))).toBe(legacy);
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'تسجيل الدخول', exact: true })).toBeVisible();
  await login(page, 'b@example.test'); await expect(page.getByLabel(/اسم المراجعة/)).toHaveValue('');
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await login(page); await expect(page.getByLabel(/اسم المراجعة/)).toHaveValue('مراجعة محفوظة');
});

test('save failure, retry and concurrent change preserve edits until an explicit reload', async ({ page }) => {
  const { control, db } = await mockBackend(page); await login(page);
  control.offline = true; await page.getByLabel(/اسم المراجعة/).fill('تبقى مدخلاتي');
  await expect(page.getByRole('button', { name: 'إعادة محاولة الحفظ' })).toBeVisible();
  await expect(page.getByLabel(/اسم المراجعة/)).toHaveValue('تبقى مدخلاتي');
  control.offline = false; await page.getByRole('button', { name: 'إعادة محاولة الحفظ' }).click(); await saved(page);
  control.conflict = true; await page.getByLabel(/اسم المراجعة/).fill('تعديل هذا التبويب');
  await expect(page.getByText(/توجد نسخة أحدث/)).toBeVisible();
  await expect(page.getByLabel(/اسم المراجعة/)).toHaveValue('تعديل هذا التبويب');
  const current = db.get(uid('a@example.test')); current.draft.name = 'تعديل التبويب الآخر'; current.revision++;
  control.conflict = false;
  await page.getByRole('button', { name: 'تحميل النسخة المحفوظة واستبدال المدخلات الحالية' }).click();
  await expect(page.getByLabel(/اسم المراجعة/)).toHaveValue('تعديل التبويب الآخر');
});

test('load failure cannot fall through to demo data or an automatic save', async ({ page }) => {
  const fixture = await mockBackend(page); fixture.control.failLoad = true;
  await page.goto('/'); await page.getByLabel('البريد الإلكتروني').fill('a@example.test');
  await page.getByLabel('كلمة المرور', { exact: true }).fill('ValidPass123!');
  await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'تعذّر تحميل المسودة' })).toBeVisible();
  expect(fixture.calls.some(call => call.action === 'save_review_draft')).toBe(false);
  fixture.control.failLoad = false; await page.getByRole('button', { name: 'إعادة المحاولة', exact: true }).click();
  await expect(page.getByLabel(/اسم المراجعة/)).toHaveValue('');
});

test('approved demo still works and custom input never receives its canned results', async ({ page }) => {
  await mockBackend(page); await login(page); await page.getByRole('button', { name: 'تجربة المثال', exact: true }).click(); await saved(page);
  await page.getByRole('button', { name: 'فحص النطاق', exact: true }).click();
  await page.getByRole('button', { name: 'بدء المراجعة', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'تقرير النتائج' })).toBeVisible();
  await page.getByRole('button', { name: /تعديل/ }).first().click();
  await page.locator('#requirements').fill('متطلب مختلف'); await saved(page);
  await page.getByRole('button', { name: 'فحص النطاق', exact: true }).click();
  await page.getByRole('button', { name: 'بدء المراجعة', exact: true }).click();
  await expect(page.getByText('التقرير التوضيحي مرتبط بالمثال الجاهز')).toBeVisible();
});

test('missing environment has one safe startup error and disables auth', async ({ page }) => {
  const errors = []; page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.route('**/src/lib/supabaseClient.js', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace('readSupabaseConfig(import.meta.env)', 'readSupabaseConfig({})');
    await route.fulfill({ response, body });
  });
  await page.goto('/#/review');
  await expect(page.getByRole('button', { name: 'تسجيل الدخول', exact: true })).toBeDisabled();
  expect(errors.filter(message => message.startsWith('Raje3: missing'))).toHaveLength(1);
});
