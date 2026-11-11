// Engine: ประกอบ core ทั้งหมดเข้าด้วยกัน และเป็นจุดที่โมดูลอนาคต (World, Story, Character) เสียบเข้ามา
// โมดูล = { id, deps:[...], install(engine) } ติดตั้งตามลำดับ deps
(function(AW){
'use strict';
const C=AW.core;
class Engine{
 constructor(opts={}){this.bus=new C.Bus();this.debug=new C.Debug(this.bus);this.state=new C.GameState(this.bus);
  this.loop=new C.Loop(this.state,this.bus,{timer:opts.timer||globalThis,baseMs:opts.baseMs||1200});
  this.time=new C.WorldTime(this.state,this.bus,this.loop);
  this.state.register('meta','engine',()=>({seed:null,rng:0,created:0,name:''}));
  this.save=new C.SaveSystem(this.state,{storage:opts.storage||globalThis.localStorage,migrations:opts.migrations||{}});
  this.assets=new C.AssetRegistry(opts.assets||{});
  this.registries={world:new C.Registry('world',['id','name','description','timeRate','entry','module','config','assetNs','storyNs']),story:new C.Registry('story',['id','world','chapters']),character:new C.Registry('character',['id','world','name'])};
  this.modules=new Map();this.rng=new C.Rng(1)}
 use(mod){if(this.modules.has(mod.id))throw new Error('โมดูลซ้ำ: '+mod.id);for(const d of mod.deps||[])if(!this.modules.has(d))throw new Error(`โมดูล ${mod.id} ต้องการ ${d} ก่อน`);mod.install(this);this.modules.set(mod.id,mod);this.debug.log('ติดตั้งโมดูล '+mod.id);return this}
 newGame({seed,name=''}={}){this.state.reset();const s=seed??String(Date.now());this.rng=new C.Rng(s);
  this.state.mutate('engine','meta',m=>{m.seed=s;m.rng=this.rng.state;m.created=Date.now();m.name=name});this.bus.emit('game:new',{seed:s});}
 saveTo(slot){this.state.mutate('engine','meta',m=>{m.rng=this.rng.state});return this.save.save(slot,{name:this.state.get('meta').name,month:this.loop.month})}
 loadFrom(slot,o){const ok=this.save.load(slot,o);if(ok){this.rng=new C.Rng(this.state.get('meta').rng);this.bus.emit('game:loaded',{slot})}return ok}
}
AW.core.Engine=Engine;
})(globalThis.AW);
