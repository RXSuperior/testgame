# UI design (Phase 7A)

The test shell (`src/ui/shell.js`) is replaced by a game UI. Game systems, formulas and the save format are unchanged. `git diff phase6 -- src/core src/systems data` is empty.

## Theme
Modern Hunter + Dark Fantasy + Korean Manhwa. All colours are CSS variables in `src/ui/theme.css`.

| Role | Colour |
|---|---|
| Background | navy/charcoal `#0b0f1a`, with soft blue/violet glows |
| Panels | dark gradients `#1a2340` → `#141b2e` |
| Accent | blue `#4cc3ff`, violet `#9b7bff` |
| Rank and rewards | gold `#f2c14e` |
| Danger | red `#ff5c6c` |
| Text | `#e8ebf5`, muted `#9aa5c4` |

Font stack: Sarabun, Noto Sans Thai, Leelawadee UI, Tahoma, system. No web font is downloaded, so the game works offline and adds no dependency.

## Layout (dashboard)
- **Sticky header:**
  - name and class, rank badge (gold), HP bar, MP bar, money, level and EXP bar, AP pips, age, month and speed, world
  - time controls (pause, 1x, 3x, 10x, +1 month, pause toggle) and a right-panel toggle
  - it stays visible while scrolling
- **Left sidebar:** 17 pages in three groups (play, hunter, system), with an active state and `aria-current`.
- **Main:**
  - special screens on top (character creation, event/result/death, combat, dungeon run)
  - then the active page
- **Right sidebar:** current activity, people you know (opens dialogue), recent events, world news, monthly ledger.

## Pages
Dashboard, Character, Inventory, Skills, Equipment, Party, Missions, Map/Worlds, Relationships, Family, Economy, Hunter Association, Guild, Dungeon, Tower, Dark Market, Settings.

Every page reads the real systems. A page that needs you to be somewhere shows a "go there" button (a real `moveTo`) instead of a fake action. No button exists without a handler; this is tested. No page needed a TODO in this phase, because every listed system already has an API.

## Special screens (focus mode)
- **Combat:**
  - team versus enemies, with HP bars and status (enraged, shield, armor)
  - last 6 log lines, action buttons
  - the dashboard is hidden while it runs
- **Dungeon run:** floor and room, loot so far, log, next room or leave.
- **Event choices:** a card at the top of main, with the NPC badge and odds on each choice.
- **NPC dialogue:**
  - a modal with age, relation, affection, trust, combat role and recent memories
  - the real interaction buttons
  - invite to party
- **Gate travel:** gate cards on the Map page and the dashboard, showing travel time and why travel is blocked.
- **Death:** a life summary with a "new life" button.

During combat or a dungeon run, choosing a menu item still opens that page (for example Settings, to save), with a "back to the fight" bar.

## Responsive
| Width | Layout |
|---|---|
| ≥ 1200 px | sidebar, main, right panel |
| 768–1199 px | sidebar and main; right panel below main and can be hidden |
| < 768 px | single column, bottom navigation (home, character, missions, map, menu) and a drawer for all pages; 44 px touch targets; no horizontal overflow (tested at 360 and 390 px) |

## UX
- Pages switch without reloading. The open page is remembered per tab in `sessionStorage`, so save data is never touched.
- Tooltips (`title`) on stats, HP/MP/EXP, AP, merit, heat and gear condition.
- A confirm modal guards important actions: new game, quit job, buy a house, remove a party member. It closes with Escape or the backdrop.
- Risky missions, dungeons and tower bosses keep the two-step confirm on the button, so the screen is not blocked.
- Toasts report results. Errors show a red toast and are still recorded in `debug.errors`.
- A loading state shows before boot. Empty states appear on pages with nothing to show.
- The debug panel is hidden in player mode. Open it with `?debug=1` or with Settings → developer mode.

## Scenes
`src/ui/scene.js` picks the asset from the location's `bg`. It switches to dungeon, combat or night scenes when they apply. The canvas is 576x324 (16:9). While an asset has no licensed file, it draws a themed placeholder that names the asset id. Adding `src` and `license` to `data/assets/manifest.js` swaps in the real art with no code change. The asset list is in PLACEHOLDERS_FOR_7B.md.
