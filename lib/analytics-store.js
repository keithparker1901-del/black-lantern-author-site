const { put, list } = require('@vercel/blob');

const PREFIX = 'private-analytics/events/';

function clean(value, max) {
  return String(value || '').replace(/[\r\n\t]+/g, ' ').slice(0, max);
}

function hasStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function storeEvent(event) {
  if (!hasStorage()) return { stored: false, reason: 'blob-not-configured' };
  const at = event.at || new Date().toISOString();
  const day = at.slice(0, 10);
  const kind = clean(event.event || event.kind || 'event', 40).replace(/[^a-z0-9_-]+/gi, '-').toLowerCase();
  const name = `${PREFIX}${day}/${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.json`;
  const body = JSON.stringify({ ...event, at });
  const result = await put(name, body, {
    access: 'private',
    addRandomSuffix: false,
    contentType: 'application/json',
    token: process.env.BLOB_READ_WRITE_TOKEN
  });
  return { stored: true, pathname: result.pathname };
}

async function loadEvents(limit = 3000) {
  if (!hasStorage()) return { configured: false, events: [] };
  const events = [];
  let cursor;
  do {
    const result = await list({
      prefix: PREFIX,
      limit: Math.min(1000, Math.max(1, limit - events.length)),
      cursor,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    for (const blob of result.blobs || []) {
      if (events.length >= limit) break;
      try {
        const response = await fetch(blob.downloadUrl || blob.url, {
          headers: blob.downloadUrl ? undefined : { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
        });
        if (!response.ok) continue;
        events.push(await response.json());
      } catch {}
    }
    cursor = result.cursor;
  } while (cursor && events.length < limit);
  return { configured: true, events };
}

module.exports = { clean, hasStorage, storeEvent, loadEvents };
