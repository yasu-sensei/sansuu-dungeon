const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const line=prefix=>s.split('\n').find(l=>l.startsWith(prefix));
const start=s.indexOf('async function takeTurn('),end=s.indexOf(' // Show actions one at a time.',start);
const turn=s.slice(start,end)+'state.busy=false;return events;}';
async function setup({dungeon='carry',stage=5,hp=35,damage=10,spd=20,cmd='attack',skill,previous=false,cinematic=false}={}){
 const g={stage,hero:'attack',stats:{atk:30,def:20,spd}};
 const f={hp:40,enemyHP:hp,maxEnemyHP:50,evoDamage:14,evolved:false,enemyEvolved:previous,usedSkill:false,enemyUsedSkill:false,turn:3};
 const effects=[],math=Object.create(Math);math.random=()=>0;
 const c=vm.createContext({Math:math,state:{dungeon,busy:false,testMode:false,fight:f,logs:[]},battleHelpOpen:false,current:()=>g,HEROES:{attack:{name:'ファイ'}},ASSETS:{boss:'normal',attack:'hero'},EVO_IMAGES:{attack:'hero-evolved'},BOSS_EVOLUTION_IMAGES:{boss:'three-tails'},SKILLS:{reflect:['リフレクトガード']},cpuAction:()=>({cmd:'attack'}),enemyInfo:()=>({name:'マグサソリ',key:'boss'}),enemyStats:()=>({atk:20,def:20,spd:20}),initiative:()=>true,evade:()=>false,damage:()=>damage,EVOLVE_THRESHOLD:15,$:()=>null,esc:x=>x,beep:()=>{},prepareEnemySkillWarning:()=>{},render:()=>{},endBattle:()=>{},setTimeout:fn=>{fn();return 1},document:{body:{appendChild:el=>effects.push(el)},createElement:()=>({classList:{add:()=>{},remove:()=>{}},setAttribute:()=>{},remove:()=>{}})}});
 vm.runInContext(line('function heroCanEvolve(')+'\n'+line('function enemySpriteSource(')+'\n'+(cinematic?s.slice(start,s.indexOf('\nfunction endBattle(',start)):turn),c);
 const events=await c.takeTurn(cmd,skill);return {c,f,events,effects,g};
}
(async()=>{
 let r=await setup({hp:36});assert.equal(r.f.enemyHP,26);assert(!r.f.enemyEvolved);
 r=await setup({hp:35});assert.equal(r.f.enemyHP,25);assert(r.f.enemyEvolved);assert.equal(r.events.filter(e=>e.kind==='enemyEvolve').length,1);assert.equal(r.c.enemySpriteSource(5),'three-tails');assert.equal(r.f.maxEnemyHP,50);
 r=await setup({hp:40,spd:100});assert.equal(r.f.enemyHP,22);assert(r.f.enemyEvolved); // normal hit leaves 30; surprise crosses halfway
 r=await setup({hp:30,cmd:'skill',skill:'reflect'});assert.equal(r.f.enemyHP,25);assert(r.f.enemyEvolved);
 r=await setup({hp:10});assert.equal(r.f.enemyHP,0);assert(!r.f.enemyEvolved);assert(!r.events.some(e=>e.kind==='enemyEvolve'));
 r=await setup({hp:35,previous:true});assert(!r.events.some(e=>e.kind==='enemyEvolve'));
 for(const dungeon of ['mix','borrow']){r=await setup({dungeon,hp:35});assert(!r.f.enemyEvolved);assert.equal(r.c.enemySpriteSource(5),'normal');assert(r.c.heroCanEvolve(15))}
 for(const stage of [1,10,15,20,25,30]){r=await setup({stage,hp:35});assert(!r.f.enemyEvolved);assert(!r.f.evolved);assert.equal(r.f.evoDamage,14);assert(!r.c.heroCanEvolve(stage))}
 r=await setup({hp:35,cinematic:true});assert(r.f.enemyEvolved);assert(r.effects.some(e=>e.className==='evo-cinematic evo-attack'&&e.innerHTML.includes('three-tails')));
 const before=r.f;vm.runInContext(line('function startBattle('),r.c);r.c.STAGE_HP=Array(30).fill(50);r.c.startBattle();assert.equal(r.c.state.fight.enemyEvolved,false);assert.equal(r.c.enemySpriteSource(5),'normal');assert.notEqual(r.c.state.fight,before);
 const asset=line('const BOSS_EVOLUTION_IMAGES=');assert(asset.includes('data:image/webp;base64,'));assert(!s.includes('__SCORPION_ASSET__'));
 assert.equal(s,fs.readFileSync(path.join(__dirname,'..','keisan_dungeon_v48_enemy_balance_Index.html'),'utf8'));
 console.log('Passed: above/exact half HP, normal/surprise/reflection triggers, no evolution at death, once per battle, carry-stage-5 isolation, hero evolution disabled only in carry, cinematic playback, and replay reset');
})().catch(e=>{console.error(e);process.exitCode=1});
