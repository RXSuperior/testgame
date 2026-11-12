# NPC System (Phase 4)

Code: `src/systems/npcs.js` (`engine.npcs`). Data: `data.npcs`, `data.schedules`, `data.jobs`, `config.namePool`, `config.population`, `config.calendar` of each world. Shared tempers: `data/shared/people.js`.

## Storage
- One slice per world: `npcs:<world>`, owner `npcs`, version `_v: 1`. Contents: `{list:{id: npc}, seq, populated}`.
- NPC id is `world.id` (for example `hunter.best_friend`). It is unique and checked on every add.
- NPC record:
  - who: id, name, world, gender, species, role, faction
  - places and work: home, work, occupation, status, schedule, override
  - age: bornAt (in the world's **local** months)
  - personality: traits (brave/kind/dili/loyal), temper
  - other: tags, flags, memory (last 12), alive, death `{cause, month, global, ageY}`, ill, origin (`data`/`gen`/`script`)
- Relationships are not stored on the NPC. They live in the Relationship System.

## Where NPCs come from
- **World data** (`data.npcs`): added on new game. After a load, only ids not already present are added, so a load never duplicates an NPC.
  - Hajun (`best_friend`) is an ordinary entry here.
  - `flagChance` sets a flag with a fixed chance per game seed. For example, Hajun has a 50% chance to awaken.
- **Generated** (`generate`): uses its own Rng seeded from `game seed | world | sequence`, not the main game rng. The same seed gives the same people every time.
- **Population** (`config.population`): generated once per game. The `populated` flag in the save prevents doing it again.
- Validation before a world registers: home/work/schedule/occupation/temper/traits exist, and `rels` point to NPCs that exist. If not, the world is not registered (atomic, Phase 3).

## Schedules
- `schedule.entries`: `{slot: morning|day|evening|night, days: work|off|any, at: home|work|<location>, chance}`. The first matching row wins.
- `chance` uses a fixed hash of `(npc, month, slot)`, so asking again gives the same answer and no rng is used.
- **Time of day:**
  - The game ticks once a month, so the slot comes from the player's AP left: 2 = morning, 1 = day, 0 = evening.
  - Worlds the player is not in count as day.
- **Day type:** `config.calendar.holidayMonths` (local month % 12). Hunter: months 0 and 6 are long holidays.
- **Order of rules:**
  1. dead: nowhere
  2. seriously ill (severity ≥ 2): at home
  3. `override` (`npcMove` from an event, with an end month)
  4. the schedule
  5. home
- A job change (`setJob` / `npcJob`) changes `work` and the schedule that comes with the job.
- No movement is simulated. The place is worked out when asked (`where`, `at`), so the cost is O(1) per NPC.

## Monthly simulation (LOD)
- On `world:month` of each world:
  - **The world the player is in:** every local month. This covers illness/death (the same `Health.roll` as the player), override expiry, and `socialize` (NPCs in the same place meet; fondness moves with chemistry).
  - **Other worlds:** once every 12 local months, as a 12-month batch for illness/death. No socializing.
- NPC age comes from local time. Player age is not affected (tested).
