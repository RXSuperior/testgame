# UI components (Phase 7A)

Built by `tools/build.py` in this order into `dist/index.html`. `theme.css` is inlined into `<style>`. There is no framework and no new dependency.

| File | Contents |
|---|---|
| `src/ui/theme.css` | Tokens, layout grid, header, nav, cards, scene, special screens, dialogs and toasts, tablet and mobile breakpoints. No game logic. |
| `src/ui/util.js` | `AW.ui.u`: `esc`, number format, `bar`, `badge`, `rank`, `empty`, `todo`, risk labels, stat tooltips, `toast()`, `confirm()` modal, and the `page()` registry. |
| `src/ui/scene.js` | Location Scene: `sceneOf(E)` picks asset and title, `html()`, `draw()` (real asset or themed placeholder). |
| `src/ui/layout.js` | `header`, `side` (sidebar menu), `bnav` (mobile), `right` (activity, people, events, news, ledger), `worldLine`, `statusLine`. |
| `src/ui/screens.js` | `create`, `modal` (event/result/death), `combat`, `dungeonRun`, `dialogue`, `gates`. |
| `src/ui/pages_play.js` | Pages: dashboard, character, inventory, skills, equipment, party, missions. Shared parts are exported as `AW.ui.parts` (`sec`, `services`, `advList`, `towerTile`, `lifeHere`, `miss`). |
| `src/ui/pages_world.js` | Pages: map, relations, family, economy, association, guild, dungeon, tower, market, settings. |
| `src/ui/app.js` | `boot`, render shell, `update` (cached `innerHTML` per region, throttled at speed), router `go()`, `reveal(selector)`, focus mode, `act()`, click delegation, debug panel. |

## How it works
- **Rendering:**
  - every page renders into its own `<section class="page">` and only the active one is shown
  - regions update only when their HTML changes
  - updates are throttled to 300 ms while time runs
- **Actions:**
  - one delegated click handler on `#app` maps `data-*` attributes to system API calls
  - the same attributes as the old shell are kept (`data-mis`, `data-loc`, `data-cact`, …), so old tests and saves behave the same
- **Navigation:** `AW.ui.go(page)`. `AW.ui.reveal(selector)` opens the page that contains an element (used by links and tests).
- **UI state:** `AW.ui.state` holds page, focus override, right panel, open dialogue and last result. Only `mvh-ui-page`, `mvh-ui-right` and `mvh-ui-dev` are kept, in `sessionStorage`.
- **Adding a page:** `AW.ui.u.page('id',{title,render(E){return html}})` and a line in `NAV` in `layout.js`.
- **Old element ids kept:** `#world #status #step #menu #modal #combat #adv #people #player #gearp #partyp #famp #journal #pgates #ecop #lifep #locs #acts #miss #gates #info #dbg #new #pcreate #pname`.
