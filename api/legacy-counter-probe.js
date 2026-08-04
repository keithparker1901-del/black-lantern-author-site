module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false });

  const base = 'https://rkeithparkerbooks.com';
  const assets = [
    '/assets/visit-stats-BGKbBR8i.js',
    '/assets/outbound-click-tracker-Z8PXzrJT.js',
    '/assets/visit-stats-D9ljdokO.css'
  ];
  const endpoints = [
    '/api/visit-stats',
    '/api/visits',
    '/api/visitor-stats',
    '/api/site-visits',
    '/api/outbound-clicks',
    '/api/outbound-click'
  ];
  const headers = {
    'user-agent': 'Mozilla/5.0 BlackLanternCounterMigration/1.0',
    accept: 'text/html,application/json,application/javascript,*/*'
  };
  const output = { assets: {}, endpoints: {} };

  for (const asset of assets) {
    try {
      const response = await fetch(base + asset, { headers, redirect: 'follow' });
      const text = await response.text();
      output.assets[asset] = {
        status: response.status,
        contentType: response.headers.get('content-type'),
        bytes: text.length,
        text: text.slice(0, 100000)
      };
    } catch (error) {
      output.assets[asset] = { error: String(error) };
    }
  }

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(base + endpoint, {
        method: 'GET',
        headers,
        redirect: 'manual'
      });
      const text = await response.text();
      output.endpoints[endpoint] = {
        status: response.status,
        location: response.headers.get('location'),
        contentType: response.headers.get('content-type'),
        allow: response.headers.get('allow'),
        text: text.slice(0, 12000)
      };
    } catch (error) {
      output.endpoints[endpoint] = { error: String(error) };
    }
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ ok: true, output });
};
