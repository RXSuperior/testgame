# Health, Illness & Death (Phase 4)

Code: `src/systems/health.js` (`engine.health`). Illnesses: `data/shared/people.js` (cold, flu, pneumonia, chronic back pain, heart disease).

## Player
- **Body condition 0–100:** drops 1.5 per year after age 40, goes up/down with `lifeMod` (events such as "the body starts showing its age"), and drops 10 per injury month.
- **Monthly illness chance:**
  - Base 2%, higher when condition is poor, doubled after 50.
  - Some illnesses only happen from a certain age.
- **Effect:** illness severity 2 or more:
  - AP −1
  - no missions
  - no work pay
  - combat power −10% per severity level
- **Treatment:** the hospital's `treat` action (100) halves the remaining months. A treated illness cannot kill.
- **Death:**
  - A deadly illness left untreated: 6% per month, ×0.15 under 40, ×0.5 under 60.
  - Old age: from 62, (age − 58)/220 per year.
  - Combat still does not kill (same as Phase 3).

## NPCs
They use the same `Health.roll`. In worlds the player is not in, it runs as a 12-month batch (×12 chance).

## When the player dies (`die`)
1. `player.alive=false`, `death {cause, month, age}`, AP 0. Nothing is deleted.
2. A **life record** is added to `health.lives` (append only):
   - name, age, cause, class, rank, level
   - karma, traits, reputation, flags
   - assets: money, items, equipment, home, job
   - family: background, spouse, members with alive status, lineage
   - top 8 relationships
3. Pending events are cleared, and time stops with loop reason `dead`.
4. Everything stops: events, missions, actions, moving, Life and Health monthly updates.
5. After a load it is still dead and still paused. The UI shows the life record and a "start a new life" button.

Death text stays plain: it shows only the age and cause, with no violent detail.
