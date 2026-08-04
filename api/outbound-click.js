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

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method not allowed.' });
  }

  const body = parseBody(req);
  const url = clean(body.url || body.target, 700);
  const label = clean(body.label || body.kind || 'Outbound link', 180);
  const pagePath = clean(body.pagePath || body.path || '/', 500);
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
      body: JSON.stringify({ url, label, pagePath })
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
