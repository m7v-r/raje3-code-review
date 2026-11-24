import test from 'node:test';
import assert from 'node:assert/strict';
import { createReviewDraftRepository, emptyDraft, validateDraft } from './reviewDraftRepository.js';

const draft = () => ({ name: 'مراجعة', requirements: 'رفض القيم الفارغة\nقبول بريد صالح', files: [{ name: 'login.js', demo: false }] });

test('accepts incomplete drafts and counts Unicode characters consistently', () => {
  assert.equal(validateDraft(emptyDraft()), null);
  assert.equal(validateDraft({ ...draft(), name: '🧪'.repeat(120) }), null);
  assert.match(validateDraft({ ...draft(), name: '🧪'.repeat(121) }), /اسم/);
});

test('rejects limits, duplicate filenames and source-file content', () => {
  assert.ok(validateDraft({ ...draft(), requirements: 'x'.repeat(20001) }));
  assert.ok(validateDraft({ ...draft(), requirements: Array(101).fill('x').join('\n') }));
  assert.ok(validateDraft({ ...draft(), requirements: 'x'.repeat(1001) }));
  assert.ok(validateDraft({ ...draft(), files: Array.from({ length: 21 }, (_, i) => ({ name: `${i}.js`, demo: false })) }));
  assert.ok(validateDraft({ ...draft(), files: [draft().files[0], draft().files[0]] }));
  assert.ok(validateDraft({ ...draft(), files: [{ name: 'a.js', demo: false, content: 'secret' }] }));
  assert.ok(validateDraft({ ...draft(), files: [{ name: '', demo: false }] }));
});

test('RPC boundary preserves UI shape and never sends owner ids or file contents', async () => {
  const calls = [];
  const client = { rpc: async (name, args) => { calls.push({ name, args }); return { data: { draft: null }, error: null }; } };
  const repo = createReviewDraftRepository(client);
  await repo.load(); await repo.save(draft(), 4); await repo.clear(5);
  assert.deepEqual(calls, [
    { name: 'get_review_draft', args: {} },
    { name: 'save_review_draft', args: { p_name: draft().name, p_requirements: draft().requirements, p_files: draft().files, p_expected_revision: 4 } },
    { name: 'delete_review_draft', args: { p_expected_revision: 5 } },
  ]);
});

test('configuration, validation and backend failures remain failures', async () => {
  await assert.rejects(createReviewDraftRepository(null).load(), { code: 'CONFIG' });
  let called = false;
  const repo = createReviewDraftRepository({ rpc() { called = true; return Promise.resolve({ error: { code: 'PT409' } }); } });
  await assert.rejects(repo.save({ ...draft(), name: 'a'.repeat(121) }, null), { code: 'VALIDATION' });
  assert.equal(called, false);
  await assert.rejects(repo.save(draft(), 1), { code: 'PT409' });
});
