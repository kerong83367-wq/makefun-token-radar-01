# Token Launch Radar

[![make.fun](https://make.fun/badge/competition/token-radar-01)](https://make.fun/bounty/token-radar-01)
[![make.fun](https://make.fun/badge/entry/token-radar-01)](https://make.fun/bounty/token-radar-01)
[![make.fun](https://make.fun/badge/verified/token-radar-01)](https://make.fun/bounty/token-radar-01)

A token launch radar for make.fun's `token-radar-01` bounty: it ranks the 40 pre-token
protocols on the watchlist, plus 137 more pre-token protocols below the $50M TVL floor, by
an implied token value computed from the snapshot's own figures — and gives every one a
concrete farm plan.

## The model (radar-2)

`implied = TVL x category multiple x growth x maturity x breadth`

- **Category multiple** — what a locked dollar is worth depends on the business: Dexs and
  Perpetuals 0.35, Lending and CDP 0.30, Prediction 0.28, RWA 0.25, Risk Curators 0.24,
  Insurance 0.22, Yield 0.20, Stablecoins 0.18, Bridge 0.15, everything else 0.25.
- **Growth** — 7-day TVL change clamped to [-50%, +150%]; multiplier `1 + growth x 0.6`.
- **Maturity** — `0.65 + 0.35 x sqrt(min(age, 1460) / 1460)`. A protocol that ran two years
  with no token is steadier than a two-week-old one, but age alone never doubles a value.
  Unknown age counts as 365 days.
- **Breadth** — `1 + min(chains - 1, 4) x 0.03` per extra chain.

No protocol name is ever special-cased: the same function scores every row.

## The board

177 rows: the full 40-protocol watchlist plus 137 early rows (pre-token, below the $50M
floor, excluding bridges, staking receipts, exchanges, versioned pools and wrapped products).
Already-trading protocols are shown separately as live-token rows, at the market's own
values — never mixed into the ranking.

Each row carries an 8-step farm plan, generated from the protocol's own category, chains,
TVL tier and age: fresh wallet, the category's main action with a sized capital, a weekly
action, a points-page check, a second-chain or second-feature step, a hold period, a
claim-safety step, and a risk note.

## Run it

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts --input /input/snapshot.json
```

Node 22, standard library only, no network. Writes `board.json`, `data.js`, `dashboard/`,
`screenshots/` and `dossier.json` to the output directory. Two runs produce byte-identical
output.

## Data

Snapshot: DefiLlama public API, fetched 2026-11-14, sealed by the competition kit
(`as_of` 2026-11-14, 758 protocols, floor $50,000,000).
