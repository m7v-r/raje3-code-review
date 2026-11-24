import { reviewSample, statusClass, statusIcon } from '../lib/reviewModel';
import { fmtNumber } from '../lib/format';

const paths = {
  logo: 'M4 5H1v14h3M20 5h3v14h-3M8 12l3 3 6-7',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  files: 'M16 2H6a2 2 0 0 0-2 2v14M8 6h8l4 4v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2M16 6v4h4',
  close: 'M6 6l12 12M6 18 18 6', check: 'M20 6 9 17l-5-5',
  warning: 'm12 3 10 18H2zM12 9v4M12 17h.01',
  unknown: 'M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5M12 18h.01',
  info: 'M12 11v6M12 7h.01', lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
  code: 'm8 5-6 7 6 7M16 5l6 7-6 7M14 4l-4 16',
  target: 'M12 2a10 10 0 1 0 10 10M12 7a5 5 0 1 0 5 5M12 12l9-9M16 3h5v5',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  clock: 'M12 8v5l3 2',
  keyboard: 'M3 5h18v14H3zM6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10',
  focus: 'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5',
};

export function Icon({ name }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {['unknown', 'info', 'clock'].includes(name) && <circle cx="12" cy="12" r="10" />}
    <path d={paths[name] || paths.file} />
  </svg>;
}

export function StatusPill({ status }) {
  return <span className={`pill ${statusClass(status)}`}><Icon name={statusIcon(status)} />{reviewSample.statusLabels[status]}</span>;
}

function Syntax({ text }) {
  const parts = text.split(/("(?:\\.|[^"\\])*"|\b(?:return|if|function|false)\b)/g);
  return parts.map((part, index) => part.startsWith('"')
    ? <span className="syntax-string" key={index}>{part}</span>
    : /^(return|if|function|false)$/.test(part)
      ? <span className="syntax-keyword" key={index}>{part}</span> : part);
}

export function CodeWindow({ evidence, context = true }) {
  let snippet = evidence.snippet;
  let start = evidence.lineStart;
  if (context && evidence.file === 'validators.js' && evidence.lineStart === 14) {
    snippet = reviewSample.review.results[0].evidence.snippet;
    start = 12;
  }
  return <div className="code-window">
    <div className="code-title"><span className="inline-note"><Icon name="file" /><bdi dir="ltr">{evidence.file}</bdi></span><span>السطر {fmtNumber(evidence.lineStart)}</span></div>
    <div className="code-body" dir="ltr" tabIndex="0" aria-label={`مقتطف كود للقراءة فقط من ${evidence.file}`}>
      <div role="code">{snippet.split('\n').map((line, index) => <div className={`code-line ${start + index >= evidence.lineStart && start + index <= evidence.lineEnd ? 'highlight' : ''}`} key={index}>
        <span className="line-number" aria-hidden="true">{start + index}</span><code><Syntax text={line} /></code>
      </div>)}</div>
    </div>
  </div>;
}

export function FileList({ files, onRemove }) {
  return <ul className="file-list">{files.map((file, index) => <li className="file-item" key={`${index}:${file.name}`}>
    <Icon name="file" /><bdi dir="ltr">{file.name}</bdi>{file.demo && <span className="file-kind">مثال</span>}
    {onRemove && <button type="button" className="icon-button" onClick={() => onRemove(index)} aria-label={`إزالة ${file.name}`}><Icon name="close" /></button>}
  </li>)}</ul>;
}

export function DemoNotice({ blocked = false, onExample }) {
  if (!blocked) return null;
  return <div className="notice" id="custom-notice"><Icon name="info" /><div>
    <strong>التقرير التوضيحي مرتبط بالمثال الجاهز</strong>
    <p>يمكنك تجربة إدخال بياناتك وفحص نطاقها. التحليل الفعلي غير مفعّل في هذه المعاينة.</p>
    <button type="button" className="link-button" onClick={onExample}>استعادة المثال وتجربة التقرير</button>
  </div></div>;
}
