# Economy (Phase 6)

System: `src/systems/economy.js` (`engine.economy`). All prices and numbers live in `data/worlds/hunter/economy.js`.

## The problem
In the Phase 5 build, a character who reached C had nothing worth buying, so money piled up: 220k–245k by age 40 for mission/solo bots, while spending was 15–21 a month.

## Money tracking
- `player.addMoney(n, cat)` now emits `money:changed {n, cat}`. Other systems tag their money with `economy.as(cat, fn)`. The categories are mission, salary, living, housing, dungeon, tower, party, gear, upgrade, training, lifestyle, association, guild, invest, shop, sell, medical, underground, event and action.
- Slice `economy.ledger` keeps 24 months of {in, out, cats}, and `summary()` gives the averages.

## Services (data: `H.services`)
| kind | What it is | Examples |
|---|---|---|
| once | Bought one time, may have monthly upkeep | mana coating, home gym, meditation room, home clinic |
| repeat | Can be bought again; price grows by `grow` | intel report, Association program, skill seminar, mana course, guild sponsorship, rift stone pack |
| plan | Monthly subscription, can be cancelled; plans in the same `group` replace each other | Association insurance, private coach, gear maintenance, comfortable or luxury lifestyle |

- Prices go up with rank (`priceByRank`, `monthlyByRank`).
- Discounts: a perk `discount{cat}` from a service or job (insurance gives medical −60%), or a `discounts[{when,pct}]` entry on the service itself (private coach is −25% when Master Kang's affection is ≥ 60). The highest discount wins; they do not stack.
- Perks the systems read: `maint` (no gear wear), `wearGuard`, `injuryGuard`, `powerPct`, `discount`.
- Data is validated: kind, amounts, grow 1–3, cap, known perks, discount ≤ 0.5, conditions and effects.

## No debt loop
- A monthly fee is only taken if cash stays above a rank-based safety amount (`safetyCash`: E 100 … B 1000), so there is always money left for treatment.
- If the fee can't be paid, the service pauses that month. No arrears pile up. A plan that misses 3 months in a row is cancelled. A once-item with upkeep stays owned and turns back on when money returns.
- Phase 4 rent arrears still work as before.

## Gear condition
- Wear per fight: auto 1, manual 3, ×1.5 on a loss. Wear only applies to gear with a rank.
- Below 50 condition, gear stats fall in a straight line, down to half at 0. They are never removed.
- Repair costs per point by item rank (E 2, D 4, C 10, B 24). The maintenance plan or mana coating stops or slows wear.

## High-tier upgrades
`upgrade.grow` makes upgrade cost grow as a power. B gear goes to +5 with `grow:1.5`, so +1…+5 on the stormsteel blade costs 2,500 → 27,951 (≈70k in total).

## Guild investment (data: `H.guilds`)
- You can stake money with Northstar, Ironfang or Silverdragon. The cap depends on rank (D 2k, C 15k, B 50k).
- The monthly return is seeded and can be negative: Northstar 0.3% ± 1%, Ironfang 0.4% ± 3%, Silverdragon 0.5% ± 5%.
- Withdrawing costs a fee (5% / 8% / 10%).
- Guild standing comes from sponsorship or guild contracts. It is separate from the stake and opens guild contracts.

## Jobs
- Pay rises with years in the job: `raise` per year (5% by default), up to `raiseMax` (40%).
- Senior jobs need years in the job below them (`jobTenure`): office_senior, assoc_officer, gym_head, hospital_nurse, and guild_senior_contract (950, rank B).
- Jobs can carry perks (medical discount).

## Income side
- Doing the same mission again within 6 months cuts its money by 12% each time, never below 50%. Merit tiers soften this cut.
- Association merit decays 2% a month, so only active mission hunters keep high tiers.

## Before / after (age 15→40, 4 seeds × 6 styles = 24 characters)
See PLAYSTYLE_BALANCE.md for the full table. Cash at 40 dropped from 29k–245k to 3k–27k. Total wealth (cash plus guild stakes) is 3k–101k. Spending went from 2–68% of income to 94–99%, and the spending goes to things with a visible benefit.

## Known limits
- Guild stakes keep growing slowly (they are savings). Wealth at 40 counts them separately.
- Bots buy intel often. Real players may spend less there.
