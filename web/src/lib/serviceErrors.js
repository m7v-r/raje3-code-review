export function arabicError(error, context = 'data') {
  const code = error?.code;
  if (code === 'CONFIG') return 'يلزم إكمال إعداد الاتصال قبل استخدام الحساب والحفظ.';
  if (code === 'PT409' || code === '23505' || code === 'CONFLICT') return 'توجد نسخة أحدث من المسودة. حمّل النسخة المحفوظة قبل المتابعة؛ سيستبدل ذلك المدخلات الحالية.';
  if (['PGRST202', '42P01', '42883'].includes(code)) return 'حفظ المسودة غير جاهز بعد. يلزم تطبيق ملف إعداد قاعدة البيانات.';
  if (['PT400', '23514', '22023', 'VALIDATION'].includes(code)) return error.userMessage || 'تعذّر الحفظ. تحقق من طول النصوص وعدد الملفات وأسمائها.';
  if (['PT401', 'PGRST301', 'PGRST303', 'session_not_found', 'refresh_token_not_found', 'refresh_token_already_used'].includes(code)) return 'انتهت الجلسة. سجّل الدخول مجددًا للمتابعة.';
  if (['42501', 'PT403'].includes(code)) return 'لا تملك صلاحية تنفيذ هذه العملية.';
  if (code === 'email_not_confirmed') return 'أكد بريدك من الرسالة التي وصلتك، ثم سجّل الدخول.';
  if (code === 'invalid_credentials' || code === 'user_not_found') return 'البريد أو كلمة المرور غير صحيحة.';
  if (code === 'weak_password') return 'اختر كلمة مرور أقوى، لا تقل عن ثمانية أحرف.';
  if (['email_address_invalid', 'validation_failed'].includes(code)) return 'تحقق من البريد وكلمة المرور ثم أعد المحاولة.';
  if (['user_already_exists', 'email_exists'].includes(code)) return 'تعذّر إنشاء الحساب. جرّب تسجيل الدخول أو استخدم بريدًا آخر.';
  if (['signup_disabled', 'email_provider_disabled'].includes(code)) return 'إنشاء الحساب بالبريد غير متاح حاليًا.';
  if (error?.status === 429 || ['over_request_rate_limit', 'over_email_send_rate_limit'].includes(code)) return 'طلبات كثيرة خلال وقت قصير. انتظر قليلًا ثم حاول مجددًا.';
  if (error?.name === 'AuthRetryableFetchError' || error instanceof TypeError || error?.status === 0) return 'تعذّر الاتصال. تحقق من الإنترنت وحاول مجددًا.';
  return context === 'auth' ? 'تعذّر إكمال العملية. حاول مجددًا.' : 'تعذّر حفظ أو تحميل المسودة. مدخلاتك الحالية باقية في الصفحة؛ حاول مجددًا.';
}
