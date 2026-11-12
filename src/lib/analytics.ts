type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

export const CONSENT_KEY = 'em_cookie_consent';

export function getConsent(): 'granted' | 'denied' | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

export function setConsent(value: 'granted' | 'denied') {
  try { localStorage.setItem(CONSENT_KEY, value); } catch { /* ignoré */ }
  window.gtag?.('consent', 'update', { analytics_storage: value });
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  try { window.gtag?.('event', name, params); } catch { /* ne doit jamais casser le site */ }
}
