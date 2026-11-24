import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import AuthLayout from '../components/AuthLayout';
import { Icon } from '../components/ReviewUI';
import { arabicError } from '../lib/serviceErrors';
import { validateCredentials } from '../auth/validateCredentials';

export default function SignIn() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const errorRef = useRef(null);
  useEffect(() => { document.getElementById('page-heading')?.focus(); }, []);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  async function submit(event) {
    event.preventDefault();
    if (submitting.current || !auth.configured) return;
    const invalid = validateCredentials(email, password);
    if (invalid) { setError(invalid); return; }
    submitting.current = true; setBusy(true); setError('');
    try { await auth.signIn(email, password); }
    catch (cause) { setError(arabicError(cause, 'auth')); }
    finally { submitting.current = false; setBusy(false); setPassword(''); }
  }
  return <AuthLayout><section className="panel form-panel auth-panel" aria-labelledby="page-heading">
    <span className="eyebrow"><Icon name="code" />كمل من حيث توقفت.</span>
    <h1 id="page-heading" tabIndex="-1">تسجيل الدخول</h1>
    <p className="auth-description">ادخل إلى حسابك لاستعادة مسودة المراجعة وحفظ تعديلاتك.</p>
    {!auth.configured && <div className="notice auth-notice" role="status"><Icon name="info" /><p>الاتصال غير مُعدّ بعد. أضف رابط المشروع والمفتاح العام في <bdi dir="ltr">web/.env.local</bdi>، ثم أعد تشغيل التطبيق.</p></div>}
    <form onSubmit={submit} aria-busy={busy} noValidate>
      <div className="field"><label className="label" htmlFor="sign-in-email">البريد الإلكتروني</label><input id="sign-in-email" name="email" aria-describedby={error ? 'sign-in-error' : undefined} type="email" dir="auto" autoComplete="email" required disabled={busy || !auth.configured} value={email} onChange={event => setEmail(event.target.value)} /></div>
      <div className="field"><label className="label" htmlFor="sign-in-password">كلمة المرور</label><input id="sign-in-password" name="password" aria-describedby={error ? 'sign-in-error' : undefined} type="password" dir="auto" autoComplete="current-password" required disabled={busy || !auth.configured} value={password} onChange={event => setPassword(event.target.value)} /></div>
      {error && <p className="validation auth-error" role="alert" tabIndex="-1" ref={errorRef} id="sign-in-error">{error}</p>}
      <button className="primary auth-submit" type="submit" disabled={busy || !auth.configured}>{busy ? 'جارٍ تسجيل الدخول…' : 'تسجيل الدخول'}</button>
    </form>
    <p className="auth-switch">ما عندك حساب؟ <a href="#/sign-up">أنشئ حسابًا</a></p>
  </section></AuthLayout>;
}
