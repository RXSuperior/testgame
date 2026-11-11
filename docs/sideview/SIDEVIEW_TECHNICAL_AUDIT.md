# Side-view 2D RPG: technical audit (Phase 7B.2)

Base: `ab050f9` (tag `phase7b.1`). Every finding below comes from reading the code in this repo and the old game folders (`/home/claude/game4`, `/home/claude/game3/a`). No source file was changed.

Code size today:

| Folder | Files | Characters |
|---|---|---|
| src/core | 11 | 18.6k |
| src/systems | 18 | 180k |
| src/ui | 9 | 77k |
| Hunter world data | 14 | 137k |

## 1. UI and application structure
- `src/ui/app.js` boots the engine and renders a DOM dashboard: header, sidebar, 17 pages, right panel and special screens.
- Rendering:
  - `innerHTML` per region, cached by string
  - `update()` throttled to 300 ms while time runs
  - every page renders on update
- Input is one delegated `click` handler on `#app` (`data-*` attributes) plus one `keydown` for Escape.
- **Canvas today:** only the Location Scene (`src/ui/scene.js`), 576x324. A `setInterval(draw, 200)` redraws a static image (5 fps), with no animation and no game objects.
- **Gap:** no real-time render loop, no `requestAnimationFrame`, no camera, no sprite drawing.

## 2. Game loop and time
- **Ticks:** `src/core/loop.js`. One tick is one month (`month:before` → `month` → `month:after`). Speed comes from `setInterval(baseMs/speed)`; `baseMs` is 1200.
- **Pausing:** pause takes a reason (`pause(r)`/`resume(r)`). Combat already uses the reason `combat`, and the UI uses `menu`.
- **Time within a month:** derived from AP. `npcs.clock()` gives slot = morning/day/evening for AP 2/1/0. Spending AP (actions, missions) moves the day forward. There are no hours or minutes.
- **Gap:** no sub-month clock and no frame delta.

## 3. Player system (`src/systems/player.js`, slice `player`, v3)
- **Data:**
  - location `{world, loc}` (named place, no coordinates), hp, AP 0–2, stats, class, level/exp
  - skills, `skillLv`, equipment (3 slots), upgrades, money, ranks, flags
- **Appearance:** only `gender`. There is no skin, hair or outfit. The old game had all of these (`game4/create5.js`, `gchar.js`).
- **Movement:** `moveTo(loc)` checks `canEnter`, runs `enter` events and costs no AP.
- **Gap:** no position, velocity, facing, collision box or animation state.

## 4. World system and registry (`src/systems/worlds.js`)
- Worlds register from data with validators (`addValidator`) and are atomic.
- `ctx.list(kind)` turns any data array with `id`s into a Map. This means new data kinds (for example `areas`) can be added without changing the system.
- Locations are `{id, name, desc, bg, enter}`. Hunter has 10 and Fantasy has 3. Murim and Apocalypse have no world data.
- Gates (world travel) and per-world time already exist.
- **Gap:** locations have no layout: no width, ground, platforms, door positions or spawn points.

## 5. NPCs and relationships
- **Placement:** NPCs (`npcs.js`, level-of-detail simulation) are placed by schedule: `where(n, clock)` → loc, and `at(world, loc)` lists who is present.
  - Example: Hajun (`best_friend`, schedule `student`) is at school in the morning and during the day on work days, and in the city in the evening (40%).
- **Interaction:** relationships (`relations.js`) have directed edges with aff/trust/resp. `rels.actions(npc)` and `rels.interact(npc, id)` are the real interaction API.
- **Gap:** NPCs have no position inside a location and no sprite or animation data.

## 6. Combat (`src/systems/combat.js`)
- **Auto:** `resolve()` computes and `apply()` writes, through registered modes (`register(mode, fn)`, only `auto` today).
- **Manual:** a turn-based session (`start/act/_end/claim`) stored in the `combat` slice. It pauses the loop with reason `combat`.
- **Shared result path:** `apply(rep)` writes HP, injury, critical, death, party results and skill XP, and emits `combat:done`. Missions and dungeons listen to `combat:ended` and call `claim(id)`, which needs a manual session.
- **Profile and enemies:** `profile()` (power, maxHp, mp, skills, party) and `enemy(world, id)` (power, hp, armor, patterns) are reusable.
- **Death policy:** normal risk never kills; high = critical; lethal only when marked.
- **Gap:**
  - no real-time combat, hitboxes or i-frames
  - mission validation only allows `mode: auto|manual`, so an `action` mode needs a validator change
  - `claim()` only accepts manual sessions

## 7. Events and story (`src/systems/events.js`)
- **Triggers:** auto, month, enter, action, passive, dungeon, tower.
- **Choices:** Ask/Answer with conditions, checks, odds and effects through the Rules DSL. NPC binding through `who` and `$who`.
- **API:** `present(id)`, `pending()`, `choices()`, `answer(i)`, `doAction(id)`, `actions()` (actions available at the current location).
- **UI:** the event card (`#modal`) and NPC dialogue modal already exist.
- **Gap:** no cutscene format (panels, camera, timed lines), and nothing triggers by position (for example "walk into the gate area").

## 8. Save and load (`src/core/save.js`, `state.js`)
- Keys are `mvh1:slot<N>` with a checksum and `.prev` backup. Old-game keys `hunter-path-*` are protected.
- **Slices:**
  - snapshot is JSON
  - every write (`mutate`) deep-clones and freezes the whole slice and emits `state:changed`
  - an unknown slice in a save is kept as an orphan
  - a newly registered slice that is missing from an old save gets its `init()` value
  - so a new module can add a slice without any save-format change (proven by the Phase 2–6 fixtures)
- Migrations are per module, through a `_v` field.
- **Constraint:** `mutate` per frame (60 Hz) would clone, freeze and emit 60 times a second. Real-time state must not live in `GameState`.

## 9. Assets (`src/core/assets.js`, `src/ui/assetpipe.js`, `tools/assets.js`)
- **Registry:**
  - 93 ids, all placeholders
  - `kind/w/h/frames/anchor/layers` fields
  - the 7B.1 metadata (type, std, priority, path) is on the same entries
- **Pipeline:** load tracking, dimension check, fallback, preload, lazy loading, and a check tool.
- **Old pixel assets that fit side-view** (in `/home/claude/game3/a`, licenses not confirmed: no license files are in the folder; the manifest lists them only as "candidates"):
  - `bg/*`: 22 sets of 576x324 parallax layers (city 8 layers, home, gate, gatered, guild, hospital, tower, forest and others; 140 files)
  - `c/g1..g3, m1..m3, trader`: 128 px frame strips (Idle, Walk, Attack, Hurt/Dead, Dialogue)
  - `m/*`: 9 monsters (skeleton, slime and wolf variants) with Idle, Attack_1, Hurt and Dead strips, but **no Walk strip**
  - `gh/chars.png`: an 800x14336 modular body sheet with 80x64 frames (the old system: idle 5, walk 8, run 8, jump 4+4, attack 6, death 10)
  - `gh/c_*`: 18 backgrounds
  - `i/*`: 22 item icons
  - `m2/*`: 6 bosses (source unknown)
- **Art direction conflict:** Phase 7B.1 approved a manhwa illustration style. This phase asks for pixel art gameplay with manhwa cutscenes. The Art Bible needs a revision, and the 31 "old sprite sheet" ids (P3) become core.

## 10. Input
- Only mouse/touch clicks and Escape. There is no keyboard movement, gamepad or touch joystick.
- The old game had no keyboard movement either (no `ArrowLeft` or `KeyA` in `game4/*.js`).

## Summary: reuse or change
| System | Reuse as is | Needs extension (later phase, must be reported) | New |
|---|---|---|---|
| Loop / time | yes: pause reasons, month tick, AP-based day slot | — | frame loop for the scene (UI layer) |
| Player | stats, hp, AP, location, `moveTo` | appearance fields (if a look system comes back) | runtime body (x, y, velocity, facing), not saved per frame |
| Worlds | registry, validators, `ctx.list` | — | `areas` data kind (layout per location) and its validator |
| NPCs / relations | schedule `at()`, `actions/interact` | — | NPC placement points per area |
| Events | `present/choices/answer/doAction`, `#modal` | position triggers: optional `area` field | cutscene format |
| Combat | `profile`, `enemy`, `apply`, death policy | mission `mode:'action'` and a `claim()` path for action fights | real-time action combat |
| Save | slices, orphans, migrations | — | small `scene` slice (area, x, facing) |
| Assets | registry and pipeline | animation metadata on entries (`anims`) | sprite animation player |
| UI | DOM pages, event modal, dialogue, toasts | Dashboard entry into explore mode | canvas game view, HUD, touch controls |
| Input | — | — | keyboard, touch, gamepad later |
