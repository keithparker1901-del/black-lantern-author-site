const esc = (s) => String(s ?? '').replace(/[&<>\"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const fmt = (n) => Number(n || 0).toLocaleString();
const pct = (n) => `${Number(n || 0).toFixed(1)}%`;

function metricCard(label, value, note = '') {
  return `<div class="card"><span>${esc(label)}</span><div class="num">${esc(value)}</div>${note ? `<small class="metric-note">${esc(note)}</small>` : ''}</div>`;
}

function rows(days) {
  return Object.entries(days || {}).sort((a,b) => b[0].localeCompare(a[0])).slice(0,7)
    .map(([day,count]) => `<div class="row"><span>${esc(day)}</span><strong>${fmt(count)}</strong></div>`).join('');
}

function listRows(items, empty = 'No data yet.') {
  if (!items?.length) return `<p class="muted">${esc(empty)}</p>`;
  return items.map((item) => `<div class="row"><span>${esc(item.name)}</span><strong>${fmt(item.count)}</strong></div>`).join('');
}

function sourceTable(items, totalVisits) {
  const body = (items || []).map((item) => `<tr><th scope="row">${esc(item.name)}</th><td>${fmt(item.readers)}</td><td>${fmt(item.visits)}</td><td>${pct(item.share)}</td></tr>`).join('');
  return `<div class="source-table-wrap"><table class="source-table"><thead><tr><th>Traffic source</th><th>Readers</th><th>Visits</th><th>Share</th></tr></thead><tbody>${body}</tbody></table></div><p class="muted table-note">${fmt(totalVisits)} total sessions in the current durable record.</p>`;
}

function periodTable(periods = {}) {
  const entries = [
    ['Last 7 days', periods.sevenDays],
    ['Last 30 days', periods.thirtyDays],
    ['Lifetime', periods.lifetime]
  ];
  const body = entries.map(([label, data]) => `<tr><th scope="row">${esc(label)}</th><td>${fmt(data?.uniqueReaders)}</td><td>${fmt(data?.visits)}</td><td>${fmt(data?.pageViews)}</td></tr>`).join('');
  return `<div class="source-table-wrap"><table class="source-table"><thead><tr><th>Period</th><th>Readers</th><th>Visits</th><th>Page views</th></tr></thead><tbody>${body}</tbody></table></div>`;
}

function recent(items) {
  if (!items?.length) return '<p class="muted">No stored retailer exits yet.</p>';
  return items.map((item) => `<div class="click-row"><div><strong>${esc(item.destination)}</strong><br>${esc(item.label)} <span class="tag">${esc(item.attribution || 'Direct')}</span><br><span class="muted">From ${esc(item.pagePath)} · ${esc(item.at)}</span>${item.campaign ? `<br><span class="muted">Campaign: ${esc(item.campaign)}</span>` : ''}</div>${item.rawPagePath && item.rawPagePath !== item.pagePath ? `<details><summary>Raw attribution URL</summary><code>${esc(item.rawPagePath)}</code></details>` : ''}</div>`).join('');
}

function installOwnerControls() {
  const key = 'black_lantern_analytics_excluded';
  const status = document.getElementById('owner-browser-status');
  const exclude = document.getElementById('exclude-owner-browser');
  const include = document.getElementById('include-owner-browser');
  if (!status || !exclude || !include) return;

  const refresh = () => {
    let excluded = false;
    try { excluded = localStorage.getItem(key) === '1'; } catch {}
    status.textContent = excluded ? 'This browser is excluded from public-site analytics.' : 'This browser is currently counted on public-site visits.';
    exclude.disabled = excluded;
    include.disabled = !excluded;
  };

  exclude.addEventListener('click', () => { try { localStorage.setItem(key, '1'); } catch {} refresh(); });
  include.addEventListener('click', () => { try { localStorage.removeItem(key); } catch {} refresh(); });
  refresh();
}

async function loadAnalytics() {
  const status = document.getElementById('status');
  const app = document.getElementById('app');
  status.textContent = 'Loading…';
  app.innerHTML = '';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch('/api/private-analytics', { cache:'no-store', signal:controller.signal });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { throw new Error(`Analytics API returned ${response.status} instead of JSON.`); }
    if (!response.ok) throw new Error(data.message || `Analytics API error ${response.status}.`);
    status.textContent = '';

    const legacy = data.legacy || {};
    app.innerHTML = `
      <section class="live-section">
        <div class="section-kicker">Publishing decision dashboard</div>
        <h2>Reader funnel and site performance</h2>
        <p class="muted">Unique readers are anonymous browser IDs. A visit is a 30-minute session. Page views are individual pages loaded by counted human readers.</p>

        <div class="cards metric-cards">
          ${metricCard('Unique readers', fmt(data.uniqueReaders), 'Audience size')}
          ${metricCard('Visits', fmt(data.visits), 'Repeat interest')}
          ${metricCard('Page views', fmt(data.pageViews), 'Depth of browsing')}
          ${metricCard('Book One visitors', fmt(data.bookOneVisitors), 'Funnel entry')}
          ${metricCard('Chapter One opens', fmt(data.chapterOneOpens), 'Reading intent')}
          ${metricCard('Amazon clicks', fmt(data.amazonClicks), 'Purchase intent')}
          ${metricCard('Paperback Direct clicks', fmt(data.paperbackDirectClicks), 'Purchase intent')}
          ${metricCard('Email signups', fmt(data.emailSignups), 'Owned audience')}
          ${metricCard('Pinterest visitors', fmt(data.pinterestVisitors), 'Campaign effectiveness')}
          ${metricCard('Conversion rate', pct(data.conversionRate), 'Book One → retailer')}
        </div>

        <div class="traffic-source-panel">
          <div class="section-kicker">Conversion health</div>
          <h3>Three rates that matter</h3>
          <div class="cards rate-cards">
            ${metricCard('Chapter open rate', pct(data.chapterOpenRate), 'Book One → Chapter One')}
            ${metricCard('Retailer click rate', pct(data.retailerClickRate), 'Book One → retailer')}
            ${metricCard('Email signup rate', pct(data.emailSignupRate), 'Reader → subscriber')}
          </div>
          <p class="muted">Chapter One and signup events begin accumulating from this upgraded tracker forward; older anonymous page views cannot be reconstructed into those events.</p>
        </div>

        <div class="traffic-source-panel">
          <div class="section-kicker">7 / 30 / lifetime</div>
          <h3>Audience trend</h3>
          ${periodTable(data.periods)}
        </div>

        <div class="traffic-source-panel">
          <div class="section-kicker">Top traffic sources</div>
          <h3>Where readers are coming from</h3>
          <p class="muted">Pinterest, Facebook, Instagram, YouTube, Google/Search, email, Goodreads, BookBub, direct, and other referrals are classified from UTM tags and browser referrers.</p>
          ${sourceTable(data.trafficSources, data.visits)}
        </div>

        <div class="decision-flow" aria-label="Publishing funnel reporting order">
          <strong>Top traffic sources</strong><span>→</span><strong>Top landing pages</strong><span>→</span><strong>Reader actions</strong><span>→</span><strong>Retailer exits</strong>
        </div>

        <div class="two-col">
          <div><h3>Top landing pages</h3>${listRows(data.landingPages, 'No session landing pages yet.')}</div>
          <div><h3>Reader actions</h3>${listRows(data.readerActions, 'No reader actions yet.')}</div>
        </div>
        <div class="two-col">
          <div><h3>Retailer exits</h3>${listRows(data.retailerExits, 'No retailer exits yet.')}</div>
          <div><h3>Recent page-view days</h3>${rows(data.days) || '<p class="muted">No stored visits yet.</p>'}</div>
        </div>

        <h3>Most recent retailer and outbound clicks</h3>
        ${recent(data.recent)}
      </section>

      <section class="legacy-section">
        <div class="section-kicker">Recovered historical baseline</div>
        <h2>Prior Lantern Road record</h2>
        <p class="muted">These earlier totals remain separate so the upgraded durable tracker does not double-count them. They did not preserve enough event detail to reconstruct sessions, Chapter One opens, or modern source attribution.</p>
        <div class="cards legacy-cards">
          ${metricCard('Total visits', fmt(legacy.totalVisits))}
          ${metricCard('Unique visitors', fmt(legacy.uniqueVisitors))}
          ${metricCard('Outbound clicks', fmt(legacy.totalOutboundClicks))}
          ${metricCard('Unique clickers', fmt(legacy.uniqueClickers))}
        </div>
        <div class="two-col"><div><h3>Recovered daily record</h3>${rows(legacy.days)}</div><div><h3>Historical clicks by destination</h3>${listRows(Object.entries(legacy.byDestination || {}).map(([name,count]) => ({name,count})))}</div></div>
        <h3>Recovered recent clicks</h3>${recent(legacy.recent)}
      </section>`;
  } catch (error) {
    status.textContent = error.name === 'AbortError' ? 'Analytics request timed out. Please refresh.' : error.message;
  } finally {
    clearTimeout(timeout);
  }
}

document.getElementById('refresh-count').addEventListener('click', loadAnalytics);
installOwnerControls();
loadAnalytics();
