// React + official SDK + HTTP fixture in jsdom. No database/SQL/browser process is run.
import { test, beforeEach, afterEach, after } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const db = new Map(); let calls = []; const control = { offline: false, conflict: false, failLoad: false };
const uid = email => email === 'a@example.test' ? '00000000-0000-4000-8000-000000000001' : '00000000-0000-4000-8000-000000000002';
const user = email => ({ id: uid(email), email, aud: 'authenticated', role: 'authenticated', email_confirmed_at: new Date().toISOString(), app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, created_at: new Date().toISOString(), identities: [] });
const token = email => `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: uid(email), email, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) })).toString('base64url')}.fixture`;

globalThis.fetch = async (input, options = {}) => {
  const path = new URL(typeof input === 'string' ? input : input.url).pathname;
  const body = JSON.parse(options.body || '{}');
  const response = (status, value) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json', 'X-Supabase-Api-Version': '2024-01-01' } });
  if (path === '/auth/v1/signup') return response(200, user(body.email));
  if (path === '/auth/v1/token') return body.password !== 'ValidPass123!' ? response(400, { code: 'invalid_credentials', msg: 'Invalid login credentials' })
    : response(200, { access_token: token(body.email), refresh_token: `fixture-refresh-${uid(body.email)}`, expires_in: 3600, token_type: 'bearer', user: user(body.email) });
  if (path === '/auth/v1/logout') return new Response(null, { status: 204 });
  if (path === '/auth/v1/user') return response(200, user('a@example.test'));
  if (path.startsWith('/rest/v1/rpc/')) {
    const bearer = new Headers(options.headers).get('Authorization')?.split(' ')[1];
    const id = JSON.parse(Buffer.from(bearer.split('.')[1], 'base64url').toString()).sub;
    const action = path.split('/').at(-1); calls.push({ action, body, id });
    if (action === 'get_review_draft') return control.failLoad ? response(404, { code: 'PGRST202' }) : response(200, db.get(id) || { draft: null });
    if (action === 'save_review_draft') {
      if (control.offline) throw new TypeError('offline');
      const current = db.get(id);
      if (control.conflict || body.p_expected_revision !== (current?.revision ?? null)) return response(409, { code: 'PT409' });
      const saved = { id: `draft-${id}`, revision: (current?.revision ?? 0) + 1, draft: { name: body.p_name, requirements: body.p_requirements, files: body.p_files } };
      db.set(id, saved); return response(200, saved);
    }
  }
  throw new Error(`Unexpected fixture path ${path}`);
};

const { default: App, supabase } = await import('../.cache/app-test.mjs');
const mount = () => render(React.createElement(React.StrictMode, null, React.createElement(App)));
const heading = text => screen.findByRole('heading', { name: text, exact: true }, { timeout: 3000 });
const change = (label, value) => fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } });
async function navigate(hash) { await act(async () => { window.location.hash = hash; window.dispatchEvent(new window.HashChangeEvent('hashchange')); }); }
async function login(email = 'a@example.test') {
  await heading('تسجيل الدخول'); change('البريد الإلكتروني', email); change('كلمة المرور', 'ValidPass123!');
  fireEvent.click(screen.getByRole('button', { name: 'تسجيل الدخول', exact: true }));
  await heading('راجع كودك، وافهم ما ينقصه.');
}
const saved = () => screen.findByText('حُفظت المسودة في حسابك.', { exact: true });

beforeEach(async () => {
  cleanup(); await supabase.auth.signOut({ scope: 'local' }); window.localStorage.clear();
  db.clear(); calls = []; Object.assign(control, { offline: false, conflict: false, failLoad: false });
  window.history.replaceState(null, '', '/#/sign-in');
});
afterEach(cleanup);
after(async () => { await supabase.auth.signOut({ scope: 'local' }); await supabase.auth.dispose(); window.close(); });

test('private route redirects a signed-out user without mounting review inputs', async () => {
  window.history.replaceState(null, '', '/#/review'); mount(); await heading('تسجيل الدخول');
  await waitFor(() => assert.equal(window.location.hash, '#/sign-in'));
  assert.equal(screen.queryByLabelText('اسم المراجعة'), null);
});

test('empty/invalid input and wrong password produce Arabic feedback', async () => {
  mount(); await heading('تسجيل الدخول');
  fireEvent.click(screen.getByRole('button', { name: 'تسجيل الدخول', exact: true }));
  assert.equal((await screen.findByRole('alert')).textContent, 'أدخل بريدك الإلكتروني.');
  change('البريد الإلكتروني', 'bad'); fireEvent.click(screen.getByRole('button', { name: 'تسجيل الدخول', exact: true }));
  assert.match(screen.getByRole('alert').textContent, /بريدًا إلكترونيًا صحيحًا/);
  change('البريد الإلكتروني', 'a@example.test'); change('كلمة المرور', 'wrong');
  fireEvent.click(screen.getByRole('button', { name: 'تسجيل الدخول', exact: true }));
  await waitFor(() => assert.equal(screen.getByRole('alert').textContent, 'البريد أو كلمة المرور غير صحيحة.'));
});

test('sign up with confirmation enabled does not grant a session', async () => {
  window.history.replaceState(null, '', '/#/sign-up'); mount(); await heading('إنشاء حساب');
  change('البريد الإلكتروني', 'a@example.test'); change('كلمة المرور', 'ValidPass123!');
  fireEvent.click(screen.getByRole('button', { name: 'إنشاء حساب', exact: true }));
  await screen.findByText('تحقق من بريدك', { exact: true });
  assert.equal(screen.queryByLabelText('اسم المراجعة'), null);
});

test('save + remount restores draft and filenames; legacy guest data stays untouched', async () => {
  const legacy = JSON.stringify({ version: 1, draft: { name: 'guest private draft', requirements: '', files: [] } });
  window.localStorage.setItem('raje3.review-draft.v1', legacy);
  mount(); await login(); assert.equal(screen.getByLabelText('اسم المراجعة اختياري').value, '');
  change('اسم المراجعة اختياري', 'مراجعة محفوظة'); await saved();
  change('المتطلبات ٠ متطلبات', 'قبول البريد\nرفض القيم الفارغة'); await saved();
  const picker = document.querySelector('input[type=file]');
  fireEvent.change(picker, { target: { files: [new File(['never upload source'], 'login.js', { type: 'text/javascript' })] } }); await saved();
  assert.deepEqual(db.get(uid('a@example.test')).draft.files, [{ name: 'login.js', demo: false }]);
  assert.ok(!JSON.stringify(calls).includes('never upload source'));
  cleanup(); mount(); await heading('راجع كودك، وافهم ما ينقصه.');
  assert.equal(screen.getByLabelText('اسم المراجعة اختياري').value, 'مراجعة محفوظة');
  assert.equal(document.getElementById('requirements').value, 'قبول البريد\nرفض القيم الفارغة');
  assert.equal(window.localStorage.getItem('raje3.review-draft.v1'), legacy);
});

test('sign out, account switch and sign in keep draft ownership separate', async () => {
  mount(); await login(); change('اسم المراجعة اختياري', 'private A'); await saved();
  fireEvent.click(screen.getByRole('button', { name: 'تسجيل الخروج', exact: true })); await heading('تسجيل الدخول');
  await login('b@example.test'); assert.equal(screen.getByLabelText('اسم المراجعة اختياري').value, '');
  fireEvent.click(screen.getByRole('button', { name: 'تسجيل الخروج', exact: true })); await heading('تسجيل الدخول');
  await login(); assert.equal(screen.getByLabelText('اسم المراجعة اختياري').value, 'private A');
});

test('network failure preserves input and explicit retry persists it', async () => {
  mount(); await login(); control.offline = true; change('اسم المراجعة اختياري', 'مدخلاتي باقية');
  const retry = await screen.findByRole('button', { name: 'إعادة محاولة الحفظ' });
  assert.equal(screen.getByLabelText('اسم المراجعة اختياري').value, 'مدخلاتي باقية');
  control.offline = false; fireEvent.click(retry); await saved();
  assert.equal(db.get(uid('a@example.test')).draft.name, 'مدخلاتي باقية');
});

test('conflict does not overwrite the server; explicit reload replaces current inputs', async () => {
  mount(); await login(); change('اسم المراجعة اختياري', 'old'); await saved();
  control.conflict = true; change('اسم المراجعة اختياري', 'mine');
  const reload = await screen.findByRole('button', { name: 'تحميل النسخة المحفوظة واستبدال المدخلات الحالية' });
  assert.equal(screen.getByLabelText('اسم المراجعة اختياري').value, 'mine');
  db.get(uid('a@example.test')).draft.name = 'other tab'; db.get(uid('a@example.test')).revision++;
  control.conflict = false; fireEvent.click(reload); await heading('راجع كودك، وافهم ما ينقصه.');
  assert.equal(screen.getByLabelText('اسم المراجعة اختياري').value, 'other tab');
});

test('migration/setup failure stays an error and never saves a demo fallback', async () => {
  control.failLoad = true; mount(); await heading('تسجيل الدخول');
  change('البريد الإلكتروني', 'a@example.test'); change('كلمة المرور', 'ValidPass123!');
  fireEvent.click(screen.getByRole('button', { name: 'تسجيل الدخول', exact: true })); await heading('تعذّر تحميل المسودة');
  assert.equal(calls.some(call => call.action === 'save_review_draft'), false);
  control.failLoad = false; fireEvent.click(screen.getByRole('button', { name: 'إعادة المحاولة', exact: true }));
  await heading('راجع كودك، وافهم ما ينقصه.'); assert.equal(screen.getByLabelText('اسم المراجعة اختياري').value, '');
});

test('demo report still works; changed requirements cannot receive canned results', async () => {
  mount(); await login(); fireEvent.click(screen.getByRole('button', { name: 'تجربة المثال', exact: true })); await saved();
  fireEvent.click(screen.getByRole('button', { name: 'فحص النطاق', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'بدء المراجعة', exact: true }));
  await heading('تقرير النتائج'); fireEvent.click(screen.getByRole('button', { name: 'تعديل المراجعة', exact: true }));
  fireEvent.change(document.getElementById('requirements'), { target: { value: 'متطلب آخر' } }); await saved();
  fireEvent.click(screen.getByRole('button', { name: 'فحص النطاق', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'بدء المراجعة', exact: true }));
  await screen.findByText('التقرير التوضيحي مرتبط بالمثال الجاهز');
});
