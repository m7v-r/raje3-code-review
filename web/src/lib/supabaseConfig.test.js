import test from 'node:test';
import assert from 'node:assert/strict';
import { readSupabaseConfig } from './supabaseConfig.js';
import { arabicError } from './serviceErrors.js';

const env = { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test' };
const jwt = role => `header.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.signature`;

test('missing configuration lists variable names without printing values', () => {
  const result = readSupabaseConfig({ VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_do_not_print' });
  assert.match(result.error, /VITE_SUPABASE_URL/); assert.doesNotMatch(result.error, /do_not_print/);
});

test('accepts publishable and legacy anon keys and rejects privileged keys before client creation', () => {
  assert.equal(readSupabaseConfig(env).error, null);
  assert.equal(readSupabaseConfig({ ...env, VITE_SUPABASE_PUBLISHABLE_KEY: jwt('anon') }).error, null);
  for (const key of ['sb_secret_do_not_print', jwt('service_role'), jwt('authenticated')]) {
    const result = readSupabaseConfig({ ...env, VITE_SUPABASE_PUBLISHABLE_KEY: key });
    assert.ok(result.error); assert.doesNotMatch(result.error, /do_not_print/); assert.equal(result.key, undefined);
  }
});

test('invalid project URLs and human-readable auth/backend errors', () => {
  assert.ok(readSupabaseConfig({ ...env, VITE_SUPABASE_URL: 'broken' }).error);
  assert.match(arabicError({ code: 'invalid_credentials' }, 'auth'), /البريد أو كلمة المرور/);
  assert.match(arabicError({ code: 'email_not_confirmed' }, 'auth'), /أكد بريدك/);
  assert.match(arabicError({ code: 'PT409' }), /نسخة أحدث/);
  assert.match(arabicError({ code: 'PGRST202' }), /قاعدة البيانات/);
  assert.doesNotMatch(arabicError({ message: 'sensitive backend stack' }), /sensitive/);
});
