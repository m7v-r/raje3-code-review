import { Icon } from './ReviewUI';

export default function AuthLayout({ children }) {
  return <>
    <a className="skip-link" href="#main">انتقل إلى المحتوى</a>
    <header className="shell"><div className="masthead auth-masthead"><a className="brand" href="#/sign-in" aria-label="راجع، تسجيل الدخول"><span className="brand-symbol"><Icon name="logo" /></span><span className="brand-word">راجع</span><span className="brand-description">مختبر الكود</span></a><span className="inline-note"><Icon name="lock" />مساحة مراجعتك الخاصة</span></div></header>
    <main className="shell auth-layout view-enter" id="main">{children}</main>
    <footer className="shell"><div className="site-footer"><span className="footer-brand"><Icon name="logo" />راجع، قبل أن تعتبر المهمة مكتملة.</span><span>التحليل الحقيقي غير مفعّل؛ التقرير الحالي مثال توضيحي.</span></div></footer>
  </>;
}
