const { loadEvents } = require('../lib/analytics-store');

const LEGACY = {
  totalVisits: 691,
  uniqueVisitors: 614,
  days: {
    '2026-08-02': 7,
    '2026-08-03': 120,
    '2026-08-04': 109,
    '2026-08-05': 56,
    '2026-08-06': 51
  },
  totalOutboundClicks: 4,
  uniqueClickers: 4,
  byDestination: { Amazon: 4 },
  recent: [
    { destination: 'Amazon', label: 'Buy on Amazon', attribution: 'Facebook paid', pagePath: '/books/the-manor-that-drank-the-road/', at: '2026-08-07T17:06:58Z' },
    { destination: 'Amazon', label: 'Buy on Amazon', attribution: 'Direct', pagePath: '/books/the-manor-that-drank-the-road/', at: '2026-08-07T01:28:56Z' },
    { destination: 'Amazon', label: 'Start with Book One', attribution: 'Direct', pagePath: '/', at: '2026-08-03T01:33:12Z' },
    { destination: 'Amazon', label: 'Amazon Author Page', attribution: 'Facebook', pagePath: '/', at: '2026-08-02T04:17:25Z' }
  ]
};

const SOURCE_ORDER = ['Pinterest','Facebook Paid','Facebook Organic','Instagram','YouTube','Google/Search','Email','Goodreads','BookBub','Direct','Other'];
const BOOK_ONE_PATH = '/books/the-manor-that-drank-the-road/';
const SESSION_GAP_MS = 30 * 60 * 1000;

function safeDate(value) {
  const ms = Date.parse(String(value || ''));
  return Number.isFinite(ms) ? ms : 0;
}

function pathname(value) {
  try { return new URL(value || '/', 'https://rkeithparkerbooks.com').pathname || '/'; }
  catch { return '/'; }
}

function destination(url) {
  try {
    const u = new URL(url);
    if (/amazon\./i.test(u.hostname)) return 'Amazon';
    if (/shop\.ingramspark\.com$/i.test(u.hostname)) return 'Paperback Direct';
    if (/goodreads/i.test(u.hostname)) return 'Goodreads';
    if (/bookbub/i.test(u.hostname)) return 'BookBub';
    if (/facebook|fb\.com/i.test(u.hostname)) return 'Facebook';
    return u.hostname.replace(/^www\./, '');
  } catch { return 'Other'; }
}

function trafficSource(event) {
  let page;
  try { page = new URL(event.path || event.rawPagePath || '/', 'https://rkeithparkerbooks.com'); }
  catch { page = new URL('https://rkeithparkerbooks.com/'); }

  const params = page.searchParams;
  const source = String(params.get('utm_source') || event.source || '').toLowerCase();
  const medium = String(params.get('utm_medium') || event.medium || '').toLowerCase();
  const hasFbclid = params.has('fbclid');
  const hasGclid = params.has('gclid');
  const paid = /paid|cpc|ppc|paid_social|display|ads?/.test(medium) || params.has('utm_id') || hasGclid;

  let refHost = '';
  try { refHost = new URL(event.referrer || '').hostname.toLowerCase().replace(/^www\./, ''); }
  catch {}

  if (/^(pinterest|pin)$/.test(source) || /(^|\.)(pinterest\.[a-z.]+|pin\.it)$/.test(refHost)) return 'Pinterest';
  if (/^(fb|facebook|meta)$/.test(source) || hasFbclid || /(^|\.)facebook\.com$|(^|\.)fb\.com$/.test(refHost)) return paid || /paid/.test(medium) ? 'Facebook Paid' : 'Facebook Organic';
  if (/^(instagram|ig)$/.test(source) || /(^|\.)instagram\.com$/.test(refHost)) return 'Instagram';
  if (/^(youtube|yt)$/.test(source) || /(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(refHost)) return 'YouTube';
  if (/email|newsletter/.test(source) || /email|newsletter/.test(medium)) return 'Email';
  if (/goodreads/.test(source) || /goodreads\.com$/.test(refHost)) return 'Goodreads';
  if (/bookbub/.test(source) || /bookbub\.com$/.test(refHost)) return 'BookBub';
  if (/google|bing|yahoo|duckduckgo|ecosia/.test(source) || /(^|\.)(google\.[a-z.]+|bing\.com|search\.yahoo\.com|duckduckgo\.com|ecosia\.org)$/.test(refHost) || hasGclid) return 'Google/Search';
  if (!source && (!refHost || refHost === 'rkeithparkerbooks.com' || refHost.endsWith('.rkeithparkerbooks.com'))) return 'Direct';
  if (SOURCE_ORDER.includes(event.trafficSource) && event.trafficSource !== 'Other') return event.trafficSource;
  return 'Other';
}

function buildSessions(pageviews) {
  const byVisitor = new Map();
  for (const event of pageviews) {
    if (!event.visitorId) continue;
    if (!byVisitor.has(event.visitorId)) byVisitor.set(event.visitorId, []);
    byVisitor.get(event.visitorId).push(event);
  }

  const sessions = [];
  for (const [visitorId, items] of byVisitor) {
    items.sort((a,b) => safeDate(a.at) - safeDate(b.at));
    let session = null;
    for (const event of items) {
      const at = safeDate(event.at);
      if (!session || !at || at - session.lastAt > SESSION_GAP_MS) {
        session = {
          visitorId,
          startedAt: at,
          lastAt: at,
          landingPath: pathname(event.path),
          trafficSource: trafficSource(event),
          pageViews: 1
        };
        sessions.push(session);
      } else {
        session.lastAt = at;
        session.pageViews += 1;
      }
    }
  }
  return sessions.sort((a,b) => a.startedAt - b.startedAt);
}

function countBy(items, keyFn) {
  const counts = {};
  for (const item of items) {
    const key = keyFn(item) || 'Other';
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function topRows(counts, limit = 10) {
  return Object.entries(counts || {}).sort((a,b) => b[1] - a[1]).slice(0, limit).map(([name,count]) => ({ name, count }));
}

function pct(numerator, denominator) {
  return denominator ? Number(((numerator / denominator) * 100).toFixed(1)) : 0;
}

function periodSummary(events, sessions, days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const pv = events.filter(e => e.event === 'pageview' && safeDate(e.at) >= cutoff);
  const people = new Set(pv.map(e => e.visitorId).filter(Boolean));
  const visits = sessions.filter(s => s.startedAt >= cutoff);
  return { uniqueReaders: people.size, visits: visits.length, pageViews: pv.length };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false });
  }

  try {
    const { configured, events } = await loadEvents(5000);
    if (!configured) return res.status(503).json({ ok: false, configured: false, message: 'Analytics storage is not configured.' });

    const pageviews = events.filter(e => e.event === 'pageview').sort((a,b) => safeDate(a.at) - safeDate(b.at));
    const actions = events.filter(e => e.event === 'reader_action');
    const clicks = events.filter(e => e.event === 'outbound_click' || e.marker === 'LANTERN_OUTBOUND_ATTRIBUTION');
    const signups = events.filter(e => e.event === 'email_signup');
    const sessions = buildSessions(pageviews);

    const uniqueReaders = new Set(pageviews.map(e => e.visitorId).filter(Boolean));
    const bookOneReaders = new Set(pageviews.filter(e => pathname(e.path) === BOOK_ONE_PATH).map(e => e.visitorId).filter(Boolean));
    const chapterReaders = new Set(actions.filter(e => e.kind === 'chapter_open' && pathname(e.path) === BOOK_ONE_PATH).map(e => e.visitorId).filter(Boolean));

    const amazonClicks = clicks.filter(e => destination(e.url) === 'Amazon');
    const paperbackClicks = clicks.filter(e => destination(e.url) === 'Paperback Direct');
    const bookOneRetailerClicks = clicks.filter(e => pathname(e.pagePath || e.path) === BOOK_ONE_PATH && ['Amazon','Paperback Direct'].includes(destination(e.url)));
    const bookOneRetailerClickers = new Set(bookOneRetailerClicks.map(e => e.visitorId).filter(Boolean));
    const signupVisitors = new Set(signups.map(e => e.visitorId).filter(Boolean));

    const pinterestReaders = new Set(pageviews.filter(e => trafficSource(e) === 'Pinterest').map(e => e.visitorId).filter(Boolean));

    const sourceSessionCounts = countBy(sessions, s => s.trafficSource);
    const sourceReaderSets = Object.fromEntries(SOURCE_ORDER.map(name => [name, new Set()]));
    for (const session of sessions) {
      if (!sourceReaderSets[session.trafficSource]) sourceReaderSets[session.trafficSource] = new Set();
      sourceReaderSets[session.trafficSource].add(session.visitorId);
    }
    const trafficSources = SOURCE_ORDER.map(name => ({
      name,
      visits: sourceSessionCounts[name] || 0,
      readers: sourceReaderSets[name]?.size || 0,
      share: pct(sourceSessionCounts[name] || 0, sessions.length)
    }));

    const landingPages = topRows(countBy(sessions, s => s.landingPath), 10);
    const retailerExits = topRows(countBy(clicks, e => destination(e.url)), 10);

    const actionCounts = countBy(actions, e => {
      if (e.kind === 'chapter_open') return 'Chapter One opens';
      if (e.kind === 'amazon') return 'Amazon reader actions';
      if (e.kind === 'download') return 'Downloads';
      if (e.kind === 'email') return 'Email link clicks';
      return e.kind ? e.kind.replace(/_/g, ' ') : 'Other reader action';
    });
    actionCounts['Amazon clicks'] = amazonClicks.length;
    actionCounts['Paperback Direct clicks'] = paperbackClicks.length;
    actionCounts['Email signups'] = signups.length;
    const readerActions = topRows(actionCounts, 12);

    const days = {};
    for (const e of pageviews) {
      const d = String(e.at || '').slice(0, 10);
      if (d) days[d] = (days[d] || 0) + 1;
    }

    const recent = clicks.sort((a,b) => safeDate(b.at) - safeDate(a.at)).slice(0,25).map(e => ({
      destination: destination(e.url),
      label: e.label || 'Outbound link',
      attribution: e.attribution || trafficSource(e),
      pagePath: e.pagePath || '/',
      rawPagePath: e.rawPagePath || e.pagePath || '/',
      campaign: e.campaign || '',
      at: e.at
    }));

    return res.status(200).json({
      ok: true,
      configured: true,
      definitions: { sessionMinutes: 30, bookOnePath: BOOK_ONE_PATH },
      uniqueReaders: uniqueReaders.size,
      visits: sessions.length,
      pageViews: pageviews.length,
      bookOneVisitors: bookOneReaders.size,
      chapterOneOpens: chapterReaders.size,
      amazonClicks: amazonClicks.length,
      paperbackDirectClicks: paperbackClicks.length,
      emailSignups: signups.length,
      pinterestVisitors: pinterestReaders.size,
      conversionRate: pct(bookOneRetailerClickers.size, bookOneReaders.size),
      chapterOpenRate: pct(chapterReaders.size, bookOneReaders.size),
      retailerClickRate: pct(bookOneRetailerClickers.size, bookOneReaders.size),
      emailSignupRate: pct(signupVisitors.size || signups.length, uniqueReaders.size),
      periods: {
        sevenDays: periodSummary(events, sessions, 7),
        thirtyDays: periodSummary(events, sessions, 30),
        lifetime: { uniqueReaders: uniqueReaders.size, visits: sessions.length, pageViews: pageviews.length }
      },
      trafficSources,
      landingPages,
      readerActions,
      retailerExits,
      days,
      recent,
      trackingNotes: {
        chapterOpenTrackingStarted: true,
        emailSignupTrackingStarted: true,
        pinterestHumanTrafficAllowed: true
      },
      legacy: LEGACY
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, message: 'Analytics report could not be loaded.' });
  }
};
