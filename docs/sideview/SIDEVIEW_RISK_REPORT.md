# Side-view risk report

Ordered by impact.

| # | Risk | Why (from the code) | Mitigation |
|---|---|---|---|
| 1 | **Art direction conflict** | 7B.1 approved manhwa illustration. Side-view gameplay needs pixel sprite animation. The registry's 31 old sprite-sheet ids are P3. | Split it: pixel for gameplay, manhwa for cutscenes and portraits. Revise the Art Bible before any sprite work. |
| 2 | **Unconfirmed asset licenses** | The old pixel packs in `game3/a` have no license files. The manifest lists them only as candidates. `m2/*` has an unknown source. | Use them only after you confirm them; record source and license per file. Otherwise placeholders. The asset check tool already blocks files without a license. |
| 3 | **Monster animation gaps** | Old monster strips have Idle/Attack/Hurt/Dead, but **no Walk**. | Slide the Idle strip while moving in the slice; add walk strips later. |
| 4 | **Saving per frame would be costly** | `state.mutate` deep-clones, freezes and emits per write. | Keep real-time state out of `GameState`; write the `scene` slice only on area change or save. |
| 5 | **Combat contract** | Missions and dungeons rely on `combat:ended` + `claim()` of a manual session. The mission validator allows only `auto/manual`. | The slice uses `apply()` for free encounters only. Mission and dungeon action mode is a later, approved change to Phase 5 code. |
| 6 | **Balance drift** | Real-time skill (dodging) changes outcomes that were tuned for auto/turn-based fights (Phase 5–6 bots). | Damage numbers come from `profile`/`enemy`. Free encounters give small or no rewards at first. Balance missions only when they switch modes. |
| 7 | **Time model confusion** | The day slot comes from AP, not real time. Players may expect a day/night cycle from walking. | The HUD shows the slot and AP clearly. The month ends only by sleep or an explicit action. Document this in the tutorial. |
| 8 | **NPC presence is stochastic** | Schedules use chances (for example the city in the evening is 40%). A scene can be empty. | That is expected world behaviour. Tests pin seed and slot; the dashboard still lists who is where. |
| 9 | **Two render paths** | DOM pages, plus a canvas at 60 fps. The DOM `update()` re-renders every page. | Explore mode pauses heavy page renders (only header and HUD update). The canvas loop runs only in explore mode. |
| 10 | **Mobile controls** | No input system exists today. Touch platforming is hard. | On-screen buttons (◀ ▶ jump attack interact) with 44 px+ targets, and a test on 390 px. Real-device testing is still needed (not possible here). |
| 11 | **Thai text in canvas** | Canvas `fillText` handles Thai poorly. | All text stays in DOM overlays; the canvas holds only art and numbers. |
| 12 | **Scope creep** | The request covers movement, exploration, NPCs, action combat, cutscenes and all worlds. | Ship the vertical slice first; each later step is gated by your review. |
| 13 | **Test determinism** | Real-time code is usually timing-dependent. | Fixed-step simulation as pure functions, unit-tested in node. Playwright drives time through a test hook (`advance(frames)`) instead of wall-clock waits. |

What is missing today, plainly:
- no input system
- no frame loop
- no physics or collision
- no area layouts
- no animation player
- no real-time combat
- no cutscene format
- no character appearance data
- no confirmed pixel art
