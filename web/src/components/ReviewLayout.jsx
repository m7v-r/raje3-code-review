import { Icon } from './ReviewUI';
import { fmtNumber } from '../lib/format';
import { screenNames } from '../lib/reviewModel';

export function Header({ step, reached, busy, onStage, onExample, onShortcuts }) {
  return <header className="shell"><div className="masthead">
    <button type="button" className="brand" onClick={() => onStage(0)} aria-label="راجع، بدء المراجعة"><span className="brand-symbol"><Icon name="logo" /></span><span className="brand-word">راجع</span><span className="brand-description">مختبر الكود</span></button>
    <nav aria-label="مراحل المراجعة"><ol className="steps">{screenNames.map((name, index) => <li key={name}><button type="button" className={`step ${index === step ? 'current' : index < step ? 'done' : ''}`} disabled={index > reached || busy} aria-current={index === step ? 'step' : undefined} onClick={() => onStage(index)}><span className="step-number">{fmtNumber(index + 1)}</span>{name}</button></li>)}</ol></nav>
    <div className="top-actions"><button type="button" className="quiet" onClick={onExample} disabled={busy}>تجربة المثال</button><button type="button" className="icon-button shortcut-trigger" aria-label="اختصارات لوحة المفاتيح" title="اختصارات لوحة المفاتيح" onClick={onShortcuts} disabled={busy}><Icon name="keyboard" /></button><span className="demo-pill"><Icon name="code" />معاينة تفاعلية</span></div>
    <div className="mobile-step"><strong>{fmtNumber(step + 1)} من {fmtNumber(3)}</strong>، {screenNames[step]}</div>
  </div></header>;
}

export function Footer({ onAbout }) {
  return <footer className="shell"><div className="site-footer"><span className="footer-brand"><Icon name="logo" />راجع، قبل أن تعتبر المهمة مكتملة.</span><span>تصميم مختبر الكود، ببيانات توضيحية.</span><button type="button" className="link-button" onClick={onAbout}>عن هذه المعاينة</button></div></footer>;
}

export function Dialogs({ aboutRef, shortcutsRef }) {
  return <>
    <dialog id="about-dialog" ref={aboutRef} aria-labelledby="about-heading"><div className="dialog-head"><h2 id="about-heading">جرّب التصميم، وافهم الرحلة</h2><button type="button" className="icon-button" aria-label="إغلاق" onClick={() => aboutRef.current.close()}><Icon name="close" /></button></div>
      <p>هذه الواجهة الأساسية لراجع. تحفظ مسودة المراجعة في حسابك، بينما التقرير الحالي يخص مثال تسجيل الدخول الجاهز ولا يمثل تحليلًا فعليًا لملفاتك.</p>
      <p>يُحفظ الاسم والمتطلبات وأسماء الملفات فقط؛ لا تُقرأ محتويات الملفات ولا تُرفع. لا يُشغّل الكود أو الاختبارات.</p><button type="button" className="primary" onClick={() => aboutRef.current.close()}>فهمت</button>
    </dialog>
    <dialog id="shortcuts-dialog" ref={shortcutsRef} aria-labelledby="shortcuts-heading"><div className="dialog-head"><h2 id="shortcuts-heading">اختصارات تختصر الطريق</h2><button type="button" className="icon-button" aria-label="إغلاق الاختصارات" onClick={() => shortcutsRef.current.close()}><Icon name="close" /></button></div>
      <dl className="shortcut-list">{[
        ['Ctrl / ⌘ + Enter', 'المتابعة من المدخلات إلى النطاق، ثم بدء المثال.'],
        ['J / K', 'الملاحظة التالية أو السابقة ضمن نتائج التصفية.'],
        ['F', 'وضع التركيز على اللابتوب، أو تبديل الدليل على الجوال.'],
        ['Esc', 'الخروج من التركيز، أو الرجوع للمتطلبات على الجوال.'],
        ['?', 'فتح هذه الاختصارات.'],
      ].map(([keys, description]) => <div key={keys}><dt><kbd dir="ltr">{keys}</kbd></dt><dd>{description}</dd></div>)}</dl>
      <p>الحروف المفردة لا تعمل أثناء الكتابة داخل الحقول.</p><button type="button" className="primary" onClick={() => shortcutsRef.current.close()}>فهمت</button>
    </dialog>
  </>;
}
