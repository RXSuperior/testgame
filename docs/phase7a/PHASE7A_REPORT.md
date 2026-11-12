# Phase 7A report: complete UI/UX overhaul

1. **Done:**
   - dashboard layout with a sticky header, left menu, main area and right panel
   - 17 pages on real data
   - special screens: combat, dungeon run, events, NPC dialogue, gate travel, death
   - Location Scene component with a themed placeholder that switches to real art through the manifest
   - responsive layout: desktop, tablet (collapsible right panel), mobile (bottom nav and drawer)
   - toasts, confirm modal, tooltips, loading and empty states
   - debug hidden behind `?debug=1` or a Settings toggle
2. **Files:**
   - New: `src/ui/theme.css`, `util.js`, `scene.js`, `layout.js`, `screens.js`, `pages_play.js`, `pages_world.js`, `app.js`, `tests/ui_smoke.py`, docs/phase7a/*
   - Removed: `src/ui/shell.js` (its handlers were moved into `app.js`, keeping the same `data-*` attributes)
   - Changed: `src/template.html` (CSS slot, loading state), `tools/build.py` (UI file list, CSS), `tests/smoke.py` (debug URL, page reveal before click)
3. **Not changed:** `src/core`, `src/systems`, data, gameplay, combat, economy, NPC and save formulas. No API change was needed.
4. **Tests:** unit 269/269, old browser 57/57 ×3, new UI 34/34. No console errors and no horizontal overflow at 1440/1024/768/390/360 px.
5. **Known limits:**
   - All art is still placeholder.
   - NPC portraits, item icons and enemy images are not shown yet (see PLACEHOLDERS_FOR_7B.md).
   - The right panel moves below main on tablet; it is not a slide-in drawer.
   - Every page re-renders on update (cached per region). This is fine at the current size; switch to rendering only the active page if pages grow.
6. **Phase 7B:** not started.
