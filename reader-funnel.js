(() => {
  'use strict';

  const BOOK_PATHS = new Set([
    '/books/the-manor-that-drank-the-road/',
    '/books/the-manor-that-drank-the-road/index.html'
  ]);
  if (!BOOK_PATHS.has(location.pathname)) return;

  const BOT_PATTERN = /bot|crawler|spider|slurp|preview|facebookexternalhit|twitterbot|linkedinbot|discordbot|whatsapp|telegrambot|pinterestbot|headless|lighthouse|pagespeed/i;
  const BOOK_TITLE = 'The Manor That Drank the Road';
  const CHAPTER_TITLE = 'Chapter One — Road Without Return';
  const EXCLUDE_KEY = 'black_lantern_analytics_excluded';

  function excluded() {
    try {
      if (window.BlackLanternAnalytics?.isExcluded?.()) return true;
      return localStorage.getItem(EXCLUDE_KEY) === '1';
    } catch {
      return Boolean(window.BlackLanternAnalytics?.isExcluded?.());
    }
  }

  function analyticsAllowed() {
    return !excluded() && navigator.doNotTrack !== '1' && !BOT_PATTERN.test(navigator.userAgent || '');
  }

  function gaEvent(name, params = {}) {
    if (!analyticsAllowed()) return;
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', name, {
          book_title: BOOK_TITLE,
          page_path: location.pathname,
          ...params
        });
      }
    } catch {}
  }

  function visitorId() {
    try {
      return window.BlackLanternAnalytics?.getVisitorId?.() || localStorage.getItem('black_lantern_visitor_id') || '';
    } catch {
      return '';
    }
  }

  function sendReaderAction(kind, target) {
    if (!analyticsAllowed()) return;
    const id = visitorId();
    if (!id) return;
    const body = JSON.stringify({
      event: 'reader_action',
      visitorId: id,
      path: `${location.pathname}${location.search}`.slice(0, 500),
      title: document.title.slice(0, 200),
      referrer: document.referrer.slice(0, 500),
      kind,
      target: String(target || CHAPTER_TITLE).slice(0, 700)
    });
    fetch('/api/visit', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body,
      keepalive: true,
      credentials: 'same-origin'
    }).catch(() => {
      try {
        if (navigator.sendBeacon) navigator.sendBeacon('/api/visit', new Blob([body], {type:'application/json'}));
      } catch {}
    });
  }

  function runOncePerSession(key, fn) {
    try {
      if (sessionStorage.getItem(key) === '1') return false;
      sessionStorage.setItem(key, '1');
    } catch {}
    fn();
    return true;
  }

  function recordMilestone(kind, gaName, label) {
    runOncePerSession(`black_lantern_funnel_${kind}`, () => {
      sendReaderAction(kind, label);
      gaEvent(gaName, {chapter_title: CHAPTER_TITLE, milestone: kind});
    });
  }

  function installBookOneTracking() {
    if (!analyticsAllowed()) return;

    runOncePerSession('black_lantern_ga_book1_page_view', () => {
      gaEvent('book1_page_view', {content_group: 'Black Lantern Book One'});
    });

    const excerpt = document.querySelector('.full-excerpt');
    if (!excerpt) return;

    const markOpenForGa = () => {
      runOncePerSession('black_lantern_ga_chapter1_open', () => {
        gaEvent('chapter1_open', {chapter_title: CHAPTER_TITLE});
      });
    };

    if ('IntersectionObserver' in window) {
      const openObserver = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          openObserver.disconnect();
          markOpenForGa();
        }
      }, {threshold: 0.03, rootMargin: '0px 0px -15% 0px'});
      openObserver.observe(excerpt);
    } else {
      markOpenForGa();
    }

    let ticking = false;
    const checkDepth = () => {
      ticking = false;
      const rect = excerpt.getBoundingClientRect();
      const height = Math.max(1, rect.height);
      const progress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / height));
      if (progress >= 0.25) recordMilestone('chapter_25', 'chapter1_25', 'Chapter One — 25%');
      if (progress >= 0.50) recordMilestone('chapter_50', 'chapter1_50', 'Chapter One — 50%');
      if (progress >= 0.75) recordMilestone('chapter_75', 'chapter1_75', 'Chapter One — 75%');
      if (progress >= 0.995) recordMilestone('chapter_complete', 'chapter1_complete', 'Chapter One — complete');
    };

    const requestDepthCheck = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(checkDepth);
    };

    window.addEventListener('scroll', requestDepthCheck, {passive:true});
    window.addEventListener('resize', requestDepthCheck, {passive:true});
    requestDepthCheck();

    document.addEventListener('click', event => {
      const anchor = event.target.closest?.('a[href]');
      if (!anchor) return;
      let url;
      try { url = new URL(anchor.href, location.href); } catch { return; }
      if (!/amazon\./i.test(url.hostname)) return;

      const label = (anchor.dataset.trackLabel || anchor.textContent || 'Amazon').replace(/\s+/g, ' ').trim().slice(0, 180);
      const normalized = label.toLowerCase();
      const common = {link_text: label, destination: 'Amazon'};
      gaEvent('amazon_click', common);
      gaEvent('retailer_click', common);
      if (/kindle|ebook/.test(normalized)) gaEvent('amazon_kindle_click', common);
      if (/paperback|print edition/.test(normalized)) gaEvent('amazon_paperback_click', common);
      if (/hardcover/.test(normalized)) gaEvent('amazon_hardcover_click', common);
    }, {capture:true});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installBookOneTracking, {once:true});
  } else {
    installBookOneTracking();
  }
})();
