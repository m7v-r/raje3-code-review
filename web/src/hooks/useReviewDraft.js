import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { createReviewDraftRepository, emptyDraft } from '../lib/reviewDraftRepository';
import { createReviewDraftController } from '../lib/reviewDraftController';

export function useReviewDraft(userId) {
  const controller = useRef(null);
  const [state, setState] = useState({ draft: emptyDraft(), phase: 'loading', status: 'idle', dirty: false, error: '', conflict: false });
  useEffect(() => {
    const current = createReviewDraftController(createReviewDraftRepository(supabase), setState);
    controller.current = current;
    current.load();
    return () => { current.dispose(); controller.current = null; };
  }, [userId]);
  useEffect(() => {
    if (!state.dirty) return;
    const guard = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [state.dirty]);
  return { ...state, update: patch => controller.current?.update(patch), retry: () => controller.current?.retry(), reload: () => controller.current?.load() };
}
