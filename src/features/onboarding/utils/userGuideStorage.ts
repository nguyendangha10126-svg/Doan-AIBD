export function getGuideNeverShowKey(userId?: string | null): string {
  return `drawtostory_guide_never_${userId || 'guest'}`;
}

export function getGuideSessionSeenKey(userId?: string | null): string {
  return `drawtostory_guide_seen_session_${userId || 'guest'}`;
}

export function shouldAutoOpenUserGuide(userId?: string | null): boolean {
  if (typeof window === 'undefined' || !userId) return false;
  const neverShow = window.localStorage.getItem(getGuideNeverShowKey(userId)) === 'true';
  if (neverShow) return false;
  const seenThisSession = window.sessionStorage.getItem(getGuideSessionSeenKey(userId)) === 'true';
  return !seenThisSession;
}

export function markUserGuideSeenForSession(userId?: string | null): void {
  if (typeof window === 'undefined' || !userId) return;
  window.sessionStorage.setItem(getGuideSessionSeenKey(userId), 'true');
}

export function clearUserGuideForUser(userId?: string | null): void {
  if (typeof window === 'undefined' || !userId) return;
  window.localStorage.removeItem(getGuideNeverShowKey(userId));
  window.sessionStorage.removeItem(getGuideSessionSeenKey(userId));
}

// Clear session-seen markers on logout so logging back in shows the guide again (unless "Never show again" was chosen)
if (typeof window !== 'undefined') {
  window.addEventListener('drawtostory:logged-out', () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const k = window.sessionStorage.key(i);
        if (k && k.startsWith('drawtostory_guide_seen_session_')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
    } catch {
      // ignore storage errors
    }
  });
}
