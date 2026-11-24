import { copyDraft, emptyDraft, validateDraft } from './reviewDraftRepository.js';
import { arabicError } from './serviceErrors.js';

// One account / one mounted workbench. No localStorage cache or offline replay.
export function createReviewDraftController(repository, onChange) {
  const abort = new AbortController();
  let live = true;
  let loaded = false;
  let paused = false;
  let version = 0;
  let worker = null;
  let state = { draft: emptyDraft(), revision: null, phase: 'loading', status: 'idle', dirty: false, error: '', conflict: false };
  function publish(patch) {
    state = { ...state, ...patch };
    if (live) onChange(state);
  }
  async function load() {
    if (!live || worker) return;
    loaded = false;
    publish({ phase: 'loading', error: '' });
    try {
      const result = await repository.load(abort.signal);
      if (!live) return;
      if (!result || (result.draft !== null && (validateDraft(result.draft) || !Number.isSafeInteger(result.revision) || result.revision < 1))) throw new Error('Invalid draft response');
      loaded = true; paused = false; version = 0;
      publish({ draft: result.draft ? copyDraft(result.draft) : emptyDraft(), revision: result.draft ? result.revision : null,
        phase: 'ready', status: 'idle', dirty: false, error: '', conflict: false });
    } catch (error) {
      if (live) publish({ phase: 'load-error', error: arabicError(error) });
    }
  }
  async function saveLoop() {
    while (live && loaded && state.dirty && !paused) {
      const snapshot = copyDraft(state.draft);
      const savingVersion = version;
      const invalid = validateDraft(snapshot);
      if (invalid) { publish({ status: 'error', error: invalid }); return; }
      publish({ status: 'saving', error: '' });
      try {
        const result = await repository.save(snapshot, state.revision, abort.signal);
        if (!live) return;
        if (!result || !Number.isSafeInteger(result.revision) || result.revision < 1) throw new Error('Invalid save response');
        publish({ revision: result.revision, dirty: version !== savingVersion, status: version === savingVersion ? 'saved' : 'saving' });
      } catch (error) {
        if (!live) return;
        paused = true;
        publish({ status: 'error', error: arabicError(error), conflict: ['PT409', '23505', 'CONFLICT'].includes(error.code) });
      }
    }
  }
  function pump() {
    if (!worker && loaded && live && !paused && state.dirty) worker = saveLoop().finally(() => { worker = null; });
    return worker;
  }
  return {
    load,
    getState: () => state,
    update(patch) {
      if (!live || !loaded) return;
      version += 1;
      publish({ draft: copyDraft({ ...state.draft, ...patch }), dirty: true, status: paused ? 'error' : 'saving' });
      pump();
    },
    retry() {
      if (state.conflict) return;
      paused = false;
      return pump();
    },
    dispose() { live = false; loaded = false; abort.abort(); },
  };
}
