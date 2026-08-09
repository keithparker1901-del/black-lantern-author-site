const esc = (s) => String(s ?? '').replace(/[&<>\"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));

async function loadAnalytics() {
  const status = document.getElementById('status');
  const app = document.getElementById('app');
  status.textContent = 'Loading…';
  app.innerHTML = '';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch('/api/private-analytics', {
      cache: 'no-store',
      signal: controller.signal
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Analytics API returned ${response.status} instead of JSON.`);
    }

    if (!response.ok) throw new Error(data.message || `Analytics API error ${response.status}.`);

    status.textContent = '';
    const days = Object.entries(data.days || {}).sort((a,b) => b[0].localeCompare(a[0])).slice(0,7);
    const destinations = Object.entries(data.byDestination || {}).sort((a,b) => b[1]-a[1]);

    app.innerHTML = `
      <div class="cards">
        <div class="card">Total visits<div class="num">${data.totalVisits}</div></div>
        <div class="card">Unique visitors<div class="num">${data.uniqueVisitors}</div></div>
        <div class="card">Outbound clicks<div class="num">${data.totalOutboundClicks}</div></div>
        <div class="card">Unique clickers<div class="num">${data.uniqueClickers}</div></div>
      </div>
      <h2>Last seven recorded days</h2>
      ${days.map(([day,count]) => `<div class="row">${esc(day)} <strong>${count}</strong></div>`).join('') || '<p class="muted">No stored visits yet.</p>'}
      <h2>Clicks by destination</h2>
      ${destinations.map(([name,count]) => `<div class="row">${esc(name)} <strong>${count}</strong></div>`).join('') || '<p class="muted">No stored clicks yet.</p>'}
      <h2>Most recent clicks</h2>
      ${(data.recent || []).map((item) => `<div class="row"><strong>${esc(item.destination)}</strong> ${esc(item.label)} <span class="tag">${esc(item.attribution)}</span><br><span class="muted">From ${esc(item.pagePath)} · ${esc(item.at)}</span>${item.campaign ? `<br><span class="muted">Campaign: ${esc(item.campaign)}</span>` : ''}${item.rawPagePath !== item.pagePath ? `<details><summary>Raw attribution URL</summary><code>${esc(item.rawPagePath)}</code></details>` : ''}</div>`).join('') || '<p class="muted">No stored clicks yet.</p>'}
    `;
  } catch (error) {
    status.textContent = error.name === 'AbortError' ? 'Analytics request timed out. Please refresh.' : error.message;
  } finally {
    clearTimeout(timeout);
  }
}

document.getElementById('refresh-count').addEventListener('click', loadAnalytics);
loadAnalytics();
