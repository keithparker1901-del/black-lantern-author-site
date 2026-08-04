module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false });
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'black-lantern-site-diagnostics/1.0',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  const response = await fetch('https://api.github.com/repos/keithparker1901-del/black-lantern-author-site/actions/runs?per_page=10', { headers });
  const data = await response.json();
  const runs = (data.workflow_runs || []).map(run => ({
    id: run.id,
    name: run.name,
    status: run.status,
    conclusion: run.conclusion,
    head_sha: run.head_sha,
    run_number: run.run_number,
    created_at: run.created_at,
    updated_at: run.updated_at
  }));
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ ok: true, runs });
};
