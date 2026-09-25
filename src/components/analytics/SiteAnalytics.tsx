import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type TrafficSource = 'direct' | 'google' | 'ai' | 'social' | 'other';

type Attribution = {
  source: TrafficSource;
  detail: string;
};

const AI_SOURCES = ['chatgpt', 'openai', 'perplexity', 'claude', 'anthropic', 'gemini', 'copilot', 'mistral', 'you.com'];
const SOCIAL_SOURCES = ['facebook', 'instagram', 'tiktok', 'linkedin', 'pinterest', 'youtube', 'twitter', 'x.com', 'snapchat'];
const SEARCH_SOURCES = ['google', 'bing', 'yahoo', 'duckduckgo', 'qwant', 'ecosia'];
let lastTrackedPage = '';

function anonymousId(storage: Storage, key: string): string {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const value = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  storage.setItem(key, value);
  return value;
}

function classifySource(): Attribution {
  const params = new URLSearchParams(window.location.search);
  const campaignSource = (params.get('utm_source') || '').toLowerCase();
  const referrer = document.referrer;

  let referrerHost = '';
  try {
    referrerHost = referrer ? new URL(referrer).hostname.toLowerCase() : '';
  } catch {
    referrerHost = '';
  }

  const value = campaignSource || referrerHost;
  if (!value || referrerHost === window.location.hostname) return { source: 'direct', detail: 'Accès direct' };
  if (AI_SOURCES.some(source => value.includes(source))) return { source: 'ai', detail: campaignSource || referrerHost };
  if (SOCIAL_SOURCES.some(source => value.includes(source))) return { source: 'social', detail: campaignSource || referrerHost };
  if (SEARCH_SOURCES.some(source => value.includes(source))) return { source: 'google', detail: campaignSource || referrerHost };
  return { source: 'other', detail: campaignSource || referrerHost || 'Autre' };
}

function getAttribution(): Attribution {
  const stored = sessionStorage.getItem('em_attribution');
  if (stored) {
    try { return JSON.parse(stored) as Attribution; } catch { /* Nouvelle attribution ci-dessous. */ }
  }
  const attribution = classifySource();
  sessionStorage.setItem('em_attribution', JSON.stringify(attribution));
  return attribution;
}

function track(eventName: 'page_view' | 'click', pagePath: string, targetPath?: string) {
  const attribution = getAttribution();
  void supabase.from('analytics_events').insert({
    event_name: eventName,
    visitor_id: anonymousId(localStorage, 'em_visitor_id'),
    session_id: anonymousId(sessionStorage, 'em_session_id'),
    page_path: pagePath,
    target_path: targetPath || null,
    source: attribution.source,
    source_detail: attribution.detail,
  });
}

function clickTarget(element: HTMLElement): string {
  if (element instanceof HTMLAnchorElement) {
    try {
      const url = new URL(element.href, window.location.origin);
      return url.origin === window.location.origin ? url.pathname : url.hostname;
    } catch {
      return element.getAttribute('href') || 'Lien';
    }
  }
  return (element.getAttribute('aria-label') || element.getAttribute('title') || element.textContent || 'Bouton')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 100);
}

export default function SiteAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return;

    const pagePath = location.pathname;
    const deduplicationKey = `${pagePath}:${location.search}`;
    if (lastTrackedPage !== deduplicationKey) {
      lastTrackedPage = deduplicationKey;
      track('page_view', pagePath);
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (window.location.pathname.startsWith('/admin')) return;
      const origin = event.target;
      if (!(origin instanceof Element)) return;
      const interactiveElement = origin.closest<HTMLElement>('a, button');
      if (!interactiveElement || interactiveElement.hasAttribute('data-no-analytics')) return;
      track('click', window.location.pathname, clickTarget(interactiveElement));
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  return null;
}
