// Only this module knows where the review draft is stored.
// A future repository can keep the same load/save/clear boundary.
export const REVIEW_DRAFT_KEY = 'raje3.review-draft.v1';
const VERSION = 1;

function browserStorage() {
  return typeof window === 'undefined' ? null : window.localStorage;
}

function isDraft(value) {
  return value !== null && typeof value === 'object'
    && typeof value.name === 'string'
    && typeof value.requirements === 'string'
    && Array.isArray(value.files)
    && value.files.every(file => file !== null && typeof file === 'object'
      && typeof file.name === 'string' && file.name.length > 0
      && typeof file.demo === 'boolean');
}

function copyDraft(value) {
  return {
    name: value.name,
    requirements: value.requirements,
    files: value.files.map(file => ({ name: file.name, demo: file.demo })),
  };
}

export function createReviewDraftStorage(getStorage = browserStorage) {
  return {
    load() {
      try {
        const storage = getStorage();
        const raw = storage?.getItem(REVIEW_DRAFT_KEY);
        if (!raw) return null;
        const saved = JSON.parse(raw);
        return saved?.version === VERSION && isDraft(saved.draft)
          ? copyDraft(saved.draft) : null;
      } catch {
        return null;
      }
    },
    save(draft) {
      if (!isDraft(draft)) return false;
      try {
        const storage = getStorage();
        if (!storage) return false;
        storage.setItem(REVIEW_DRAFT_KEY, JSON.stringify({
          version: VERSION,
          draft: copyDraft(draft),
        }));
        return true;
      } catch {
        return false;
      }
    },
    clear() {
      try {
        const storage = getStorage();
        if (!storage) return false;
        storage.removeItem(REVIEW_DRAFT_KEY);
        return true;
      } catch {
        return false;
      }
    },
  };
}

export const reviewDraftStorage = createReviewDraftStorage();
