# Life System (Phase 4)

Code: `src/systems/life.js` (`engine.life`). Data: `data.housing`, `data.jobs`, `config.livingCost`, `config.calendar`. It takes ideas from life9/life5 and rewrites them as a separate module.

## Housing
- Modes:
  - `family` (parents' home, free)
  - `rent` (first month paid on move-in)
  - `own` (buy for `price`, then `upkeep` each month)
  - `shelter` (free, used when evicted and there is no family left)
- `agent` is where you go to rent or buy. Hunter: the city, or the association for the hunter dorm.

## Jobs
- Any job, not only Hunter (convenience store, ramen shop, gym, hospital, office, association clerk, guild contract).
- Awakened players can still work normal jobs (tested).
- A job:
  - has `when` (conditions to apply)
  - pays `salary`
  - costs `ap` per month (the office takes 2 AP, so it is full time)
  - has `monthly` effects (growth, like the old PATHS)
  - has `status` (social standing)
- `npcOnly` jobs are for NPCs only (teacher, doctor, shopkeeper, hunter, student).
- Work days and days off:
  - In a holiday month (`calendar.holidayMonths`) the player is paid without spending AP.
  - Injured or seriously ill: no work, no pay.

## Money each month (global `month`, after Player and Health)
1. Work: spend AP, then get the salary and the job's monthly effects.
2. Costs: rent / upkeep / living cost (30 per month when not at the family home), plus arrears.
3. If money runs short, pay what there is; the rest becomes `arrears`. **Money never goes negative** (tested).
4. If arrears exceed 3 months of rent, the player is evicted: to the family home if a parent is alive, otherwise to the shelter.

Every month is logged in `ledger` (last 12).

## Social status
Score = job status + home comfort (×2 if owned) + reputation/5 + rank×10. Bands: lower class / middle class / upper-middle class / upper class.
