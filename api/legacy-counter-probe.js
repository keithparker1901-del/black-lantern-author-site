module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false });

  const url = 'https://black-lantern-cycle.keithparker1901.chatgpt.site/';
  const variants = [
    { name: 'plain', headers: {} },
    { name: 'forwarded-host', headers: { 'x-forwarded-host': 'rkeithparkerbooks.com', 'x-forwarded-proto': 'https' } },
    { name: 'original-host', headers: { 'x-original-host': 'rkeithparkerbooks.com', 'x-forwarded-proto': 'https' } },
    { name: 'forwarded-standard', headers: { forwarded: 'host=rkeithparkerbooks.com;proto=https' } },
    { name: 'rewrite-headers', headers: { 'x-vercel-forwarded-for': '203.0.113.42', 'x-forwarded-host': 'rkeithparkerbooks.com', 'x-forwarded-proto': 'https' } }
  ];
  const output = [];

  for (const variant of variants) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36',
          accept: 'text/html,application/xhtml+xml',
          cookie: `bl_visitor=00000000-0000-4000-8000-${String(variant.name.length).padStart(12, '0')}`,
          referer: 'https://rkeithparkerbooks.com/',
          ...variant.headers
        }
      });
      output.push({
        name: variant.name,
        status: response.status,
        location: response.headers.get('location'),
        setCookie: response.headers.get('set-cookie'),
        contentType: response.headers.get('content-type'),
        text: (await response.text()).slice(0, 500)
      });
    } catch (error) {
      output.push({ name: variant.name, error: String(error) });
    }
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ ok: true, output });
};
