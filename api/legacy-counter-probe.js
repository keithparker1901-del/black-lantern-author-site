module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false });

  const urls = [
    'https://rkeithparkerbooks.com/',
    'https://black-lantern-cycle.keithparker1901.chatgpt.site/'
  ];
  const output = [];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36',
          accept: 'text/html,application/xhtml+xml'
        }
      });
      const text = await response.text();
      output.push({
        requested: url,
        status: response.status,
        location: response.headers.get('location'),
        setCookie: response.headers.get('set-cookie'),
        vary: response.headers.get('vary'),
        cacheControl: response.headers.get('cache-control'),
        server: response.headers.get('server'),
        cookieTerms: [...new Set([...text.matchAll(/.{0,200}(?:document\.cookie|cookie|visitor[_-]?id|visit[_-]?id|analytics[_-]?id).{0,400}/gi)].map(match => match[0]))].slice(0, 30)
      });
    } catch (error) {
      output.push({ requested: url, error: String(error) });
    }
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ ok: true, output });
};
