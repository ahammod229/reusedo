// Text-only autosave for the post form, so a dropped connection or a closed tab doesn't lose the write-up.
// Photos are not stored (too large for localStorage); the person re-adds them.
const KEY = "reusedo-post-draft";

export interface SavedDraft<T> {
  kind: "offer" | "need";
  form: T;
  savedAt: number;
}

export function loadDraft<T>(): SavedDraft<T> | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedDraft<T>) : null;
  } catch {
    return null;
  }
}

export function saveDraft<T>(d: SavedDraft<T>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* storage full or blocked — autosave is a convenience */
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
