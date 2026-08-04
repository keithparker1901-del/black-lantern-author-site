export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  try {
    const runsResponse = await fetch(
      'https://api.github.com/repos/keithparker1901-del/black-lantern-author-site/actions/runs?per_page=12',
      { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'black-lantern-site-diagnostics' } }
    );
    const data = await runsResponse.json();
    const runs = (data.workflow_runs || []).map(run => ({
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      head_sha: run.head_sha,
      run_number: run.run_number,
      jobs_url: run.jobs_url,
      html_url: run.html_url,
      created_at: run.created_at,
      updated_at: run.updated_at
    }));
    response.status(runsResponse.status).json({ ok: runsResponse.ok, runs });
  } catch (error) {
    response.status(500).json({ ok: false, error: error.message });
  }
}
