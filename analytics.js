(() => {
  'use strict';

  const EXCLUDE_KEY = 'black_lantern_analytics_excluded';
  const VISITOR_KEY = 'black_lantern_visitor_id';
  const BOT_PATTERN = /bot|crawler|spider|slurp|preview|facebookexternalhit|twitterbot|linkedinbot|discordbot|whatsapp|telegrambot|pinterest|headless|lighthouse|pagespeed/i;

  function setExcluded(value) {
    try {
      if (value) localStorage.setItem(EXCLUDE_KEY, '1');
      else localStorage.removeItem(EXCLUDE_KEY);
      return true;
    } catch {
      return false;
    }
  }

  function isExcluded() {
    try {
      return localStorage.getItem(EXCLUDE_KEY) === '1';
    } catch {
      return false;
    }
  }

  const params = new URLSearchParams(location.search);
  if (params.get('author_preview') === '1') {
    setExcluded(true);
    params.delete('author_preview');
    const query = params.toString();
    history.replaceState({}, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
  } else if (params.get('author_preview') === '0') {
    setExcluded(false);
    params.delete('author_preview');
    const query = params.toString();
    history.replaceState({}, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
  }

  window.BlackLanternAnalytics = {
    excludeThisBrowser() {
      setExcluded(true);
      return true;
    },
    includeThisBrowser() {
      setExcluded(false);
      return true;
    },
    isExcluded
  };

  if (isExcluded() || navigator.doNotTrack === '1' || BOT_PATTERN.test(navigator.userAgent)) return;

  function visitorId() {
    try {
      let id = localStorage.getItem(VISITOR_KEY);
      if (!id) {
        id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem(VISITOR_KEY, id);
      }
      return id;
    } catch {
      return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
  }

  const id = visitorId();

  function transmit(endpoint, payload) {
    const body = JSON.stringify(payload);
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        if (navigator.sendBeacon(endpoint, blob)) return;
      }
    } catch {
      // Fall through to fetch.
    }
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      credentials: 'same-origin'
    }).catch(() => {});
  }

  function send(event, details = {}) {
    transmit('/api/visit/', {
      event,
      visitorId: id,
      path: `${location.pathname}${location.search}`.slice(0, 500),
      title: document.title.slice(0, 200),
      referrer: document.referrer.slice(0, 500),
      ...details
    });
  }

  const recordPageView = () => send('pageview');
  if (document.readyState === 'complete') recordPageView();
  else window.addEventListener('load', recordPageView, { once: true });

  document.addEventListener('click', event => {
    const anchor = event.target.closest?.('a[href]');
    if (!anchor) return;

    const raw = anchor.getAttribute('href') || '';
    const label = (anchor.dataset.trackLabel || anchor.textContent || 'Outbound link').replace(/\s+/g, ' ').trim().slice(0, 180);
    let kind = '';
    let target = raw;

    if (raw.startsWith('mailto:')) kind = 'email';
    else if (raw.endsWith('.pdf') || anchor.hasAttribute('download')) kind = 'download';
    else {
      try {
        const url = new URL(anchor.href, location.href);
        if (url.origin !== location.origin) {
          target = url.href;
          if (/amazon\./i.test(url.hostname)) kind = 'amazon';
          else if (/goodreads\./i.test(url.hostname)) kind = 'goodreads';
          else if (/bookbub\./i.test(url.hostname)) kind = 'bookbub';
          else if (/facebook\./i.test(url.hostname)) kind = 'facebook';
          else kind = 'outbound';
        }
      } catch {
        return;
      }
    }

    if (!kind) return;

    const pagePath = `${location.pathname}${location.search}`.slice(0, 500);
    send('reader_action', { kind, target: String(target).slice(0, 700) });
    transmit('/api/outbound-click/', {
      visitorId: id,
      url: String(target).slice(0, 700),
      label,
      pagePath
    });
  }, { capture: true });
})();
