# World Module Guide

Adding a world never needs a core change. You create one file and add it to the build list.

## 1. Create `data/worlds/<id>.js`
```js
(function(AW){
AW.data.worlds.push({
 id:'murim', name:'...', description:'...',
 timeRate:2,              // 0.001–100, steps of 0.001
 entry:'sect_gate',       // must be a location id below
 assetNs:'murim', storyNs:'murim',
 config:{currency:'...', rules:{...}},   // world rules, read by ctx.rules
 data:{
  locations:[{id:'sect_gate',name:'...',bg:'bg.mountain'}],
  npcs:[{id:'...',name:'...'}], quests:[...], events:[...],
  gates:[{id:'to_hunter',name:'...',to:'hunter',months:0}],
  assets:['murim.bg.mountain']           // must start with assetNs. and exist in the manifest
 },
 state:()=>({location:'sect_gate',flags:{}}),   // starting world state, JSON only
 module:{ install(w){}, enter(w,{from,via,aborted}){}, leave(w,{to,via}){}, update(w,{month}){}, dispose(w){} }
});
})(globalThis.AW);
```
Every hook is optional.

## 2. Add the file to `tools/build.py` (ORDER, after data/worlds/index.js)

## 3. What a module receives (`w` = ctx)
| Name | Use |
|---|---|
| `w.get()` | this world's state (frozen, read only) |
| `w.mutate(fn)` | change this world's state; `fn(draft)` edits a copy |
| `w.month()` / `w.globalMonth()` | local month / global month |
| `w.locations`, `w.npcs`, `w.quests`, `w.events` | Maps by id (frozen data) |
| `w.config`, `w.rules` | world config |
| `w.asset(key)` | `engine.assets.get(assetNs + '.' + key)` |
| `w.storyId(key)` | `storyNs + '.' + key` |
| `w.emit(ev, payload)` | sends `world:event {world, ev, payload}` on the bus |

A module has no way to write another world's state. If it tries, state ownership throws.
There is no shared global between worlds. Keep everything in `state` (saved) or `data` (fixed).

## Rules
- State must be JSON (no functions, Map or Date objects).
- Do not rename a world id after release, because saves key on it (`world:<id>`).
- Assets: ids only. Real images need `src` + a confirmed license in the manifest; otherwise they stay placeholders.
- Hooks should be fast. `update` runs every local month for every world, and a world at rate 2 gets 2 calls per tick.
