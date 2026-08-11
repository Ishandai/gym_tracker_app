// Keeps in-progress, unsaved form input alive when the user navigates away
// (e.g. switches to History) and comes back — without permanently storing
// abandoned drafts forever. Uses sessionStorage, so it also fully clears
// itself when the app is closed, on top of the explicit expiry below.

const DRAFT_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes of inactivity

export function saveDraft(key, draft) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    // sessionStorage can throw in rare restricted contexts — draft persistence
    // is a convenience, not critical, so fail silently.
  }
}

export function loadDraft(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.savedAt > DRAFT_EXPIRY_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearDraft(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}
