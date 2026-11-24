// UX feedback only. Supabase Auth validates credentials and password policy on the server.
export function validateCredentials(email, password, signingUp = false) {
  if (!email.trim()) return 'أدخل بريدك الإلكتروني.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'أدخل بريدًا إلكترونيًا صحيحًا.';
  if (!password) return 'أدخل كلمة المرور.';
  if (signingUp && [...password].length < 8) return 'اختر كلمة مرور لا تقل عن ثمانية أحرف.';
  return '';
}
