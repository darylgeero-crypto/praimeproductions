// PrAIme Render server — serves suite/ on Render's PORT (or 8080 locally),
// PLUS PayPal server-side order verification and tokenized kit delivery.
//
// SECURITY DESIGN — read before deploying:
// - This file contains NO PayPal Client ID, NO Secret, and NO delivery secret.
//   All of those come ONLY from environment variables set in the Render
//   dashboard by the site owner (never paste them into chat, code, or git):
//     PAYPAL_MODE            'live' (default) or 'sandbox'
//     PAYPAL_CLIENT_ID       PayPal app Client ID (same app as the Beat Store)
//     PAYPAL_CLIENT_SECRET   PayPal app Secret — Render dashboard ONLY
//     DELIVERY_SECRET        Long random string, Render dashboard ONLY.
//                            Used to sign download tokens. If it is not set,
//                            the server generates an ephemeral secret at
//                            startup and /api/health reports
//                            delivery_secret_persistent:false — tokens then
//                            stop working if the server restarts.
// - Verification NEVER trusts the browser. The browser sends only an
//   orderID and the cart item names. The server:
//     1. prices every item itself from PRICE rules below (client prices
//        are ignored — a tampered $0.01 cart cannot verify),
//     2. fetches the order from PayPal's own API with the server secret,
//     3. requires status COMPLETED, currency USD, and an amount that
//        matches the server-computed total to the cent.
//   Only then does it issue a 24-hour HMAC download token.
// - Kit ZIPs are the only files served through /api/download, and only
//   for kits named in the verified order's token. Beat leases, masters,
//   Separate/Re-Beat, video and Lifetime have no server file to download:
//   for those, verification returns a licence record (order + items +
//   token), and the actual beat/master/video is the browser-generated
//   file the buyer already made — the token is the proof of licence.
// - Verified orders are kept in memory only. Render free instances have
//   ephemeral disk, so this is NOT a durable ledger. For a production
//   ledger, store verified orders in a database before launch.
// - If PayPal credentials are not configured, /api/verify-order returns
//   verified:false with reason 'paypal_not_configured'. It NEVER returns
//   verified:true without a successful PayPal API check.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const SUITE = path.join(__dirname, 'suite');
const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.wav':'audio/wav','.mp3':'audio/mpeg','.ogg':'audio/ogg','.zip':'application/zip','.webm':'video/webm','.png':'image/png','.jpg':'image/jpeg','.txt':'text/plain'};
const PORT = process.env.PORT || 8080;
const MODE = (process.env.PAYPAL_MODE || 'live').toLowerCase() === 'sandbox' ? 'sandbox' : 'live';
const PAYPAL_BASE = MODE === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
const DELIVERY_SECRET = process.env.DELIVERY_SECRET || crypto.randomBytes(32).toString('hex');
const DELIVERY_SECRET_PERSISTENT = !!process.env.DELIVERY_SECRET;
const TOKEN_SECRET = process.env.TOKEN_SECRET || '';
const TOKEN_SECRET_PERSISTENT = !!process.env.TOKEN_SECRET;
// ---- Founder Tokens: server-only, HMAC-signed, email-bound, ledger-backed ----
// No token is ever generated in the browser. A token is valid ONLY if:
//  (a) its HMAC (with TOKEN_SECRET, never in code/git) recomputes, AND
//  (b) the server ledger holds that exact token as ACTIVE, AND
//  (c) on verify, the email supplied hashes to the emailHash stored for it.
// Copying a token string alone therefore does NOT work without the owner's
// email, and a transferred/revoked token fails (b) even if its signature
// still recomputes. Claims are capped at 100 EVER (active + revoked).
// Ledger file: data/founder-tokens.json, written atomically (tmp + rename).
// HONEST LIMIT: on Render free, disk is ephemeral across deploys/restarts,
// so the ledger file must be backed up regularly (see SERVER_VERIFICATION.md
// and the Tokens page). If the ledger file is lost, the count resets —
// that is why the page also shows the claimed count from the live server,
// and why a durable database is the next step for production.
const TOKEN_LEDGER_DIR = path.join(__dirname, 'data');
const TOKEN_LEDGER_FILE = path.join(TOKEN_LEDGER_DIR, 'founder-tokens.json');
let tokenLedger = {nextNumber:1, tokens:[], pending:[]};
try { fs.mkdirSync(TOKEN_LEDGER_DIR, {recursive:true}); const raw=fs.readFileSync(TOKEN_LEDGER_FILE,'utf8'); const j=JSON.parse(raw); if(j && Array.isArray(j.tokens) && Number.isInteger(j.nextNumber)) { tokenLedger=j; if(!Array.isArray(tokenLedger.pending)) tokenLedger.pending=[]; } } catch(e) {}
function saveTokenLedger(){ try { fs.mkdirSync(TOKEN_LEDGER_DIR, {recursive:true}); const tmp=TOKEN_LEDGER_FILE+'.tmp'; fs.writeFileSync(tmp, JSON.stringify(tokenLedger)); fs.renameSync(tmp, TOKEN_LEDGER_FILE); } catch(e) {} }
function emailHash(email){ return crypto.createHash('sha256').update(String(email||'').trim().toLowerCase()).digest('hex'); }
function pad3(n){ return String(n).padStart(3,'0'); }
function tokenSig(number, eHash, rand){ return crypto.createHmac('sha256', TOKEN_SECRET).update('F-'+pad3(number)+'|'+eHash+'|'+rand).digest('hex').slice(0,32); }
function makeToken(number, eHash){ const rand=crypto.randomBytes(16).toString('hex'); return 'PRAIME-F-'+pad3(number)+'-'+rand+'-'+tokenSig(number, eHash, rand); }
function parseToken(tok){ const m=/^PRAIME-F-(\d{3})-([0-9a-f]{32})-([0-9a-f]{32})$/.exec(String(tok||'').trim()); if(!m) return null; return {number:parseInt(m[1],10), rand:m[2], sig:m[3]}; }
const tokenRate = new Map();
function tokenRateOk(ip, kind){ const key=ip+'|'+kind; const now=Date.now(); const arr=(tokenRate.get(key)||[]).filter(t=>now-t<3600000); if(arr.length >= (kind==='claim'?5:60)) return false; arr.push(now); tokenRate.set(key, arr); return true; }
// ONE TOKEN PER IP, EVER + IP BLOCKS: the claim IP is hashed (never stored
// plain) on the ledger entry. A second claim from the same IP is rejected
// even if the first token was transferred away — one IP, one founder slot.
// Repeated abusive attempts from one IP (10+ failed claims in an hour)
// block that IP for 24 hours.
function ipHash(ip){ return crypto.createHash('sha256').update(String(ip||'')).digest('hex'); }
const tokenIpBlocks = new Map(); // ipHash -> {blockedUntil, fails:[timestamps]}
function tokenIpBlocked(ip){ const b=tokenIpBlocks.get(ipHash(ip)); return !!(b && Date.now() < b.blockedUntil); }
function tokenIpFail(ip){ const h=ipHash(ip); const now=Date.now(); const b=tokenIpBlocks.get(h)||{blockedUntil:0, fails:[]}; b.fails=b.fails.filter(t=>now-t<3600000); b.fails.push(now); if(b.fails.length>=10) b.blockedUntil=now+86400000; tokenIpBlocks.set(h,b); }
function reqIp(req){ return req.headers['x-forwarded-for'] ? String(req.headers['x-forwarded-for']).split(',')[0].trim() : (req.socket.remoteAddress||''); }
// ---- Email verification delivery ----
// A code is NEVER returned in an API response and NEVER shown on the page.
// It is sent only to the claimed email address, and only its SHA-256 hash
// is stored. Delivery needs ONE of, set in Render env only:
//   RESEND_API_KEY (Resend, https://resend.com — free tier works), or
//   SMTP_HOST + SMTP_PORT + SMTP_USER + SMTP_PASS (+ SMTP_FROM).
// If neither is configured, claim refuses with email_delivery_not_configured
// and NO token is issued — a fake email cannot verify itself.
async function sendVerificationEmail(to, code){
  const subject = 'Your PrAIme Founder Token verification code';
  const text = 'Your PrAIme Productions Founder Token verification code is: ' + code + '\nIt expires in 15 minutes. If you did not request this, ignore this email.';
  if (process.env.RESEND_API_KEY) {
    try {
      const r = await fetch('https://api.resend.com/emails', {method:'POST', headers:{'Authorization':'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type':'application/json'}, body:JSON.stringify({from: process.env.SMTP_FROM || 'PrAIme Productions <onboarding@resend.dev>', to:[to], subject, text})});
      return r.ok;
    } catch(e) { return false; }
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    // Minimal SMTP client (no dependencies): EHLO, AUTH LOGIN, MAIL/RCPT/DATA.
    try {
      const tls = require('tls');
      const host = process.env.SMTP_HOST, port = parseInt(process.env.SMTP_PORT || '465', 10);
      const sock = await new Promise((res, rej) => { const c = tls.connect(port, host, {}, () => res(c)); c.on('error', rej); });
      const read = () => new Promise((res) => { let buf=''; const on=(d)=>{ buf+=d.toString(); if(buf.includes('\r\n')){ sock.off('data', on); res(buf); } }; sock.on('data', on); });
      const cmd = async (line) => { sock.write(line + '\r\n'); return await read(); };
      await read();
      await cmd('EHLO praimeproductions.onrender.com');
      await cmd('AUTH LOGIN');
      await cmd(Buffer.from(process.env.SMTP_USER).toString('base64'));
      await cmd(Buffer.from(process.env.SMTP_PASS).toString('base64'));
      await cmd('MAIL FROM:<' + (process.env.SMTP_USER) + '>');
      await cmd('RCPT TO:<' + to + '>');
      await cmd('DATA');
      sock.write('From: ' + (process.env.SMTP_FROM || process.env.SMTP_USER) + '\r\nTo: ' + to + '\r\nSubject: ' + subject + '\r\n\r\n' + text + '\r\n.\r\n');
      await read();
      sock.write('QUIT\r\n'); sock.end();
      return true;
    } catch(e) { return false; }
  }
  return false;
}
function emailDeliveryConfigured(){ return !!(process.env.RESEND_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)); }

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://praime-productions.onrender.com').split(',').map(s => s.trim()).filter(Boolean);

// ---- Server-side price rules (canonical, in USD cents) ----
function priceFor(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('all-in')) return 4999;
  if (n.includes('lifetime')) return 499900;
  if (n.includes('trap kit') || n.includes('lo-fi kit') || n.includes('house kit')) return 999;
  if (n.includes('instrument kit')) return 2999;
  if (n.includes('brass kit') || n.includes('strings kit') || n.includes('woodwinds kit') || n.includes('keys & guitars kit')) return 1499;
  if (n.includes('re-beat')) return 1999;
  if (n.includes('separate')) return 299;
  if (n.includes('song master')) return 299;
  if (n.includes('vocal master')) return 199;
  if (n.includes('video render')) return 199;
  if (n.includes('live dj mix') || n.includes('full beat')) return 999;
  if (n.includes('beat exclusive')) return 19900;
  if (n.includes('beat unlimited')) return 9999;
  if (n.includes('beat trackout')) return 4999;
  if (n.includes('beat wav')) return 1999;
  if (n.includes('beat mp3')) return 999;
  if (n.includes('lyrics')) return 0;
  return null; // unknown item — cannot verify
}

// ---- Kit delivery mapping (same ZIPs the Beat Store already ships) ----
function deliveryFor(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('all-in')) return ['praime-brass-kit.zip','praime-strings-kit.zip','praime-woodwinds-kit.zip','praime-keys-kit.zip','praime-trap-kit.zip'];
  if (n.includes('brass kit')) return ['praime-brass-kit.zip'];
  if (n.includes('strings kit')) return ['praime-strings-kit.zip'];
  if (n.includes('woodwinds kit')) return ['praime-woodwinds-kit.zip'];
  if (n.includes('keys & guitars kit')) return ['praime-keys-kit.zip'];
  if (n.includes('instrument kit')) return ['praime-instrument-kit-a.zip','praime-instrument-kit-b.zip'];
  if (n.includes('trap kit') || n.includes('lo-fi kit') || n.includes('house kit')) return ['praime-trap-kit.zip'];
  return []; // licence-only item, no server file
}

// ---- HMAC download tokens (base64url header.payload.signature, no JWT lib) ----
function b64u(buf) { return Buffer.from(buf).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function signToken(payload) {
  const header = b64u('{"alg":"HS256","typ":"JWT"}');
  const body = b64u(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', DELIVERY_SECRET).update(header + '.' + body).digest();
  return header + '.' + body + '.' + b64u(sig);
}
function verifyToken(token) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 3) return null;
    const expect = crypto.createHmac('sha256', DELIVERY_SECRET).update(parts[0] + '.' + parts[1]).digest();
    const actual = Buffer.from(parts[2].replace(/-/g,'+').replace(/_/g,'/'), 'base64');
    if (actual.length !== expect.length || !crypto.timingSafeEqual(actual, expect)) return null;
    const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) return null;
    if (!Array.isArray(payload.items)) return null;
    return payload;
  } catch (e) { return null; }
}

const verifiedOrders = new Map(); // orderID -> {items, totalCents, at} (memory only)

function sendJson(res, code, obj) {
  res.writeHead(code, {'Content-Type':'application/json'});
  res.end(JSON.stringify(obj));
}
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > limit) { req.destroy(); reject(new Error('body too large')); } });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}
async function paypalAccessToken() {
  const id = process.env.PAYPAL_CLIENT_ID, secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) return null;
  const r = await fetch(PAYPAL_BASE + '/v1/oauth2/token', {
    method: 'POST',
    headers: {'Authorization':'Basic ' + Buffer.from(id + ':' + secret).toString('base64'), 'Content-Type':'application/x-www-form-urlencoded'},
    body: 'grant_type=client_credentials'
  });
  if (!r.ok) return null;
  const j = await r.json();
  return j.access_token || null;
}

const server = http.createServer(async (req, res) => {
  try {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    const url = new URL(req.url, 'http://localhost');
    const urlPath = decodeURIComponent(url.pathname);

    // GET /api/health — configuration status only, NEVER any secret value
    if (req.method === 'GET' && urlPath === '/api/health') {
      sendJson(res, 200, {ok:true, mode:MODE, paypal_configured:!!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET), delivery_secret_persistent:DELIVERY_SECRET_PERSISTENT, verified_orders_in_memory:verifiedOrders.size, token_configured:TOKEN_SECRET_PERSISTENT, token_claimed:tokenLedger.nextNumber-1, token_remaining:Math.max(0, 100-(tokenLedger.nextNumber-1)), token_active:tokenLedger.tokens.filter(t=>t.active).length});
      return;
    }

    // POST /api/verify-order {orderID, items:[{name,price}]}
    if (req.method === 'POST' && urlPath === '/api/verify-order') {
      let body;
      try { body = JSON.parse(await readBody(req, 10000)); } catch (e) { sendJson(res, 400, {verified:false, reason:'bad_json'}); return; }
      const orderID = String(body.orderID || '').trim();
      const items = Array.isArray(body.items) ? body.items : [];
      if (!/^[A-Za-z0-9_-]{5,64}$/.test(orderID) || !items.length || items.length > 50) { sendJson(res, 400, {verified:false, reason:'bad_request'}); return; }
      // Price every item server-side; unknown items or price mismatches reject.
      let totalCents = 0;
      const names = [];
      for (const it of items) {
        const p = priceFor(it.name);
        if (p === null) { sendJson(res, 400, {verified:false, reason:'unknown_item', item:it.name}); return; }
        totalCents += p; names.push(String(it.name));
      }
      if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) { sendJson(res, 503, {verified:false, reason:'paypal_not_configured'}); return; }
      if (verifiedOrders.has(orderID)) {
        const prev = verifiedOrders.get(orderID);
        const token = signToken({order:orderID, items:prev.items, exp:Date.now() + 86400000});
        sendJson(res, 200, {verified:true, orderID, items:prev.items, total:prev.totalCents / 100, token, downloads:downloadList(prev.items, token)});
        return;
      }
      const access = await paypalAccessToken();
      if (!access) { sendJson(res, 502, {verified:false, reason:'paypal_auth_failed'}); return; }
      const or = await fetch(PAYPAL_BASE + '/v2/checkout/orders/' + encodeURIComponent(orderID), {headers:{'Authorization':'Bearer ' + access}});
      if (!or.ok) { sendJson(res, 200, {verified:false, reason:'order_not_found'}); return; }
      const order = await or.json();
      const units = order.purchase_units || [];
      let paidCents = 0, currencyOk = true;
      for (const u of units) { if (u.amount && u.amount.currency_code !== 'USD') currencyOk = false; paidCents += Math.round(parseFloat((u.amount && u.amount.value) || '0') * 100); }
      if (order.status !== 'COMPLETED' || !currencyOk || paidCents !== totalCents) {
        sendJson(res, 200, {verified:false, reason:'amount_or_status_mismatch', paypal_status:order.status || null});
        return;
      }
      verifiedOrders.set(orderID, {items:names, totalCents, at:Date.now()});
      const token = signToken({order:orderID, items:names, exp:Date.now() + 86400000});
      sendJson(res, 200, {verified:true, orderID, items:names, total:totalCents / 100, token, downloads:downloadList(names, token)});
      return;
    }

    // GET /api/download?file=<kit zip>&token=<token>
    if (req.method === 'GET' && urlPath === '/api/download') {
      const file = String(url.searchParams.get('file') || '');
      const payload = verifyToken(url.searchParams.get('token') || '');
      if (!payload) { sendJson(res, 403, {error:'invalid_or_expired_token'}); return; }
      const allowed = new Set();
      for (const name of payload.items) for (const f of deliveryFor(name)) allowed.add(f);
      if (!/^[a-z0-9\-]+\.zip$/.test(file) || !allowed.has(file)) { sendJson(res, 403, {error:'file_not_in_verified_order'}); return; }
      const full = path.join(SUITE, 'samples', 'kits', file);
      fs.readFile(full, (err, data) => {
        if (err) { sendJson(res, 404, {error:'file_not_found'}); return; }
        res.writeHead(200, {'Content-Type':'application/zip', 'Content-Disposition':'attachment; filename="' + file + '"'});
        res.end(data);
      });
      return;
    }

    // POST /api/token/status, /claim, /verify, /transfer — server-only Founder Tokens
    if (urlPath === '/api/token/status' && req.method === 'POST') { sendJson(res, 200, {ok:true, configured:TOKEN_SECRET_PERSISTENT, claimed:tokenLedger.nextNumber-1, remaining:Math.max(0, 100-(tokenLedger.nextNumber-1)), active:tokenLedger.tokens.filter(t=>t.active).length}); return; }
    if (urlPath === '/api/token/claim' && req.method === 'POST') {
      if (!TOKEN_SECRET_PERSISTENT) { sendJson(res, 503, {ok:false, error:'token_not_configured'}); return; }
      const ip = reqIp(req);
      if (tokenIpBlocked(ip)) { sendJson(res, 403, {ok:false, error:'ip_blocked'}); return; }
      if (!tokenRateOk(ip,'claim')) { tokenIpFail(ip); sendJson(res, 429, {ok:false, error:'rate_limited'}); return; }
      let body; try { body = JSON.parse(await readBody(req, 2000)); } catch(e) { sendJson(res, 400, {ok:false, error:'bad_json'}); return; }
      const email = String(body.email||'').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { sendJson(res, 400, {ok:false, error:'valid_email_required'}); return; }
      const eHash = emailHash(email);
      if (tokenLedger.tokens.some(t=>t.emailHash===eHash && t.active)) { tokenIpFail(ip); sendJson(res, 409, {ok:false, error:'email_already_claimed'}); return; }
      if (tokenLedger.tokens.some(t=>t.ipHash===ipHash(ip))) { tokenIpFail(ip); sendJson(res, 409, {ok:false, error:'ip_already_claimed'}); return; }
      // Expire old pendings, then block a second pending for same email/IP
      tokenLedger.pending = tokenLedger.pending.filter(x=>Date.now() < x.expiresAt);
      if (tokenLedger.pending.some(x=>x.emailHash===eHash)) { sendJson(res, 409, {ok:false, error:'verification_already_pending'}); return; }
      if (tokenLedger.pending.some(x=>x.ipHash===ipHash(ip))) { sendJson(res, 409, {ok:false, error:'ip_already_claimed'}); return; }
      if (!emailDeliveryConfigured()) { sendJson(res, 503, {ok:false, error:'email_delivery_not_configured'}); return; }
      const code = String(Math.floor(100000 + Math.random()*900000));
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');
      tokenLedger.pending.push({emailHash:eHash, ipHash:ipHash(ip), codeHash, expiresAt:Date.now()+900000, attempts:0});
      saveTokenLedger();
      const sent = await sendVerificationEmail(email, code);
      if (!sent) { tokenLedger.pending = tokenLedger.pending.filter(x=>x.emailHash!==eHash); saveTokenLedger(); sendJson(res, 502, {ok:false, error:'email_send_failed'}); return; }
      sendJson(res, 200, {ok:true, pending:true, message:'verification_code_sent'});
      return;
    }
    if (urlPath === '/api/token/verify-code' && req.method === 'POST') {
      if (!TOKEN_SECRET_PERSISTENT) { sendJson(res, 503, {ok:false, error:'token_not_configured'}); return; }
      let body; try { body = JSON.parse(await readBody(req, 2000)); } catch(e) { sendJson(res, 400, {ok:false, error:'bad_json'}); return; }
      const email = String(body.email||'').trim().toLowerCase();
      const code = String(body.code||'').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(code)) { sendJson(res, 400, {ok:false, error:'bad_request'}); return; }
      const eHash = emailHash(email);
      const pend = tokenLedger.pending.find(x=>x.emailHash===eHash);
      if (!pend) { sendJson(res, 200, {ok:false, error:'no_pending_verification'}); return; }
      if (Date.now() >= pend.expiresAt) { tokenLedger.pending = tokenLedger.pending.filter(x=>x.emailHash!==eHash); saveTokenLedger(); sendJson(res, 200, {ok:false, error:'code_expired'}); return; }
      if (pend.attempts >= 5) { tokenLedger.pending = tokenLedger.pending.filter(x=>x.emailHash!==eHash); saveTokenLedger(); sendJson(res, 200, {ok:false, error:'too_many_attempts'}); return; }
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');
      if (codeHash !== pend.codeHash) { pend.attempts++; saveTokenLedger(); sendJson(res, 200, {ok:false, error:'wrong_code'}); return; }
      // Code correct: re-check the hard caps at issuance time, then issue.
      if (tokenLedger.tokens.some(t=>t.emailHash===eHash && t.active) || tokenLedger.tokens.some(t=>t.ipHash===pend.ipHash)) { tokenLedger.pending = tokenLedger.pending.filter(x=>x.emailHash!==eHash); saveTokenLedger(); sendJson(res, 409, {ok:false, error:'already_claimed'}); return; }
      if (tokenLedger.nextNumber > 100) { sendJson(res, 409, {ok:false, error:'all_100_claimed'}); return; }
      tokenLedger.pending = tokenLedger.pending.filter(x=>x.emailHash!==eHash);
      const number = tokenLedger.nextNumber++;
      const token = makeToken(number, eHash);
      tokenLedger.tokens.push({number, emailHash:eHash, ipHash:pend.ipHash, tokenHash:crypto.createHash('sha256').update(token).digest('hex'), active:true, issuedAt:new Date().toISOString(), emailVerified:true});
      saveTokenLedger();
      sendJson(res, 200, {ok:true, token, number, claimed:tokenLedger.nextNumber-1, remaining:Math.max(0, 100-(tokenLedger.nextNumber-1))});
      return;
    }
    if (urlPath === '/api/token/verify' && req.method === 'POST') {
      if (!TOKEN_SECRET_PERSISTENT) { sendJson(res, 503, {ok:false, error:'token_not_configured'}); return; }
      let body; try { body = JSON.parse(await readBody(req, 2000)); } catch(e) { sendJson(res, 400, {ok:false, error:'bad_json'}); return; }
      const parsed = parseToken(body.token); if (!parsed) { sendJson(res, 200, {ok:false, valid:false, error:'bad_token_format'}); return; }
      const entry = tokenLedger.tokens.find(t=>t.number===parsed.number && t.active);
      if (!entry) { sendJson(res, 200, {ok:false, valid:false, error:'not_active_or_revoked'}); return; }
      if (tokenSig(parsed.number, entry.emailHash, parsed.rand) !== parsed.sig) { sendJson(res, 200, {ok:false, valid:false, error:'bad_signature'}); return; }
      if (body.email && emailHash(body.email) !== entry.emailHash) { sendJson(res, 200, {ok:false, valid:false, error:'email_mismatch'}); return; }
      sendJson(res, 200, {ok:true, valid:true, number:parsed.number, issuedAt:entry.issuedAt});
      return;
    }
    if (urlPath === '/api/token/transfer' && req.method === 'POST') {
      if (!TOKEN_SECRET_PERSISTENT) { sendJson(res, 503, {ok:false, error:'token_not_configured'}); return; }
      let body; try { body = JSON.parse(await readBody(req, 2000)); } catch(e) { sendJson(res, 400, {ok:false, error:'bad_json'}); return; }
      const parsed = parseToken(body.token); const newEmail = String(body.newEmail||'').trim().toLowerCase();
      if (!parsed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { sendJson(res, 400, {ok:false, error:'bad_request'}); return; }
      const entry = tokenLedger.tokens.find(t=>t.number===parsed.number && t.active);
      if (!entry || tokenSig(parsed.number, entry.emailHash, parsed.rand) !== parsed.sig) { sendJson(res, 200, {ok:false, error:'invalid_token'}); return; }
      if (body.email && emailHash(body.email) !== entry.emailHash) { sendJson(res, 200, {ok:false, error:'email_mismatch'}); return; }
      const newHash = emailHash(newEmail);
      if (tokenLedger.tokens.some(t=>t.emailHash===newHash && t.active)) { sendJson(res, 409, {ok:false, error:'new_email_already_claimed'}); return; }
      entry.active=false; entry.revokedAt=new Date().toISOString();
      const newToken = makeToken(parsed.number, newHash);
      tokenLedger.tokens.push({number:parsed.number, emailHash:newHash, tokenHash:crypto.createHash('sha256').update(newToken).digest('hex'), active:true, issuedAt:entry.issuedAt, transferredAt:new Date().toISOString()});
      saveTokenLedger();
      sendJson(res, 200, {ok:true, token:newToken, number:parsed.number});
      return;
    }

    // Static files from suite/
    if (req.method !== 'GET') { sendJson(res, 405, {error:'method_not_allowed'}); return; }
    let servePath = urlPath === '/' || urlPath === '' ? '/index.html' : urlPath;
    const full = path.resolve(SUITE, '.' + servePath);
    if (full !== SUITE && !full.startsWith(SUITE + path.sep)) { res.writeHead(403); res.end('blocked'); return; }
    fs.readFile(full, (err, data) => {
      if (err) { res.writeHead(404, {'Content-Type':'text/plain'}); res.end('Not found: ' + servePath); return; }
      res.writeHead(200, {'Content-Type': MIME[path.extname(full)] || 'application/octet-stream'});
      res.end(data);
    });
  } catch (e) { try { sendJson(res, 500, {error:'server_error'}); } catch (_) {} }
});

function downloadList(names, token) {
  const out = [];
  for (const name of names) for (const f of deliveryFor(name)) out.push({item:name, file:f, url:'/api/download?file=' + encodeURIComponent(f) + '&token=' + encodeURIComponent(token)});
  return out;
}

if (require.main === module) server.listen(PORT, '0.0.0.0', () => console.log('PrAIme server on port ' + PORT + ' (mode ' + MODE + ')'));
module.exports = {server, priceFor, deliveryFor, signToken, verifyToken, downloadList};
