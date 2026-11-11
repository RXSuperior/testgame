# Phase 7B.3: Side-view Vertical Slice

A playable side-view slice on top of the Phase 1–7B systems. Open it from the Dashboard ("เดินสำรวจ") at the school, the city or the gate zone.

## What is playable
- Three connected areas: the street in front of the school, the city street, the gate zone. Doors in both directions.
- Walk left/right, jump, drop through one-way platforms. Collision with solid blocks, coyote time, jump buffer, short hop when the button is released early.
- Camera follows the player with a dead zone and stops at area edges.
- NPCs come from the real schedule (`npcs.at`). Hajun stands at the school on work-day mornings and daytime, and leaves when the time slot changes.
- Press E near an NPC: options from `rels.actions` (talk, gift, ...) plus area events that are eligible now (`hunter.friend_gate_clip`). Event choices use the normal `events.present/answer`.
- One goblin type (`hunter.goblins`), two spawns in the gate zone. Real-time melee: patrol, chase, 0.5 s wind-up, cooldown, knockback, invulnerability frames.
- HUD: area, time slot, HP bar, AP.
- Save button in the scene, plus normal saves. Area and position are saved.
- Esc closes a dialog first, then leaves the scene and returns to the Dashboard. Touch buttons on mobile.

## Rule conflict found (no rule changed)
The brief asked for a door from the school straight to the gate zone. Existing location rules make that impossible for one character:
- `school` requires `awakened:false`
- `gate_zone` requires the `registered` world flag (after awakening)

Solution: school ↔ city ↔ gate_zone. Every door calls `player.moveTo`, so the old rules decide. Before registration the gate door shows "(ล็อก)"; after awakening the school door is locked. Changing the location rules needs separate approval.

## Architecture
| Part | File | Notes |
|---|---|---|
| Physics, camera | `src/sideview/physics.js` | Pure functions, fixed step 1/60 s, no DOM, no GameState |
| Runtime | `src/sideview/sideview.js` | `install(E)` adds slice `scene` and the area validator. `Explore` runs one session in memory |
| Area data | `data/worlds/hunter/areas.js` | One area per location, read through the world registry (`ctx.list('areas')`) |
| View | `src/ui/sv_view.js` | Canvas 576x324, input, touch, HUD, dialogs. No game rules |
| Assets | `data/assets/art_meta.js` | 5 sprites, 2 tilesets as placeholders, with frame/anchor/bbox/anims metadata |

- `src/core` unchanged. `installGameplay` unchanged. The new module is installed next to it in UI boot and tests.
- GameState is written only when something happens: area change, goblin defeated, save, exit. Never per frame (tested: 300 frames = 0 writes).
- Combat results go through the public `combat.apply(rep)` with `mode:'action'`, `party:[]`. The goblin key (`area|month|spawn`) is stored in `scene.resolved` before the reward, so a reload, area re-entry or save/load never pays twice.
- Death rule kept: these fights are normal risk. HP 0 = loss report (`hpAfter:1`, injury 3), respawn at the area start. Never death.
- Damage you take and then walk away from is recorded once as a retreat before a door, save or exit, so player HP always matches.
- Missions are untouched: they still accept only auto/manual. Side-view fights are free encounters and do not complete missions.
- Save contract unchanged: `scene` is a normal slice. Old saves get the default; an area that no longer matches the player location is cleared on load.

## Art
- Art Bible updated (section 14): pixel art for gameplay and HUD, manhwa for cutscenes and portraits. Earlier rules kept.
- 64x64 character frame, foot anchor (32,63), separate bbox, 7 animations. Other frame sizes allowed through metadata.
- No game3/a image used. Everything is placeholder. Replacing = add `src` + `license` to the asset entry.

## Not done
- No sprite art, sound or particles.
- One enemy type; goblins do not jump or follow you through doors.
- Side-view fights give EXP only; no item drops, no mission credit.
- Only the three hunter areas. Other locations still use the Dashboard.
