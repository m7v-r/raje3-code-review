import { DemoNotice, FileList, Icon } from '../components/ReviewUI';
import { fmtNumber, fmtReviewDate } from '../lib/format';
import { requirementLines } from '../lib/reviewModel';

const runStages = ['تجهيز المعاينة', 'عرض المتطلبات', 'فتح التقرير التوضيحي'];

export default function Action({ draft, busy, runStage, blocked, onRun, onEdit, onExample }) {
  const requirements = requirementLines(draft);
  return <>
    <div className="intro"><div><span className="eyebrow"><Icon name="lock" />النطاق واضح قبل المراجعة.</span><h1 id="page-heading" tabIndex="-1">فحص النطاق</h1><p>{draft.name || `مراجعة ${fmtReviewDate(new Date())}`}</p></div><span className="pill read-only"><Icon name="lock" />قراءة فقط</span></div>
    <div className="scope-layout">
      <section className="panel manifest"><div className="panel-heading"><h2>الملفات ضمن هذه المراجعة</h2><span className="caption">{fmtNumber(draft.files.length)} ملفات</span></div>
        <div className="panel-body"><FileList files={draft.files} /><div className="scope-meta"><span><strong>{fmtNumber(draft.files.length)}</strong> ملفات مختارة</span><span><strong>{fmtNumber(requirements.length)}</strong> متطلبات</span></div>
          <h3>المتطلبات التي أدخلتها</h3><ol className="scope-requirements">{requirements.map((text, index) => <li key={index}><span className="req-number">{fmtNumber(index + 1)}</span><span>{text}</span></li>)}</ol>
        </div>
      </section>
      <section className="panel run-pane" aria-label="حالة المراجعة"><span className="run-symbol"><Icon name={busy ? 'clock' : 'code'} /></span><div><h2>{busy ? 'تحضير التقرير التوضيحي' : 'جاهز للمراجعة'}</h2><p>لن تُعدّل الملفات، ولن يُشغّل الكود أو الاختبارات.</p></div>
        {busy ? <ol className="running-steps">{runStages.map((text, index) => <li key={text} className={index === runStage ? 'active' : index < runStage ? 'complete' : ''}><span>{index < runStage ? <Icon name="check" /> : fmtNumber(index + 1)}</span><span>{text}</span></li>)}</ol> : <>
          <div className="notice"><Icon name="info" /><div><strong>أنت تستعرض نموذج التصميم</strong><p>التقرير التالي يستخدم بيانات مثال تسجيل الدخول الجاهز.</p></div></div>
          <DemoNotice blocked={blocked} onExample={onExample} />
          <div className="scope-buttons"><button type="button" className="primary" onClick={onRun}>بدء المراجعة</button><button type="button" className="link-button" onClick={onEdit}>تعديل الاختيار</button></div>
        </>}
      </section>
    </div>
  </>;
}
