'use strict';
// hong.fun brand kit → _studio/out/hongfun-*.html; render.js rasterizes to brand/. Warm paper, vermilion, gold, big 红.
const fs = require('fs'); const path = require('path');
const OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const CSS = `@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700;900&family=Noto+Sans+SC:wght@400;500;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}html,body{background:#f7efe0;font-family:'Noto Sans SC',sans-serif;color:#1c1410;overflow:hidden;-webkit-font-smoothing:antialiased}
.stage{position:relative;overflow:hidden;background:#f7efe0;background-image:radial-gradient(rgba(200,16,46,.05) 1.4px,transparent 1.8px);background-size:26px 26px;border-top:18px solid #c8102e;border-bottom:8px solid #c99a2e}
.serif{font-family:'Noto Serif SC',serif;font-weight:900}.mono{font-family:'IBM Plex Mono',monospace;font-variant-numeric:tabular-nums}
.red{color:#c8102e}.gold{color:#c99a2e}.green{color:#1f7a4d}.dim{color:#9a8a76}.ink2{color:#5a4a3a}
.k{font-family:'IBM Plex Mono',monospace;font-size:22px;letter-spacing:.24em;text-transform:uppercase;color:#9a8a76;font-weight:600}
.seal{display:inline-flex;align-items:center;justify-content:center;border:5px solid #b3121f;color:#b3121f;font-family:'Noto Serif SC',serif;font-weight:900;transform:rotate(-7deg);background:rgba(179,18,31,.06);box-shadow:inset 0 0 0 4px #f7efe0,inset 0 0 0 6px #b3121f;line-height:1;text-align:center}
.zi{font-family:'Noto Serif SC',serif;font-weight:900;color:#c8102e;line-height:.9;text-shadow:10px 10px 0 rgba(201,154,46,.35)}
.card{background:#fffaf0;border:2px solid #d9c9a8;border-top:6px solid #c8102e;padding:32px 36px}
.card h4{font-family:'IBM Plex Mono',monospace;font-size:20px;letter-spacing:.2em;text-transform:uppercase;color:#9a8a76;margin-bottom:14px}
.card b{font-family:'Noto Serif SC',serif;font-weight:900;font-size:44px;display:block;margin-bottom:10px}
.card p{font-size:26px;color:#5a4a3a;line-height:1.45}
.strip{background:#1c1410;color:#f7efe0;font-family:'IBM Plex Mono',monospace;font-size:24px;display:flex;overflow:hidden;white-space:nowrap}
.strip span{padding:16px 28px;border-right:1px solid #3a2e24}.strip .u{color:#ff5a6e}.strip .d{color:#4ed08a}
.logo{display:flex;align-items:center;gap:16px;font-family:'IBM Plex Mono',monospace;font-weight:600;font-size:40px}.logo .z{font-family:'Noto Serif SC',serif;font-weight:900;font-size:64px;color:#c8102e;line-height:1}
.btn{display:inline-block;background:#c8102e;color:#fff;font-weight:700;letter-spacing:.16em;text-transform:uppercase;font-size:26px;padding:22px 40px;border-radius:3px}`;
const wrap = (name, w, h, body) => fs.writeFileSync(path.join(OUT, name + '.html'), `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="stage" style="width:${w}px;height:${h}px">${body}</div></body></html>`);
const TAPE = [['腾讯', '0700.HK', '438.80', '+1.2', 1], ['阿里巴巴', '9988.HK', '107.20', '-0.4', 0], ['比亚迪', '1211.HK', '79.05', '+3.1', 1], ['贵州茅台', '600519.SS', '1272.75', '+0.6', 1], ['宁德时代', '300750.SZ', '316.36', '+2.4', 1], ['小米', '1810.HK', '26.50', '-2.4', 0], ['蔚来', '9866.HK', '28.68', '-2.2', 0], ['拼多多', 'PDD', '78.08', '+0.9', 1]];
const strip = TAPE.concat(TAPE).map((t) => `<span>${t[0]} ${t[1]} <b class="${t[4] ? 'u' : 'd'}">${t[2]} ${t[3]}%</b></span>`).join('');
const logo = (s = 1) => `<div class="logo" style="font-size:${40 * s}px;gap:${16 * s}px"><span class="z" style="font-size:${64 * s}px">红</span>hong.fun</div>`;

// PFP 2000² — the 红 glyph with a seal
wrap('hongfun-pfp', 2000, 2000, `<div class="zi" style="position:absolute;left:0;right:0;top:230px;text-align:center;font-size:1150px">红</div>
  <div class="seal" style="position:absolute;right:250px;bottom:300px;width:300px;height:300px;font-size:120px">fun</div>
  <div class="mono" style="position:absolute;left:0;right:0;bottom:120px;text-align:center;font-size:110px;font-weight:600;letter-spacing:.06em">hong.fun</div>`);
// banner 3000×1000
wrap('hongfun-banner', 3000, 1000, `<div style="position:absolute;left:150px;top:180px">${logo(1.6)}</div>
  <div class="serif" style="position:absolute;left:150px;top:330px;font-size:110px;line-height:1.05;max-width:1800px">Every coin paired to<br>a <span class="red">Chinese stock.</span></div>
  <div class="ink2" style="position:absolute;left:150px;top:600px;font-size:38px;max-width:1500px">Bonding curve × the A-share tape. 88 red envelopes. Red is up.</div>
  <div class="zi" style="position:absolute;right:220px;top:60px;font-size:760px">红</div>
  <div class="strip" style="position:absolute;left:0;right:0;bottom:0">${strip}</div>`);
// keyart 2400×1350 — landing as art
wrap('hongfun-keyart', 2400, 1350, `<div style="position:absolute;left:150px;top:110px">${logo(1.2)}</div>
  <div class="k" style="position:absolute;right:150px;top:140px;color:#c8102e">ROBINHOOD CHAIN · 上海 · 深圳 · 香港</div>
  <div class="serif" style="position:absolute;left:150px;top:290px;font-size:104px;line-height:1.04;max-width:1350px">The launchpad where every coin is <span class="red">paired to a Chinese stock.</span></div>
  <div class="ink2" style="position:absolute;left:150px;top:760px;font-size:34px;line-height:1.5;max-width:1250px">Pick Tencent, BYD, Moutai, CATL. Launch on a curve that is <b>multiplied by the stock's move</b>. First 88 buyers open a red envelope. Every trade burns $HONG.</div>
  <div style="position:absolute;left:150px;top:980px;display:flex;gap:24px;align-items:center"><span class="btn">Open the board</span><span class="seal" style="width:120px;height:120px;font-size:52px">红</span><span class="mono ink2" style="font-size:30px;margin-left:10px">hongfun.xyz</span></div>
  <div class="zi" style="position:absolute;right:130px;top:250px;font-size:820px">红</div>
  <div class="mono" style="position:absolute;right:170px;bottom:230px;font-size:26px;letter-spacing:.4em;color:#9a8a76">RED · IS · UP</div>
  <div class="strip" style="position:absolute;left:0;right:0;bottom:0">${strip}</div>`);
// how it works 2400×1350
wrap('hongfun-how', 2400, 1350, `<div style="position:absolute;left:150px;top:100px">${logo()}</div><div class="k" style="position:absolute;right:150px;top:126px">规则 · HOW IT WORKS</div>
  <div class="serif" style="position:absolute;left:150px;top:220px;font-size:96px;line-height:1">Demand moves the curve. <span class="red">The tape moves the multiplier.</span></div>
  <div style="position:absolute;left:150px;right:150px;top:470px;display:grid;grid-template-columns:repeat(2,1fr);gap:24px">
    <div class="card"><h4>01 · Pair</h4><b>Lock the base</b><p>Choose one of 18 Chinese names. The stock's live print at launch becomes the coin's index base. It never changes.</p></div>
    <div class="card"><h4>02 · Index</h4><b>price = curve × (stock ÷ base)</b><p>Moutai up 3% since you listed? Your coin's whole curve is up 3%. Closed market, frozen index. Open bell, everything gaps.</p></div>
    <div class="card"><h4>03 · 红包</h4><b>88 red envelopes</b><p>1% of supply. The first 88 buyers each open one: a random bonus, hash-seeded. Every 8th buyer gets 1.88×.</p></div>
    <div class="card"><h4>04 · Fee</h4><b>1% · half burns $HONG</b><p>Every buy and sell. Half buys $HONG at market and burns it, half fills the next launches' envelopes. Graduates at 8,888 USDG.</p></div>
  </div>
  <div class="mono" style="position:absolute;left:150px;bottom:80px;font-size:30px;color:#c8102e">hongfun.xyz</div><div class="mono dim" style="position:absolute;right:150px;bottom:80px;font-size:26px">simulated ledgers · real prices · red is up</div>`);
// the names 2400×1350
const N = [['腾讯', 'Tencent', '0700.HK'], ['阿里巴巴', 'Alibaba', '9988.HK'], ['比亚迪', 'BYD', '1211.HK'], ['美团', 'Meituan', '3690.HK'], ['小米', 'Xiaomi', '1810.HK'], ['蔚来', 'NIO', '9866.HK'], ['理想汽车', 'Li Auto', '2015.HK'], ['京东', 'JD.com', '9618.HK'], ['中芯国际', 'SMIC', '0981.HK'], ['工商银行', 'ICBC', '1398.HK'], ['平安', 'Ping An', '2318.HK'], ['中国石油', 'PetroChina', '0857.HK'], ['贵州茅台', 'Moutai', '600519.SS'], ['宁德时代', 'CATL', '300750.SZ'], ['中国平安', 'Ping An A', '601318.SS'], ['五粮液', 'Wuliangye', '000858.SZ'], ['拼多多', 'PDD', 'PDD'], ['阿里 ADR', 'Alibaba ADR', 'BABA']];
wrap('hongfun-names', 2400, 1350, `<div style="position:absolute;left:150px;top:100px">${logo()}</div><div class="k" style="position:absolute;right:150px;top:126px">上市 · 18 LISTED NAMES</div>
  <div class="serif" style="position:absolute;left:150px;top:210px;font-size:96px;line-height:1">Eighteen names. <span class="red">Three exchanges.</span> One pad.</div>
  <div style="position:absolute;left:150px;right:150px;top:380px;display:grid;grid-template-columns:repeat(6,1fr);gap:16px">${N.map((n) => `<div style="background:#fffaf0;border:2px solid #d9c9a8;padding:22px 20px"><div class="serif" style="font-size:44px;line-height:1">${n[0]}</div><div style="font-size:24px;color:#5a4a3a;margin-top:8px">${n[1]}</div><div class="mono dim" style="font-size:20px;margin-top:4px">${n[2]}</div></div>`).join('')}</div>
  <div class="mono" style="position:absolute;left:150px;bottom:80px;font-size:30px;color:#c8102e">hongfun.xyz</div><div class="mono dim" style="position:absolute;right:150px;bottom:80px;font-size:26px">HKEX 09:30–16:00 · SSE/SZSE 09:30–15:00 · index freezes when closed</div>`);
// vs pump.fun 2400×1350
const R = [['Launch a coin on a bonding curve', 1, 1], ['Coin paired to a real stock', 0, 1], ['Price moves with the exchange tape', 0, 1], ['Red envelopes for the first 88 buyers', 0, 1], ['Fee burns the pad token', 0, 1], ['Chinese names · HK · Shanghai · Shenzhen', 0, 1], ['Red is up', 0, 1]];
wrap('hongfun-vs', 2400, 1350, `<div style="position:absolute;left:150px;top:100px">${logo()}</div><div class="k" style="position:absolute;right:150px;top:126px">PUMP.FUN vs HONG.FUN</div>
  <div class="serif" style="position:absolute;left:150px;top:210px;font-size:96px;line-height:1">Same curve. <span class="red">Paired to China.</span></div>
  <div style="position:absolute;left:150px;right:150px;top:380px">
    <div style="display:grid;grid-template-columns:1.6fr .5fr .5fr;padding:14px 26px;border-bottom:4px solid #1c1410" class="k"><span></span><span style="text-align:center">pump.fun</span><span style="text-align:center;color:#c8102e">hong.fun</span></div>
    ${R.map((r) => `<div style="display:grid;grid-template-columns:1.6fr .5fr .5fr;padding:22px 26px;border-bottom:2px solid #d9c9a8;font-size:34px;align-items:center"><span style="font-weight:500">${r[0]}</span><span class="mono" style="text-align:center;font-size:40px;color:${r[1] ? '#1f7a4d' : '#c9bda3'}">${r[1] ? '✓' : '—'}</span><span class="mono red" style="text-align:center;font-size:40px">✓</span></div>`).join('')}
  </div>
  <div class="mono" style="position:absolute;left:150px;bottom:80px;font-size:30px;color:#c8102e">hongfun.xyz</div><div class="mono dim" style="position:absolute;right:150px;bottom:80px;font-size:26px">$HONG · Robinhood Chain</div>`);
console.log('built 6');

// PONS launch: initial awareness on an established Robinhood Chain pad vs a brand-new one
const PONS = [['Buyers on day one', 'holders and feed already on the pad', 'zero · you bring everyone'], ['Discovery', 'listed on the board and rankings', 'a link you have to push'], ['Liquidity', 'a curve and graduation route in place', 'seeded from scratch'], ['Trust', 'a launcher people already used', 'an unproven contract'], ['Chain', 'Robinhood Chain, same as hong.fun', 'Robinhood Chain'], ['What it costs', 'the token launches where the crowd is', 'awareness before the product exists']];
wrap('hongfun-pons', 2400, 1350, `<div style="position:absolute;left:150px;top:100px">${logo()}</div><div class="k" style="position:absolute;right:150px;top:126px">WHY $HONG LAUNCHED ON PONS</div>
  <div class="serif" style="position:absolute;left:150px;top:210px;font-size:88px;line-height:1">Launch the token <span class="red">where the crowd is.</span> Build the pad after.</div>
  <div style="position:absolute;left:150px;right:150px;top:400px">
    <div style="display:grid;grid-template-columns:.9fr 1.1fr 1.1fr;padding:14px 26px;border-bottom:4px solid #1c1410" class="k"><span></span><span style="color:#c8102e">$HONG on PONS</span><span>a brand-new pad</span></div>
    ${PONS.map((r) => `<div style="display:grid;grid-template-columns:.9fr 1.1fr 1.1fr;padding:20px 26px;border-bottom:2px solid #d9c9a8;font-size:31px;align-items:center;gap:20px"><span style="font-weight:700">${r[0]}</span><span style="color:#1f7a4d;font-weight:500">${r[1]}</span><span class="dim">${r[2]}</span></div>`).join('')}
  </div>
  <div class="mono" style="position:absolute;left:150px;bottom:80px;font-size:30px;color:#c8102e">hongfun.xyz</div><div class="mono dim" style="position:absolute;right:150px;bottom:80px;font-size:26px">$HONG · launched on PONS · Robinhood Chain</div>`);
