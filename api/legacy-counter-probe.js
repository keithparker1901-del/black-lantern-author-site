module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false });

  const origins = [
    'https://rkeithparkerbooks.com',
    'https://black-lantern-cycle.keithparker1901.chatgpt.site'
  ];
  const routes = ['/', '/api/outbound-click', '/api/owner/visits', '/owner/visits'];
  const output = [];
  const headers = {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36',
    accept: 'text/html,application/json,*/*',
    cookie: 'bl_visitor=00000000-0000-4000-8000-000000000001'
  };

  for (const origin of origins) {
    for (const route of routes) {
      try {
        const response = await fetch(origin + route, {
          method: 'GET',
          headers,
          redirect: 'manual'
        });
        output.push({
          origin,
          route,
          status: response.status,
          location: response.headers.get('location'),
          contentType: response.headers.get('content-type'),
          setCookie: response.headers.get('set-cookie'),
          allow: response.headers.get('allow'),
          text: (await response.text()).slice(0, 1200)
        });
      } catch (error) {
        output.push({ origin, route, error: String(error) });
      }
    }
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ ok: true, output });
};
