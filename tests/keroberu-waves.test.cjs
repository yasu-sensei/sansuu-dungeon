const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const line=p=>s.split('\n').find(l=>l.startsWith(p));
const fn=(a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
function setup(stage,dungeon='borrow'){
 const g={stage,hero:'attack',stats:{atk:40,def:30,spd:10},points:12,skills:['power'],equipped:['power']},nodes={},wins=[];let renders=0;
 const math=Object.create(Math);math.random=()=>.999;
 const c=vm.createContext({Math:math,state:{dungeon,screen:'battle',busy:false,logs:[]},battleHelpOpen:false,current:()=>g,HEROES:{attack:{name:'ファイ'}},ASSETS:new Proxy({},{get:(_,k)=>'normal-'+k}),EVO_IMAGES:{attack:'evolved-hero'},BOSS_EVOLUTION_IMAGES:{},DUNGEON_TWO_MOCHI_IMAGES:Object.fromEntries(['spring','summer','autumn','winter','dark','demon'].map(k=>['mochi_'+k,'evolved-'+k])),EVOLVE_THRESHOLD:15,$:id=>nodes[id]||null,esc:x=>x,beep:()=>{},render:()=>{renders++},endBattle:won=>wins.push(won),setTimeout:fn=>{fn();return 1},document:{body:{appendChild:()=>{}},createElement:()=>({classList:{add:()=>{},remove:()=>{}},setAttribute:()=>{},remove:()=>{}})}});
 const constants=['const STAGE_HP=','const BOSS_STATS=','const ENEMIES=','const SKILLS=','const KEROBERU_TYPES=','const KEROBERU_IMAGES='].map(line).join('\n');
 const funcs=['enemyInfo','enemyStats','enemyCombatStats','enemySpriteSource','heroCanEvolve','startBattle','battle','enemyPreview'].map(n=>line('function '+n+'(')).join('\n');
 vm.runInContext(constants+'\n'+fn('const STAGE_ENEMIES=','function enemyInfo(')+'\n'+funcs+'\n'+fn('function prepareEnemySkillWarning(){','function damage(')+'\n'+fn('function arriveKeroberu(){','function endBattle(')+'\n'+fn('async function takeTurn(','function arriveKeroberu(){'),c);
 c.cpuAction=()=>({cmd:'attack'});c.initiative=()=>true;c.evade=()=>false;c.damage=()=>10;c.startBattle();
 return {c,g,wins,nodes,get renders(){return renders}};
}
(async()=>{
 for(let stage=1;stage<=30;stage++){
  const r=setup(stage),{c,g,wins}=r,f=c.state.fight,base=c.enemyStats(stage),boss=stage%5===0;
  assert.equal(c.enemySpriteSource(stage),boss?'normal-'+c.enemyInfo(stage).key:'evolved-'+['spring','summer','autumn','winter','dark','demon'][Math.floor((stage-1)/5)]);
  f.hp=31;f.usedSkill=true;f.usedHeal=true;f.evolved=true;f.evoDamage=15;f.charge=true;f.enemyHP=10;f.enemyCharge=true;f.enemyUsedSkill=true;f.enemyUsedHeal=true;f.enemyDodgeTurns=2;f.enemyArmorTurns=2;
  await c.takeTurn('attack');
  if(boss){assert.equal(wins.length,1);assert.equal(wins[0],true);assert(!f.keroberu);continue}
  assert(f.keroberu);assert.equal(wins.length,0);assert.equal(f.enemyHP,f.maxEnemyHP);assert.equal(f.hp,31);assert(f.usedSkill&&f.usedHeal&&f.evolved);assert.equal(f.evoDamage,15);assert.equal(g.stage,stage);assert.equal(g.points,12);
  assert(!f.enemyCharge&&!f.enemyUsedSkill&&!f.enemyUsedHeal&&!f.enemyLastDef);assert.equal(f.enemyArmorTurns,0);assert.equal(f.enemyDodgeTurns,0);assert.equal(f.pendingBossSkill,null);
  const es=c.enemyCombatStats(stage);for(const k of ['atk','def','spd'])assert.equal(es[k],base[k]);
  const expected=['power','break','armor','swift','pinch','drain'][Math.floor((stage-1)/5)];assert.equal(es.skills[0],expected);
  assert.equal(c.enemyInfo(stage,true).key,'keroberu_'+(Math.floor((stage-1)/5)+1));assert(c.enemySpriteSource(stage).startsWith('data:image/webp;base64,'));
  const ui={};c.battle(ui);assert(ui.innerHTML.includes('2 / 2 たいめ'));assert(ui.innerHTML.includes(c.enemyInfo(stage,true).name));assert(ui.innerHTML.includes(c.enemySpriteSource(stage)));
  // Training preview must not accidentally display the previous wave.
  assert(c.enemyPreview(stage).includes('src="'+c.enemySpriteSource(stage,false,false)+'"'));
  const beforeHP=f.enemyHP;assert.equal(c.arriveKeroberu(),false);assert.equal(f.enemyHP,beforeHP);
  // New wave really uses the changed skill in combat.
  f.usedSkill=false;c.cpuAction=()=>({cmd:'skill',skill:expected});await c.takeTurn('defend');assert(f.enemyUsedSkill);assert.equal(wins.length,0);
  f.enemyHP=1;f.hp=40;c.cpuAction=()=>({cmd:'attack'});await c.takeTurn('attack');assert.deepEqual(wins,[true]);
  c.startBattle();assert.equal(c.state.fight.keroberu,false);assert.equal(c.state.fight.enemyHP,c.state.fight.maxEnemyHP);
 }
 // A loss to either wave must remain a loss, with no replacement/resurrection.
 for(const wave of [false,true]){const {c,wins}=setup(1);c.state.fight.keroberu=wave;c.state.fight.hp=1;c.initiative=()=>false;await c.takeTurn('attack');assert.deepEqual(wins,[false]);assert.equal(c.state.fight.keroberu,wave)}
 for(const dungeon of ['mix','carry']){const {c,wins}=setup(1,dungeon);c.state.fight.enemyHP=1;await c.takeTurn('attack');assert.deepEqual(wins,[true]);assert.equal(c.state.fight.keroberu,false)}
 // Reflected and surprise lethal damage must also lead to the second wave.
 {const {c,wins}=setup(1);c.state.fight.enemyHP=5;await c.takeTurn('skill','reflect');assert(c.state.fight.keroberu);assert.equal(wins.length,0)}
 {const {c,wins}=setup(1);c.current().stats.spd=100;c.Math.random=()=>0;c.state.fight.enemyHP=15;await c.takeTurn('attack');assert(c.state.fight.keroberu);assert.equal(wins.length,0)}
 assert(Buffer.byteLength(s)<4194304);assert.equal(s,fs.readFileSync(path.join(__dirname,'..','keisan_dungeon_v48_enemy_balance_Index.html'),'utf8'));
 console.log('Passed: all 24 normal stages have evolved mochi -> keroberu; 6 bosses unchanged; 6 art/skill mappings; same stats/HP; retained hero resources; enemy statuses reset; actual skill combat; victory only after wave 2; loss/restart; reflection/surprise; other dungeons isolated; HTML size');
})().catch(e=>{console.error(e);process.exitCode=1});
