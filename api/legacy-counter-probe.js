module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false });

  const origins = [
    'https://black-lantern-cycle.keithparker1901.chatgpt.site/',
    'https://rkeithparkerbooks.com/'
  ];
  const pattern = /visitor|visit|click|owner|analytics|counter|metric|outbound|\/api\//i;
  const output = [];
  const headers = {
    'user-agent': 'Mozilla/5.0 BlackLanternCounterMigration/1.0',
    accept: 'text/html,application/javascript,*/*'
  };

  for (const origin of origins) {
    try {
      const homeResponse = await fetch(origin, { headers, redirect: 'follow' });
      const html = await homeResponse.text();
      output.push({ type: 'home', requested: origin, finalUrl: homeResponse.url, status: homeResponse.status, matches: snippets(html, pattern) });

      const sources = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)]
        .map(match => new URL(match[1], homeResponse.url).href)
        .slice(0, 40);

      for (const source of sources) {
        try {
          const response = await fetch(source, { headers, redirect: 'follow' });
          const text = await response.text();
          const matches = snippets(text, pattern);
          if (matches.length) output.push({ type: 'script', requested: source, finalUrl: response.url, status: response.status, matches });
        } catch (error) {
          output.push({ type: 'script-error', requested: source, error: String(error) });
        }
      }
    } catch (error) {
      output.push({ type: 'home-error', requested: origin, error: String(error) });
    }
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ ok: true, output });
};

function snippets(text, pattern) {
  const found = [];
  const lines = String(text || '').split(/\r?\n/);
  for (let index = 0; index < lines.length && found.length < 80; index += 1) {
    if (!pattern.test(lines[index])) continue;
    const start = Math.max(0, index - 1);
    const end = Math.min(lines.length, index + 2);
    found.push(lines.slice(start, end).join('\n').slice(0, 4000));
  }
  return found;
}
