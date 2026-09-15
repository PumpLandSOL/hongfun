// HONGBAO E2E (DEV=1): tape, launch (dup ban), indexed quote, buy w/ envelope, sell, fee ledger, graduation.
const B = 'http://localhost:8202'; const A = '0x00000000000000000000000000000000000000a1', C = '0x00000000000000000000000000000000000000c2';
const get = (u) => fetch(B + u).then((r) => r.json()); const post = (u, b) => fetch(B + u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }).then((r) => r.json());
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
const near = (a, b, e) => Math.abs(a - b) <= e;
(async () => {
  const cfg = await get('/api/config'); ok('config + tape live', cfg.ok && cfg.params.graduate === 8888);
  const t = await get('/api/tape'); const live = t.stocks.filter((s) => s.px > 0); ok('≥12 Chinese stocks priced', live.length >= 12, live.length + '/18 · ' + live.slice(0, 3).map((s) => s.zh + ' ' + s.px).join(', '));
  ok('sessions labeled', t.stocks.every((s) => s.session && /开盘|午休|收盘|休市/.test(s.session.label)));
  const bad = await post('/api/launch', { wallet: A, stock: 'AAPL', name: 'x', ticker: 'XX' }); ok('non-Chinese underlying refused', /listed Chinese/.test(bad.error || ''));
  const L = await post('/api/launch', { wallet: A, stock: '600519.SS', name: 'Moutai Enjoyer', ticker: 'MOUTAI', emoji: '🍶', desc: 'baijiu szn' }); const c = L.r;
  ok('launch paired to Moutai, base locked', L.ok && c.stock === '600519.SS' && c.px0 > 0 && c.idx === 1 && c.envelopesLeft === 88, 'base ' + c.px0 + ' CNY');
  const dup = await post('/api/launch', { wallet: C, stock: '0700.HK', name: 'y', ticker: 'moutai' }); ok('duplicate ticker banned', /taken/.test(dup.error || ''));
  const q = await get('/api/quote?id=moutai&side=buy&amount=100'); ok('buy quote: fee 1%, idx 1', near(q.fee, 1, 1e-9) && q.idx === 1 && q.tokOut > 0, 'tokOut ' + Math.round(q.tokOut));
  const b1 = await post('/api/buy', { wallet: A, id: 'moutai', amount: 100 }); const tr = b1.r.trade;
  ok('buy: tokens = quote, envelope #1 opened', near(tr.tok, q.tokOut, 1) && tr.envelope && tr.envelope.n === 1 && tr.envelope.amt > 0, 'env +' + Math.round(tr.envelope.amt));
  ok('ledger: 1000 − 100 USDG, bag = tokens + envelope', b1.r.me.usdg === 900 && near(b1.r.me.bags[0].tok, tr.tok + tr.envelope.amt, 1));
  const b2 = await post('/api/buy', { wallet: A, id: 'moutai', amount: 50 }); ok('second buy by same wallet: no envelope', !b2.r.trade.envelope);
  const bC = await post('/api/buy', { wallet: C, id: 'moutai', amount: 30 }); ok('new wallet: envelope #2', bC.r.trade.envelope && bC.r.trade.envelope.n === 2);
  const board = await get('/api/board'); ok('fees: 1% of 180 = 1.80, half to burn', near(board.stats.fees, 1.8, 0.01) && near(board.stats.burnUsd, 0.9, 0.01) && board.stats.envelopes === 2, JSON.stringify({ fees: board.stats.fees, burn: board.stats.burnUsd }));
  const cn = board.coins.find((x) => x.id === 'moutai'); ok('price rose, raised = 178.2, 86 envelopes left', cn.price > c.price && near(cn.raised, 178.2, 0.01) && cn.envelopesLeft === 86 && cn.holders === 2);
  const s = await post('/api/sell', { wallet: C, id: 'moutai', amount: 1e15 }); ok('sell (capped to bag) returns USDG minus fee', s.ok && s.r.trade.side === 'sell' && s.r.trade.usdg > 0 && s.r.me.bags.length === 0, 'got ' + s.r.trade.usdg);
  // graduation: faucet + big buys
  await post('/api/dev/faucet', { wallet: A, amount: 20000 }); let g = null; for (let i = 0; i < 6; i++) { const r = await post('/api/buy', { wallet: A, id: 'moutai', amount: 1800 }); if (r.error) { console.log('buy err', r.error); break; } if (r.r.coin.listed) { g = r.r.coin; break; } }
  ok('graduates at ≥ 8,888 raised → listed', g && g.listed && g.raised >= 8888, g && 'raised ' + g.raised);
  const post2 = await post('/api/buy', { wallet: C, id: 'moutai', amount: 10 }); ok('curve closed after listing', /graduated/.test(post2.error || ''));
  const me = await get('/api/me?wallet=' + A); ok('me: envelopes + launched recorded', me.envelopes.length === 1 && me.launched.includes('moutai') && me.nav > 0);
  console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exitCode = fails ? 1 : 0;
})();
