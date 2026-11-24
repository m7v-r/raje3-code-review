export const emptyDraft = () => ({ name: '', requirements: '', files: [] });
export const copyDraft = draft => ({ name: draft.name, requirements: draft.requirements, files: draft.files.map(file => ({ name: file.name, demo: file.demo })) });

// This is a UX check. The migration enforces the same limits on the server.
export function validateDraft(draft) {
  if (!draft || typeof draft.name !== 'string' || typeof draft.requirements !== 'string' || !Array.isArray(draft.files)) return 'بيانات المسودة غير صالحة.';
  const length = text => [...text].length;
  if (length(draft.name) > 120) return 'اختصر اسم المراجعة إلى مئة وعشرين حرفًا أو أقل.';
  if (length(draft.requirements) > 20000) return 'نص المتطلبات طويل جدًا. الحد عشرون ألف حرف.';
  const lines = draft.requirements.split(/\r\n|\r|\n/).filter(line => line.trim());
  if (lines.length > 100 || lines.some(line => length(line) > 1000)) return 'الحد مئة متطلب، وألف حرف لكل متطلب.';
  if (draft.files.length > 20) return 'اختر عشرين ملفًا أو أقل.';
  const names = new Set();
  for (const file of draft.files) {
    if (!file || typeof file.name !== 'string' || !file.name.trim() || length(file.name) > 255 || typeof file.demo !== 'boolean'
      || Object.keys(file).some(key => !['name', 'demo'].includes(key))) return 'تحقق من أسماء الملفات؛ الحد مئتان وخمسة وخمسون حرفًا للاسم.';
    if (names.has(file.name)) return 'توجد ملفات تحمل الاسم نفسه. اختر أسماء مختلفة حتى يكون النطاق واضحًا.';
    names.add(file.name);
  }
  return null;
}

export function createReviewDraftRepository(client) {
  async function rpc(name, args, signal) {
    if (!client) throw Object.assign(new Error('Supabase is not configured'), { code: 'CONFIG' });
    let request = client.rpc(name, args);
    if (signal) request = request.abortSignal(signal);
    const { data, error } = await request;
    if (error) throw error;
    return data;
  }
  return {
    load: signal => rpc('get_review_draft', {}, signal),
    save(draft, revision, signal) {
      const error = validateDraft(draft);
      if (error) return Promise.reject(Object.assign(new Error('Invalid draft'), { code: 'VALIDATION', userMessage: error }));
      return rpc('save_review_draft', { p_name: draft.name, p_requirements: draft.requirements, p_files: copyDraft(draft).files, p_expected_revision: revision }, signal);
    },
    clear: (revision, signal) => rpc('delete_review_draft', { p_expected_revision: revision }, signal),
  };
}
