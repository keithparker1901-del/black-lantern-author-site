(() => {
  'use strict';

  const esc = value => String(value ?? '').replace(/[&<>\"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[char]));
  const fmt = value => Number(value || 0).toLocaleString();
  const pct = value => `${Number(value || 0).toFixed(1)}%`;

  function funnelTable(stages = []) {
    const rows = stages.map((stage, index) => `
      <tr>
        <th scope="row">${esc(stage.label)}</th>
        <td>${fmt(stage.count)}</td>
        <td>${index === 0 ? 'Baseline' : pct(stage.fromPriorRate)}</td>
      </tr>`).join('');
    return `<div class="source-table-wrap"><table class="source-table"><thead><tr><th>Stage</th><th>Unique readers</th><th>From prior stage</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function sourceTable(rows = []) {
    const body = rows.map(row => `
      <tr>
        <th scope="row">${esc(row.source)}</th>
        <td>${fmt(row.sessions)}</td>
        <td>${fmt(row.bookOneVisitors)}</td>
        <td>${fmt(row.chapterStarts)}</td>
        <td>${fmt(row.halfwayReaders)}</td>
        <td>${fmt(row.chapterCompletes)}</td>
        <td>${fmt(row.retailerClickers)}</td>
      </tr>`).join('');
    return `<div class="source-table-wrap"><table class="source-table"><thead><tr><th>Source</th><th>Site sessions</th><th>Book One</th><th>Starts</th><th>50%</th><th>Complete</th><th>Retailer</th></tr></thead><tbody>${body}</tbody></table></div>`;
  }

  function metric(label, value, note) {
    return `<div class="card"><span>${esc(label)}</span><div class="num">${esc(value)}</div><small class="metric-note">${esc(note)}</small></div>`;
  }

  function waitForLiveSection(timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const found = document.querySelector('.live-section');
      if (found) return resolve(found);
      const observer = new MutationObserver(() => {
        const section = document.querySelector('.live-section');
        if (!section) return;
        observer.disconnect();
        resolve(section);
      });
      observer.observe(document.getElementById('app') || document.body, {childList:true, subtree:true});
      setTimeout(() => {
        observer.disconnect();
        reject(new Error('Publishing dashboard did not finish loading.'));
      }, timeoutMs);
    });
  }

  async function loadFunnel() {
    let data;
    try {
      const response = await fetch('/api/book-one-funnel', {cache:'no-store'});
      data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || `Funnel API error ${response.status}.`);
    } catch (error) {
      console.warn('Book One funnel could not load', error);
      return;
    }

    let live;
    try { live = await waitForLiveSection(); } catch { return; }

    live.querySelector('[data-book-one-funnel]')?.remove();
    const panel = document.createElement('div');
    panel.className = 'traffic-source-panel';
    panel.dataset.bookOneFunnel = 'true';
    panel.innerHTML = `
      <div class="section-kicker">Book One conversion funnel</div>
      <h3>From landing page to reader action</h3>
      <p class="muted">This section uses unique anonymous browser IDs, so repeat milestone events from the same reader do not inflate the funnel.</p>
      ${funnelTable(data.stages)}
      <div class="cards rate-cards">
        ${metric('Chapter start rate', pct(data.rates.startRate), 'Book One → Chapter One')}
        ${metric('Halfway rate', pct(data.rates.halfwayRate), 'Starts → 50%')}
        ${metric('Completion rate', pct(data.rates.completionRate), 'Starts → complete')}
        ${metric('Retailer click rate', pct(data.rates.retailerRate), 'Book One → retailer')}
        ${metric('Finish → retailer', pct(data.rates.finisherToRetailerRate), 'Completed excerpt → retailer')}
      </div>
      <p class="muted">${esc(data.trackingStartNote)} Reading depth is a scroll-depth proxy through the visible excerpt, not proof that every word was read.</p>
      <h3>Retailer detail</h3>
      <div class="cards rate-cards">
        ${metric('Amazon clickers', fmt(data.counts.amazonClickers), 'Unique Book One readers')}
        ${metric('Identified Kindle clickers', fmt(data.counts.kindleClickers), 'Only links labeled Kindle/eBook')}
        ${metric('Identified paperback clickers', fmt(data.counts.paperbackClickers), 'Only links labeled paperback/print')}
        ${metric('Book One email signups', fmt(data.counts.bookOneEmailSignups), 'Attributed from Book One')}
      </div>
      <h3>Funnel by traffic source</h3>
      <p class="muted">This is the table to use when deciding whether Facebook, Instagram, Pinterest, search, or direct traffic is sending actual readers rather than only visits.</p>
      ${sourceTable(data.sourceRows)}
    `;

    const metrics = live.querySelector('.metric-cards');
    if (metrics) metrics.insertAdjacentElement('afterend', panel);
    else live.prepend(panel);
  }

  document.getElementById('refresh-count')?.addEventListener('click', () => {
    setTimeout(loadFunnel, 50);
  });
  loadFunnel();
})();
