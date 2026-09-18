// hong.fun LIVE: Practice ledger (1,000 USDG) + Live ledger funded with real USDG on Robinhood Chain (ERC-20 transfer to TREASURY verified from the receipt), separate coin boards per mode, withdraw queue, admin routes, FAQ rewrite, X → x.com/HongFunPad.
const fs = require('fs'), path = require('path');
const F = (f) => path.join(__dirname, '..', f);
const R = (f) => fs.readFileSync(F(f), 'utf8').split('\r\n').join('\n');
const Wr = (f, s) => fs.writeFileSync(F(f), s);
const rep = (s, a, b, f) => { if (!s.includes(a)) throw new Error(f + ' miss: ' + a.slice(0, 90)); return s.split(a).join(b); };

// ── server ──
let s = R('server/index.js');
s = rep(s, "const MINT = process.env.HONG_MINT || '';", `const MINT = process.env.HONG_MINT || '';
// ---- LIVE ledger: real USDG on Robinhood Chain ----
const CHAIN = { id: 4663, hex: '0x1237', name: 'Robinhood Chain', rpc: process.env.CHAIN_RPC || 'https://rpc.mainnet.chain.robinhood.com', explorer: 'https://explorer.mainnet.chain.robinhood.com' };
const USDG = { addr: (process.env.USDG_ADDR || '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168').toLowerCase(), dec: 6 };
const TREASURY = (process.env.TREASURY || '').toLowerCase();   // wallet that receives live USDG deposits and pays withdrawals
const MIN_DEPOSIT = +(process.env.MIN_DEPOSIT || 10);            // USDG
const ADMIN_KEY = process.env.ADMIN_KEY || '';
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';`, 'consts');
s = rep(s, "  START_USDG: 1000,            // paper USDG per wallet (simulated ledger)", "  START_USDG: 1000,            // practice USDG per wallet", 'p');
s = rep(s, "function user(w) { w = w.toLowerCase(); if (!db.users[w]) { db.users[w] = { wallet: w, usdg: P.START_USDG, bags: {}, envelopes: [], launched: [], t: now() }; dirty(); } return db.users[w]; }",
`function user(w) { w = w.toLowerCase(); if (!db.users[w]) { db.users[w] = { wallet: w, usdg: P.START_USDG, live: 0, bags: {}, envelopes: [], launched: [], t: now() }; dirty(); } const u = db.users[w]; if (u.live == null) u.live = 0; return u; }
const MODES = { practice: 'usdg', live: 'live' };
const modeOf = (m) => (m === 'live' ? 'live' : 'practice');
const coinMode = (c) => c.mode || 'practice';`, 'user');
// launch/buy/sell take a mode
s = rep(s, "function launch(w, d) {\n  const u = user(w); const stock = d.stock;", "function launch(w, d) {\n  const u = user(w); const mode = modeOf(d.mode); if (mode === 'live' && !TREASURY) throw 'live launches open when the treasury is published'; const stock = d.stock;", 'launch1');
s = rep(s, "  if (Object.values(db.coins).some((c) => c.ticker === ticker)) throw 'ticker taken — duplicates are banned';", "  if (Object.values(db.coins).some((c) => c.ticker === ticker && coinMode(c) === mode)) throw 'ticker taken — duplicates are banned';", 'launch2');
s = rep(s, "  const id = ticker.toLowerCase();\n  const c = { id, ticker, name, emoji, desc, stock,", "  const id = (mode === 'live' ? 'live:' : '') + ticker.toLowerCase();\n  const c = { id, mode, ticker, name, emoji, desc, stock,", 'launch3');
s = rep(s, "function buy(w, id, usdg) {\n  const u = user(w); const c = db.coins[id]; if (!c) throw 'no such coin'; if (c.listed) throw c.ticker + ' has graduated — trade it on the DEX';\n  usdg = +usdg; if (!(usdg >= P.MIN_BUY)) throw 'min ' + P.MIN_BUY + ' USDG'; if (u.usdg < usdg) throw 'not enough USDG on ledger';",
`function buy(w, id, usdg, mode) {
  const u = user(w); const c = db.coins[id]; if (!c) throw 'no such coin'; if (c.listed) throw c.ticker + ' has graduated — trade it on the DEX';
  mode = modeOf(mode); if (coinMode(c) !== mode) throw 'this coin trades on the ' + coinMode(c) + ' board — switch mode'; const L = MODES[mode];
  usdg = +usdg; if (!(usdg >= P.MIN_BUY)) throw 'min ' + P.MIN_BUY + ' USDG'; if (u[L] < usdg) throw 'not enough USDG on your ' + mode + ' ledger';`, 'buy1');
s = rep(s, "  u.usdg = r2(u.usdg - usdg); c.vUsdg += qt.uIn;", "  u[L] = r2(u[L] - usdg); c.vUsdg += qt.uIn;", 'buy2');
s = rep(s, "  const tr = { id: db.seq++, coin: id, ticker: c.ticker, side: 'buy', w, usdg, tok: r6(qt.tokOut), px: price(c), idx: qt.idx, t: now(), envelope };", "  const tr = { id: db.seq++, coin: id, mode, ticker: c.ticker, side: 'buy', w, usdg, tok: r6(qt.tokOut), px: price(c), idx: qt.idx, t: now(), envelope };", 'buy3');
s = rep(s, "  dirty(); cast({ type: 'trade', trade: tr, coin: pub(c) }); return { trade: tr, coin: pub(c), me: me(w) };\n}\nfunction sell(w, id, tok) {\n  const u = user(w); const c = db.coins[id]; if (!c) throw 'no such coin'; if (c.listed) throw c.ticker + ' has graduated — trade it on the DEX';",
`  dirty(); cast({ type: 'trade', trade: tr, coin: pub(c) }); return { trade: tr, coin: pub(c), me: me(w) };
}
function sell(w, id, tok, mode) {
  const u = user(w); const c = db.coins[id]; if (!c) throw 'no such coin'; if (c.listed) throw c.ticker + ' has graduated — trade it on the DEX';
  mode = modeOf(mode); if (coinMode(c) !== mode) throw 'this coin trades on the ' + coinMode(c) + ' board — switch mode'; const L = MODES[mode];`, 'sell1');
s = rep(s, "c.raised = r2(Math.max(0, c.raised - qt.net)); u.usdg = r2(u.usdg + qt.net);", "c.raised = r2(Math.max(0, c.raised - qt.net)); u[L] = r2(u[L] + qt.net);", 'sell2');
s = rep(s, "  const tr = { id: db.seq++, coin: id, ticker: c.ticker, side: 'sell', w, usdg: r2(qt.net), tok: r6(tok), px: price(c), idx: qt.idx, t: now() };", "  const tr = { id: db.seq++, coin: id, mode, ticker: c.ticker, side: 'sell', w, usdg: r2(qt.net), tok: r6(tok), px: price(c), idx: qt.idx, t: now() };", 'sell3');
// pub/me/board
s = rep(s, "function pub(c) { const q = PX[c.stock] || {}; const idx = index(c); const pxNow = price(c);", "function pub(c) { const q = PX[c.stock] || {}; const idx = index(c); const pxNow = price(c); const mode = coinMode(c);", 'pub');
s = s.replace(/function pub\(c\) \{([\s\S]*?)return \{ id: c\.id,/, (m, a) => `function pub(c) {${a}return { id: c.id, mode,`);
s = rep(s, "function me(w) { const u = user(w); const bags = Object.entries(u.bags).filter(([, n]) => n > 0).map(([id, n]) => { const c = db.coins[id]; return { id, ticker: c.ticker, emoji: c.emoji, stock: c.stock, tok: n, value: r2(n * price(c)), pct: r2(n / P.SUPPLY * 100) }; });\n  return { wallet: w, usdg: u.usdg, bags, nav: r2(u.usdg + bags.reduce((a, b) => a + b.value, 0)), envelopes: u.envelopes.slice(-20).reverse(), launched: u.launched }; }",
`function me(w) { const u = user(w); const bags = Object.entries(u.bags).filter(([, n]) => n > 0 && db.coins[id0(n, arguments)]).map(([id, n]) => { const c = db.coins[id]; return { id, mode: coinMode(c), ticker: c.ticker, emoji: c.emoji, stock: c.stock, tok: n, value: r2(n * price(c)), pct: r2(n / P.SUPPLY * 100) }; });
  const val = (m) => bags.filter((b) => b.mode === m).reduce((a, b) => a + b.value, 0);
  const queue = db.queue.filter((q) => q.wallet === w).slice(0, 10);
  return { wallet: w, usdg: u.usdg, live: u.live, bags, nav: r2(u.usdg + val('practice')), navLive: r2(u.live + val('live')), deposited: u.deposited || 0, withdrawn: u.withdrawn || 0, queue, envelopes: u.envelopes.slice(-20).reverse(), launched: u.launched }; }
function id0(n, args) { return null; }`, 'me');
// simpler: fix the bags filter (keep coins that exist)
s = rep(s, "Object.entries(u.bags).filter(([, n]) => n > 0 && db.coins[id0(n, arguments)])", "Object.entries(u.bags).filter(([id, n]) => n > 0 && db.coins[id])", 'me2');
s = rep(s, "function id0(n, args) { return null; }\n", "", 'me3');
s = rep(s, "function board() { return Object.values(db.coins).map(pub).sort((a, b) => (b.listed - a.listed) || b.vol - a.vol); }", "function board(mode) { mode = modeOf(mode); return Object.values(db.coins).filter((c) => coinMode(c) === mode).map(pub).sort((a, b) => (b.listed - a.listed) || b.vol - a.vol); }", 'board');
s = rep(s, "  if (p === '/api/board') return json(res, 200, { ok: PRICE_OK, coins: board(), stats: db.stats, trades: db.trades.slice(0, 40), hongPrice: HONG_PRICE });",
  "  if (p === '/api/board') { const mode = modeOf(u.searchParams.get('mode')); return json(res, 200, { ok: PRICE_OK, mode, coins: board(mode), stats: db.stats, trades: db.trades.filter((t) => modeOf(t.mode) === mode).slice(0, 40), hongPrice: HONG_PRICE }); }", 'board route');
s = rep(s, "if (p === '/api/launch') r = launch(w, d); else if (p === '/api/buy') r = buy(w, d.id, d.amount); else if (p === '/api/sell') r = sell(w, d.id, d.amount);",
`if (p === '/api/launch') r = launch(w, d); else if (p === '/api/buy') r = buy(w, d.id, d.amount, d.mode); else if (p === '/api/sell') r = sell(w, d.id, d.amount, d.mode);
      else if (p === '/api/deposit') { const x = await creditDeposit(w, d.tx); r = Object.assign(x, { me: me(w) }); }
      else if (p === '/api/withdraw') { const q = requestWithdraw(w, d.amount); r = { queued: q, me: me(w) }; }
      else if (p === '/api/admin/paid') { if (!ADMIN_KEY || d.key !== ADMIN_KEY) throw 'no'; const q = db.queue.find((x) => x.id === d.id); if (!q) throw 'no such request'; q.status = 'paid'; q.paidTx = d.tx || null; q.paidAt = now(); dirty(); r = { q }; }
      else if (p === '/api/dev/live' && process.env.DEV === '1') { const x = user(w); const amt = +d.amount || 100; x.live = r2(x.live + amt); x.deposited = r2((x.deposited || 0) + amt); dirty(); r = me(w); }`, 'post routes');
s = rep(s, "  if (p === '/api/tape') return json(res, 200, { ok: PRICE_OK, stocks: tape() });",
`  if (p === '/api/tape') return json(res, 200, { ok: PRICE_OK, stocks: tape() });
  if (p === '/api/live') return json(res, 200, { open: !!TREASURY, treasury: TREASURY || null, usdg: USDG.addr, minDeposit: MIN_DEPOSIT, chain: { ...CHAIN, ...TCHAIN }, deposited: db.treasuryIn.usdg, deposits: db.treasuryIn.n, queued: db.queue.filter((q) => q.status === 'queued').length, queuedUsd: r2(db.queue.filter((q) => q.status === 'queued').reduce((a, q) => a + q.amt, 0)) });
  if (p === '/api/admin/queue') { if (!ADMIN_KEY || u.searchParams.get('key') !== ADMIN_KEY) return json(res, 403, { error: 'no' }); return json(res, 200, { queue: db.queue, deposits: db.txs }); }`, 'get routes');
s = rep(s, "  if (p === '/api/config') return json(res, 200, { token: 'HONG', mint: MINT,", "  if (p === '/api/config') return json(res, 200, { token: 'HONG', mint: MINT, live: !!TREASURY, treasury: TREASURY || null, usdg: USDG.addr, minDeposit: MIN_DEPOSIT, chain: CHAIN,", 'config');
// live plumbing before the $HONG price section
s = rep(s, "// ---------- $HONG price (DexScreener) ----------", `// ---------- LIVE: USDG deposits on Robinhood Chain ----------
if (!db.txs) db.txs = {}; if (!db.queue) db.queue = []; if (!db.treasuryIn) db.treasuryIn = { usdg: 0, n: 0 };
async function rpc(method, params) { const r = await fetch(CHAIN.rpc, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }).then((x) => x.json()); if (r.error) throw new Error(r.error.message); return r.result; }
const TCHAIN = { ok: false, block: 0, treasuryUsdg: 0, lastRead: 0 };
async function pollTreasury() { if (!TREASURY) return; try { TCHAIN.block = Number(BigInt(await rpc('eth_blockNumber', []))); const h = await rpc('eth_call', [{ to: USDG.addr, data: '0x70a08231' + TREASURY.replace('0x', '').padStart(64, '0') }, 'latest']); TCHAIN.treasuryUsdg = Number(BigInt(h)) / 10 ** USDG.dec; TCHAIN.ok = true; TCHAIN.lastRead = now(); } catch (e) { TCHAIN.ok = false; } }
pollTreasury(); setInterval(pollTreasury, 30000);
async function creditDeposit(w, txHash) {
  if (!TREASURY) throw 'live deposits are not open yet';
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash || '')) throw 'paste the transaction hash';
  txHash = txHash.toLowerCase(); if (db.txs[txHash]) throw 'already credited';
  const rc = await rpc('eth_getTransactionReceipt', [txHash]); if (!rc) throw 'pending — try again in a few seconds'; if (rc.status !== '0x1') throw 'transaction reverted';
  const pad = (a) => '0x' + a.replace('0x', '').toLowerCase().padStart(64, '0');
  const log = (rc.logs || []).find((l) => (l.address || '').toLowerCase() === USDG.addr && l.topics && l.topics[0] === TRANSFER_TOPIC && l.topics[1] === pad(w) && l.topics[2] === pad(TREASURY));
  if (!log) throw 'no USDG transfer from your wallet to the treasury in this transaction';
  const amt = Number(BigInt(log.data)) / 10 ** USDG.dec; if (!(amt > 0)) throw 'no USDG value'; if (amt < MIN_DEPOSIT) throw 'minimum deposit is ' + MIN_DEPOSIT + ' USDG';
  const u = user(w); u.live = r2(u.live + amt); u.deposited = r2((u.deposited || 0) + amt);
  db.txs[txHash] = { w, amt, block: Number(BigInt(rc.blockNumber)), ts: now() }; db.treasuryIn.usdg = r2(db.treasuryIn.usdg + amt); db.treasuryIn.n++; dirty();
  return { ok: true, amt, tx: txHash, block: db.txs[txHash].block };
}
function requestWithdraw(w, amount) {
  const u = user(w); amount = r2(+amount); if (!(amount >= 1)) throw 'minimum withdrawal is 1 USDG'; if (u.live < amount) throw 'not enough free USDG on your live ledger (sell first)';
  u.live = r2(u.live - amount); u.withdrawn = r2((u.withdrawn || 0) + amount);
  const q = { id: 'w' + crypto.randomBytes(5).toString('hex'), wallet: w, amt: amount, status: 'queued', ts: now(), paidTx: null, paidAt: null }; db.queue.unshift(q); if (db.queue.length > 500) db.queue.pop(); dirty(); return q;
}

// ---------- $HONG price (DexScreener) ----------`, 'live plumbing');
Wr('server/index.js', s);

// ── board page ──
let b = R('client/board.html');
b = b.split('https://x.com/hongdotfun').join('https://x.com/HongFunPad');
b = rep(b, "  <div class=\"tabs\"><button class=\"on\" data-pane=\"board\">上市 · Board</button>", "  <div class=\"seg\" id=\"modebar\" style=\"margin:12px 0 0\"><button data-mode=\"practice\">练习 · Practice · 1,000 USDG</button><button data-mode=\"live\">实盘 · Live · USDG on Robinhood Chain</button></div>\n  <div class=\"tabs\"><button class=\"on\" data-pane=\"board\">上市 · Board</button>", 'modebar');
b = rep(b, "<div class=\"card\"><h4>Ledger</h4><div class=\"kv\"><span>USDG (paper)</span><b id=\"me-usdg\">—</b></div><div class=\"kv\"><span>coins launched</span><b id=\"me-l\">—</b></div></div>",
`<div class="card"><h4>Ledger</h4><div class="kv"><span>Practice USDG</span><b id="me-usdg">—</b></div><div class="kv"><span>Live USDG</span><b id="me-live">—</b></div><div class="kv"><span>deposited · withdrawn</span><b id="me-dw">—</b></div><div class="kv"><span>coins launched</span><b id="me-l">—</b></div></div>
    <div class="card" style="margin-top:14px"><h4>实盘 · Live ledger</h4><div id="livebox" class="tiny">—</div></div>`, 'ledger card');
b = rep(b, "hong.fun 红 · simulated ledgers · real prices · red is up", "hong.fun 红 · practice and live ledgers · real prices · red is up", 'foot');
b = rep(b, "let WALLET = localStorage.getItem('hong.wallet') || '', TAPE = [], COINS = [], SEL = null, SIDE = 'buy', EMO = '🧧';", "let WALLET = localStorage.getItem('hong.wallet') || '', TAPE = [], COINS = [], SEL = null, SIDE = 'buy', EMO = '🧧', MODE = localStorage.getItem('hong.mode') || 'practice', LIVE = null;", 'state');
b = rep(b, "async function post(u, b) { const r = await fetch(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ wallet: WALLET, ...b }) })", "async function post(u, b) { const r = await fetch(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ wallet: WALLET, mode: MODE, ...b }) })", 'post');
b = rep(b, "async function loadBoard() { const b = await fetch('/api/board').then((r) => r.json()); COINS = b.coins;", "async function loadBoard() { const b = await fetch('/api/board?mode=' + MODE).then((r) => r.json()); COINS = b.coins; document.querySelectorAll('#modebar button').forEach((x) => x.classList.toggle('on', x.dataset.mode === MODE));", 'loadBoard');
b = rep(b, "  if (SEL) loadDetail(); else if (COINS.length) { SEL = COINS[0].id; loadDetail(); } }", "  if (SEL && COINS.some((c) => c.id === SEL)) loadDetail(); else if (COINS.length) { SEL = COINS[0].id; loadDetail(); } else { SEL = null; $('detail').innerHTML = '<div class=\"card\"><h4>' + (MODE === 'live' ? '实盘 · Live board' : '练习 · Practice board') + '</h4><p class=\"tiny\">no coins on this board yet · launch the first one</p></div>'; } }", 'loadBoard2');
b = rep(b, "· ledger ${me ? usd(me.usdg) + ' USDG' : '—'}</div>", "· ${MODE} ledger ${me ? usd(MODE === 'live' ? me.live : me.usdg) + ' USDG' : '—'}</div>", 'detail ledger');
b = rep(b, "async function loadMe() { if (!WALLET) return; const m = await fetch('/api/me?wallet=' + WALLET).then((r) => r.json()); $('me-usdg').textContent = usd(m.usdg); $('me-l').textContent = m.launched.length; $('me-nav').textContent = 'NAV ' + usd(m.nav);",
`async function loadMe() { if (!WALLET) return; const m = await fetch('/api/me?wallet=' + WALLET).then((r) => r.json()); if (!LIVE) LIVE = await fetch('/api/live').then((r) => r.json()); $('me-usdg').textContent = usd(m.usdg); $('me-live').textContent = usd(m.live); $('me-dw').textContent = usd(m.deposited) + ' · ' + usd(m.withdrawn); $('me-l').textContent = m.launched.length; $('me-nav').textContent = 'NAV practice ' + usd(m.nav) + ' · live ' + usd(m.navLive);
  $('livebox').innerHTML = LIVE.open ? \`<p style="margin:0 0 8px">Send USDG on Robinhood Chain to the treasury and it is credited to your live ledger once the transaction confirms. Every deposit is verified from the on-chain transfer. Withdrawals are paid from the treasury to your wallet.</p>
    <div class="kv"><span>treasury</span><b class="mono" style="font-size:11px">\${LIVE.treasury}</b></div><div class="kv"><span>treasury USDG · block</span><b>\${usd(LIVE.chain.treasuryUsdg || 0)} · \${LIVE.chain.block || '—'}</b></div>
    <div class="field" style="margin-top:8px"><label>Deposit USDG · min \${LIVE.minDeposit}</label><div style="display:flex;gap:6px"><input id="depAmt" inputmode="decimal" value="50" style="width:90px"><button class="btn" id="depSend" style="padding:8px 12px">Send from wallet</button></div></div>
    <div class="field"><label>or paste a tx hash</label><div style="display:flex;gap:6px"><input id="depTx" placeholder="0x…"><button class="btn ghost" id="depCredit" style="padding:8px 12px">Credit</button></div></div>
    <div class="field"><label>Withdraw USDG · paid by the treasury to your wallet</label><div style="display:flex;gap:6px"><input id="wdAmt" inputmode="decimal" placeholder="amount" style="width:90px"><button class="btn ghost" id="wdGo" style="padding:8px 12px">Request</button></div></div>
    \${m.queue.length ? '<div class="trades">' + m.queue.map((q) => '<div class="t"><span class="mono">' + q.id + '</span><span>' + usd(q.amt) + '</span><span class="' + (q.status === 'paid' ? 'up' : 'dim') + '">' + q.status.toUpperCase() + (q.paidTx ? ' ' + q.paidTx.slice(0, 10) + '…' : '') + '</span></div>').join('') + '</div>' : ''}\` : 'Live ledger opens when the treasury wallet is published. Practice is open now.';
  if ($('depSend')) { $('depSend').onclick = depositSend; $('depCredit').onclick = async () => { try { const r = await post('/api/deposit', { tx: $('depTx').value.trim() }); toast('credited ' + usd(r.amt) + ' USDG to your live ledger'); loadMe(); } catch (e) {} }; $('wdGo').onclick = async () => { try { const r = await post('/api/withdraw', { amount: +$('wdAmt').value }); toast('withdrawal of ' + usd(r.queued.amt) + ' queued · ' + r.queued.id); loadMe(); } catch (e) {} }; }`, 'loadMe');
b = rep(b, "$('l-emoji').innerHTML = EMOJIS.map(", `async function depositSend() { const eth = window.ethereum; if (!eth) return toast('open a wallet to send USDG, or paste a transaction hash'); const amt = +$('depAmt').value; if (!(amt > 0)) return toast('enter an amount');
  try { try { await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x1237' }] }); } catch (e) {}
    const data = '0xa9059cbb' + LIVE.treasury.replace('0x', '').padStart(64, '0') + BigInt(Math.round(amt * 1e6)).toString(16).padStart(64, '0');
    const tx = await eth.request({ method: 'eth_sendTransaction', params: [{ from: WALLET, to: LIVE.usdg, data }] }); toast('sent · waiting for confirmation…');
    for (let i = 0; i < 40; i++) { await new Promise((r) => setTimeout(r, 3000)); const r = await fetch('/api/deposit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ wallet: WALLET, tx }) }).then((r) => r.json()); if (r.ok) { toast('credited ' + usd(r.r.amt) + ' USDG to your live ledger'); return loadMe(); } if (r.error && !/pending|not found/.test(r.error)) return toast(r.error); }
    toast('still pending — paste the hash to credit later'); } catch (e) { toast('transaction cancelled'); } }
$('l-emoji').innerHTML = EMOJIS.map(`, 'depositSend');
b = rep(b, "document.addEventListener('click', (e) => { const t = e.target.closest('[data-pane],[data-coin],[data-side],[data-emo]'); if (!t) return;", "document.addEventListener('click', (e) => { const t = e.target.closest('[data-pane],[data-coin],[data-side],[data-emo],[data-mode]'); if (!t) return;\n  if (t.dataset.mode) { MODE = t.dataset.mode; localStorage.setItem('hong.mode', MODE); SEL = null; loadBoard(); loadMe(); return; }", 'click mode');
b = rep(b, "if (m.type === 'trade') { $('tape').insertAdjacentHTML('afterbegin', trow(m.trade, true));", "if (m.type === 'trade') { if ((m.trade.mode || 'practice') !== MODE) return; $('tape').insertAdjacentHTML('afterbegin', trow(m.trade, true));", 'ws');
Wr('client/board.html', b);

// ── landing ──
let i = R('client/index.html');
i = i.split('https://x.com/hongdotfun').join('https://x.com/HongFunPad');
i = rep(i, "<div class=\"card\"><h4>06 · No custody</h4><p style=\"margin:0;font-size:13.5px;color:var(--ink2)\">Ledgers are simulated with a paper USDG balance per wallet. Prices are real. Nothing here is a security, a yield, or advice. On-chain curves come with the contract.</p></div>",
  "<div class=\"card\"><h4>06 · Two ledgers</h4><p style=\"margin:0;font-size:13.5px;color:var(--ink2)\">Every wallet gets a <b>Practice</b> ledger of 1,000 USDG on connect and a <b>Live</b> ledger funded with USDG you deposit on Robinhood Chain, verified from the on-chain transfer. Each ledger has its own board of coins. Withdraw from Live any time to your wallet.</p></div>", 'card06');
i = rep(i, "hong.fun 红 · simulated ledgers · real prices · not financial advice", "hong.fun 红 · practice and live ledgers · real prices · red is up", 'foot');
const a0 = i.indexOf('<section class="sec"><h2><span class="zi">问答</span>Questions</h2>'); const a1 = i.indexOf('</section>', a0) + 10;
const FAQ = `<section class="sec"><h2><span class="zi">问答</span>Questions</h2>
    <div class="faq">
      <details open><summary>What is hong.fun?</summary><p>A launchpad on Robinhood Chain where every coin is paired to a listed Chinese stock. You pick the underlying, name the coin, and it trades on a bonding curve whose price is multiplied by the stock's move since launch. Eighteen names across HKEX, Shanghai, Shenzhen and the US ADRs. Red is up, the way the mainland and Hong Kong tapes show it.</p></details>
      <details><summary>Why pair a memecoin to a stock?</summary><p>A coin that only reflects its own hype has nothing under it. Paired coins inherit a real tape. When BYD rips on delivery numbers, every BYD-coin rips with it, and the memes compete on top of that. It gives Chinese-market traders something to trade 24/7 in their own names.</p></details>
      <details><summary>How is the price set?</summary><p>Price = curve price × (stock now ÷ stock at launch). The curve is a constant-product bonding curve with virtual reserves of 3,000 USDG and 1.073 billion tokens, the same shape as pump.fun. The index is the underlying's live print divided by the print locked the moment the coin launched, read from the exchange tape every 15 seconds. Demand moves the curve. The tape moves the multiplier.</p></details>
      <details><summary>What is the difference between Practice and Live?</summary><p>Practice is a 1,000 USDG ledger every wallet receives on connect, with its own board of coins, the same curve, the same envelopes and the same tape. Live is a second ledger funded by USDG you deposit on Robinhood Chain, with its own board. The two boards never mix, so practice balances never move a live curve. You switch between them with one toggle.</p></details>
      <details><summary>How do I fund my Live ledger?</summary><p>Connect a wallet on Robinhood Chain, open the Live ledger on the board, and send USDG to the treasury address shown there, either from the board with one click or by pasting the transaction hash. The deposit is verified from the transaction receipt: the transfer must be from your wallet, to the treasury, in the USDG token contract, and the amount is read from the transfer event. Once it confirms, your Live balance updates. Minimum deposit is 10 USDG.</p></details>
      <details><summary>How do withdrawals work?</summary><p>Request any amount up to your free Live balance. It leaves your ledger immediately and enters the payout queue with an id. The treasury pays queued withdrawals in USDG to the wallet that deposited, and the transaction hash is attached to your request when it is paid. Coins you hold must be sold back to the curve before that USDG is free to withdraw.</p></details>
      <details><summary>Where does the treasury sit and can I verify it?</summary><p>The treasury is a wallet on Robinhood Chain. Its address is printed on the Live ledger, its USDG balance is read from the chain every 30 seconds next to the block it was read at, and every deposit credited to a ledger is tied to a transaction hash you can open on the Robinhood Chain explorer.</p></details>
      <details><summary>What are the red envelopes?</summary><p>One percent of every coin's supply is set aside in 88 envelopes. The first 88 distinct buyers each open one on their first buy: a hash-seeded draw between 0.3× and 2× of an even split, and every eighth buyer's envelope is multiplied by 1.88. Envelopes are credited on top of the purchase and show on the coin's card and on your bags.</p></details>
      <details><summary>What is the fee and what does it do?</summary><p>One percent on every buy and sell. Half buys $HONG at market and burns it. Half fills the envelope pool for the next launches. The pad's fee, burn and envelope totals are on the board.</p></details>
      <details><summary>What happens when a coin graduates?</summary><p>When net raised reaches 8,888 USDG the curve closes and the coin is marked listed with the 上市 seal. The raised USDG and remaining supply seed a DEX pool at the closing price and the LP is locked.</p></details>
      <details><summary>What happens when the stock is closed?</summary><p>The multiplier freezes at the last print. The curve still trades. When Shanghai opens at 09:30 CST the multiplier jumps to the new print and every paired coin gaps with it. HKEX and the US ADRs have their own sessions; the board shows 开盘 / 午休 / 收盘 on every coin.</p></details>
      <details><summary>Which stocks can I pair to?</summary><p>HKEX: Tencent, Alibaba, BYD, Meituan, Xiaomi, NIO, Li Auto, JD.com, SMIC, ICBC, Ping An and PetroChina. Shanghai and Shenzhen: Kweichow Moutai, Wuliangye, Ping An A and CATL. US: PDD and the Alibaba ADR. Each is priced live off the exchange tape in its own currency.</p></details>
      <details><summary>Is a Tencent-coin a share of Tencent?</summary><p>No. It is a coin whose price is indexed to Tencent's live print. No shares, no dividends, no voting. The index is the only link.</p></details>
      <details><summary>Which chain and wallet do I need?</summary><p>Robinhood Chain mainnet, chain id 4663. USDG is an ERC-20 there, so a deposit is a standard token transfer from your wallet. The board switches your wallet to Robinhood Chain when you deposit. Any EVM wallet works.</p></details>
      <details><summary>What is $HONG?</summary><p>The token half of every fee buys and burns. More launches, more trades, more burn. Its contract address is published on this page once live.</p></details>
      <details><summary>Why red for up?</summary><p>Because that's how the Shanghai, Shenzhen and Hong Kong exchanges display it, and because the pad is for them.</p></details>
      <details><summary>What are the risks?</summary><p>A paired coin can fall from the curve, from the underlying, or both, and a coin that never graduates stays on its curve. Use Practice first, size Live positions you are comfortable with, and read the rules.</p></details>
    </div></section>`;
i = i.slice(0, a0) + FAQ + i.slice(a1);
Wr('client/index.html', i);

// ── docs ──
let d = R('client/docs.html');
d = d.split('https://x.com/hongdotfun').join('https://x.com/HongFunPad');
d = rep(d, "<p class=\"tiny\">Rev. 1 · Robinhood Chain · red is up</p>", "<p class=\"tiny\">Rev. 2 · Robinhood Chain · Practice and Live ledgers · red is up</p>", 'rev');
d = rep(d, "The index P&amp;L is absorbed by the pad's reserve; on the simulated ledger this is bookkeeping, on-chain it is the contract's reserve.", "The index P&amp;L is absorbed by the pad's reserve.", 'docs2');
d = rep(d, "with <code>HONG_MINT</code> and a treasury key set the burn executes each period, until then it is a ledger with the USDG amount and the $HONG it buys at the DexScreener price.", "with <code>HONG_MINT</code> and a treasury key set the burn executes each period; the board shows the USDG amount and the $HONG it buys at the DexScreener price.", 'docs5');
d = rep(d, "On-chain, the raised USDG and remaining supply seed a DEX pool at the closing price and the LP is locked; on the simulated ledger the coin is frozen at its last price and shown with the 上市 seal.", "The raised USDG and remaining supply seed a DEX pool at the closing price and the LP is locked; the coin is frozen at its last curve price and shown with the 上市 seal.", 'docs6');
d = rep(d, "  <h2><span class=\"zi\">七</span>API</h2>", `  <h2><span class="zi">七</span>Ledgers · Practice and Live</h2>
  <ul>
  <li><b>Practice.</b> Every wallet receives 1,000 USDG on connect. It trades the practice board only.</li>
  <li><b>Live.</b> Funded with USDG (<code>0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168</code>, 6 decimals) sent on Robinhood Chain to the treasury address shown on the board. The server reads the transaction receipt and requires a USDG <code>Transfer</code> event from your wallet to the treasury; the credited amount is the event's value. Minimum 10 USDG. Each hash is credited once and kept on the ledger with its block.</li>
  <li><b>Boards.</b> Coins carry the mode they were launched in. Live coins trade only with live USDG, practice coins only with practice USDG, so the two never mix.</li>
  <li><b>Treasury.</b> A wallet on Robinhood Chain, published on the board. Its USDG balance is read every 30 seconds via <code>balanceOf</code> and shown with the block number of the read.</li>
  <li><b>Withdraw.</b> Request any amount up to your free live balance. It leaves the ledger immediately and joins the payout queue with an id. The treasury pays the queue in USDG to the depositing wallet and records the payout transaction hash on the request.</li>
  </ul>

  <h2><span class="zi">八</span>API</h2>`, 'docs api hdr');
d = rep(d, "<tr><td><code>GET /api/me?wallet=</code></td><td>paper USDG, bags, envelopes, launches</td></tr>", "<tr><td><code>GET /api/me?wallet=</code></td><td>practice and live USDG, bags by mode, withdrawal queue, envelopes, launches</td></tr>\n  <tr><td><code>GET /api/board?mode=practice|live</code> · <code>/api/live</code></td><td>the board for a mode · treasury address, balance, block, totals</td></tr>\n  <tr><td><code>POST /api/deposit</code> {wallet, tx} · <code>/api/withdraw</code> {wallet, amount}</td><td>credit a verified USDG transfer · queue a payout</td></tr>", 'docs api');
d = rep(d, "<tr><td><code>POST /api/buy</code> · <code>/api/sell</code> {wallet, id, amount}</td>", "<tr><td><code>POST /api/buy</code> · <code>/api/sell</code> {wallet, mode, id, amount}</td>", 'docs api2');
d = rep(d, "  <h2><span class=\"zi\">八</span>What this is not</h2>\n  <p>Coins are not shares. Holding a Moutai-coin gives no claim on Kweichow Moutai. Ledgers are simulated; each wallet starts with 1,000 paper USDG. Prices are real. Nothing here is a security, investment advice, or a promise. Paired coins can lose value from the curve, from the underlying, or both.</p>",
  "  <h2><span class=\"zi\">九</span>Risk</h2>\n  <p>Coins are indexed to a stock, not shares of it. Holding a Moutai-coin gives no claim on Kweichow Moutai. A paired coin can lose value from the curve, from the underlying, or both. Use Practice to learn the pad before funding Live, and size positions you are comfortable holding.</p>", 'docs risk');
d = rep(d, "hong.fun 红 · rules rev. 1", "hong.fun 红 · rules rev. 2", 'docs foot');
Wr('client/docs.html', d);

// ── README / X-KIT ──
for (const f of ['README.md', 'X-KIT.md']) { let t = R(f); t = t.split('@hongdotfun (placeholder in site links)').join('@HongFunPad').split('hongdotfun').join('HongFunPad'); Wr(f, t); }
console.log('hong.fun live patch applied');
