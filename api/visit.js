const BOT_PATTERN = /bot|crawler|spider|slurp|preview|facebookexternalhit|twitterbot|linkedinbot|discordbot|whatsapp|telegrambot|pinterest|headless|lighthouse|pagespeed|monitor|uptime/i;
const { storeEvent } = require('../lib/analytics-store');

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}
function clean(value, max) { return String(value || '').replace(/[\r\n\t]+/g, ' ').slice(0, max); }
function validVisitorId(value) { return /^[0-9a-f-]{36}$/i.test(String(value || '')); }

function classifyTrafficSource(path, referrer) {
  let page;
  try { page = new URL(path || '/', 'https://rkeithparkerbooks.com'); }
  catch { page = new URL('https://rkeithparkerbooks.com/'); }

  const params = page.searchParams;
  const source = String(params.get('utm_source') || '').toLowerCase();
  const medium = String(params.get('utm_medium') || '').toLowerCase();
  const campaign = clean(params.get('utm_campaign') || params.get('utm_id') || '', 140);
  const hasFbclid = params.has('fbclid');
  const hasGclid = params.has('gclid');
  const paid = /paid|cpc|ppc|paid_social|display|ads?/.test(medium) || params.has('utm_id') || hasGclid;

  let refHost = '';
  try { refHost = new URL(referrer || '').hostname.toLowerCase().replace(/^www\./, ''); }
  catch {}

  const facebook = /^(fb|facebook|meta)$/.test(source) || hasFbclid || /(^|\.)facebook\.com$|(^|\.)fb\.com$/.test(refHost);
  let trafficSource = 'Other';
  if (facebook) trafficSource = paid || /paid/.test(medium) ? 'Facebook Paid' : 'Facebook Organic';
  else if (/goodreads/.test(source) || /goodreads\.com$/.test(refHost)) trafficSource = 'Goodreads';
  else if (/bookbub/.test(source) || /bookbub\.com$/.test(refHost)) trafficSource = 'BookBub';
  else if (/google|bing|yahoo|duckduckgo|ecosia/.test(source) || /(^|\.)(google\.[a-z.]+|bing\.com|search\.yahoo\.com|duckduckgo\.com|ecosia\.org)$/.test(refHost) || hasGclid) trafficSource = 'Google/Search';
  else if (!source && (!refHost || refHost === 'rkeithparkerbooks.com' || refHost.endsWith('.rkeithparkerbooks.com'))) trafficSource = 'Direct';

  return { trafficSource, source:clean(source,80), medium:clean(medium,80), campaign };
}

async function forwardLegacyPageview({ visitorId, userAgent, path, referrer }) {
  if (!validVisitorId(visitorId)) return { forwarded: false, reason: 'invalid-visitor-id' };
  const legacyUrl = new URL('https://black-lantern-cycle.keithparker1901.chatgpt.site/');
  legacyUrl.searchParams.set('source_path', clean(path, 450) || '/');
  try {
    const response = await fetch(legacyUrl, { method: 'GET', redirect: 'manual', headers: {
      'user-agent': userAgent || 'Mozilla/5.0 BlackLanternReader/1.0', accept: 'text/html,application/xhtml+xml',
      cookie: `bl_visitor=${visitorId}`, referer: clean(referrer, 500) || 'https://rkeithparkerbooks.com/',
      'x-forwarded-host': 'rkeithparkerbooks.com', 'x-forwarded-proto': 'https'
    }});
    return { forwarded: response.status >= 200 && response.status < 400, status: response.status, location: response.headers.get('location') || '' };
  } catch (error) { return { forwarded: false, reason: String(error).slice(0, 300) }; }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok:false, message:'Method not allowed.' }); }
  const userAgent = clean(req.headers['user-agent'], 350);
  const purpose = clean(req.headers.purpose || req.headers['sec-purpose'], 80);
  if (!userAgent || BOT_PATTERN.test(userAgent) || /prefetch|prerender/i.test(purpose)) return res.status(204).end();
  const body = parseBody(req);
  const event = body.event === 'reader_action' ? 'reader_action' : body.event === 'pageview' ? 'pageview' : '';
  if (!event) return res.status(400).json({ ok:false, message:'Invalid event.' });

  const path = clean(body.path,500);
  const referrer = clean(body.referrer,500);
  const attribution = classifyTrafficSource(path, referrer);
  const record = {
    marker:'LANTERN_METRIC', event, visitorId:clean(body.visitorId,100), path, title:clean(body.title,200), referrer,
    trafficSource: attribution.trafficSource, source: attribution.source, medium: attribution.medium, campaign: attribution.campaign,
    kind:event === 'reader_action' ? clean(body.kind,40) : undefined,
    target:event === 'reader_action' ? clean(body.target,700) : undefined, country:clean(req.headers['x-vercel-ip-country'],10),
    region:clean(req.headers['x-vercel-ip-country-region'],30), device:/mobile|android|iphone|ipad/i.test(userAgent)?'mobile':'desktop', at:new Date().toISOString()
  };
  try { record.storage = await storeEvent(record); } catch (error) { record.storage = { stored:false, reason:clean(error && error.message,200) }; }
  if (event === 'pageview') record.legacy = await forwardLegacyPageview({ visitorId:record.visitorId, userAgent, path:record.path, referrer:record.referrer });
  console.log(JSON.stringify(record));
  return res.status(204).end();
};
