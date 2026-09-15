const { loadEvents } = require('../lib/analytics-store');

const BOOK_ONE_PATH = '/books/the-manor-that-drank-the-road/';
const SESSION_GAP_MS = 30 * 60 * 1000;
const SOURCE_ORDER = ['Facebook Paid','Facebook Organic','Instagram','Pinterest','YouTube','Google/Search','Email','Goodreads','BookBub','Direct','Other'];

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
    return 'Other';
  } catch {
    return 'Other';
  }
}

function trafficSource(event) {
  let page;
  try { page = new URL(event.path || event.rawPagePath || event.pagePath || '/', 'https://rkeithparkerbooks.com'); }
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

  if (/^(fb|facebook|meta)$/.test(source) || hasFbclid || /(^|\.)facebook\.com$|(^|\.)fb\.com$/.test(refHost)) return paid || /paid/.test(medium) ? 'Facebook Paid' : 'Facebook Organic';
  if (/^(instagram|ig)$/.test(source) || /(^|\.)instagram\.com$/.test(refHost)) return 'Instagram';
  if (/^(pinterest|pin)$/.test(source) || /(^|\.)(pinterest\.[a-z.]+|pin\.it)$/.test(refHost)) return 'Pinterest';
  if (/^(youtube|yt)$/.test(source) || /(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(refHost)) return 'YouTube';
  if (/email|newsletter/.test(source) || /email|newsletter/.test(medium)) return 'Email';
  if (/goodreads/.test(source) || /goodreads\.com$/.test(refHost)) return 'Goodreads';
  if (/bookbub/.test(source) || /bookbub\.com$/.test(refHost)) return 'BookBub';
  if (/google|bing|yahoo|duckduckgo|ecosia/.test(source) || /(^|\.)(google\.[a-z.]+|bing\.com|search\.yahoo\.com|duckduckgo\.com|ecosia\.org)$/.test(refHost) || hasGclid) return 'Google/Search';
  if (!source && (!refHost || refHost === 'rkeithparkerbooks.com' || refHost.endsWith('.rkeithparkerbooks.com'))) return 'Direct';
  if (SOURCE_ORDER.includes(event.trafficSource)) return event.trafficSource;
  return 'Other';
}

function pct(numerator, denominator) {
  return denominator ? Number(((numerator / denominator) * 100).toFixed(1)) : 0;
}

function uniqueVisitors(items) {
  return new Set(items.map(item => item.visitorId).filter(Boolean));
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
    let current = null;
    for (const event of items) {
      const at = safeDate(event.at);
      if (!current || !at || at - current.lastAt > SESSION_GAP_MS) {
        current = { visitorId, startedAt: at, lastAt: at, trafficSource: trafficSource(event) };
        sessions.push(current);
      } else {
        current.lastAt = at;
      }
    }
  }
  return sessions;
}

function setsBySource(items) {
  const map = Object.fromEntries(SOURCE_ORDER.map(source => [source, new Set()]));
  for (const item of items) {
    if (!item.visitorId) continue;
    const source = trafficSource(item);
    if (!map[source]) map[source] = new Set();
    map[source].add(item.visitorId);
  }
  return map;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok:false });
  }

  try {
    const { configured, events } = await loadEvents(5000);
    if (!configured) return res.status(503).json({ ok:false, configured:false, message:'Analytics storage is not configured.' });

    const pageviews = events.filter(event => event.event === 'pageview');
    const sessions = buildSessions(pageviews);
    const bookOnePageviews = pageviews.filter(event => pathname(event.path) === BOOK_ONE_PATH);
    const actions = events.filter(event => event.event === 'reader_action' && pathname(event.path) === BOOK_ONE_PATH);
    const clicks = events.filter(event => event.event === 'outbound_click' || event.marker === 'LANTERN_OUTBOUND_ATTRIBUTION');
    const bookOneClicks = clicks.filter(event => pathname(event.pagePath || event.path) === BOOK_ONE_PATH);
    const retailerClicks = bookOneClicks.filter(event => ['Amazon','Paperback Direct'].includes(destination(event.url)));
    const amazonClicks = bookOneClicks.filter(event => destination(event.url) === 'Amazon');
    const signups = events.filter(event => event.event === 'email_signup');
    const bookOneSignups = signups.filter(event => pathname(event.path) === BOOK_ONE_PATH);

    const milestoneItems = kind => actions.filter(event => event.kind === kind);

    const bookOneVisitors = uniqueVisitors(bookOnePageviews);
    const chapterStarts = uniqueVisitors(milestoneItems('chapter_open'));
    const chapter25 = uniqueVisitors(milestoneItems('chapter_25'));
    const chapter50 = uniqueVisitors(milestoneItems('chapter_50'));
    const chapter75 = uniqueVisitors(milestoneItems('chapter_75'));
    const chapterComplete = uniqueVisitors(milestoneItems('chapter_complete'));
    const retailerClickers = uniqueVisitors(retailerClicks);
    const amazonClickers = uniqueVisitors(amazonClicks);
    const bookOneSignupVisitors = uniqueVisitors(bookOneSignups);

    const kindleClickers = uniqueVisitors(amazonClicks.filter(event => /kindle|ebook/i.test(event.label || '')));
    const paperbackClickers = uniqueVisitors(amazonClicks.filter(event => /paperback|print edition/i.test(event.label || '')));

    const sessionCounts = Object.fromEntries(SOURCE_ORDER.map(source => [source, 0]));
    for (const session of sessions) sessionCounts[session.trafficSource] = (sessionCounts[session.trafficSource] || 0) + 1;

    const bySource = {
      bookOne: setsBySource(bookOnePageviews),
      starts: setsBySource(milestoneItems('chapter_open')),
      halfway: setsBySource(milestoneItems('chapter_50')),
      complete: setsBySource(milestoneItems('chapter_complete')),
      retailer: setsBySource(retailerClicks)
    };

    const sourceRows = SOURCE_ORDER.map(source => ({
      source,
      sessions: sessionCounts[source] || 0,
      bookOneVisitors: bySource.bookOne[source]?.size || 0,
      chapterStarts: bySource.starts[source]?.size || 0,
      halfwayReaders: bySource.halfway[source]?.size || 0,
      chapterCompletes: bySource.complete[source]?.size || 0,
      retailerClickers: bySource.retailer[source]?.size || 0
    })).filter(row => row.sessions || row.bookOneVisitors || row.chapterStarts || row.retailerClickers);

    const stages = [
      { key:'bookOneVisitors', label:'Book One visitors', count:bookOneVisitors.size, fromPriorRate:100 },
      { key:'chapterStarts', label:'Chapter One starts', count:chapterStarts.size, fromPriorRate:pct(chapterStarts.size, bookOneVisitors.size) },
      { key:'chapter25', label:'Reached 25%', count:chapter25.size, fromPriorRate:pct(chapter25.size, chapterStarts.size) },
      { key:'chapter50', label:'Reached 50%', count:chapter50.size, fromPriorRate:pct(chapter50.size, chapter25.size || chapterStarts.size) },
      { key:'chapter75', label:'Reached 75%', count:chapter75.size, fromPriorRate:pct(chapter75.size, chapter50.size) },
      { key:'chapterComplete', label:'Chapter One complete', count:chapterComplete.size, fromPriorRate:pct(chapterComplete.size, chapter75.size) },
      { key:'retailerClickers', label:'Retailer clickers', count:retailerClickers.size, fromPriorRate:pct(retailerClickers.size, chapterComplete.size || bookOneVisitors.size) }
    ];

    return res.status(200).json({
      ok:true,
      trackingStartNote:'Reading-depth milestones accumulate from the reader-funnel deployment forward; earlier visits cannot be reconstructed.',
      definitions:{ bookOnePath:BOOK_ONE_PATH, sessionMinutes:30, depthMeaning:'Viewport progress through the visible Chapter One excerpt.' },
      stages,
      counts:{
        bookOneVisitors:bookOneVisitors.size,
        chapterStarts:chapterStarts.size,
        chapter25:chapter25.size,
        chapter50:chapter50.size,
        chapter75:chapter75.size,
        chapterComplete:chapterComplete.size,
        retailerClickers:retailerClickers.size,
        amazonClickers:amazonClickers.size,
        kindleClickers:kindleClickers.size,
        paperbackClickers:paperbackClickers.size,
        bookOneEmailSignups:bookOneSignupVisitors.size,
        siteWideEmailSignups:signups.length
      },
      rates:{
        startRate:pct(chapterStarts.size, bookOneVisitors.size),
        halfwayRate:pct(chapter50.size, chapterStarts.size),
        completionRate:pct(chapterComplete.size, chapterStarts.size),
        retailerRate:pct(retailerClickers.size, bookOneVisitors.size),
        finisherToRetailerRate:pct(retailerClickers.size, chapterComplete.size)
      },
      sourceRows
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok:false, message:'Book One funnel report could not be loaded.' });
  }
};
