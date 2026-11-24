# DESIGN.md — راجع / مختبر الكود

Direction selected by the user: «اعجبني مختبر الكود» (23 November 2026).
Approved midnight-blue direction and interactive preview. On 24 November 2026 the user approved uploading this design work to the Raje3 GitHub project. This does not claim completion of the React implementation or a live analysis backend.

## 1. Direction
- Name: مختبر الكود / Code Lab.
- Concept: a calm Arabic read-only workbench connecting every requirement to its evidence and limits, for a beginner reviewing work on a laptop.
- Adjectives: focused, legible, precise.
- Primary reference: GitHub file/line review, https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/reviewing-proposed-changes-in-a-pull-request . Borrow evidence context only; omit merge, approval, diffs and editing.
- Approved interactive reference: `design/mockups/raje3-code-lab.html`; editable source: `design/prototype/`; handoff: `design/CODEX-HANDOFF.md`.
- This specification and the current interactive preview supersede the older exploration boards. Actual 375px/1280px viewport screenshots have not been captured; browser visual QA remains pending.
### This design never does
- No gradients, decorative terminal logs, emoji icons, fake scores, confetti, or three identical summary cards.
- No Inter, Roboto, Arial or Space Grotesk. No centered body paragraphs or Arabic letter-spacing.
- No code edits, auto-fixes, execution, whole-repository imports, merge/approval controls, or claims of guaranteed correctness.

## 2. Colors
For the prototype, tokens live in `design/prototype/tokens.css`. When implementing React, mirror these in `web/src/tokens.css`; other styles reference tokens. Opaque text colors only.
| Token | Hex | Role |
|---|---|---|
| `--color-bg` | `#060E1C` | Page, dark blue dominant |
| `--color-surface` | `#0B1830` | File rows, panels, inputs |
| `--color-surface-raised` | `#112947` | Hovered rows, secondary hover |
| `--color-ink` | `#ECF4FF` | Main Arabic text and code |
| `--color-muted` | `#B4C5E3` | Secondary metadata only |
| `--color-primary` | `#72B8FF` | Primary actions and active navigation |
| `--color-primary-hover` | `#9ACFFF` | Primary hover |
| `--color-primary-pressed` | `#4BA1F5` | Primary pressed |
| `--color-primary-ink` | `#061427` | Text/icons on primary buttons |
| `--color-accent` | `#8CB8FF` | Small brand detail |
| `--color-focus` | `#A6CFFF` | Visible keyboard focus ring |
| `--color-line` | `#244266` | Decorative separators, not sole control boundaries |
| `--color-control-border` | `#5F85B2` | Input/secondary-button boundaries |
| `--color-selected` | `#12345B` | Selected requirement/file background |
| `--color-warning` | `#FFD187` | Needs-review icon and label |
| `--color-success` | `#70DCAE` | Appears-met icon and label only |
| `--color-unknown` | `#B4C5E3` | Cannot-verify icon and label |
| `--color-danger` | `#FF9FB6` | Operational/validation errors only |
| `--color-evidence-line` | `#17334D` | Highlighted evidence line |
| `--color-disabled-bg` | `#172B44` | Disabled controls |
| `--color-disabled-ink` | `#91A8C7` | Disabled-control labels |
| `--color-code-bg` | `#040A14` | Deep-blue code background |
| `--color-chrome` | `#09182E` | Pane headers and tabs |
| `--color-blue-tint` | `#0B2442` | Quiet blue accents |
- Calculated opaque sRGB token ratios: ink/surface 15.96:1; muted/surface 10.14:1; primary-ink/primary 8.81:1; warning/surface 12.40:1; success/surface 10.56:1; danger/surface 9.17:1.
- Control-border/surface 4.62:1; focus/surface 10.94:1. These are token calculations, not a completed rendered-accessibility audit.
- Use ink for code; optional keywords may use primary, strings warning. Never dim essential code below readable contrast.

## 3. Typography
- Display and body: Noto Sans Arabic, weights 400, 600, 700; Google Fonts. System fallback: Tahoma, sans-serif.
- Code and filenames: IBM Plex Mono, weights 400, 500; Google Fonts. Fallback: monospace. Arabic labels never use the code face.
- Verify «حتى» and «على» in the loaded Arabic font before implementation acceptance.
| Role/token | Size | Line-height | Weight |
|---|---|---|---|
| h1 / `--text-h1` | 28px mobile; 32px from 1280px | 1.4 | 700 |
| h2 / `--text-h2` | 22px | 1.5 | 700 |
| h3 / `--text-h3` | 18px | 1.6 | 600 |
| body / `--text-body` | 16px | 1.75 | 400 |
| caption / `--text-caption` | 14px | 1.7 | 400 |
| code / `--text-code` | 14px | 1.7 | 400 |
- Button labels: body size, weight 600. No uppercase transform or letter-spacing on Arabic.

## 4. Spacing and layout
- Spacing scale only: 4, 8, 12, 16, 24, 32, 48px. Define numeric layout tokens in `tokens.css`.
- Radius: 4px controls/panels, 2px status labels. Border: 1px. Panel shadow: `0 16px 48px rgb(0 5 16 / .2)`; active-button glow: `0 0 24px rgb(63 149 255 / .16)`. Focus ring: 3px with 2px offset.
- Content max-width: 1440px; page padding 16px mobile, 24px from 768px. Minimum touch target: 44px square, including file removal and icon controls.
- Design breakpoints: 375, 768, 1280px. Also remain usable at 320px and browser zoom; no page-level horizontal overflow.
- Mobile <768px: one column; report tabs «المتطلبات» and «الدليل»; code scrolls horizontally inside its panel only.
- Tablet 768–1279px: collapsible allowed-file manifest above two columns, requirements min 280px and flexible evidence; collapse to tabs if either pane becomes unreadable.
- Laptop >=1280px: from inline-start/right: file manifest 216px, requirements 320px, flexible evidence pane; gaps 16px.
- Starting review: one column mobile; laptop files on the right, requirements on the left. No generic starter cards, prices, bookings or unrelated dashboard metrics.

## 5. Screens and states
### Shared navigation
- Original small bracket/check mark and «راجع» at inline-start/right. Do not mirror the wordmark or check mark.
- Compact three-stage ordered indicator: «بدء مراجعة»، «فحص النطاق»، «تقرير النتائج». Active stage uses primary plus text; avoid a nonfunctional hamburger.
- On mobile the indicator may show «٢ من ٣، فحص النطاق» to avoid cramped labels. Completed prior stages have clear back links; future stages are not links.
### Screen 1: بدء مراجعة
- Starting-screen headline «راجع كودك، وافهم ما ينقصه.»; helper «حدّد الملفات وأضف المتطلبات، ثم اطّلع على الملاحظات وأدلتها في تقرير واضح».
- Fields: «اسم المراجعة (اختياري)»، «الملفات»، «المتطلبات». If name is empty, derive the visible name «مراجعة» plus its formatted date.
- Outlined secondary action «اختيار الملفات». List only selected files; each removal has an accessible label containing the filename.
- Requirements are a multiline field; hint «اكتب كل متطلب في سطر مستقل». Preserve original requirement order and text.
- Main action «فحص النطاق», enabled only with >=1 readable selected file and nonempty requirements. Show what is missing in text, not just disabled color.
- Note «الملفات المختارة فقط». No repository-wide selector. Demo file extensions are examples, not a settled product support policy. The prototype lists user-selected filenames only; it does not read or upload their contents.
- Interactive evidence preview switches between the email concern, generic error message and unverified backend; preserve setup input when switching.
### Screen 2: فحص النطاق
- Show review name, exact selected filenames/count, requirements count and «قراءة فقط» badge.
- Ready state «جاهز للمراجعة», neutral primary text. No large green success treatment.
- Explanation «لن تُعدّل الملفات، ولن يُشغّل الكود أو الاختبارات».
- Main action «بدء المراجعة»; secondary «تعديل الاختيار», returning to retained form data.
- Prototype stages honestly say «تجهيز المعاينة»، «عرض المتطلبات»، «فتح التقرير التوضيحي». A real analysis service may later show actual preparation/comparison/report stages. No invented percentages, estimated times or execution logs.
- While running, disable duplicate start and scope editing. A mock demonstration must keep «بيانات توضيحية» visible and never imply real analysis.
### Screen 3: تقرير النتائج
- Heading, review name/date, allowed-file count, integrated textual count strip, requirement list, linked evidence and limitations.
- Exact status labels: `appears_met` = «يبدو مستوفًى» with check; `needs_review` = «يحتاج مراجعة» with warning; `unverifiable` = «لا يمكن التحقق منه» with question mark.
- Never convert these to pass/fail, calculate code quality, or imply task approval. Operational failures remain separate from review findings.
- Laptop: preserve requirement order, initially select the first needs-review item; otherwise first unverifiable; otherwise first requirement. Selected row matches the evidence pane.
- Mobile attention view: needs-review items first, then unverifiable; provide «عرض جميع المتطلبات» including appears-met items. Counts always describe all results. Retain original requirement ids/order in the all-results view.
- Selecting a mobile row switches to «الدليل» and announces its requirement title/status; «رجوع للمتطلبات» preserves list position and selection. The evidence tab must always name the selected requirement.
- Evidence contains requirement title/status, explanation, exact selected filename, line reference when available, and read-only snippet. Do not invent a line reference or evidence for an unknown result.
- Unknown explanation example: «الخادم خارج الملفات المختارة». Advice describes manual checks, not execution or fixes.
- Desktop focus mode expands the evidence pane; «إظهار المتطلبات» or Escape restores the three-pane layout. Empty filters clear the selected evidence rather than showing a stale snippet.
- Persistent report limits: «لم يُشغّل الكود أو الاختبارات» and «لا يضمن الفحص خلو الكود من الأخطاء».
- No findings: «لم تُكتشف ملاحظات ضمن النطاق المحدد»; retain unknown results and limitations. Partial review: label «تقرير جزئي»; never count unreviewed requirements as appears-met.

## 6. Components and interactions
| Component | Default, hover, focus, disabled, loading, error |
|---|---|
| Primary button | Primary/dark ink; hover primary-hover; pressed primary-pressed; focus ring; disabled token pair plus native disabled; busy Arabic label with stable width; errors beside relevant field or status |
| Secondary button/link | Transparent surface, ink and control-border; hover raised surface; same focus ring; disabled unavailable; never blue-filled alongside primary |
| Input/textarea | Surface, ink, control-border, 12px block and 16px inline padding; hover ink border; focus ring; disabled labeled; retain entered text after errors; danger border with specific linked message |
| Panel/file row | Surface, line separators; interactive row hover raised; focus ring; removal 44px; unreadable file has danger text with remove/reselect action; long filenames wrap or reveal full accessible value |
| Requirement row | At least 56px high; icon+full status text; selected background plus warning border for selected concern; focus distinct from selected; no draggable/reorder affordance |
| Tabs | 44px targets, primary underline and selected text weight; keyboard-accessible tablist/panels; no hidden content duplicated for screen readers |
| Code viewer | Read-only, LTR code and line gutter; highlighted evidence line; neutral line numbers; inner horizontal scroll; no editor caret, run/fix/copy action added without design scope |
| Loading/error | Layout-matched skeletons plus stage text; on failure «تعذّر إكمال المراجعة. أعد المحاولة أو عدّل الاختيار»; no automatic success fallback |
- Empty state: «اختر ملفاتك وأضف المتطلبات لبدء المراجعة» with «اختيار الملفات». Unreadable file: «لم نستطع قراءة هذا الملف. أزله أو اختره مجددًا».
- Error summary links to invalid fields; use text and icon as well as danger color. Move focus to the new page heading after navigation and to error summary after invalid submission.

## 7. Arabic and RTL
- `<html lang="ar" dir="rtl">`; logical CSS properties only; flex follows document direction without manual row reversal.
- Arabic labels align to start/right. Filenames in `<bdi dir="ltr">`; code in LTR blocks; user inputs `dir="auto"`.
- Mirror back/forward arrows and chevrons; never mirror logos, checkmarks, clocks or code. Progress follows RTL reading order.
- Locale remains `ar-SA-u-ca-gregory`: Gregorian calendar and Arabic-Indic digits in UI. Code identifiers/line gutters remain unchanged; Arabic line label uses «السطر ١٤».
- Never zero-pad UI counts or use a middle dot next to digits. Zero state is written in words, e.g. «لا توجد ملفات مختارة».
- Do not rewrite a user's literal numeric identifier, filename or code to Arabic-Indic digits.
- Verify keyboard order, zoom, screen-reader names, long Arabic names, English filenames and punctuation mixing.

## 8. Motion and bold place
- Durations: 120ms hover/press, 180ms evidence change, 240ms stage transition. Easing: cubic-bezier(0.2, 0.8, 0.2, 1).
- Stage transitions fade/translate 8px; evidence changes 4px. Hover lift 1px only on fine pointers. No continuous animation, auto-scroll, typewriter text or decorative delay. `prefers-reduced-motion` disables motion.
- Discoverable shortcuts: Ctrl/⌘+Enter advances setup/scope; J/K selects filtered results; F toggles evidence focus; Escape restores context; ? opens help. Ignore letter shortcuts while typing or a dialog is open.
- Bold place: the selected evidence line connected to its amber requirement. The rest of the workbench remains quiet.

## 9. Verification boundary
- Numerical contrast checks apply to specified token pairs only; final font loading, focus, reflow and rendered contrast still require verification.
- Check actual viewport screenshots at 375px and 1280px against the approved preview/spec when browser QA is available. The generated boards are not viewport screenshots.
- JavaScript syntax, event-driven state/interaction checks and token-contrast calculations passed. No live backend analysis, file execution or rendered-browser validation was performed.
- Languages, file limits, real analysis service and retention policies remain product questions; do not silently decide them during frontend styling.
