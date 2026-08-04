const BOT_PATTERN = /bot|crawler|spider|slurp|preview|facebookexternalhit|twitterbot|linkedinbot|discordbot|whatsapp|telegrambot|pinterest|headless|lighthouse|pagespeed|monitor|uptime/i;

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

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method not allowed.' });
  }

  const userAgent = clean(req.headers['user-agent'], 350);
  const purpose = clean(req.headers.purpose || req.headers['sec-purpose'], 80);
  if (!userAgent || BOT_PATTERN.test(userAgent) || /prefetch|prerender/i.test(purpose)) {
    return res.status(204).end();
  }

  const body = parseBody(req);
  const event = body.event === 'reader_action' ? 'reader_action' : body.event === 'pageview' ? 'pageview' : '';
  if (!event) return res.status(400).json({ ok: false, message: 'Invalid event.' });

  const record = {
    marker: 'LANTERN_METRIC',
    event,
    visitorId: clean(body.visitorId, 100),
    path: clean(body.path, 500),
    title: clean(body.title, 200),
    referrer: clean(body.referrer, 500),
    kind: event === 'reader_action' ? clean(body.kind, 40) : undefined,
    target: event === 'reader_action' ? clean(body.target, 700) : undefined,
    country: clean(req.headers['x-vercel-ip-country'], 10),
    region: clean(req.headers['x-vercel-ip-country-region'], 30),
    device: /mobile|android|iphone|ipad/i.test(userAgent) ? 'mobile' : 'desktop',
    at: new Date().toISOString()
  };

  console.log(JSON.stringify(record));
  return res.status(204).end();
};
