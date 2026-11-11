# Story / Event System (Phase 3)

Engine: `src/systems/events.js` (Ask/Answer). Conditions and effects: `src/systems/rules.js`. Content is data only, in `data/worlds/<id>/`. Validation runs when a world registers; if it fails, the world does not register.

## Event
```js
{id, title, text,                // text may use {name} {age}
 trigger:'auto'|'month'|'enter'|'action',
 at:'locationId',                 // required for enter/action
 when:{...condition},
 once:true, cooldown:12, weight:2, priority:50, locked:true,
 cost:{ap:1},                     // action only
 choices:[{text, when, lockText,
   check:{stat:'int', dc:'easy|mid|hard|ext'} | fight:{enemy:'id', mode:'auto'},
   ok:{text, effects:[...]}, fail:{text, effects:[...]},   // fail needed with check/fight
   next:'eventId'}],
 src:'logic4.js:183' | 'new'}
```
| trigger | When |
|---|---|
| auto | checked every month (and right after a character is created). The highest-priority eligible event shows |
| month | with chance `config.eventChance`, one event picked by weight |
| enter | when the player arrives at `at`. After it is answered, other enter events at the same place can follow (evaluation, then registration). Each shows once per visit |
| action | a button at the location. With one choice it applies at once; with more it shows as an event |

A pending event pauses time (loop reason `event`) until it is answered. It is saved and paused again after load.
- Repeats: `once` events never repeat. `cooldown` sets the minimum months between repeats. `locked` events wait for an `unlock` effect. Chains use `next`.

## Conditions (`when`), all data
`all any not age awakened class rank level stat statTotal mana money ap item location world rel flag notFlag worldFlag notWorldFlag done notDone missions canPromote injured chance`
- Numbers use `{min,max}`.
- Ids without a dot belong to the content's own world.
- An unknown key fails validation, and there is no eval anywhere.

## Effects, all data (one key per object)
`money exp stat mana hp injury cure item equip flag unflag worldFlag rel reputation class skill rankInit rankUp unlock move log`
- Effects that cost money or items are checked before a choice is allowed (`affordable`).

## Check odds
The formula is from the old game (logic4.js:144):
`0.5 + (stat − DC − offset)/30`, clamped to 5–97%, with DC easy 10 / mid 22 / hard 36 / ext 55.
The offset is 18 + 12 × rank index after awakening, because stats grow fast then.
