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

const SOURCE_ORDER = ['Facebook Paid','Facebook Organic','Google/Search','Direct','Goodreads','BookBub','Other'];

function destination(url) {
  try {
    const u = new URL(url);
    if (/amazon\./i.test(u.hostname)) return 'Amazon';
    if (/goodreads/i.test(u.hostname)) return 'Goodreads';
    if (/bookbub/i.test(u.hostname)) return 'BookBub';
    if (/facebook|fb\.com/i.test(u.hostname)) return 'Facebook';
    return u.hostname.replace(/^www\./, '');
  } catch { return 'Other'; }
}

function trafficSource(event) {
  if (SOURCE_ORDER.includes(event.trafficSource)) return event.trafficSource;

  let page;
  try { page = new URL(event.path || '/', 'https://rkeithparkerbooks.com'); }
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

  const facebook = /^(fb|facebook|meta)$/.test(source) || hasFbclid || /(^|\.)facebook\.com$|(^|\.)fb\.com$/.test(refHost);
  if (facebook) return paid || /paid/.test(medium) ? 'Facebook Paid' : 'Facebook Organic';

  if (/goodreads/.test(source) || /goodreads\.com$/.test(refHost)) return 'Goodreads';
  if (/bookbub/.test(source) || /bookbub\.com$/.test(refHost)) return 'BookBub';

  const search = /google|bing|yahoo|duckduckgo|ecosia/.test(source) || /(^|\.)(google\.[a-z.]+|bing\.com|search\.yahoo\.com|duckduckgo\.com|ecosia\.org)$/.test(refHost) || hasGclid;
  if (search) return 'Google/Search';

  if (!source && (!refHost || refHost === 'rkeithparkerbooks.com' || refHost.endsWith('.rkeithparkerbooks.com'))) return 'Direct';
  return 'Other';
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
    const pageviews = events.filter(e => e.event === 'pageview');
    const clicks = events.filter(e => e.event === 'outbound_click' || e.marker === 'LANTERN_OUTBOUND_ATTRIBUTION');
    const visitors = new Set(pageviews.map(e => e.visitorId).filter(Boolean));
    const clickers = new Set(clicks.map(e => e.visitorId).filter(Boolean));
    const days = {};
    const bySource = Object.fromEntries(SOURCE_ORDER.map(name => [name, 0]));
    const sourceVisitors = Object.fromEntries(SOURCE_ORDER.map(name => [name, new Set()]));

    for (const e of pageviews) {
      const d = String(e.at || '').slice(0, 10);
      if (d) days[d] = (days[d] || 0) + 1;
      const source = trafficSource(e);
      bySource[source] = (bySource[source] || 0) + 1;
      if (e.visitorId) sourceVisitors[source].add(e.visitorId);
    }

    const uniqueVisitorsBySource = Object.fromEntries(SOURCE_ORDER.map(name => [name, sourceVisitors[name].size]));
    const byDestination = {};
    for (const e of clicks) {
      const d = destination(e.url);
      byDestination[d] = (byDestination[d] || 0) + 1;
    }
    const recent = clicks.sort((a,b) => String(b.at).localeCompare(String(a.at))).slice(0,25).map(e => ({
      destination: destination(e.url), label: e.label || 'Outbound link', attribution: e.attribution || 'Direct',
      pagePath: e.pagePath || '/', rawPagePath: e.rawPagePath || e.pagePath || '/', campaign: e.campaign || '', at: e.at
    }));
    return res.status(200).json({
      ok: true, configured: true,
      totalVisits: pageviews.length, uniqueVisitors: visitors.size,
      totalOutboundClicks: clicks.length, uniqueClickers: clickers.size,
      days, bySource, uniqueVisitorsBySource, sourceOrder: SOURCE_ORDER, byDestination, recent, legacy: LEGACY
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, message: 'Analytics report could not be loaded.' });
  }
};
