import { CodeWindow, Icon, StatusPill } from '../components/ReviewUI';
import { fmtNumber, fmtReviewDate } from '../lib/format';
import { reviewSample, statusClass, statusIcon } from '../lib/reviewModel';

export default function Detail({ draft, rows, selected, filter, fileFilter, tab, focused, onFilter, onFileFilter, onSelect, onTab, onFocus, onEdit }) {
  const results = reviewSample.review.results;
  return <>
    <div className="intro report-intro"><div><span className="eyebrow"><Icon name="code" />بيانات توضيحية</span><h1 id="page-heading" tabIndex="-1">تقرير النتائج</h1><p>{draft.name || reviewSample.review.name}، {fmtReviewDate(new Date())}</p></div>
      <div className="report-actions"><button type="button" className="secondary desktop-only" id="focus-view-button" onClick={onFocus} aria-pressed={focused}><Icon name="focus" />{focused ? 'إظهار المتطلبات' : 'وضع التركيز'}</button><button type="button" className="secondary" onClick={onEdit}>تعديل المراجعة</button></div>
    </div>
    <div className="summary-strip" aria-label="ملخص التقرير">{['appears_met', 'needs_review', 'unverifiable'].map(status => <div className={`summary-item ${statusClass(status)}`} key={status}><Icon name={statusIcon(status)} /><strong>{fmtNumber(results.filter(result => result.status === status).length)}</strong><span className="summary-label">{reviewSample.statusLabels[status]}</span></div>)}<span className="summary-scope">{fmtNumber(3)} ملفات، {fmtNumber(6)} متطلبات، قراءة فقط</span></div>
    <div className="report-tabs" role="tablist" aria-label="عرض التقرير">{[['requirements', 'المتطلبات'], ['evidence', 'الدليل']].map(([value, label]) => <button type="button" className="report-tab" key={value} id={`${value}-tab`} role="tab" aria-controls={`${value}-panel`} aria-selected={tab === value} tabIndex={tab === value ? 0 : -1} onClick={() => onTab(value)}>{label}</button>)}</div>
    <div className={`report-layout ${focused ? 'focused' : ''}`} data-tab={tab}>
      <aside className="panel file-nav" aria-label="ملفات المراجعة"><h2>الملفات المختارة</h2><button type="button" className={`file-nav-button ${!fileFilter ? 'active' : ''}`} onClick={() => onFileFilter(null)}><Icon name="files" />كل الملفات</button>
        {reviewSample.review.selectedFiles.map(file => <button type="button" className={`file-nav-button ${fileFilter === file ? 'active' : ''}`} onClick={() => onFileFilter(file)} key={file}><Icon name="file" /><bdi dir="ltr">{file}</bdi></button>)}
        <span className="inline-note"><Icon name="lock" />نطاق للقراءة فقط</span>
      </aside>
      <section className="panel requirements-pane" id="requirements-panel" role="tabpanel" aria-label="المتطلبات ونتائجها"><div className="requirements-head"><h2>المتطلبات <span className="caption">{fmtNumber(rows.length)} من {fmtNumber(6)}</span></h2>
        <div className="filters" role="group" aria-label="تصفية المتطلبات">{[['all', 'الكل'], ['attention', 'يحتاج انتباهك'], ['appears_met', 'يبدو مستوفًى']].map(([value, label]) => <button type="button" className={`filter-button ${filter === value ? 'active' : ''}`} key={value} onClick={() => onFilter(value)} aria-pressed={filter === value}>{label}</button>)}</div>
      </div>
        {rows.length ? <ul className="requirement-list">{rows.map(result => <li key={result.id}><button type="button" className={`requirement-button ${selected?.id === result.id ? 'selected' : ''} ${result.status}`} onClick={() => onSelect(result.id)} id={`requirement-${result.id}`} aria-pressed={selected?.id === result.id}>
          <span className="req-top"><span>{result.requirement}</span><span className="req-id">{fmtNumber(result.order)}</span></span><span className={`req-status ${statusClass(result.status)}`}><Icon name={statusIcon(result.status)} />{reviewSample.statusLabels[result.status]}</span>
        </button></li>)}</ul> : <p className="empty-list">لا توجد نتائج مرتبطة بهذا الملف ضمن التصفية الحالية.</p>}
        {filter === 'attention' && <div className="all-results-action"><button type="button" className="link-button" onClick={() => onFilter('all')}>عرض جميع المتطلبات الستة</button></div>}
      </section>
      <section className="panel evidence-pane evidence-enter" id="evidence-panel" role="tabpanel" aria-label="الدليل للمتطلب المختار" key={selected?.id || 'empty'}>
        {selected ? <><div className="evidence-header"><StatusPill status={selected.status} /><h2>{selected.requirement}</h2><p>الدليل مرتبط بهذا المتطلب ضمن الملفات المختارة.</p><button type="button" className="link-button mobile-back" onClick={() => onTab('requirements')}>رجوع للمتطلبات</button></div>
          <div className="evidence-content">{selected.evidence ? <><CodeWindow evidence={selected.evidence} /><div className="analysis-block"><h3><Icon name="info" />لماذا ظهرت هذه النتيجة؟</h3><p>{selected.explanation}</p></div>{selected.manualNextStep && <div className="analysis-block"><h3><Icon name="target" />ما الذي تراجعه يدويًا؟</h3><p>{selected.manualNextStep}</p></div>}</> : <><div className="unverifiable-block"><Icon name="unknown" /><h3>لا توجد أدلة كافية ضمن هذا النطاق</h3><p>{selected.explanation}</p></div><div className="analysis-block"><h3><Icon name="target" />ما الذي يلزم للتحقق؟</h3><p>{selected.manualNextStep}</p></div></>}</div>
        </> : <div className="evidence-header"><h2>لا توجد ملاحظة مختارة</h2><p>اختر متطلبًا من نتائج التصفية، أو اعرض كل الملفات.</p><button type="button" className="link-button mobile-back" onClick={() => onTab('requirements')}>رجوع للمتطلبات</button></div>}
      </section>
    </div>
    <section className="limits" aria-label="حدود الفحص"><strong><Icon name="info" />حدود الفحص</strong><p><Icon name="lock" />لم يُشغّل الكود أو الاختبارات.</p><p>لا يضمن الفحص خلو الكود من الأخطاء.</p></section>
  </>;
}
