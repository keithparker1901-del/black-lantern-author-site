function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

function clean(value, max) {
  return String(value || '').replace(/[\r\n\t]+/g, ' ').slice(0, max);
}

function cookieValue(header, name) {
  const parts = String(header || '').split(';');
  for (const part of parts) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return '';
}

function classifyAttribution(pagePath, referrer) {
  let url;
  try { url = new URL(pagePath || '/', 'https://rkeithparkerbooks.com'); }
  catch { url = new URL('https://rkeithparkerbooks.com/'); }

  const p = url.searchParams;
  const source = (p.get('utm_source') || '').toLowerCase();
  const medium = (p.get('utm_medium') || '').toLowerCase();
  const campaign = clean(p.get('utm_campaign') || p.get('utm_id') || '', 140);
  const hasFbclid = p.has('fbclid');
  const hasGclid = p.has('gclid');
  const paid = /paid|cpc|ppc|paid_social|display|ads?/.test(medium) || p.has('utm_id') || hasGclid;
  const facebook = /^(fb|facebook|meta)$/.test(source) || hasFbclid;
  const instagram = /instagram|ig/.test(source);
  const google = /google/.test(source) || hasGclid;
  const email = /email|newsletter/.test(source) || /email|newsletter/.test(medium);

  let refHost = '';
  try { refHost = new URL(referrer || '').hostname.toLowerCase(); } catch {}

  let label = 'Direct';
  if (facebook) label = paid || /paid/.test(medium) ? 'Facebook paid' : 'Facebook organic';
  else if (instagram) label = paid ? 'Instagram paid' : 'Instagram organic';
  else if (google) label = paid ? 'Google paid' : 'Google organic';
  else if (email) label = 'Email';
  else if (source) label = paid ? `${source} paid` : source;
  else if (/facebook\.com|fb\.com/.test(refHost)) label = 'Facebook organic';
  else if (/instagram\.com/.test(refHost)) label = 'Instagram organic';
  else if (/google\./.test(refHost)) label = 'Google organic';
  else if (refHost) label = 'Other referral';

  return {
    attribution: clean(label, 80),
    source: clean(source, 80),
    medium: clean(medium, 80),
    campaign,
    cleanPagePath: clean(url.pathname || '/', 500),
    rawPagePath: clean(pagePath || '/', 1000)
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method not allowed.' });
  }

  const body = parseBody(req);
  const url = clean(body.url || body.target, 700);
  const label = clean(body.label || body.kind || 'Outbound link', 180);
  const rawPagePath = clean(body.pagePath || body.path || '/', 1000);
  const attribution = classifyAttribution(rawPagePath, body.referrer || req.headers.referer || '');
  const displayLabel = attribution.attribution && attribution.attribution !== 'Direct'
    ? clean(`${label} · ${attribution.attribution}`, 180)
    : label;

  if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) {
    return res.status(400).json({ ok: false, message: 'Invalid outbound destination.' });
  }

  const existingVisitor = cookieValue(req.headers.cookie, 'bl_visitor');
  const fallbackVisitor = clean(body.visitorId, 100);
  const visitorId = /^[0-9a-f-]{36}$/i.test(existingVisitor)
    ? existingVisitor
    : /^[0-9a-f-]{36}$/i.test(fallbackVisitor)
      ? fallbackVisitor
      : '00000000-0000-4000-8000-000000000002';

  console.log(JSON.stringify({
    marker: 'LANTERN_OUTBOUND_ATTRIBUTION',
    visitorId,
    url,
    label,
    attribution: attribution.attribution,
    source: attribution.source,
    medium: attribution.medium,
    campaign: attribution.campaign,
    pagePath: attribution.cleanPagePath,
    rawPagePath: attribution.rawPagePath,
    at: new Date().toISOString()
  }));

  try {
    const response = await fetch('https://black-lantern-cycle.keithparker1901.chatgpt.site/api/outbound-click', {
      method: 'POST',
      redirect: 'manual',
      headers: {
        'content-type': 'application/json',
        'user-agent': clean(req.headers['user-agent'], 350) || 'Mozilla/5.0 BlackLanternReader/1.0',
        cookie: `bl_visitor=${visitorId}`,
        referer: 'https://rkeithparkerbooks.com/'
      },
      body: JSON.stringify({
        url,
        label: displayLabel,
        pagePath: attribution.cleanPagePath,
        attribution: attribution.attribution,
        source: attribution.source,
        medium: attribution.medium,
        campaign: attribution.campaign,
        rawPagePath: attribution.rawPagePath
      })
    });

    if (!response.ok && response.status !== 204) {
      console.error('Legacy outbound ledger error', response.status, (await response.text()).slice(0, 1000));
      return res.status(502).json({ ok: false, message: 'Reader action could not be recorded.' });
    }

    return res.status(204).end();
  } catch (error) {
    console.error('Legacy outbound ledger request failed', error);
    return res.status(502).json({ ok: false, message: 'Reader action could not be recorded.' });
  }
};
