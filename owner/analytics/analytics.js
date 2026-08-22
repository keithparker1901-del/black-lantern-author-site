const esc = (s) => String(s ?? '').replace(/[&<>\"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));

function rows(days) {
  return Object.entries(days || {}).sort((a,b) => b[0].localeCompare(a[0])).slice(0,7)
    .map(([day,count]) => `<div class="row"><span>${esc(day)}</span><strong>${count}</strong></div>`).join('');
}

function destinations(data) {
  return Object.entries(data || {}).sort((a,b) => b[1]-a[1])
    .map(([name,count]) => `<div class="row"><span>${esc(name)}</span><strong>${count}</strong></div>`).join('');
}

function sourceTable(data, total, order) {
  const names = (order && order.length) ? order : ['Facebook Paid','Facebook Organic','Google/Search','Direct','Goodreads','BookBub','Other'];
  const body = names.map((name) => {
    const count = Number(data?.[name] || 0);
    const pct = total ? ((count / total) * 100).toFixed(1) : '0.0';
    return `<tr><th scope="row">${esc(name)}</th><td>${count.toLocaleString()}</td><td>${pct}%</td></tr>`;
  }).join('');
  return `<div class="source-table-wrap"><table class="source-table"><thead><tr><th>Traffic source</th><th>Visits</th><th>Share</th></tr></thead><tbody>${body}</tbody></table></div>`;
}

function recent(items) {
  return (items || []).map((item) => `<div class="click-row"><div><strong>${esc(item.destination)}</strong><br>${esc(item.label)} <span class="tag">${esc(item.attribution || 'Direct')}</span><br><span class="muted">From ${esc(item.pagePath)} · ${esc(item.at)}</span>${item.campaign ? `<br><span class="muted">Campaign: ${esc(item.campaign)}</span>` : ''}</div>${item.rawPagePath && item.rawPagePath !== item.pagePath ? `<details><summary>Raw attribution URL</summary><code>${esc(item.rawPagePath)}</code></details>` : ''}</div>`).join('');
}

async function loadAnalytics() {
  const status = document.getElementById('status');
  const app = document.getElementById('app');
  status.textContent = 'Loading…'; app.innerHTML = '';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch('/api/private-analytics', { cache:'no-store', signal:controller.signal });
    const text = await response.text();
    let data; try { data = JSON.parse(text); } catch { throw new Error(`Analytics API returned ${response.status} instead of JSON.`); }
    if (!response.ok) throw new Error(data.message || `Analytics API error ${response.status}.`);
    status.textContent = '';
    const legacy = data.legacy || {};
    app.innerHTML = `
      <section class="live-section">
        <div class="section-kicker">Live durable counter</div>
        <h2>Current tracking</h2>
        <p class="muted">New visits and reader actions recorded since the private Vercel analytics store went live.</p>
        <div class="cards">
          <div class="card">Total visits<div class="num">${data.totalVisits}</div></div>
          <div class="card">Unique visitors<div class="num">${data.uniqueVisitors}</div></div>
          <div class="card">Outbound clicks<div class="num">${data.totalOutboundClicks}</div></div>
          <div class="card">Unique clickers<div class="num">${data.uniqueClickers}</div></div>
        </div>
        <div class="traffic-source-panel">
          <div class="section-kicker">Reader acquisition</div>
          <h3>Visits by source</h3>
          <p class="muted">Classified from campaign tags and recorded referrers. Direct includes visits where no outside source was available to the browser.</p>
          ${sourceTable(data.bySource, data.totalVisits, data.sourceOrder)}
        </div>
        <div class="two-col"><div><h3>Recent recorded days</h3>${rows(data.days) || '<p class="muted">No stored visits yet.</p>'}</div><div><h3>Clicks by destination</h3>${destinations(data.byDestination) || '<p class="muted">No stored clicks yet.</p>'}</div></div>
        <h3>Most recent live clicks</h3>${recent(data.recent) || '<p class="muted">No stored clicks yet.</p>'}
      </section>
      <section class="legacy-section">
        <div class="section-kicker">Recovered historical baseline</div>
        <h2>Prior Lantern Road record</h2>
        <p class="muted">Preserved from the earlier Visitor Clicker. These figures are shown separately and are not added to the new durable totals, avoiding double-counting. The old baseline did not preserve enough attribution data to reconstruct a reliable traffic-source table.</p>
        <div class="cards legacy-cards">
          <div class="card">Total visits<div class="num">${legacy.totalVisits ?? 0}</div></div>
          <div class="card">Unique visitors<div class="num">${legacy.uniqueVisitors ?? 0}</div></div>
          <div class="card">Outbound clicks<div class="num">${legacy.totalOutboundClicks ?? 0}</div></div>
          <div class="card">Unique clickers<div class="num">${legacy.uniqueClickers ?? 0}</div></div>
        </div>
        <div class="two-col"><div><h3>Recovered daily record</h3>${rows(legacy.days)}</div><div><h3>Historical clicks by destination</h3>${destinations(legacy.byDestination)}</div></div>
        <h3>Recovered recent clicks</h3>${recent(legacy.recent)}
      </section>`;
  } catch (error) {
    status.textContent = error.name === 'AbortError' ? 'Analytics request timed out. Please refresh.' : error.message;
  } finally { clearTimeout(timeout); }
}

document.getElementById('refresh-count').addEventListener('click', loadAnalytics);
loadAnalytics();
