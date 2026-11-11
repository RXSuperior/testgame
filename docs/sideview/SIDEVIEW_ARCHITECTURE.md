# Side-view architecture (proposal, not built)

The idea: side-view is a **new presentation and interaction layer** on top of the existing simulation. Life, story, months, NPC schedules, combat results, economy and saves stay the authority. The side-view layer moves a body around a location and turns what happens there into calls to the existing APIs.

```
            ┌───────────── existing (unchanged) ─────────────┐
 keyboard/  │ Loop (months) · Player · Worlds · NPCs · Rels  │
 touch ───► │ Events · Combat.apply · Economy · Save         │
   │        └──────▲───────────────▲─────────────▲───────────┘
   ▼               │ moveTo/doAction│ present/answer│ apply(report)
 Input ──► Scene runtime (60 Hz fixed step, not in GameState)
           physics · collision · actors · animation · camera
           │ draws to          │ asks DOM for
           ▼                   ▼
        <canvas> game view   DOM overlay: HUD, dialogue, event choices, cutscene text
```

## Canvas or DOM
**Canvas for the game world, DOM for UI and text.**
- Canvas suits pixel art: integer scaling, `imageSmoothingEnabled=false`, dozens of animated sprites, parallax layers and particles at 60 fps without layout cost.
- DOM stays for Thai text (shaping, wrapping and fonts render better than canvas `fillText`), accessibility, the existing event card and dialogue, the menus, and every existing test selector.
- The current Location Scene is already a canvas. The side-view view replaces it in "explore mode" and reuses its asset ids and fallbacks.

## Modules (new files, UI layer + data)
| Module | Responsibility | Notes |
|---|---|---|
| `src/ui/sv/input.js` | keyboard (A/D or ←/→ move, Space/W jump, J attack, K skill, E interact, Esc menu), touch buttons, later gamepad; ignores keys while a text field has focus | no existing input to reuse |
| `src/ui/sv/physics.js` | pure functions: AABB move-and-collide against solid rects and one-way platforms, gravity, coyote time and jump buffer | pure, so node can unit-test it with a fixed step |
| `src/ui/sv/area.js` | builds a runtime area from world data: size, ground and platforms, doors, NPC spots, interactables, spawn zones, parallax layers | reads `ctx.list('areas')` |
| `src/ui/sv/actors.js` | player body, NPC bodies (from `npcs.at()`), monster bodies (stats from `combat.enemy()`) | |
| `src/ui/sv/anim.js` | sprite-strip animation state machine (idle/walk/jump/fall/attack/hurt/dead) driven by `anims` metadata on asset entries | |
| `src/ui/sv/combat_rt.js` | real-time hit and hurt boxes, i-frames, knockback, enemy AI (patrol, aggro, attack wind-up); at the end it builds a report in the existing shape and calls `combat.apply()` | death policy kept: normal risk never kills |
| `src/ui/sv/view.js` | `requestAnimationFrame` loop, fixed 60 Hz update with interpolation, camera follow with dead-zone, layered draw, debug overlay for hitboxes | |
| `src/ui/sv/explore.js` | explore-mode controller: enter/exit, door → `player.moveTo()`, interact → `rels`/`events`, AP and month bridge, HUD | |
| `data/worlds/hunter/areas.js` | layout data per location (see below) | new data kind, with its own validator |

No new registry: areas come through the world registry, sprites through the asset registry, enemies through combat, people through npcs.

## Area data (per location)
```js
{id:'school', loc:'school', width:1920, height:324, spawn:{x:120},
 layers:['bg.city_day'],                       // asset ids, parallax order (back→front); a later version adds per-layer speed
 solids:[{x:0,y:296,w:1920,h:28}],            // ground and walls (AABB)
 platforms:[{x:600,y:230,w:160}],             // one-way platforms
 doors:[{x:1880,to:'city',label:'ไปย่านใจกลางเมือง'}],
 npcSpots:[{x:700},{x:1100}],                 // NPCs present (npcs.at) take spots in order
 interact:[{x:400,action:'hunter.part_time',label:'ร้านสะดวกซื้อ'}], // existing action events
 spawns:[]}                                    // monster zones {x1,x2,enemy,max}
```
- Rects first, tiles later. A Tiled-style tile layer can be added for detail, but collision stays rect-based, which is simpler, faster and testable.
- Coordinates use a 576x324 virtual screen. This matches the existing scene size and the old 576x324 parallax backgrounds, which are integer-scaled to the window.

## Physics, collision, animation
- **Physics step:** fixed timestep 1/60 s with an accumulator. Same inputs give the same result, so tests are deterministic. Uses `E.rng` only for AI randomness.
- **Collision:** separate axes (move X, resolve; move Y, resolve) against solids. One-way platforms only collide when falling from above. Player box about 20x44 px at virtual size.
- **Animation:** strip-based (`frames`, `fps`, `loop`) from `anims` metadata. Facing flips the sprite. Events fire on specific frames (for example the attack hitbox is active on frames 3–4).
  - 128 px strips (old CraftPix-style packs) and the 80x64 modular sheet both fit with per-asset metadata.
- **Camera:** horizontal follow with a dead-zone, clamped to the area. Integer pixel positions when drawing.

## Real-time movement and the monthly clock
- **Explore mode pauses the month loop** with reason `explore` (the pause-reason API already exists). Walking around never advances months.
- **Time within the month stays AP-based.** Doing a real action (work, train, mission, talk with a cost) spends AP through the existing API. That moves the day slot (morning → day → evening). NPCs then change position on the next area load, because `npcs.at()` uses the slot.
- **The month ends only by explicit choice:** sleep at home, or "end month" on the HUD calls `loop.tick()`. Month events run through the existing event card, and the area reloads.
- **Fights:** a real-time fight does not use AP unless it is part of a mission. A mission still costs AP through `missions.start`.

## Saves
- **Real-time state is never written to `GameState` per frame.** Bodies, velocities and animation timers live in the scene runtime only.
- **New slice `scene` (`{_v:1, area, x, facing}`):** written only on area change or save. Old saves lack it → `init()` → the player appears at the area's spawn point. No save-format or core change is needed; the orphan and init behaviour is already tested with the Phase 2–6 fixtures.
- **Saving mid-fight:** a real-time fight is not saved mid-swing. Saving during a fight is blocked (like a menu during an action), or the fight ends as a retreat. A real-time `combat` session is never written into the `combat` slice. This avoids the turn-based `claim()` contract.

## Combat bridge
- **Free encounters** (monsters in an area): real-time fight → report `{mode:'action', win, outcome, hpAfter, injury, critical, dead:false, party:[], skillUse, lines}` → `combat.apply(report)`. This is already public and already used by `fight()`, so HP, injury, Health, party and skill XP all update through existing code.
- **Missions, dungeons and towers** keep their auto and manual flows at first. Moving them to action combat needs `missions` to accept `mode:'action'` and a claim path for action reports. That is a change to Phase 5 systems, so it is deferred and must be approved.
- **Numbers come from existing data:** player damage from `combat.profile().power` and skill `mult`; enemy HP and damage from `combat.enemy()` (power, hp, armor, patterns). The real-time layer turns these into hits; it does not invent new stats.

## Cutscenes (later phase)
- Data: `{id, panels:[{asset, text, who, duration}], then:eventId}`.
- Played in a DOM overlay over a full-bleed 16:9 canvas or image. Pausing reason `cutscene`.
- Triggered by an event field (`cutscene:'id'`) or an area trigger. Art is manhwa panels (16:9), consistent with the 7B.1 Art Bible for illustration work.

## What stays where
- The DOM dashboard and pages stay. Explore mode is one more special screen.
- Every existing button, test and API keeps working, and players can still play without explore mode.
