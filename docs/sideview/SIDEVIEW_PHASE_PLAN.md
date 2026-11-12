# Side-view phase plan (proposal)

Each step ends with tests, a tag and a stop for review, like earlier phases. None of this is started.

## Step 0: decisions before code
1. **Art direction:** pixel art for gameplay and manhwa illustration for cutscenes and portraits. If you agree, the Art Bible gets a pixel section.
2. **Old pixel assets in `/home/claude/game3/a`:** can we confirm their licenses?
   - CraftPix free licence for `c/`, `m/`, `bg/`
   - GandalfHardcore for `gh/`
   - `m2/` source unknown, so not usable
   
   If yes, the slice can use real sprites. If no, the slice ships with labelled placeholder rectangles.
3. **Character sprite:** use the old modular 80x64 body sheet (`gh/chars.png`, has walk/run/jump/attack/death), or 128 px strips?

## Step 1: Vertical slice (7B.3), playable
Scope (all real systems, no fake data):

| # | Feature | How |
|---|---|---|
| 1 | Walk and jump | input + physics (fixed step), camera |
| 2 | One city scene | area `school`: the street in front of the school (a city street), 1920 px wide, ground plus 2 platforms, layers from `bg.city_day` |
| 3 | One NPC | Hajun at school on a work-day morning (his real `student` schedule via `npcs.at`). Rule: whoever the schedule places there appears, nobody else. A test fixes a seed and slot so Hajun is present. |
| 4 | Talk and choices | press E near the NPC → the existing dialogue (`rels.actions/interact`) and any eligible event card (`events`), for example `friend_gate_clip`, where Hajun wants to film the gate |
| 5 | A door | at the street end → `player.moveTo('gate_zone')` (respects `canEnter` and `enter` events), loads area `gate_zone`; a door back |
| 6 | One monster type | goblin (`goblins`, power 60, asset `mon.goblin`) roaming the gate fence, 1–2 at a time |
| 7 | Basic combat | J attack (hitbox frames), contact damage, i-frames, knockback, enemy patrol, aggro and wind-up attack. The result goes to `combat.apply()`; normal risk, so no death (critical if HP reaches 0). |

Plus:
- HUD: HP bar, AP, interact prompt
- Esc returns to the dashboard
- "end month" from the HUD
- saving stores the area and x through the new `scene` slice

Out of scope for the slice: skills (K), party members in the scene, missions, dungeons and towers in side-view, cutscenes, gamepad, tiles.

Tests:
- node unit tests for physics (landing, walls, one-way platforms, jump buffer), area validation, the report → `apply` bridge, and the `scene` slice with old fixtures
- Playwright: keyboard walk/jump/door/talk/fight, mobile touch controls, no console errors
- 60 fps budget check: frame time under 8 ms at 1440 px with 1 NPC and 2 monsters

## Step 2 (7B.4): content and feel
- Areas for all 10 Hunter locations; NPC spots; interactables mapped to existing actions; services and job counters
- Animation polish, hit-stop, particles, sound hooks (no audio files yet)
- Touch controls tuned on real phones

## Step 3 (7B.5): combat depth
- Skills in real time (MP/cooldown from existing skills)
- Party members as AI allies
- Enemy patterns mapped from data (heavy/guard/shield/summon/drain)
- Missions and dungeons in action mode. This needs approved changes to the Phase 5 mission validator and claim path.

## Step 4 (7B.6): cutscenes
Cutscene data format, player, triggers from events and areas, first manhwa panels after the art pipeline produces them.

## Step 5: other worlds
- Fantasy areas (3 locations).
- Murim and Apocalypse need world data first, which is a gameplay phase, not side-view.

Rough size: the slice is about 1,200–1,800 lines of new UI and data code, plus tests. Later steps grow with content.
