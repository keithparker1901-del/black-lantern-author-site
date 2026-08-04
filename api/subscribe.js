const crypto = require('crypto');

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

function sign(email, secret) {
  const encoded = Buffer.from(email.toLowerCase()).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, message: 'Method not allowed.' });
  const { email = '', firstName = '', consent = false, website = '' } = parseBody(req);
  if (website) return json(res, 200, { ok: true }); // honeypot
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanName = String(firstName).trim().slice(0, 80);
  if (!consent || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return json(res, 400, { ok: false, message: 'Enter a valid email address and confirm consent.' });
  }
  const apiKey = process.env.RESEND_API_KEY;
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!apiKey || !secret) {
    return json(res, 503, { ok: false, message: 'The Lantern Road is being connected. Please try again soon.' });
  }
  const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'User-Agent': 'rkeithparkerbooks.com/1.0' };
  const contactPayload = { email: cleanEmail, firstName: cleanName || undefined, unsubscribed: false };
  if (process.env.RESEND_SEGMENT_ID) contactPayload.segments = [{ id: process.env.RESEND_SEGMENT_ID }];
  const contactResponse = await fetch('https://api.resend.com/contacts', { method: 'POST', headers, body: JSON.stringify(contactPayload) });
  if (!contactResponse.ok && contactResponse.status !== 409) {
    const detail = await contactResponse.text();
    console.error('Resend contact error', contactResponse.status, detail);
    return json(res, 502, { ok: false, message: 'The road could not record your address. Please try again.' });
  }
  const token = sign(cleanEmail, secret);
  const origin = process.env.PUBLIC_SITE_URL || 'https://black-lantern-author-site.vercel.app';
  const unsubscribeUrl = `${origin}/unsubscribe/?token=${encodeURIComponent(token)}`;
  const guideUrl = `${origin}/reader-guide/`;
  const greeting = cleanName ? `Dear ${cleanName},` : 'Dear Reader,';
  const emailPayload = {
    from: 'R. Keith Parker <lantern@send.rkeithparkerbooks.com>',
    to: [cleanEmail],
    subject: 'Welcome to the Lantern Road',
    html: `<div style="font-family:Georgia,serif;max-width:620px;margin:auto;background:#11100e;color:#eee7d8;padding:32px;border:1px solid #8f7745"><p>${greeting}</p><p>Thank you for finding your way to the Lantern Road.</p><p>Your Valegast Manor Reader Guide is ready:</p><p><a href="${guideUrl}" style="display:inline-block;background:#c8a968;color:#11100e;padding:12px 18px;text-decoration:none;font-weight:bold">Open the Reader Guide</a></p><p>Walk carefully,<br>R. Keith Parker</p><hr style="border:0;border-top:1px solid #4a402d"><p style="font-size:12px;color:#bdb4a4">You received this message after joining the Lantern Road at rkeithparkerbooks.com. <a href="${unsubscribeUrl}" style="color:#d9c17c">Unsubscribe</a>.</p></div>`
  };
  const mailResponse = await fetch('https://api.resend.com/emails', { method: 'POST', headers, body: JSON.stringify(emailPayload) });
  if (!mailResponse.ok) {
    const detail = await mailResponse.text();
    console.error('Resend email error', mailResponse.status, detail);
    return json(res, 502, { ok: false, message: 'Your address was recorded, but the guide email could not be sent yet.' });
  }
  return json(res, 200, { ok: true, message: 'Welcome to the Lantern Road. Check your inbox for the reader guide.' });
};
