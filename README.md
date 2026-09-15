# hong.fun 红 — the Chinese-stock launchpad. Red is up.

Launch a coin on Robinhood Chain that is **indexed to a Chinese stock** (HKEX, Shanghai, Shenzhen, US ADRs). Bonding-curve price × the underlying's move since launch. First 88 buyers open a red envelope. 1% fee: half burns **$HONG**, half fills the envelope pool. Graduates at 8,888 USDG.

Dependency-free Node ≥18. `node server/index.js` → :8202. `/` landing · `/board` the pad · `/docs` rules.
Env: `PORT` `DATA_PATH` `HONG_MINT` · `DEV=1` enables `/api/dev/faucet`. Prices: Yahoo chart API. Ledgers simulated, prices real. Not financial advice.
