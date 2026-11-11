# World System Design (Phase 2)

Code: `src/systems/worlds.js`. It is installed through the engine with `engine.use(AW.systems.WorldsModule)` and is then available as `engine.worlds`.
It uses Phase 1.1 systems and adds no new ones:
- state ownership: each world gets slice `world:<id>`, owned by `world:<id>`
- `engine.time` (WorldTime): per-world time and gates
- `engine.save`: saves include every world slice automatically

## Parts
| Part | Where |
|---|---|
| World Registry | `engine.registries.world` (generic Registry) + `validateWorld()` for the world rules |
| World Module | world definition with `module` hooks; see WORLD_MODULE_GUIDE.md |
| World State | slice `world:<id>`; read with `ctx.get()` (frozen), write with `ctx.mutate(fn)` |
| World Time | `worlds_time` slice (owned by WorldTime): `current`, `traveling`, `acc` per world |
| Gates | `data.gates` of each world: `{id, name, to, months}` |

## Registration
`worlds.register(def)` checks everything first. If anything is wrong it throws and leaves no trace: nothing goes in the registry, no slice, no time.
Checks:
- required fields
- id format and duplicate id
- name and description are text
- timeRate is valid (same rule as WorldTime)
- config is an object
- assetNs and storyNs are valid ids
- module hooks are known names and are functions
- state() returns a JSON object
- data lists are arrays with no duplicate or bad ids
- entry is one of the locations
- gate months is an integer >= 0
- every asset id is inside the world's assetNs and exists in the Asset Registry (placeholders are fine)

The definition is deep-frozen after it passes, so no code can change world data at runtime.

## Lifecycle
| Hook | When |
|---|---|
| install | once, at register |
| enter | `worlds.start(id)` at new game, and on arrival after travel. On an aborted trip, the origin world gets `enter` again with `aborted:true` |
| leave | before departing |
| update | on every local month of that world (`world:month`), including when the player is elsewhere |
| dispose | `worlds.dispose(id)`: world stops, its time stops, its saved data is kept |

If a hook throws, the error is caught and sent as the `world:error` event and to the debug log. Travel and the game loop carry on.

## Travel
`worlds.travelVia(gateId)` (a gate of the current world) or `worlds.travel(to, {months})`.
1. Checks run before anything changes:
   - destination installed
   - not already travelling
   - not the same world
   - months is a valid integer
2. The origin world's `leave` hook runs.
3. `time.travel` runs.
   - A normal gate has `months: 0`: the trip is instant and global time does not move.
   - A special gate runs n real ticks: age +n, and every world advances by its rate.
   - During the trip: `current=null`, `traveling={from,to,left}`. A second trip during this time is refused.
4. The destination world's `enter` hook runs, then the `world:enter` event fires.

If something throws during the trip, WorldTime clears `traveling` and puts the player back in the origin world. Time already passed is not undone. `gate:abort {elapsed}` fires and the error is re-thrown.

## Save and load
- Schema version stays at 1, so Phase 1.1 saves load unchanged.
- **World installed but not in the save** (e.g. an old save): the world starts from its `state()` defaults and local time 0, and `current` is null.
- **World in the save but not installed**: its slice is kept as an orphan in GameState and is written back on the next save. Its time (`acc`) is also kept. Its time does not move while it is not installed. Installing it later picks up the saved data. You can still travel out of a world that is not installed.
- `newGame()` resets every world to its defaults and clears orphans.
- Old game keys `hunter-path-*` are never touched (SaveSystem blocks them).

## Core changes in this phase (small, needed)
| File | Change | Why |
|---|---|---|
| state.js | orphan slices kept on restore and in snapshot, adopted on register | data from worlds that are not installed must not be lost |
| worldtime.js | `removeWorld`, `has`; try/catch in `travel` with `gate:abort` | dispose; travel must never get stuck |
| engine.js | world registry required fields: added description, module, config, assetNs, storyNs | the world contract asked for in Phase 2 |

## Update in Phase 3
- Registration is atomic: registry → slice → WorldTime → install hook. If any step fails, including an install hook that throws, every step is rolled back.
- Systems can add content validators (`worlds.addValidator`). These run before anything is registered.
- `stateVersion` + `module.migrate(state, fromVersion)` upgrade a world's saved state after load.
- `ctx.list(kind)` gives a Map for any data list (items, enemies, missions...).
