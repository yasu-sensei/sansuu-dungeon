const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const line=prefix=>s.split('\n').find(l=>l.startsWith(prefix));
const defs=['const STAGE_HP=','const BOSS_STATS=','const EVOLVE_THRESHOLD=','const ENEMIES=','function enemyStats('].map(line).join('\n');
const data=vm.createContext({});vm.runInContext(defs+';globalThis.hp=STAGE_HP;globalThis.threshold=EVOLVE_THRESHOLD;',data);
const oldHP=[40,42,44,46,50,48,50,52,54,60,56,58,60,62,70,64,66,68,70,80,72,74,76,78,90,80,82,84,86,100];
const oldBases=[[17,18,19],[19,19,20],[20,22,21],[23,22,22],[26,27,23]],bosses={5:[28,27,24],10:[27,27,32],15:[31,27,36],20:[29,40,27],25:[42,35,30],30:[40,40,40]};
for(let stage=1;stage<=30;stage++){
 const base=oldBases[(stage-1)%5],tier=Math.floor((stage-1)/5),bonus=stage<=5?0:stage<=10?2:stage<=15?5:stage<=20?9:stage<=25?14:20;
 const old=(bosses[stage]||base.map(n=>n+tier*2)).map(n=>n+bonus),actual=data.enemyStats(stage);
 assert.equal(data.hp[stage-1],stage>=15?Math.round(oldHP[stage-1]*1.5):oldHP[stage-1]);
 assert.equal(actual.atk,stage>=15?Math.round(old[0]*1.1):old[0]);assert.equal(actual.def,old[1]);assert.equal(actual.spd,old[2]);
}
assert.equal(data.threshold,15);assert.equal(data.hp[29],150);assert.equal(data.enemyStats(30).atk,66);
const begin=s.indexOf('async function takeTurn('),end=s.indexOf(' // Show actions one at a time.',begin);
const turn=s.slice(begin,end)+'state.busy=false;return events;}';
async function setup({stage=15,spd=100,damage=10,evoDamage=0,cpuSkill=null}={}){
 const g={stage,hero:'attack',stats:{atk:30,def:20,spd}};
 const f={hp:40,enemyHP:2000,maxEnemyHP:2000,evoDamage,evolved:false,usedSkill:true,enemyUsedSkill:false,usedHeal:false,turn:1};
 const math=Object.create(Math);math.random=()=>0;
 const c=vm.createContext({Math:math,state:{busy:false,testMode:false,fight:f},battleHelpOpen:false,current:()=>g,HEROES:{attack:{name:'ファイ'}},SKILLS:{power:['パワーストライク'],drain:['ドレインアタック']},cpuAction:()=>cpuSkill?({cmd:'skill',skill:cpuSkill}):({cmd:'attack'}),enemyInfo:()=>({name:'敵'}),enemyStats:()=>({atk:20,def:20,spd:20}),enemyCombatStats:()=>({atk:20,def:20,spd:20}),initiative:()=>spd>20,evade:()=>false,damage:()=>damage,EVOLVE_THRESHOLD:15});
 vm.runInContext(line('function heroCanEvolve(')+'\n'+turn,c);const events=await c.takeTurn('attack');return {c,f,events};
}
(async()=>{
 let {f,events}=await setup();const hits=events.filter(e=>e.kind==='hit'&&e.recipient==='e');assert.equal(hits.length,2);assert.equal(hits[0].enemyHP,1990);assert.equal(hits[1].enemyHP,1982);assert(!f.evolved);
 ({f}=await setup({evoDamage:4}));assert.equal(f.evoDamage,14);assert(!f.evolved);
 let r=await setup({evoDamage:5});assert(r.f.evolved);assert.equal(r.f.hp,40);assert(!r.f.usedSkill);assert.equal(r.events.filter(e=>e.kind==='evolve').length,1);
 r.f.usedSkill=true;await r.c.takeTurn('attack');assert.equal(r.f.usedSkill,true);
 r=await setup({spd:1});assert.equal(r.f.evoDamage,18);assert(r.f.evolved);assert.equal(r.f.hp,40);assert.equal(r.events.filter(e=>e.kind==='evolve').length,1);
 ({f}=await setup({stage:14,spd:1,evoDamage:14}));assert(!f.evolved);assert.equal(f.evoDamage,14);
 ({events}=await setup({damage:3}));const low=events.filter(e=>e.kind==='hit'&&e.recipient==='e');assert.equal(low[1].enemyHP,1995); // 3 damage + floor(3 * .8) = 5
 r=await setup({cpuSkill:'drain'});assert.equal(r.f.enemyHP,1987); // 2000 - 10 - 8 + 5; no erroneous 40-HP recovery cap
 assert(!s.includes('ごうけい 24ダメージ'));assert(s.includes('ごうけい ${EVOLVE_THRESHOLD}ダメージ'));assert(!s.includes('Math.floor(base*1.8)'));
 assert.equal(s,fs.readFileSync(path.join(__dirname,'..','keisan_dungeon_v48_enemy_balance_Index.html'),'utf8'));
 console.log('Passed: all 30 enemy stats/HP, unchanged defense/speed/early stages, 0.8x surprise damage and rounding, evolution at 15 not 14, surprise damage charge, skill restoration, and one evolution per battle, and enemy drain respects enemy maximum HP');
})().catch(e=>{console.error(e);process.exitCode=1});
