# راجع — حفظ مسودة المراجعة في المتصفح

## البرومت المعدّل لـCodex

```text
Work on the main Raje3 Vite + React application in web/.
Read the repository instructions, PRD.md and DESIGN.md first.
Keep the approved Code Lab design, Arabic RTL layout and current review data shape.
Persist the Start Review draft: { name, requirements, files: [{ name, demo }] }.
Use localStorage only behind web/src/lib/reviewDraftStorage.js, exposing load/save/clear,
so future storage can be changed at one boundary.
Restore the saved draft before rendering defaults, save user edits immediately,
and handle corrupt, incompatible, unavailable or full storage without crashing.
Store filenames only, never File objects or source contents. Add no backend or API.
Do not present canned demo results as analysis of a changed draft.
Verify the behavior with tests and in the browser: edit the name/requirements,
add or remove a selected file, reload, and confirm that the changes remain.
Report the exact manual test steps and any verification limits.
```

## ما يُحفظ

وحدة التخزين الوحيدة: [`src/lib/reviewDraftStorage.js`](src/lib/reviewDraftStorage.js).

مفتاح المتصفح: `raje3.review-draft.v1`، مع غلاف داخلي يحمل إصدار المخطط. الواجهة تستقبل نفس البيانات:

```js
{
  name: 'اسم المراجعة',
  requirements: 'متطلب في كل سطر',
  files: [{ name: 'login.js', demo: false }]
}
```

- الاستعادة تسبق ظهور القيم الافتراضية؛ المسودة الفارغة عمدًا لا تُستبدل بالمثال.
- الحفظ يحدث عند تعديل الاسم أو المتطلبات أو قائمة الملفات، دون انتظار زر إرسال أو مؤقت.
- لا تُحفظ محتويات الكود أو كائنات File أو صلاحيات قراءة الملفات. المحفوظ أسماء الملفات فقط.
- البيانات خاصة بهذا المتصفح وهذا العنوان/المنفذ؛ ليست مزامنة بين الأجهزة.
- «تجربة المثال» فعل صريح يستبدل المسودة الحالية بالمثال الجاهز ويحفظه.
- عند منع التخزين أو امتلائه، تبقى الواجهة قابلة للاستخدام وتظهر رسالة في موضع التحقق الحالي.

## اختبار يدوي من المشروع

من جذر المستودع بعد الحصول على آخر نسخة:

```sh
cd web
npm ci
npm run dev
```

1. افتح العنوان الذي يطبعه Vite، واستخدم العنوان والمنفذ نفسيهما بعد التحديث.
2. غيّر اسم المراجعة إلى «اختبار الحفظ».
3. أضف متطلبًا جديدًا إلى مربع المتطلبات.
4. احذف أحد ملفات المثال، أو اختر ملفًا من جهازك لإظهار اسمه.
5. أعد تحميل الصفحة. يجب أن يبقى الاسم والمتطلب الجديد وقائمة الملفات المعدّلة.
6. أغلق الصفحة وأعد فتح العنوان نفسه؛ يجب أن تُستعاد المسودة.
7. جرّب مسودة فارغة: أفرغ الاسم والمتطلبات وأزل الملفات، ثم أعد التحميل. يجب ألا يعود المثال تلقائيًا.
8. اضغط «تجربة المثال» لاستعادة المثال متى أردت. تظل نتائج التقرير توضيحية؛ تغيير مدخلاتك لا يشغّل تحليلًا حقيقيًا.

الاختبارات الآلية والبناء:

```sh
npm test
npm run build
```

## التحقق المنجز

- نجحت اختبارات وحدة التخزين: الاستعادة، والتعديلات، والمسودة الفارغة، والمخطط التالف/المختلف، ومنع التخزين، والامتلاء، واستبعاد المحتوى، وحماية مفاتيح التطبيقات الأخرى.
- نجح بناء الإنتاج باستخدام React وVite الموجودين في المشروع.
- اختُبر المتصفح فعلًا: تعديل الاسم والمتطلبات وحذف ملف، ثم إعادة التحميل وبقاء القيم.
- اختُبرت الرحلة إلى التقرير، وحماية المدخلات المخصصة من نتائج المثال، والتصفية الفارغة، والدليل غير القابل للتحقق، ووضع التركيز، وتبويبات الجوال.
- اختُبرت عروض ٣٢٠ و٣٧٥ و١٢٨٠ دون تجاوز عرض الصفحة، ولم تظهر أخطاء Console.
- أدلة الصور وسجل الفحص في [`../design/shots/`](../design/shots/).

لا يوجد Backend أو تحليل فعلي للكود في هذه المهمة. نقل الواجهة المعتمدة إلى `web/` لا يغير هذا الحد.

## تحديث المرحلة التالية: حسابات Supabase

الحفظ المحلي الموصوف أعلاه يمثل التنفيذ السابق. بعد اعتماد مرحلة Supabase أصبحت رحلة الحساب
تستخدم `reviewDraftRepository.js` و`useReviewDraft` للحفظ السحابي. بقيت الوحدة المحلية واختباراتها
دون حذف بيانات المتصفح القديمة؛ لا تُرفع هذه البيانات تلقائيًا إلى أي حساب. راجع `SUPABASE_SETUP.md`
للإعداد الحالي. الانتظار حتى تأكيد الحفظ مطلوب قبل إعادة التحميل لأن الحفظ الشبكي غير متزامن.
