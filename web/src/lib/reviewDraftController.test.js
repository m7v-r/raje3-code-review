import test from 'node:test';
import assert from 'node:assert/strict';
import { createReviewDraftController } from './reviewDraftController.js';

const draft = name => ({ name, requirements: '', files: [] });
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const tick = () => new Promise(resolve => setImmediate(resolve));

test('loads first, never autosaves defaults, and starts empty for a new account', async () => {
  const read = deferred(); let writes = 0;
  const controller = createReviewDraftController({ load: () => read.promise, save: () => { writes++; } }, () => {});
  const loading = controller.load();
  controller.update({ name: 'too early' });
  read.resolve({ draft: null }); await loading;
  assert.deepEqual(controller.getState().draft, draft(''));
  assert.equal(writes, 0);
});

test('serializes rapid edits and uses the latest revision without replacing new input', async () => {
  const first = deferred(); const second = deferred(); const calls = [];
  const controller = createReviewDraftController({
    load: async () => ({ draft: draft('old'), revision: 7 }),
    save: (value, revision) => { calls.push({ value, revision }); return calls.length === 1 ? first.promise : second.promise; },
  }, () => {});
  await controller.load(); controller.update({ name: 'a' }); controller.update({ name: 'ab' }); controller.update({ name: 'abc' });
  assert.equal(calls.length, 1);
  first.resolve({ revision: 8 }); await tick();
  assert.equal(calls.length, 2); assert.equal(calls[1].value.name, 'abc'); assert.equal(calls[1].revision, 8);
  second.resolve({ revision: 9 }); await tick();
  assert.equal(controller.getState().draft.name, 'abc'); assert.equal(controller.getState().dirty, false);
  assert.equal(controller.getState().revision, 9);
});

test('a failed load blocks writes instead of creating a demo or overwriting cloud data', async () => {
  let writes = 0;
  const controller = createReviewDraftController({ load: async () => { throw { code: 'PGRST202' }; }, save() { writes++; } }, () => {});
  await controller.load(); controller.update({ name: 'overwrite' });
  assert.equal(controller.getState().phase, 'load-error'); assert.equal(writes, 0);
});

test('failed save keeps input; explicit retry saves the latest input', async () => {
  let attempts = 0; let saved;
  const controller = createReviewDraftController({ load: async () => ({ draft: null }), save: async value => {
    attempts++; if (attempts === 1) throw new TypeError('offline'); saved = value; return { revision: 1 };
  } }, () => {});
  await controller.load(); controller.update({ name: 'first' }); await tick();
  assert.equal(controller.getState().dirty, true); assert.equal(controller.getState().status, 'error');
  controller.update({ name: 'latest' }); assert.equal(attempts, 1);
  await controller.retry(); assert.equal(saved.name, 'latest'); assert.equal(controller.getState().dirty, false);
});

test('conflicts never auto-overwrite and reload is an explicit discard', async () => {
  let reads = 0; let writes = 0;
  const controller = createReviewDraftController({ load: async () => ({ draft: draft(++reads === 1 ? 'old' : 'other tab'), revision: reads }),
    save: async () => { writes++; throw { code: 'PT409' }; } }, () => {});
  await controller.load(); controller.update({ name: 'mine' }); await tick();
  await controller.retry(); assert.equal(writes, 1); assert.equal(controller.getState().draft.name, 'mine');
  assert.equal(controller.getState().conflict, true);
  await controller.load(); assert.equal(controller.getState().draft.name, 'other tab'); assert.equal(controller.getState().dirty, false);
});

test('old account requests are aborted and cannot publish into the next account', async () => {
  const read = deferred(); const seen = []; let signal;
  const controller = createReviewDraftController({ load: arg => { signal = arg; return read.promise; } }, state => seen.push(state));
  const loading = controller.load(); controller.dispose(); const count = seen.length;
  read.resolve({ draft: draft('private A'), revision: 1 }); await loading;
  assert.equal(signal.aborted, true); assert.equal(seen.length, count);
});

test('invalid drafts do not hit the backend, and can be corrected', async () => {
  let writes = 0;
  const controller = createReviewDraftController({ load: async () => ({ draft: null }), save: async () => { writes++; return { revision: 1 }; } }, () => {});
  await controller.load(); controller.update({ name: 'x'.repeat(121) }); await tick();
  assert.equal(writes, 0); assert.equal(controller.getState().status, 'error');
  controller.update({ name: 'valid' }); await tick(); assert.equal(writes, 1); assert.equal(controller.getState().dirty, false);
});
