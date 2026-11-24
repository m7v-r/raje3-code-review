import { useEffect, useRef, useState } from 'react';
import Home from './screens/Home';
import Action from './screens/Action';
import Detail from './screens/Detail';
import { Dialogs, Footer, Header } from './components/ReviewLayout';
import { createDemoDraft, isDemoDraft, requirementLines, reviewSample, screenNames, visibleResults } from './lib/reviewModel';
import { useReviewDraft } from './hooks/useReviewDraft';
import { useAuth } from './auth/AuthProvider';
import AuthLayout from './components/AuthLayout';
import { arabicError } from './lib/serviceErrors';
import { fmtNumber } from './lib/format';

const mobile = () => typeof window !== 'undefined' && !!window.matchMedia?.('(max-width: 767px)').matches;

export default function ReviewWorkbench({ userId }) {
  const auth = useAuth();
  const cloud = useReviewDraft(userId);
  const draft = cloud.draft;
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const [signOutError, setSignOutError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [busy, setBusy] = useState(false);
  const [runStage, setRunStage] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [preview, setPreview] = useState('r4');
  const [selectedId, setSelectedId] = useState('r4');
  const [filter, setFilter] = useState('attention');
  const [fileFilter, setFileFilter] = useState(null);
  const [tab, setTab] = useState('requirements');
  const [focused, setFocused] = useState(false);
  const [announcement, announce] = useState('');
  const about = useRef(null);
  const shortcuts = useRef(null);
  const pendingFocus = useRef(null);
  const listScroll = useRef(0);
  const pendingScroll = useRef(null);
  const running = useRef(false);
  const active = useRef(true);
  const timer = useRef(null);
  const rows = visibleResults(filter, fileFilter);
  const selected = reviewSample.review.results.find(result => result.id === selectedId) ?? null;
  const ready = draft.files.length > 0 && requirementLines(draft).length > 0;

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; clearTimeout(timer.current); };
  }, []);

  useEffect(() => {
    if (pendingFocus.current) {
      document.getElementById(pendingFocus.current)?.focus();
      pendingFocus.current = null;
    }
    if (pendingScroll.current !== null) {
      window.scrollTo({ top: pendingScroll.current, behavior: 'instant' });
      pendingScroll.current = null;
    }
  });

  function updateDraft(patch) {
    const next = { ...draftRef.current, ...patch };
    draftRef.current = next;
    cloud.update(patch);
    setReached(0);
    setBlocked(false);
  }

  function goTo(next) {
    if (running.current) return;
    if (next > 0 && !ready) return;
    if (next === 2 && !isDemoDraft(draftRef.current)) return;
    setStep(next);
    setReached(current => Math.max(current, next));
    if (next !== 2) setFocused(false);
    pendingFocus.current = 'page-heading';
    pendingScroll.current = 0;
    announce(screenNames[next]);
  }

  function loadExample() {
    if (running.current) return;
    updateDraft(createDemoDraft());
    setPreview('r4'); setSelectedId('r4'); setFilter('attention');
    setFileFilter(null); setTab('requirements'); setFocused(false);
    setStep(0); pendingFocus.current = 'page-heading'; pendingScroll.current = 0;
    announce('تمت استعادة مثال تسجيل الدخول الجاهز.');
  }

  async function runDemo() {
    if (running.current || !ready) return;
    if (!isDemoDraft(draftRef.current)) {
      setBlocked(true);
      announce('التحليل الفعلي غير مفعّل. استعد المثال الجاهز لتجربة التقرير.');
      return;
    }
    running.current = true; setBusy(true);
    for (let index = 0; index < 3; index += 1) {
      setRunStage(index);
      announce(['تجهيز المعاينة', 'عرض المتطلبات', 'فتح التقرير التوضيحي'][index]);
      await new Promise(resolve => { timer.current = setTimeout(resolve, 420); });
      if (!active.current) return;
    }
    running.current = false; setBusy(false); setSelectedId('r4'); setFileFilter(null);
    setTab('requirements'); setFilter(mobile() ? 'attention' : 'all');
    goTo(2);
  }

  function selectRequirement(id) {
    const result = reviewSample.review.results.find(item => item.id === id);
    if (!result) return;
    setSelectedId(id);
    if (mobile()) {
      if (tab === 'requirements') listScroll.current = window.scrollY;
      setTab('evidence'); pendingFocus.current = 'evidence-tab';
    } else pendingFocus.current = focused ? 'focus-view-button' : `requirement-${id}`;
    announce(`${result.requirement}، ${reviewSample.statusLabels[result.status]}`);
  }

  function changeTab(value) {
    setTab(value); pendingFocus.current = `${value}-tab`;
    if (value === 'requirements' && mobile()) pendingScroll.current = listScroll.current;
  }

  function toggleFocus() {
    if (step !== 2) return;
    if (mobile()) changeTab(tab === 'evidence' ? 'requirements' : 'evidence');
    else { setFocused(value => !value); pendingFocus.current = 'focus-view-button'; }
  }

  function changeFilter(value) {
    setFilter(value);
    const next = visibleResults(value, fileFilter);
    if (!next.some(result => result.id === selectedId)) setSelectedId(next[0]?.id ?? null);
    announce(`عدد المتطلبات الظاهرة ${fmtNumber(next.length)}`);
  }

  function changeFileFilter(value) {
    setFileFilter(value);
    setSelectedId(visibleResults(filter, value)[0]?.id ?? null);
  }

  function handleKey(event) {
    if (about.current?.open || shortcuts.current?.open) return;
    const typing = event.target.matches?.('input,textarea,select,[contenteditable="true"]');
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault(); if (running.current) return;
      if (step === 0 && ready) goTo(1); else if (step === 1) runDemo();
      return;
    }
    if (event.target.getAttribute?.('role') === 'tab' && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault(); changeTab(event.key === 'Home' ? 'requirements' : event.key === 'End' ? 'evidence' : tab === 'requirements' ? 'evidence' : 'requirements'); return;
    }
    if (typing || event.ctrlKey || event.metaKey || event.altKey || running.current) return;
    if (event.key === '?') { event.preventDefault(); shortcuts.current.showModal(); return; }
    if (step !== 2) return;
    if (['j', 'J', 'k', 'K'].includes(event.key) && rows.length) {
      event.preventDefault(); let index = rows.findIndex(result => result.id === selectedId); if (index < 0) index = 0;
      selectRequirement(rows[(index + (event.key.toLowerCase() === 'j' ? 1 : -1) + rows.length) % rows.length].id);
    } else if (event.key.toLowerCase() === 'f') { event.preventDefault(); toggleFocus(); }
    else if (event.key === 'Escape') {
      if (focused) toggleFocus(); else if (mobile() && tab === 'evidence') changeTab('requirements');
    }
  }

  async function signOut() {
    if (signingOut) return;
    if (cloud.dirty && !window.confirm('توجد تغييرات لم تُحفظ. هل تريد تسجيل الخروج وترك هذه التغييرات؟')) return;
    setSigningOut(true); setSignOutError('');
    try { await auth.signOut(); }
    catch (error) { setSignOutError(arabicError(error, 'auth')); }
    finally { setSigningOut(false); }
  }

  if (cloud.phase !== 'ready') return <AuthLayout><section className="panel form-panel auth-panel" aria-labelledby="page-heading" aria-busy={cloud.phase === 'loading'}>
    <h1 id="page-heading" tabIndex="-1">{cloud.phase === 'loading' ? 'جارٍ استعادة مسودتك…' : 'تعذّر تحميل المسودة'}</h1>
    {cloud.error && <p className="validation auth-error" role="alert">{cloud.error}</p>}
    <div className="auth-state-actions">{cloud.phase === 'load-error' && <button className="primary" onClick={cloud.reload}>إعادة المحاولة</button>}<button className="secondary" disabled={signingOut} onClick={signOut}>تسجيل الخروج</button></div>
    {signOutError && <p role="alert" className="validation">{signOutError}</p>}
  </section></AuthLayout>;

  return <div onKeyDown={handleKey}>
    <a className="skip-link" href="#main">انتقل إلى المحتوى</a>
    <Header step={step} reached={reached} busy={busy} onStage={next => { if (next <= reached) goTo(next); }} onExample={loadExample} onShortcuts={() => shortcuts.current.showModal()} />
    <div className="shell"><div className="account-bar">
      <div className="save-status"><p className={cloud.error ? 'validation' : 'caption'} role={cloud.error ? 'alert' : 'status'} aria-live="polite">{cloud.error || (cloud.status === 'saving' ? 'جارٍ حفظ المسودة…' : cloud.status === 'saved' ? 'حُفظت المسودة في حسابك.' : 'مسودتك خاصة بحسابك. تُحفظ أسماء الملفات فقط.')}</p>
        {cloud.status === 'error' && (cloud.conflict ? <button className="link-button" onClick={cloud.reload}>تحميل النسخة المحفوظة واستبدال المدخلات الحالية</button> : <button className="link-button" onClick={cloud.retry}>إعادة محاولة الحفظ</button>)}</div>
      <button className="quiet" disabled={signingOut || busy} onClick={signOut}>{signingOut ? 'جارٍ الخروج…' : 'تسجيل الخروج'}</button>
    </div>{signOutError && <p role="alert" className="validation">{signOutError}</p>}</div>
    <main className="shell view-enter" id="main" key={step}>
      {step === 0 && <Home draft={draft} onChange={updateDraft} onNext={() => goTo(1)} preview={preview} onPreview={setPreview} />}
      {step === 1 && <Action draft={draft} busy={busy} runStage={runStage} blocked={blocked} onRun={runDemo} onEdit={() => goTo(0)} onExample={loadExample} />}
      {step === 2 && <Detail draft={draft} rows={rows} selected={selected} filter={filter} fileFilter={fileFilter} tab={tab} focused={focused} onFilter={changeFilter} onFileFilter={changeFileFilter} onSelect={selectRequirement} onTab={changeTab} onFocus={toggleFocus} onEdit={() => goTo(0)} />}
    </main>
    <Footer onAbout={() => about.current.showModal()} />
    <Dialogs aboutRef={about} shortcutsRef={shortcuts} />
    <div id="announcer" className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
  </div>;
}
