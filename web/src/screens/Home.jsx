import { useRef, useState } from 'react';
import { CodeWindow, FileList, Icon, StatusPill } from '../components/ReviewUI';
import { fmtNumber } from '../lib/format';
import { requirementLines, reviewSample } from '../lib/reviewModel';

export default function Home({ draft, onChange, onNext, preview, onPreview, storageError }) {
  const fileInput = useRef(null);
  const [dragging, setDragging] = useState(false);
  const requirements = requirementLines(draft);
  const ready = draft.files.length > 0 && requirements.length > 0;
  const example = reviewSample.review.results.find(result => result.id === preview);
  const chooseFiles = files => {
    if (files.length) onChange({ files: Array.from(files, file => ({ name: file.name, demo: false })) });
    setDragging(false);
  };
  return <>
    <div className="intro"><div><span className="eyebrow"><Icon name="code" />قبل أن تقول: خلصت.</span>
      <h1 id="page-heading" tabIndex="-1">راجع كودك، وافهم ما ينقصه.</h1>
      <p>حدّد الملفات وأضف المتطلبات، ثم اطّلع على الملاحظات وأدلتها في تقرير واضح.</p>
    </div><span className="inline-note"><Icon name="lock" />قراءة فقط، ضمن اختيارك.</span></div>
    <div className="start-layout">
      <section className="panel form-panel" aria-label="بدء مراجعة">
        <div className="field"><label className="label" htmlFor="review-name">اسم المراجعة <span className="optional">اختياري</span></label>
          <input id="review-name" type="text" dir="auto" autoComplete="off" placeholder="مثال: مراجعة تسجيل الدخول" value={draft.name} onChange={event => onChange({ name: event.target.value })} />
        </div>
        <div className={`file-section ${dragging ? 'dragging' : ''}`} id="drop-zone" onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); chooseFiles(event.dataTransfer.files); }}>
          <div className="file-zone-head"><h2 className="file-zone-title"><Icon name="files" />ملفات المراجعة <span className="caption">{draft.files.length ? fmtNumber(draft.files.length) : 'لا توجد ملفات'}</span></h2>
            <button type="button" className="secondary" onClick={() => fileInput.current.click()}>اختيار الملفات</button>
            <input ref={fileInput} type="file" multiple hidden onChange={event => { chooseFiles(event.target.files); event.target.value = ''; }} />
          </div>
          {draft.files.length ? <FileList files={draft.files} onRemove={index => onChange({ files: draft.files.filter((_, i) => i !== index) })} /> : <p className="empty-list">اختر الملفات التي تريد مراجعتها، أو اسحبها هنا.</p>}
          <p className="file-help">{draft.files.length && draft.files.every(file => file.demo) ? 'ملفات المثال الجاهز للتجربة. يمكنك إزالتها أو اختيار ملفاتك.' : 'اختيار ملفاتك يعرض أسماءها فقط في هذه المعاينة.'}</p>
        </div>
        <div className="field"><label className="label" htmlFor="requirements">المتطلبات <span className="caption">{fmtNumber(requirements.length)} متطلبات</span></label>
          <textarea id="requirements" dir="auto" aria-describedby="requirements-hint" placeholder="اكتب كل متطلب في سطر مستقل" value={draft.requirements} onChange={event => onChange({ requirements: event.target.value })} />
          <p id="requirements-hint" className="caption">اكتب كل متطلب في سطر مستقل، واذكر السلوك المتوقع بوضوح.</p>
        </div>
        <p className="validation" id="validation" role="status">{storageError ? 'تعذّر الحفظ في هذا المتصفح؛ التغييرات الحالية محفوظة في الصفحة فقط.' : !ready ? 'اختر ملفًا واحدًا على الأقل وأضف المتطلبات للمتابعة.' : ''}</p>
        <div className="setup-footer"><span className="inline-note"><Icon name="lock" />الملفات المختارة فقط. دون تعديل أو تشغيل.</span>
          <div className="main-action-group"><button type="button" className="primary" id="scope-button" disabled={!ready} onClick={onNext}>فحص النطاق</button><span className="shortcut-hint"><kbd dir="ltr">Ctrl / ⌘ + Enter</kbd></span></div>
        </div>
      </section>
      <aside className="start-preview" aria-label="مثال على التقرير">
        <div className="preview-head"><h2>من المتطلب إلى الدليل</h2><span>مثال تفاعلي</span></div>
        <section className="preview-showcase" id="interactive-preview" aria-label="تجربة أدلة المثال">
          <div className="preview-tabs" role="group" aria-label="اختيار مثال الدليل">{[['r4', 'البريد'], ['r5', 'رسالة الخطأ'], ['r6', 'حدود الفحص']].map(([id, label]) => <button type="button" className={`preview-tab ${preview === id ? 'active' : ''}`} key={id} aria-pressed={preview === id} onClick={() => onPreview(id)}>{label}</button>)}</div>
          <div className="preview-block evidence-enter" key={preview}><StatusPill status={example.status} /><h3 className="preview-note-title">{example.requirement}</h3>
            {example.evidence ? <CodeWindow evidence={example.evidence} /> : <div className="preview-unknown"><Icon name="unknown" /><strong>الخادم خارج الملفات المختارة</strong><span>لذلك لا يمكن تأكيد سلوك تسجيل الدخول.</span></div>}
            <p className="explanation">{example.explanation}</p>
          </div>
        </section>
        <div className="principles">{[
          ['target', 'نطاق تختاره أنت', 'تبدأ المراجعة من الملفات والمتطلبات التي تحددها.'],
          ['list', 'حالة مفهومة لكل متطلب', 'ما يبدو مستوفًى، وما يحتاج مراجعة، وما تعذّر التحقق منه.'],
          ['code', 'ملاحظة لها سياق', 'ارجع إلى الملف والسطر، وافهم سبب الملاحظة.'],
        ].map(([icon, title, text]) => <div className="principle" key={icon}><span className="principle-icon"><Icon name={icon} /></span><div><h3>{title}</h3><p>{text}</p></div></div>)}</div>
        <p className="prototype-note"><strong>جاهز للتجربة:</strong> المثال الحالي يحتوي {fmtNumber(3)} ملفات و{fmtNumber(6)} متطلبات. النتائج توضيحية ولا تمثل فحصًا فعليًا.</p>
      </aside>
    </div>
  </>;
}
