import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import AuthLayout from '../components/AuthLayout';
import { Icon } from '../components/ReviewUI';
import { arabicError } from '../lib/serviceErrors';
import { validateCredentials } from '../auth/validateCredentials';

export default function SignUp() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const resultRef = useRef(null);
  useEffect(() => { document.getElementById('page-heading')?.focus(); }, []);
  useEffect(() => { if (error || sent) resultRef.current?.focus(); }, [error, sent]);
  async function submit(event) {
    event.preventDefault();
    if (submitting.current || !auth.configured) return;
    const invalid = validateCredentials(email, password, true);
    if (invalid) { setError(invalid); return; }
    submitting.current = true; setBusy(true); setError('');
    try {
      const data = await auth.signUp(email, password);
      if (!data.session) setSent(true);
    } catch (cause) { setError(arabicError(cause, 'auth')); }
    finally { submitting.current = false; setBusy(false); setPassword(''); }
  }
  return <AuthLayout><section className="panel form-panel auth-panel" aria-labelledby="page-heading">
    <span className="eyebrow"><Icon name="lock" />مسودتك مرتبطة بحسابك.</span>
    <h1 id="page-heading" tabIndex="-1">إنشاء حساب</h1>
    <p className="auth-description">احفظ اسم المراجعة ومتطلباتها وأسماء الملفات، وارجع لها لاحقًا.</p>
    {!auth.configured && <div className="notice auth-notice" role="status"><Icon name="info" /><p>يلزم إكمال إعداد الاتصال في <bdi dir="ltr">web/.env.local</bdi> قبل إنشاء الحساب.</p></div>}
    {sent ? <div className="notice auth-notice" role="status" tabIndex="-1" ref={resultRef}><Icon name="check" /><div><strong>تحقق من بريدك</strong><p>إذا كان البريد متاحًا للتسجيل، ستصلك رسالة لتأكيده. افتح رابط التأكيد ثم سجّل الدخول. تحقق أيضًا من مجلد الرسائل غير المرغوب فيها.</p></div></div>
      : <form onSubmit={submit} aria-busy={busy} noValidate>
        <div className="field"><label className="label" htmlFor="sign-up-email">البريد الإلكتروني</label><input id="sign-up-email" name="email" aria-describedby={error ? 'sign-up-error' : undefined} type="email" dir="auto" autoComplete="email" required disabled={busy || !auth.configured} value={email} onChange={event => setEmail(event.target.value)} /></div>
        <div className="field"><label className="label" htmlFor="sign-up-password">كلمة المرور</label><input id="sign-up-password" name="password" type="password" dir="auto" autoComplete="new-password" required minLength={8} aria-describedby={error ? 'password-hint sign-up-error' : 'password-hint'} disabled={busy || !auth.configured} value={password} onChange={event => setPassword(event.target.value)} /><p className="caption" id="password-hint">ثمانية أحرف على الأقل. استخدم كلمة مرور خاصة بهذا الحساب.</p></div>
        {error && <p className="validation auth-error" role="alert" tabIndex="-1" ref={resultRef} id="sign-up-error">{error}</p>}
        <button className="primary auth-submit" type="submit" disabled={busy || !auth.configured}>{busy ? 'جارٍ إنشاء الحساب…' : 'إنشاء حساب'}</button>
      </form>}
    <p className="auth-switch">عندك حساب؟ <a href="#/sign-in">تسجيل الدخول</a></p>
  </section></AuthLayout>;
}
