module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ ok: false, message: 'Method not allowed.' }));
  }
  const base = 'https://api.github.com/repos/keithparker1901-del/black-lantern-author-site';
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'black-lantern-site-diagnostics/1.0',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  try {
    const runsResponse = await fetch(`${base}/actions/runs?per_page=10`, { headers });
    const runs = await runsResponse.json();
    const selected = (runs.workflow_runs || []).map(run => ({
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      head_sha: run.head_sha,
      run_number: run.run_number,
      html_url: run.html_url,
      jobs_url: run.jobs_url,
      created_at: run.created_at,
      updated_at: run.updated_at
    }));
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ ok: true, runs: selected });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
};
