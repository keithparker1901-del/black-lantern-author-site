export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, message: 'Method not allowed.' });
  }

  const results = {};

  async function capture(name, url, options = {}) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; RKeithParkerSiteMigration/1.0)',
          accept: options.accept || 'text/html,application/json;q=0.9,*/*;q=0.8'
        }
      });
      const text = await response.text();
      results[name] = {
        ok: response.ok,
        status: response.status,
        url: response.url,
        contentType: response.headers.get('content-type'),
        text: text.slice(0, options.limit || 400000)
      };
    } catch (error) {
      results[name] = { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  await Promise.all([
    capture('liveSite', 'https://rkeithparkerbooks.com/', { limit: 600000 }),
    capture('oldSite', 'https://black-lantern-cycle.keithparker1901.chatgpt.site/', { limit: 600000 }),
    capture('goodreadsManor', 'https://www.goodreads.com/book/auto_complete?format=json&q=The%20Manor%20That%20Drank%20the%20Road%20R%20Keith%20Parker', { accept: 'application/json', limit: 200000 }),
    capture('goodreadsValley', 'https://www.goodreads.com/book/auto_complete?format=json&q=The%20Valley%20That%20Laughed%20at%20the%20Lantern%20R%20Keith%20Parker', { accept: 'application/json', limit: 200000 }),
    capture('bookbubSearch', 'https://www.bookbub.com/search?search=R.%20Keith%20Parker', { limit: 300000 })
  ]);

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ ok: true, results });
}
