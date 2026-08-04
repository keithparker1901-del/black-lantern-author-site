module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false });

  const base = 'https://rkeithparkerbooks.com';
  const assets = [
    '/assets/index-CYabEdSN.js',
    '/assets/outbound-click-tracker-Z8PXzrJT.js',
    '/assets/newsletter-form-Ba5-yujk.js',
    '/assets/public-author-settings-Bd-tKyd6.js',
    '/assets/share-buttons-B8mYQCYj.js',
    '/assets/visit-stats-BGKbBR8i.js'
  ];
  const headers = {
    'user-agent': 'Mozilla/5.0 BlackLanternCounterMigration/1.0',
    accept: 'application/javascript,*/*'
  };
  const output = {};

  for (const asset of assets) {
    try {
      const response = await fetch(base + asset, { headers, redirect: 'follow' });
      const text = await response.text();
      const endpoints = [...new Set([...text.matchAll(/(?:["'`])((?:https?:\/\/[^"'` ]+)?\/api\/[A-Za-z0-9_?=&.\/-]+)/g)].map(match => match[1]))];
      const trackerTerms = [...new Set([...text.matchAll(/.{0,180}(?:visitor|pageview|page-view|visitId|visitorId|visit-cookie|outbound-click|owner\/visits).{0,360}/gi)].map(match => match[0]))].slice(0, 40);
      output[asset] = {
        status: response.status,
        bytes: text.length,
        endpoints,
        trackerTerms
      };
    } catch (error) {
      output[asset] = { error: String(error) };
    }
  }

  const methodTests = {};
  const candidates = ['/api/visit', '/api/visitor', '/api/page-view', '/api/pageview', '/api/track-visit', '/api/site-visit'];
  for (const endpoint of candidates) {
    try {
      const response = await fetch(base + endpoint, { method: 'GET', headers, redirect: 'manual' });
      methodTests[endpoint] = {
        status: response.status,
        allow: response.headers.get('allow'),
        location: response.headers.get('location'),
        contentType: response.headers.get('content-type'),
        text: (await response.text()).slice(0, 1000)
      };
    } catch (error) {
      methodTests[endpoint] = { error: String(error) };
    }
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ ok: true, output, methodTests });
};
