# Phase 7B.3 bug fix and stabilization

Fixes for the code audit of tag `phase7b.3` (1 critical, 5 major, minor items). Only the side-view system, its data, its tests and the asset tool were changed.
Nothing is committed or tagged. The work waits for the independent review.

## Changed files
| File | Change |
|---|---|
| `src/sideview/sideview.js` | HP model, lifecycle, pause ownership, NPC events, combat rules, goblin physics, metadata validator |
| `src/ui/sv_view.js` | one click listener, inert background, key handling in dialogs, safe image drawing, tileset drawing, animation timing, all NPCs, touch layout |
| `src/ui/theme.css` | side-view block only: stage grid, touch pads outside the canvas, full-screen dialog layer |
| `data/worlds/hunter/areas.js` | `talkEvents` owned by an NPC, `sprite` on spawns |
| `data/assets/art_meta.js` | tileset cell map and sheet size, goblin animation list |
| `tools/assets.js` | sees asset references from areas, checks sprite and tileset sheet size |
| `tests/core.test.js` | 23 new regression tests, 2 old tests updated to the stricter behaviour |
| `tests/sv_smoke.py` | 39 new browser checks |
| `tests/fixtures/phase6_save.json` | new: real Phase 6 save |
| `docs/phase7b/ART_BIBLE.md`, `docs/phase7b3/*` | docs, regenerated asset inventory, screenshots |
| `dist/index.html` | rebuilt |

Not changed: `src/core`, `src/systems`, `src/ui/app.js`, other UI files, the save format, the combat contract, the mission validator. `git diff --stat -- src/core src/systems` is empty.

## Round 1

### 1. HP synchronization (critical)
- Cause: the runtime copied the player's HP when the area loaded and wrote that copy back through `combat.apply` on exit. Any HP change made by an event in the scene was undone, and a retreat report was sent although no fight happened.
- Fix: `player.hp` in GameState is the only source of truth. The runtime keeps one number, `dmg`: damage taken in the scene that has not been sent to `combat.apply` yet. `rt.hp` is a getter (`player.hp - dmg`) and `rt.maxHp` reads `player.maxHp()` every time.
- `settle()` sends a report only when `dmg > 0` and the player is alive. No damage means no `combat:done`.
- Tests: event damage survives exit with no `combat:done`; pending damage plus an outside HP change add up and settle once; level-up updates max HP; death in the scene changes nothing on exit.

### 2. Click listener (major)
- Cause: `#sv` was reused, but a click listener was added on every open.
- Fix: the element, its click listener and the key listeners are created once in `root()`. Touch listeners sit on buttons that are rebuilt on each open, so they cannot pile up.
- Tests (browser): third open, one click on save = one `saveTo`; one click on an answer = one `events.answer`, no error.

### 3. Pause and resume (major)
- Cause: `game:loaded` cleared the runtime reference, so the view never called `exit()` and the `explore` pause stayed. Keyboard focus could leave the overlay with Tab, which made this reachable.
- Fix: the handlers for `game:loaded` and `game:new` call `runtime.abort()`. It releases the runtime's own pause once and writes nothing (the state was just replaced). A runtime releases `explore` only if it is the registered active runtime; it never touches other reasons.
- Focus: `#app` is `inert` while the scene is open, and focus moves into the scene.
- Tests: load and new game during a scene leave no `explore` reason, keep `menu`, write nothing extra, and time can advance; an old runtime cannot release a new runtime's pause; 38 Tab presses never leave the scene.

### 4. NPC events (major)
- Cause: `talkEvents` belonged to the area, so every NPC offered Hajun's event and became its `who`.
- Fix: `talkEvents:[{npc,event}]`. The option shows only for that NPC. `choose()` re-checks that the NPC is in the scene and that the option belongs to them.
- Tests: only Hajun offers the event; choosing it through another NPC or an absent NPC throws; nobody offers it when Hajun is away.

### 5. Runtime lifecycle
- `enter()` refuses a second runtime. `open()` returns the running scene. `exit()` works once.
- A failed `enter()` releases its pause.
- Doors: the validator rejects a door to a location without an area or without the named arrival point. The runtime checks area and entry rule before it settles or moves. The old `left` path is gone, and so is the null access after it.
- The frame loop does not schedule a new frame after close. Tests count frame calls after close (0 new) and with a double open (one loop).

### 6. Gameplay rules
Old behaviour: fights cost no AP, ignored the heavy-injury rule that missions use, and gave 24 EXP a month for free.

New rule, in `fightWhy()` / `engage()`:
- A fight can start when the player is alive, has injury below 2 (same as missions) and has at least 1 AP.
- A fight starts when either side lands the first hit. Starting costs 1 AP per goblin, once.
- If a fight cannot start, goblins keep patrolling, cannot be damaged, cost nothing and give nothing. The HUD says why.
- Reward: only for a goblin whose fight was started (AP paid), once per spawn per month. Retreat or loss does not refund AP. After a loss all goblins disengage, so there is no loss loop.
- Goblins now use the same physics step as the player: solid blocks, platforms, world edges, gravity.

Reward size was decided by the owner in round 4: 50 EXP per goblin for 1 AP (see below).

## Round 2
1. Image load failure: the view draws real art only when the pipeline reports the file loaded, the image decoded, and the sheet is at least as large as the metadata needs. Otherwise it draws the placeholder. Drawing errors are reported once and do not stop the loop.
2. Placeholder fallback: tested with a missing file and with a sheet that is too small.
3. Tileset: drawn from the Asset Registry image using the `tiles` cell map (`top`, `fill`, `platform`), only for cells on screen.
4. Touch controls: pads are separate grid cells. Portrait: under the game image. Landscape: left and right of it. They never overlap the canvas (tested at 390x844, 360x740, 844x390).
5. HUD after level-up: fixed by item 1 of round 1.
6. Dialog keys: Space, Enter and Tab belong to the dialog buttons. E closes a result. A held E (key repeat) does not reopen the dialog.
7. NPC rendering: everyone at the location is placed. Owners of talk events get the designed spots first; the rest are spread over free positions away from doors. E picks the nearest NPC. Names show for all when 6 or fewer, otherwise only near the player.
8. Metadata: the runtime takes collision boxes from `bbox` and attack timing from the `attack` animation. The view uses `frame`, `anchor`, `anims` (row, frames, fps, loop). The validator rejects missing or inconsistent sprite and tileset metadata. The tool checks sheet size and lists area references.
9. `tests/fixtures/phase6_save.json`: made by running the code of tag `phase6` itself (mission bot, 150 months, rank B, level 35). Not edited by hand.

## Regression tests
Every new node test was also run against the old source (tag `phase7b.3`): 20 of 23 fail there. The 3 that pass check behaviour that was already correct (no fight = no report, save compatibility).

Node (`p7b3fix`, 23 tests): HP (5), pause (3), lifecycle (1), doors (1), NPC event (1), NPC crowd (1), combat rules (4), goblin collision (1), state writes (1), metadata (2), tool (1), saves (2).

Browser (39 checks): focus (2), listener (2), dialog keys (6), load and new game in scene (3), loop lifecycle (2), NPC crowd (1), wrong-size sheet (1), HUD and AP (3), missing sprite (2), real sprite (2), real tileset (1), error log (2), touch layout 3 screens x 4.

## Test results
| Suite | Result |
|---|---|
| `node tests/core.test.js` | 318 pass, 0 fail |
| `python3 tests/sv_smoke.py` | 75 pass, 0 fail |
| `python3 tests/smoke.py` x3 | 57/57 each |
| `python3 tests/ui_smoke.py` | 34/34 |
| `python3 tests/responsive.py` | 56/56 |
| `python3 tests/asset_smoke.py` | 11/11 |
| `node tools/assets.js --check` | 100 assets, 0 errors, 0 warnings |

Build: `python3 tools/build.py` → `dist/index.html`, 60 files, syntax check passed.

## Save compatibility
Fixtures Phase 2, 3, 4, 5 and 6 each: load; every old slice equals a build without side-view; `scene` gets its default; save again and reload is byte-identical; six more months of play stay identical with and without side-view. The Phase 6 save also enters the gate zone, fights, saves and reloads. The save format did not change.

## Performance
- Node: 16 µs per step with two goblins using full physics (was 4 µs without goblin collision); 2.8 µs per step with 205 NPCs in the area.
- Browser: 0.22 ms per frame on average including drawing.
- GameState writes during frames: none. The only write in a fight before it ends is the single AP payment when it starts (tested over 600 frames).

## Known limits
- Reward size versus AP cost: decided in round 4 (50 EXP).
- The enemy is the existing `goblins` entry, whose name is "ฝูงก็อบลิน" (a pack). One sprite stands for it.
- Goblins do not jump. A goblin pushed outside its patrol range behind a block walks into the block until the player comes near.
- Landscape phones narrower than about 600 px get a small game image because the pads take 144 px.
- Real touch hardware, Firefox and Safari were not tested. `inert` needs Chrome 102, Safari 15.5 or Firefox 112.

## Final review fixes (round 3)
Scope: mobile portrait layout and portable browser tests. Not committed or tagged.

### Changed files
| File | Change |
|---|---|
| `src/ui/sv_view.js` | `fit()` sizes the scene per screen; HUD, Save/Exit and messages are grid items; dialog starts below the HUD (`--svtop`) |
| `src/ui/theme.css` | side-view block: portrait layout (`#sv.sv-portrait`), dialog sheet, 44 px buttons |
| `src/sideview/sideview.js` | `view` and `setView(w)`: the camera width is configurable (default 576) |
| `tests/original_game.py` | new: shared original-game hash check |
| `tests/original_game_test.py` | new: self-test of the check |
| `tests/smoke.py`, `tests/ui_smoke.py`, `tests/sv_smoke.py` | use the shared check, no fixed path |
| `tests/sv_smoke.py`, `tests/core.test.js` | layout and camera tests |
| `.gitignore` | `__pycache__/` (created by the shared Python module) |

`src/core`, `src/systems`, `src/ui/app.js`, the save format and the combat API are unchanged.

### Portrait layout
The world is 324 px tall, so a taller camera would only add empty sky. Portrait therefore uses a narrower camera at a larger scale:
- `scale` = the largest value where both the remaining height and a 216-world-px-wide view fit, rounded down so that `scale x devicePixelRatio` is a whole number. Each art pixel is a whole number of screen pixels, scaled nearest-neighbour, never stretched.
- Camera width = screen width / scale (at most 576).
- Rows, top to bottom: HUD and Save/Exit, game image, prompt and messages, touch pads. Nothing is drawn over the game image. Safe-area insets are respected.
- Dialogs open as a full-width sheet below the HUD row, buttons at least 44 px tall.
- Landscape and desktop keep the old layout: camera 576, HUD at the top-left of the image, Save/Exit at the top-right. Only the dialog now starts below the HUD.
- Rotating the device re-runs the layout.

| Screen | Mode | Game image (CSS px) | Share of screen | Camera (world px) | Scale |
|---|---|---|---|---|---|
| 390x844 (dpr 3) | portrait | 390x540 (was 390x219) | 64% | 234x324 | 1.667 |
| 360x740 (dpr 3) | portrait | 360x540 (was 360x203) | 73% | 216x324 | 1.667 |
| 430x932 (dpr 3) | portrait | 430x540 (was 430x242) | 58% | 258x324 | 1.667 |
| 844x390 (dpr 3) | landscape | 693x390 | 82% | 576x324 | 1.204 |
| 1280x720 | desktop | 1280x720 | 100% | 576x324 | 2.222 |

Screenshots: `sv_layout_<size>.png` and `sv_layout_<size>_dialog.png` in this folder.

Trade-off: in portrait the player sees 216 to 258 world px ahead instead of 576. Goblins start chasing at 160 px, so one can begin to approach from just off screen.

### Portable original-game check
- Path: `ORIGINAL_GAME_PATH`, else `../game4/index.html` next to the repo. The output always names the path and where it came from.
- PASS: the file exists, its sha256 equals the value locked since Phase 1 (`d53b7879…`), and it did not change during the run.
- FAIL: wrong hash (original modified), or the file changed or vanished during the run.
- SKIP: no file. The line says why and how to enable the check. The summary shows `ข้าม 1` and the skip is not counted as a pass.
- Verified with real runs of `ui_smoke.py`: missing path → SKIP, exit 0; real file → PASS; modified copy → FAIL, exit 1.

### New tests
- `tests/original_game_test.py` (14): pass, missing via env, missing fallback, modified, changed during run, vanished during run, summary counting, locked hash value, and that all three suites use the check with no fixed path.
- `tests/sv_smoke.py` layout (42): per size, game image size and share, no stretching, nearest-neighbour scaling, whole device pixels (portrait), nothing over the image (portrait), image at least twice the old 16:9 height (portrait), old layout kept (landscape, desktop), pads off the image, dialog inside the screen and clear of the HUD, 44 px dialog buttons, real two-finger touch through Chrome DevTools (hold ▶ and tap ▲, lift one finger, lift all), rotation, no console errors.
- `tests/core.test.js` (1): narrow camera follows the player, stays inside the area, returns to 576.

### Results
| Suite | Result |
|---|---|
| `node tests/core.test.js` | 319 pass |
| `python3 tests/original_game_test.py` | 14 pass |
| `python3 tests/sv_smoke.py` | 117 pass |
| `python3 tests/smoke.py` x3 | 57 pass each |
| `python3 tests/ui_smoke.py` | 34 pass |
| `python3 tests/responsive.py` | 56 pass |
| `python3 tests/asset_smoke.py` | 11 pass |
| `node tools/assets.js --check` | 100 assets, 0 errors |
| `python3 tools/build.py` | built, 60 files |
| `git diff --check` | clean |

Saves from Phases 2 to 6 still load (tests `p7b3fix save`).

### Known issues
- Browser tests still assume Chrome at `/usr/bin/google-chrome`. Only the original-game path was made portable.
- The black margin in portrait comes from rounding the scale to whole device pixels: 52 px above and below at 390x844.
- The layout was tested in Chromium emulation only. Not tested on real phones, Safari or Firefox.
- Reward size was decided in round 4.

## Balance fix (round 4)
Owner decision: a goblin in the scene gives **50 EXP for 1 AP**. Previously 12.

Changed files:
- `data/worlds/hunter/areas.js`: `reward:[{exp:12}]` → `reward:[{exp:50}]` for both spawns. This is the only gameplay change.
- `tests/core.test.js`: 3 old assertions updated from 12/24 to 50/100, plus 8 new tests in 7 groups (`p7b3bal`).
- `docs/phase7b3/BUGFIX_REPORT.md`, `PHASE7B3_REPORT.md`, `CHANGELOG.md`: updated to match.

No code changed. The rules already in place enforce the rest:
- EXP only after a fight was started and its AP paid.
- 1 AP per goblin.
- Once per spawn per month.
- No AP refund on retreat or loss.
- EXP only, no money or items.

### New tests (`p7b3bal`)
| # | Check |
|---|---|
| 1 | Spawn data is exactly `[{exp:50}]`; a started and won fight pays exactly +50 EXP, costs 1 AP, money and inventory unchanged |
| 2 | The same spawn never pays twice in one month: reopening the scene, reloading the area, leaving and coming back through doors, save and load, a fresh engine loading the save |
| 3 | A goblin never engaged pays nothing and costs no AP |
| 4 | No AP, or injury ≥ 2: no EXP however often the goblin is hit (including direct `hitFoe` calls) |
| 5 | Retreat and loss pay no EXP and refund no AP; a new fight after a loss costs a new AP and pays once when won |
| 6 | Next month both spawns return with new keys and pay 50 each; old keys are pruned; the same month does not pay twice |
| 7 | Mission `goblin_gate` data is still `money 100, exp 100, mana_stone x2`; a real win pays `round(100 x exp multiplier)` EXP, `round(100 x money multiplier)` money and 2 mana stones (Phase 6 multipliers, e.g. 115 EXP with the solo bonus) |

Checked that the tests catch regressions: with the reward set back to 12, five tests fail; with the mission EXP temporarily set to 90, test 7 fails. Both files were restored.

Running the mission on the committed `phase7b.3` code and on the current code (same seed) gives the same result: +115 EXP, +100 money, +2 mana stones.
