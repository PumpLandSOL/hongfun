// HONGBAO 红包 — the Chinese-stock launchpad on Robinhood Chain. Red is up.
// Every coin launched here is INDEXED to a Chinese stock (HK / Shanghai / Shenzhen / US ADR): its bonding-curve price
// is multiplied by the underlying's move since launch, so a Moutai-coin inherits Moutai's tape on top of meme demand.
// Bonding curve (constant product, virtual USDG reserves) → graduates at 8,888 USDG → "listed". 1% fee on every trade:
// half buys & burns $HONG, half fills the red-envelope pool. First 88 buyers of every coin open a red envelope (random
// bonus tokens, hash-seeded). Ledgers are simulated (no custody), prices are real (Yahoo chart API, 15 s). Dependency-free Node ≥18.
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const PORT = +(process.env.PORT || 8202);
const ROOT = path.join(__dirname, '..'), CLIENT = path.join(ROOT, 'client');
const DATA_PATH = process.env.DATA_PATH || path.join(ROOT, 'data.json');
const MINT = process.env.HONG_MINT || '';
const P = {
  START_USDG: 1000,            // paper USDG per wallet (simulated ledger)
  V_USDG: 3000, V_TOK: 1_073_000_000, SUPPLY: 1_000_000_000,   // virtual reserves (pump-style) · 1B supply
  GRADUATE: 8888,              // USDG raised → listed
  FEE: 0.01, FEE_BURN: 0.5,    // 1% per trade · 50% → $HONG buyback & burn, 50% → red-envelope pool
  HONGBAO_POOL: 0.01, HONGBAO_N: 88,   // 1% of supply into 88 red envelopes for the first 88 buyers
  MIN_BUY: 1, MAX_TICKER: 8,
};
const r2 = (x) => Math.round(x * 100) / 100, r6 = (x) => Math.round(x * 1e6) / 1e6;
const now = () => Date.now();
const isEvm = (s) => /^0x[a-fA-F0-9]{40}$/.test(s || '');
const H = (s) => crypto.createHash('sha256').update(s).digest();

// ---------- the underlyings: Chinese stocks via Yahoo chart API ----------
const YF = 'https://query1.finance.yahoo.com/v8/finance/chart/';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36';
const STOCKS = {
  '0700.HK': { name: 'Tencent', zh: '腾讯', ex: 'HKEX', ccy: 'HKD' }, '9988.HK': { name: 'Alibaba', zh: '阿里巴巴', ex: 'HKEX', ccy: 'HKD' },
  '1211.HK': { name: 'BYD', zh: '比亚迪', ex: 'HKEX', ccy: 'HKD' }, '3690.HK': { name: 'Meituan', zh: '美团', ex: 'HKEX', ccy: 'HKD' },
  '1810.HK': { name: 'Xiaomi', zh: '小米', ex: 'HKEX', ccy: 'HKD' }, '9866.HK': { name: 'NIO', zh: '蔚来', ex: 'HKEX', ccy: 'HKD' },
  '2015.HK': { name: 'Li Auto', zh: '理想汽车', ex: 'HKEX', ccy: 'HKD' }, '9618.HK': { name: 'JD.com', zh: '京东', ex: 'HKEX', ccy: 'HKD' },
  '0981.HK': { name: 'SMIC', zh: '中芯国际', ex: 'HKEX', ccy: 'HKD' }, '1398.HK': { name: 'ICBC', zh: '工商银行', ex: 'HKEX', ccy: 'HKD' },
  '2318.HK': { name: 'Ping An', zh: '平安', ex: 'HKEX', ccy: 'HKD' }, '0857.HK': { name: 'PetroChina', zh: '中国石油', ex: 'HKEX', ccy: 'HKD' },
  '600519.SS': { name: 'Kweichow Moutai', zh: '贵州茅台', ex: 'SSE', ccy: 'CNY' }, '300750.SZ': { name: 'CATL', zh: '宁德时代', ex: 'SZSE', ccy: 'CNY' },
  '601318.SS': { name: 'Ping An A', zh: '中国平安', ex: 'SSE', ccy: 'CNY' }, '000858.SZ': { name: 'Wuliangye', zh: '五粮液', ex: 'SZSE', ccy: 'CNY' },
  'PDD': { name: 'PDD (Temu)', zh: '拼多多', ex: 'NASDAQ', ccy: 'USD' }, 'BABA': { name: 'Alibaba ADR', zh: '阿里 ADR', ex: 'NYSE', ccy: 'USD' },
};
const PX = {}; let PRICE_OK = false;
async function pollTape() {
  let ok = 0;
  for (const sym of Object.keys(STOCKS)) {
    try {
      const ac = new AbortController(); const tm = setTimeout(() => ac.abort(), 9000);
      const r = await fetch(YF + encodeURIComponent(sym) + '?range=1d&interval=1m', { headers: { accept: 'application/json', 'user-agent': UA }, signal: ac.signal }); clearTimeout(tm);
      if (!r.ok) continue; const res = (await r.json()).chart.result[0]; const m = res.meta;
      const prev = PX[sym]; PX[sym] = { px: +m.regularMarketPrice, prevClose: +(m.chartPreviousClose || m.previousClose || m.regularMarketPrice), ts: m.regularMarketTime * 1000, hist: (prev && prev.hist) || [] };
      PX[sym].hist.push(PX[sym].px); if (PX[sym].hist.length > 300) PX[sym].hist.shift(); ok++;
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 80));
  }
  if (ok >= 12) PRICE_OK = true;
}
pollTape(); setInterval(pollTape, 15000);
// market sessions (local exchange time). HKEX 09:30–12:00, 13:00–16:00 HKT · SSE/SZSE 09:30–11:30, 13:00–15:00 CST · US 09:30–16:00 ET
function session(ex) {
  const d = new Date(); const tz = ex === 'NASDAQ' || ex === 'NYSE' ? 'America/New_York' : 'Asia/Shanghai';
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' }).formatToParts(d);
  const g = (t) => f.find((p) => p.type === t).value; const wd = g('weekday'), hm = +g('hour') * 60 + +g('minute');
  if (wd === 'Sat' || wd === 'Sun') return { open: false, label: '休市 · weekend' };
  const win = ex === 'HKEX' ? [[570, 720], [780, 960]] : ex === 'SSE' || ex === 'SZSE' ? [[570, 690], [780, 900]] : [[570, 960]];
  const open = win.some(([a, b]) => hm >= a && hm < b); const lunch = (ex !== 'NASDAQ' && ex !== 'NYSE') && hm >= win[0][1] && hm < win[1][0];
  return { open, label: open ? '开盘 · open' : lunch ? '午休 · lunch' : '收盘 · closed' };
}

// ---------- state ----------
let db = { coins: {}, users: {}, trades: [], seq: 1, stats: { launches: 0, trades: 0, volume: 0, fees: 0, burnUsd: 0, burnHong: 0, envelopes: 0, envelopeUsd: 0, graduated: 0 } };
try { db = Object.assign(db, JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))); } catch (e) {}
let DIRTY = false; const dirty = () => { DIRTY = true; };
setInterval(() => { if (DIRTY) { DIRTY = false; try { fs.writeFileSync(DATA_PATH, JSON.stringify(db)); } catch (e) {} } }, 2500);
function user(w) { w = w.toLowerCase(); if (!db.users[w]) { db.users[w] = { wallet: w, usdg: P.START_USDG, bags: {}, envelopes: [], launched: [], t: now() }; dirty(); } return db.users[w]; }

// ---------- hand-rolled WS ----------
const CLIENTS = new Set();
function cast(obj) { const s = JSON.stringify(obj); const len = Buffer.byteLength(s); let head;
  if (len < 126) head = Buffer.from([0x81, len]); else if (len < 65536) { head = Buffer.alloc(4); head[0] = 0x81; head[1] = 126; head.writeUInt16BE(len, 2); } else { head = Buffer.alloc(10); head[0] = 0x81; head[1] = 127; head.writeBigUInt64BE(BigInt(len), 2); }
  const frame = Buffer.concat([head, Buffer.from(s)]); for (const sock of CLIENTS) { try { sock.write(frame); } catch (e) { CLIENTS.delete(sock); } } }

// ---------- the curve, indexed to the stock ----------
// curve price (USDG per token) = vUSDG / vTOK. Traded price = curve price × index, index = stock_now / stock_at_launch.
const index = (c) => { const q = PX[c.stock]; return q && q.px > 0 && c.px0 > 0 ? q.px / c.px0 : 1; };
const curvePx = (c) => c.vUsdg / c.vTok;
const price = (c) => curvePx(c) * index(c);
const mcap = (c) => price(c) * P.SUPPLY;
function buyQuote(c, usdg) { const idx = index(c); const uIn = usdg * (1 - P.FEE) / idx; const k = c.vUsdg * c.vTok; const tokOut = c.vTok - k / (c.vUsdg + uIn); return { tokOut, uIn, fee: usdg * P.FEE, idx, pxAfter: (c.vUsdg + uIn) / (c.vTok - tokOut) * idx }; }
function sellQuote(c, tok) { const idx = index(c); const k = c.vUsdg * c.vTok; const uOut = c.vUsdg - k / (c.vTok + tok); const gross = uOut * idx; return { uOut, gross, fee: gross * P.FEE, net: gross * (1 - P.FEE), idx }; }

function fee(usd) { const burn = usd * P.FEE_BURN, env = usd - burn; db.stats.fees = r2(db.stats.fees + usd); db.stats.burnUsd = r2(db.stats.burnUsd + burn); if (HONG_PRICE > 0) db.stats.burnHong = r2(db.stats.burnHong + burn / HONG_PRICE); db.stats.envelopeUsd = r2(db.stats.envelopeUsd + env); }

function launch(w, d) {
  const u = user(w); const stock = d.stock; if (!STOCKS[stock]) throw 'pick a listed Chinese stock';
  const q = PX[stock]; if (!(q && q.px > 0)) throw 'tape warming for ' + stock + ' — try again in a few seconds';
  const ticker = String(d.ticker || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, P.MAX_TICKER); if (ticker.length < 2) throw 'ticker 2–8 chars';
  if (Object.values(db.coins).some((c) => c.ticker === ticker)) throw 'ticker taken — duplicates are banned';
  const name = String(d.name || '').trim().slice(0, 32); if (name.length < 2) throw 'name 2–32 chars';
  const emoji = String(d.emoji || '🧧').slice(0, 4); const desc = String(d.desc || '').trim().slice(0, 240);
  const id = ticker.toLowerCase();
  const c = { id, ticker, name, emoji, desc, stock, stockName: STOCKS[stock].name, zh: STOCKS[stock].zh, ex: STOCKS[stock].ex, ccy: STOCKS[stock].ccy, px0: q.px, creator: w, t: now(),
    vUsdg: P.V_USDG, vTok: P.V_TOK, sold: 0, raised: 0, holders: {}, buyers: 0, envelopes: [], envelopePool: P.SUPPLY * P.HONGBAO_POOL, listed: false, listedAt: 0, vol: 0, trades: 0, hist: [] };
  db.coins[id] = c; u.launched.push(id); db.stats.launches++; dirty();
  cast({ type: 'launch', coin: pub(c) }); return pub(c);
}
function buy(w, id, usdg) {
  const u = user(w); const c = db.coins[id]; if (!c) throw 'no such coin'; if (c.listed) throw c.ticker + ' has graduated — trade it on the DEX';
  usdg = +usdg; if (!(usdg >= P.MIN_BUY)) throw 'min ' + P.MIN_BUY + ' USDG'; if (u.usdg < usdg) throw 'not enough USDG on ledger';
  const qt = buyQuote(c, usdg); if (qt.tokOut > c.vTok * 0.5) throw 'too large for the curve';
  u.usdg = r2(u.usdg - usdg); c.vUsdg += qt.uIn; c.vTok -= qt.tokOut; c.sold += qt.tokOut; c.raised = r2(c.raised + usdg * (1 - P.FEE));
  const first = !c.holders[w]; c.holders[w] = r6((c.holders[w] || 0) + qt.tokOut); u.bags[id] = r6((u.bags[id] || 0) + qt.tokOut);
  fee(qt.fee); c.vol = r2(c.vol + usdg); c.trades++; db.stats.trades++; db.stats.volume = r2(db.stats.volume + usdg);
  let envelope = null;
  if (first && c.buyers < P.HONGBAO_N) { c.buyers++; const roll = H(id + w + c.buyers)[0] / 255; const share = (0.3 + roll * 1.7) / P.HONGBAO_N;   // 0.3×–2× of an even split, lucky 8s pay more
    let amt = Math.min(c.envelopePool, P.SUPPLY * P.HONGBAO_POOL * share); if (c.buyers % 8 === 0) amt = Math.min(c.envelopePool, amt * 1.88);
    c.envelopePool -= amt; c.holders[w] = r6(c.holders[w] + amt); u.bags[id] = r6(u.bags[id] + amt); envelope = { n: c.buyers, amt: r6(amt), usd: r2(amt * price(c)), lucky: c.buyers % 8 === 0 };
    c.envelopes.push({ w, ...envelope, t: now() }); u.envelopes.push({ coin: id, ...envelope, t: now() }); db.stats.envelopes++; }
  const tr = { id: db.seq++, coin: id, ticker: c.ticker, side: 'buy', w, usdg, tok: r6(qt.tokOut), px: price(c), idx: qt.idx, t: now(), envelope };
  db.trades.unshift(tr); if (db.trades.length > 500) db.trades.pop(); c.hist.push({ t: tr.t, px: tr.px }); if (c.hist.length > 400) c.hist.shift();
  if (c.raised >= P.GRADUATE && !c.listed) { c.listed = true; c.listedAt = now(); db.stats.graduated++; cast({ type: 'listed', coin: pub(c) }); }
  dirty(); cast({ type: 'trade', trade: tr, coin: pub(c) }); return { trade: tr, coin: pub(c), me: me(w) };
}
function sell(w, id, tok) {
  const u = user(w); const c = db.coins[id]; if (!c) throw 'no such coin'; if (c.listed) throw c.ticker + ' has graduated — trade it on the DEX';
  tok = Math.min(+tok, u.bags[id] || 0); if (!(tok > 0)) throw 'nothing to sell';
  const qt = sellQuote(c, tok); u.bags[id] = r6(u.bags[id] - tok); c.holders[w] = r6((c.holders[w] || 0) - tok); if (c.holders[w] <= 0) delete c.holders[w];
  c.vUsdg -= qt.uOut; c.vTok += tok; c.sold -= tok; c.raised = r2(Math.max(0, c.raised - qt.net)); u.usdg = r2(u.usdg + qt.net);
  fee(qt.fee); c.vol = r2(c.vol + qt.gross); c.trades++; db.stats.trades++; db.stats.volume = r2(db.stats.volume + qt.gross);
  const tr = { id: db.seq++, coin: id, ticker: c.ticker, side: 'sell', w, usdg: r2(qt.net), tok: r6(tok), px: price(c), idx: qt.idx, t: now() };
  db.trades.unshift(tr); if (db.trades.length > 500) db.trades.pop(); c.hist.push({ t: tr.t, px: tr.px }); if (c.hist.length > 400) c.hist.shift();
  dirty(); cast({ type: 'trade', trade: tr, coin: pub(c) }); return { trade: tr, coin: pub(c), me: me(w) };
}

// ---------- $HONG price (DexScreener) ----------
let HONG_PRICE = 0;
async function pollHong() { if (!MINT) return; try { const r = await fetch('https://api.dexscreener.com/latest/dex/tokens/' + MINT); if (!r.ok) return; const ps = ((await r.json()).pairs || []).filter((p) => p.chainId === 'robinhood' && +p.priceUsd > 0).sort((a, b) => ((b.liquidity && b.liquidity.usd) || 0) - ((a.liquidity && a.liquidity.usd) || 0)); if (ps[0]) HONG_PRICE = +ps[0].priceUsd; } catch (e) {} }
pollHong(); setInterval(pollHong, 60000);

// ---------- projections ----------
function pub(c) { const q = PX[c.stock] || {}; const idx = index(c); const pxNow = price(c);
  return { id: c.id, ticker: c.ticker, name: c.name, emoji: c.emoji, desc: c.desc, stock: c.stock, stockName: c.stockName, zh: c.zh, ex: c.ex, ccy: c.ccy, session: session(c.ex), creator: c.creator, t: c.t,
    px0: c.px0, stockPx: q.px || 0, stockChg: q.prevClose ? r2((q.px / q.prevClose - 1) * 100) : 0, idx: r6(idx), idxPct: r2((idx - 1) * 100),
    price: pxNow, curvePx: curvePx(c), mcap: r2(mcap(c)), raised: c.raised, progress: Math.min(1, c.raised / P.GRADUATE), graduate: P.GRADUATE, listed: c.listed, listedAt: c.listedAt,
    holders: Object.keys(c.holders).length, buyers: c.buyers, envelopesLeft: Math.max(0, P.HONGBAO_N - c.buyers), envelopePool: r6(c.envelopePool), vol: c.vol, trades: c.trades, hist: c.hist.slice(-120) }; }
function me(w) { const u = user(w); const bags = Object.entries(u.bags).filter(([, n]) => n > 0).map(([id, n]) => { const c = db.coins[id]; return { id, ticker: c.ticker, emoji: c.emoji, stock: c.stock, tok: n, value: r2(n * price(c)), pct: r2(n / P.SUPPLY * 100) }; });
  return { wallet: w, usdg: u.usdg, bags, nav: r2(u.usdg + bags.reduce((a, b) => a + b.value, 0)), envelopes: u.envelopes.slice(-20).reverse(), launched: u.launched }; }
function board() { return Object.values(db.coins).map(pub).sort((a, b) => (b.listed - a.listed) || b.vol - a.vol); }
function tape() { return Object.entries(STOCKS).map(([sym, s]) => { const q = PX[sym] || {}; return { sym, ...s, px: q.px || 0, chg: q.prevClose ? r2((q.px / q.prevClose - 1) * 100) : 0, session: session(s.ex), coins: Object.values(db.coins).filter((c) => c.stock === sym).length }; }); }

// ---------- http ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' };
const json = (res, c, o) => { res.writeHead(c, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(o)); };
const body = (req) => new Promise((res) => { const c = []; req.on('data', (d) => { c.push(d); if (Buffer.concat(c).length > 1e5) req.destroy(); }); req.on('end', () => { try { res(JSON.parse(Buffer.concat(c).toString() || '{}')); } catch (e) { res({}); } }); });
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x'); const p = u.pathname;
  if (p === '/api/config') return json(res, 200, { token: 'HONG', mint: MINT, hongPrice: HONG_PRICE, chainId: 4663, ok: PRICE_OK, params: { supply: P.SUPPLY, graduate: P.GRADUATE, fee: P.FEE, feeBurn: P.FEE_BURN, hongbaoPool: P.HONGBAO_POOL, hongbaoN: P.HONGBAO_N, startUsdg: P.START_USDG } });
  if (p === '/api/tape') return json(res, 200, { ok: PRICE_OK, stocks: tape() });
  if (p === '/api/board') return json(res, 200, { ok: PRICE_OK, coins: board(), stats: db.stats, trades: db.trades.slice(0, 40), hongPrice: HONG_PRICE });
  if (p === '/api/coin') { const c = db.coins[(u.searchParams.get('id') || '').toLowerCase()]; if (!c) return json(res, 404, { error: 'no such coin' }); return json(res, 200, { coin: pub(c), trades: db.trades.filter((t) => t.coin === c.id).slice(0, 60), envelopes: c.envelopes.slice(-20).reverse(), top: Object.entries(c.holders).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w, n]) => ({ w, tok: n, pct: r2(n / P.SUPPLY * 100) })) }); }
  if (p === '/api/quote') { const c = db.coins[(u.searchParams.get('id') || '').toLowerCase()]; if (!c) return json(res, 404, { error: 'no such coin' }); const side = u.searchParams.get('side'), amt = +u.searchParams.get('amount') || 0; return json(res, 200, side === 'sell' ? sellQuote(c, amt) : buyQuote(c, amt)); }
  if (p === '/api/me') { const w = (u.searchParams.get('wallet') || '').toLowerCase(); if (!isEvm(w)) return json(res, 400, { error: 'wallet' }); return json(res, 200, me(w)); }
  if (req.method === 'POST' && p.startsWith('/api/')) {
    const d = await body(req); const w = (d.wallet || '').toLowerCase(); if (!isEvm(w)) return json(res, 200, { error: 'connect a wallet first' });
    try { let r;
      if (p === '/api/launch') r = launch(w, d); else if (p === '/api/buy') r = buy(w, d.id, d.amount); else if (p === '/api/sell') r = sell(w, d.id, d.amount);
      else if (p === '/api/dev/faucet' && process.env.DEV === '1') { const x = user(w); x.usdg = r2(x.usdg + (+d.amount || 1000)); dirty(); r = me(w); }
      else return json(res, 404, { error: 'unknown' });
      return json(res, 200, { ok: true, r }); } catch (e) { return json(res, 200, { error: String(e) }); }
  }
  let f = p === '/' ? '/index.html' : p === '/board' ? '/board.html' : p === '/docs' ? '/docs.html' : p;
  const base = f.startsWith('/brand/') ? ROOT : CLIENT; const file = path.join(base, f); if (!file.startsWith(base)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (e, buf) => { if (e) { res.writeHead(404); return res.end('not found'); } res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' }); res.end(buf); });
});
server.on('upgrade', (req, sock) => { const key = req.headers['sec-websocket-key']; if (!key) return sock.destroy(); const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n'); CLIENTS.add(sock); sock.on('close', () => CLIENTS.delete(sock)); sock.on('error', () => CLIENTS.delete(sock)); });
server.listen(PORT, () => console.log('HONGBAO 红包 on :' + PORT + ' · ' + Object.keys(STOCKS).length + ' Chinese stocks · red is up'));
