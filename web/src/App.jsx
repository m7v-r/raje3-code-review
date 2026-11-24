import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import AuthLayout from './components/AuthLayout';
import SignIn from './screens/SignIn';
import SignUp from './screens/SignUp';
import ReviewWorkbench from './ReviewWorkbench';

function routeFromHash() {
  return window.location.hash === '#/sign-up' ? 'sign-up' : window.location.hash === '#/review' ? 'review' : 'sign-in';
}

function AccountGate() {
  const auth = useAuth();
  const [route, setRoute] = useState(routeFromHash);
  useEffect(() => {
    const changed = () => setRoute(routeFromHash());
    window.addEventListener('hashchange', changed);
    return () => window.removeEventListener('hashchange', changed);
  }, []);
  useEffect(() => {
    if (auth.loading || auth.error) return;
    const next = auth.session ? 'review' : route === 'review' ? 'sign-in' : route;
    // SDK consumes email-confirmation URL fragments before this redirect.
    const hash = `#/${next}`;
    if (window.location.hash !== hash) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
    if (next !== route) setRoute(next);
  }, [auth.session, auth.loading, auth.error, route]);
  if (auth.loading || auth.error) return <AuthLayout><section className="panel form-panel auth-panel" aria-busy={auth.loading}>
    <h1 id="page-heading" tabIndex="-1">{auth.loading ? 'جارٍ التحقق من الجلسة…' : 'تعذّر التحقق من الجلسة'}</h1>
    {auth.error && <><p className="validation auth-error" role="alert">{auth.error}</p><button className="primary" onClick={auth.retry}>إعادة المحاولة</button></>}
  </section></AuthLayout>;
  if (!auth.session) return route === 'sign-up' ? <SignUp /> : <SignIn />;
  // Unmount all account state on sign-out or account change.
  return <ReviewWorkbench key={auth.session.user.id} userId={auth.session.user.id} />;
}

export default function App() {
  return <AuthProvider><AccountGate /></AuthProvider>;
}
