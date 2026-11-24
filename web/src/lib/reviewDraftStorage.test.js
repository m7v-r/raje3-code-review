import test from 'node:test';
import assert from 'node:assert/strict';
import { createReviewDraftStorage, REVIEW_DRAFT_KEY } from './reviewDraftStorage.js';

function memoryStorage() {
  const values = new Map();
  return {
    values,
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
}

const draft = {
  name: 'مراجعة التسجيل',
  requirements: 'قبول بريد صالح\nرفض الحقول الفارغة',
  files: [{ name: 'login.js', demo: false }],
};

test('a fresh adapter restores edits after a simulated page reload', () => {
  const browser = memoryStorage();
  const firstPage = createReviewDraftStorage(() => browser);
  assert.equal(firstPage.load(), null);
  assert.equal(firstPage.save(draft), true);
  const reloadedPage = createReviewDraftStorage(() => browser);
  assert.deepEqual(reloadedPage.load(), draft);
  assert.equal(reloadedPage.save({ ...draft, name: 'اسم معدّل' }), true);
  assert.equal(createReviewDraftStorage(() => browser).load().name, 'اسم معدّل');
});

test('an intentionally empty draft survives reload instead of becoming sample data', () => {
  const browser = memoryStorage();
  const storage = createReviewDraftStorage(() => browser);
  const empty = { name: '', requirements: '', files: [] };
  assert.equal(storage.save(empty), true);
  assert.deepEqual(createReviewDraftStorage(() => browser).load(), empty);
});

test('corrupt data, incompatible versions and invalid shapes return no draft', () => {
  const browser = memoryStorage();
  const storage = createReviewDraftStorage(() => browser);
  for (const value of ['{bad json', 'null', JSON.stringify({ version: 2, draft }),
    JSON.stringify({ version: 1, draft: { ...draft, files: [{}] } }),
    JSON.stringify({ version: 1, draft: { ...draft, requirements: [] } })]) {
    browser.setItem(REVIEW_DRAFT_KEY, value);
    assert.equal(storage.load(), null);
  }
  assert.equal(storage.save({ ...draft, files: [{ name: '', demo: false }] }), false);
});

test('blocked storage and quota errors never throw into the screen', () => {
  const blocked = createReviewDraftStorage(() => { throw new Error('SecurityError'); });
  assert.equal(blocked.load(), null);
  assert.equal(blocked.save(draft), false);
  assert.equal(blocked.clear(), false);
  const full = createReviewDraftStorage(() => ({ setItem() { throw new Error('QuotaExceededError'); } }));
  assert.equal(full.save(draft), false);
  assert.equal(createReviewDraftStorage(() => null).save(draft), false);
});

test('only the draft fields are stored; source contents and File objects are excluded', () => {
  const browser = memoryStorage();
  const storage = createReviewDraftStorage(() => browser);
  storage.save({ ...draft, sourceCode: 'private content', files: [{ name: 'login.js', demo: false, contents: 'secret' }] });
  const raw = browser.getItem(REVIEW_DRAFT_KEY);
  assert.ok(!raw.includes('private content'));
  assert.ok(!raw.includes('secret'));
  assert.deepEqual(storage.load(), draft);
  const restored = storage.load();
  restored.files[0].name = 'changed-in-memory.js';
  assert.equal(storage.load().files[0].name, 'login.js');
});

test('clearing a draft preserves unrelated browser data', () => {
  const browser = memoryStorage();
  browser.setItem('another-app', 'keep');
  const storage = createReviewDraftStorage(() => browser);
  storage.save(draft);
  assert.equal(storage.clear(), true);
  assert.equal(storage.load(), null);
  assert.equal(browser.getItem('another-app'), 'keep');
});
