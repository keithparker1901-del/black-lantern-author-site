module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false });

  const pages = [
    'https://rkeithparkerbooks.com/',
    'https://rkeithparkerbooks.com/owner/visits',
    'https://black-lantern-cycle.keithparker1901.chatgpt.site/owner/visits'
  ];
  const pattern = /visitor|visit|click|owner|analytics|counter|metric|outbound|human|bot|unique|\/api\//ig;
  const output = [];
  const headers = {
    'user-agent': 'Mozilla/5.0 BlackLanternCounterMigration/1.0',
    accept: 'text/html,application/javascript,*/*'
  };
  const assets = new Set();

  for (const page of pages) {
    try {
      const response = await fetch(page, { headers, redirect: 'follow' });
      const text = await response.text();
      output.push({ type: 'page', requested: page, finalUrl: response.url, status: response.status, contentType: response.headers.get('content-type'), matches: snippets(text, pattern, 20) });

      for (const match of text.matchAll(/(?:src|href)=["']([^"']+\.js(?:\?[^"']*)?)["']/gi)) {
        try { assets.add(new URL(match[1], response.url).href); } catch {}
      }
    } catch (error) {
      output.push({ type: 'page-error', requested: page, error: String(error) });
    }
  }

  const priority = [...assets].sort((a, b) => {
    const score = value => /outbound|visit|owner|analytics|author-settings|index-/i.test(value) ? 0 : 1;
    return score(a) - score(b);
  }).slice(0, 45);

  for (const source of priority) {
    try {
      const response = await fetch(source, { headers, redirect: 'follow' });
      const text = await response.text();
      const matches = snippets(text, pattern, 30);
      if (matches.length) output.push({ type: 'asset', requested: source, finalUrl: response.url, status: response.status, bytes: text.length, matches });
    } catch (error) {
      output.push({ type: 'asset-error', requested: source, error: String(error) });
    }
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ ok: true, assetCount: assets.size, output });
};

function snippets(text, pattern, limit) {
  const source = String(text || '');
  const found = [];
  pattern.lastIndex = 0;
  let match;
  while ((match = pattern.exec(source)) && found.length < limit) {
    const start = Math.max(0, match.index - 650);
    const end = Math.min(source.length, match.index + 1000);
    found.push(source.slice(start, end));
    if (match.index === pattern.lastIndex) pattern.lastIndex += 1;
  }
  return found;
}
