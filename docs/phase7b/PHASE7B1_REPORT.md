# Phase 7B.1 report: Art Bible & asset pipeline preparation

1. **Inventory (from code):**
   - 93 assets in the existing registry: 89 old and 4 new placeholder ids (`hunter.bg.school`, `shared.portrait.player_m`, `shared.portrait.player_f`, `hunter.portrait.best_friend`). None have real files.
   - The UI shows 18 location scenes today (P0 + P1).
   - Data also needs about 9 NPC portraits, 22 items, 15 skill icons and art for 16 enemies that are not registered yet (REQUIRED_ART_LIST.md).
2. **Art Bible:** style, characters, locations, monsters, items, skill icons, lighting, palette (tied to the UI colours), camera, quality, negative prompts, and identity per world (Hunter, Fantasy, Murim, Apocalypse, others). Murim and Apocalypse have no world in the game yet.
3. **Pipeline:**
   - metadata on the same manifest entries (`data/assets/art_meta.js`)
   - browser loader with load tracking, missing and dimension checks, fallback, preload of P0/P1 and lazy loading of the rest (`src/ui/assetpipe.js`)
   - check and inventory tool (`tools/assets.js`)
   - the build copies only referenced files
   - `src/core` is unchanged; the registry is used as it is
4. **Pilot plan:**
   - 10 images mapped to registry ids, with prompts
   - the character briefs are based only on the data
   - the player has gender only (no appearance system), and Hajun has no physical description anywhere, so both briefs need your approval
5. **Not done, on purpose:**
   - no images generated (no image tool in this session, and generation is 7B.2)
   - no gameplay, data or world changes
   - the school still uses `bg.city_day` until you approve the link
6. **Files:**
   - New: data/assets/art_meta.js, src/ui/assetpipe.js, tools/assets.js, tests/asset_smoke.py, docs/phase7b/* (ART_BIBLE, ASSET_INVENTORY, ASSET_PIPELINE, PILOT_ASSET_PLAN, REQUIRED_ART_LIST, asset_registry_mapping.json, TEST_REPORT, this report)
   - Changed: src/ui/app.js (loader wiring), src/ui/scene.js (draws only after the image has loaded and passed the checks), tools/build.py (order, asset copy), tests/core.test.js (+5 tests)
7. **Decisions needed before 7B.2:** see PILOT_ASSET_PLAN.md §Open decisions (image tool and terms, main character look, Hajun look, school link, old sprite sheets).
