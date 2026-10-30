const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const line=prefix=>s.split('\n').find(l=>l.startsWith(prefix));
const data=['const STAGE_HP=','const BOSS_STATS=','const ENEMIES=','function enemyStats(','function heroCanEvolve(','function enemySpriteSource(','function enemyCombatStats('].map(line).join('\n')+'\n'+s.slice(s.indexOf('const STAGE_ENEMIES='),s.indexOf('function heroCanEvolve('));
const start=s.indexOf('async function takeTurn('),end=s.indexOf(' // Show actions one at a time.',start),turn=s.slice(start,end)+'state.busy=false;return events;}';
const keys=['boss','boss10','boss15','boss20','boss25','boss30'];
async function setup({stage=5,dungeon='carry',offset=10,damage=10,cmd='attack',skill,spd=1,surprise=false,dead=false,cinematic=false}={}){
 const g={stage,hero:'attack',stats:{atk:40,def:30,spd}},f={hp:40,enemyHP:0,maxEnemyHP:0,evoDamage:14,evolved:false,enemyEvolved:false,usedSkill:false,enemyUsedSkill:false,turn:3};
 const effects=[],damageCalls=[],math=Object.create(Math);math.random=()=>surprise?0:.9999;
 const c=vm.createContext({Math:math,state:{dungeon,busy:false,testMode:false,fight:f,logs:[]},battleHelpOpen:false,current:()=>g,HEROES:{attack:{name:'ファイ'}},ASSETS:Object.fromEntries([...keys,'mochi_spring','mochi_summer','mochi_autumn','mochi_winter','mochi_dark','mochi_demon','attack'].map(k=>[k,'normal-'+k])),EVO_IMAGES:{attack:'hero-evolved'},BOSS_EVOLUTION_IMAGES:Object.fromEntries(keys.map(k=>[k,'evolved-'+k])),DUNGEON_TWO_MOCHI_IMAGES:{},SKILLS:{reflect:['リフレクトガード']},cpuAction:()=>({cmd:'attack'}),initiative:()=>true,evade:()=>false,damage:(atk,def)=>{damageCalls.push({atk,def});return damage},EVOLVE_THRESHOLD:15,$:()=>null,esc:x=>x,beep:()=>{},prepareEnemySkillWarning:()=>{},render:()=>{},endBattle:()=>{},setTimeout:fn=>{fn();return 1},document:{body:{appendChild:el=>effects.push(el)},createElement:()=>({classList:{add:()=>{},remove:()=>{}},setAttribute:()=>{},remove:()=>{}})}});
 vm.runInContext(data+'\n'+(cinematic?s.slice(start,s.indexOf('\nfunction endBattle(',start)):turn),c);
 vm.runInContext('state.fight.maxEnemyHP=STAGE_HP[current().stage-1]',c);f.enemyHP=dead?damage:f.maxEnemyHP/2+offset;
 const base=c.enemyStats(stage),events=await c.takeTurn(cmd,skill);return {c,f,g,events,effects,base,damageCalls};
}
(async()=>{
 for(const stage of [5,10,15,20,25,30]){
  let r=await setup({stage,damage:9});assert(!r.f.enemyEvolved);assert.equal(r.f.enemyHP,r.f.maxEnemyHP/2+1);
  r=await setup({stage});assert(r.f.enemyEvolved);assert.equal(r.f.enemyHP,r.f.maxEnemyHP);assert.equal(r.events.filter(e=>e.kind==='enemyEvolve').length,1);assert(!r.f.bossAwake);
  for(const key of ['atk','def','spd'])assert.equal(r.c.enemyCombatStats(stage)[key],r.base[key]+7);
  assert.equal(r.damageCalls[1].atk,r.base.atk+7); // evolved attack is used by actual same-turn combat
  assert(r.c.enemySpriteSource(stage).startsWith('evolved-'));
  r.f.enemyHP=r.f.maxEnemyHP/2+10;const again=await r.c.takeTurn('attack');assert.equal(r.f.enemyHP,r.f.maxEnemyHP/2);assert(!again.some(e=>e.kind==='enemyEvolve'));
  for(const key of ['atk','def','spd'])assert.equal(r.c.enemyCombatStats(stage)[key],r.base[key]+7);
  r=await setup({stage,dead:true});assert.equal(r.f.enemyHP,0);assert(!r.f.enemyEvolved);
  r=await setup({stage,offset:13,spd:100,surprise:true});assert(r.f.enemyEvolved);assert.equal(r.f.enemyHP,r.f.maxEnemyHP); // surprise crosses half
  r=await setup({stage,offset:5,cmd:'skill',skill:'reflect'});assert(r.f.enemyEvolved);assert.equal(r.f.enemyHP,r.f.maxEnemyHP);
  r=await setup({stage,cinematic:true});assert(r.effects.some(e=>e.className==='evo-cinematic evo-attack'&&e.innerHTML.includes('ぜんのうりょく ＋7')));
  vm.runInContext(line('function startBattle('),r.c);r.c.startBattle();assert.equal(r.c.state.fight.enemyEvolved,false);assert(r.c.enemySpriteSource(stage).startsWith('normal-'));for(const key of ['atk','def','spd'])assert.equal(r.c.enemyCombatStats(stage)[key],r.base[key]);
 }
 for(const dungeon of ['mix','borrow']){const r=await setup({dungeon});assert(!r.f.enemyEvolved);assert(r.c.enemySpriteSource(5).startsWith('normal-'));assert(r.c.heroCanEvolve(15))}
 for(const stage of [1,6,11,16,21,26]){const r=await setup({stage});assert(!r.f.enemyEvolved);assert(!r.f.evolved);assert.equal(r.f.evoDamage,14)}
 const assets=vm.createContext({});vm.runInContext(line('const BOSS_EVOLUTION_IMAGES=')+';globalThis.assets=BOSS_EVOLUTION_IMAGES;',assets);assert.deepEqual(Object.keys(assets.assets),keys);for(const src of Object.values(assets.assets))assert(src.startsWith('data:image/webp;base64,'));
 assert(Buffer.byteLength(s)<4194304);assert(!s.includes('__SCORPION_ASSET__'));assert.equal(s,fs.readFileSync(path.join(__dirname,'..','keisan_dungeon_v48_enemy_balance_Index.html'),'utf8'));
 console.log('Passed: all six carry bosses, exact/above half HP, full heal once, all combat stats +7 once, attack uses bonus, surprise/reflection triggers, no revival at zero, cinematic, reset, no carry awakening stack, dungeon isolation, 6 embedded assets, HTML under 4 MiB');
})().catch(e=>{console.error(e);process.exitCode=1});
