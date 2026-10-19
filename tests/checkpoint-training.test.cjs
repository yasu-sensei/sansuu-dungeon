const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const heroes={attack:{atk:26,def:17,spd:17,skill:'power'},defense:{atk:17,def:26,spd:17,skill:'reflect'},speed:{atk:17,def:18,spd:25,skill:'swift'}};
const one=name=>s.split('\n').find(l=>l.startsWith('function '+name+'('));
const helpers=s.slice(s.indexOf('function persistTraining(){'),s.indexOf('function training(b){'));
const end=s.slice(s.indexOf('function endBattle(won){'),s.indexOf('\nfunction result('));
let saved,saves=0,confirmed=true,started=0;
const ctx=vm.createContext({HEROES:heroes,STAGE_HP:Array(30).fill(50),state:{screen:'training',mode:'checkpoint',hero:'attack',dungeon:'mix',busy:false},storage:{games:{},masterUnlocks:{},loginRewards:{},loginThemes:{}},confirm:()=>confirmed,save:()=>{saves++;saved=JSON.stringify(ctx.storage)},masterStudentKey:()=> '1_1',enemyStats:()=>({}),enemyInfo:()=>({boss:false,name:'敵'}),startMath:()=>{started++}});
vm.runInContext("function current(){return state.testMode?state.testGame:storage.games[state.dungeon+'_'+state.mode]}\n"+one('blank')+'\n'+helpers+'\n'+end+'\n'+one('raise')+'\n'+one('startBattle')+'\n'+one('resume')+'\n'+one('confirmTraining')+'\n'+one('finishMath')+'\n'+one('clearMathFeedback'),ctx);
ctx.clearTimeout=()=>{};ctx.clearInterval=()=>{};
ctx.render=()=>ctx.persistTraining();
function fresh(stage=10,hero='attack'){
 const h=heroes[hero];ctx.state.hero=hero;ctx.state.mode='checkpoint';ctx.state.dungeon='mix';ctx.state.testMode=false;ctx.state.screen='training';ctx.state.busy=false;
 const g={hero,stage,best:stage-1,points:5,stats:{atk:h.atk+6,def:h.def+2,spd:h.spd+1},skills:[h.skill,'drain'],equipped:[h.skill,'drain'],correctTotal:12,answerTotal:15,checkpoint:{stage:6,stats:{atk:1,def:1,spd:1},skills:[],points:0}};
 ctx.storage.games.mix_checkpoint=g;ctx.state.working={stats:{...g.stats},points:g.points,skills:[...g.skills],equipped:[...g.equipped]};return g;
}
for(const stage of [1,5,10,15,20,25,30]){
 let g=fresh(stage);const before=JSON.stringify(g);ctx.endBattle(false);assert.equal(JSON.stringify(g),before);assert.equal(ctx.state.screen,'result');
 ctx.storage=JSON.parse(saved);g=ctx.storage.games.mix_checkpoint;assert.equal(g.stage,stage);assert.equal(g.stats.atk,32);
 ctx.resume();assert.equal(ctx.state.screen,'math');
 ctx.state.correct=2;ctx.state.attempts=3;ctx.finishMath();assert.equal(g.points,7);assert.equal(g.correctTotal,14);assert.equal(g.answerTotal,18);
 ctx.raise('atk');assert.equal(g.stats.atk,33);assert.equal(g.points,3);assert.equal(JSON.parse(saved).games.mix_checkpoint.stats.atk,33);
 ctx.confirmTraining();assert.equal(ctx.state.fight.hp,40);assert.equal(ctx.state.fight.usedSkill,false);assert.equal(ctx.state.fight.usedHeal,false);assert.equal(ctx.state.fight.evolved,false);
 ctx.endBattle(true);assert.equal(g.stage,stage+1);assert.equal(g.best,stage);assert.equal(JSON.parse(saved).games.mix_checkpoint.stage,stage+1);
}
assert.equal(started,7);assert(ctx.storage.masterUnlocks['1_1']);assert(ctx.storage.loginRewards['1_1'].mix);
for(const hero of Object.keys(heroes)){
 const g=fresh(20,hero),h=heroes[hero];const skills=JSON.stringify(g.skills),equipped=JSON.stringify(g.equipped);
 confirmed=false;const before=JSON.stringify(ctx.state.working);ctx.resetAbilities();assert.equal(JSON.stringify(ctx.state.working),before);
 confirmed=true;ctx.resetAbilities();assert.deepEqual(JSON.parse(JSON.stringify(g.stats)),{atk:h.atk,def:h.def,spd:h.spd});assert.equal(g.points,41);assert.equal(JSON.stringify(g.skills),skills);assert.equal(JSON.stringify(g.equipped),equipped);assert.equal(g.stage,20);assert.equal(g.correctTotal,12);
 ctx.resetAbilities();assert.equal(g.points,41);ctx.raise('spd');assert.equal(g.points,37);ctx.resetAbilities();assert.equal(g.points,41);
 const reloaded=JSON.parse(saved).games.mix_checkpoint;assert.equal(reloaded.points,41);assert.equal(reloaded.stats.spd,h.spd);
}
// Autosaving is limited to checkpoint training and never changes other profiles.
fresh();ctx.storage.games.carry_checkpoint={points:123};ctx.state.working.points=9;ctx.persistTraining();assert.equal(ctx.storage.games.carry_checkpoint.points,123);
ctx.state.mode='challenge';ctx.storage.games.mix_challenge={...ctx.storage.games.mix_checkpoint,stats:{atk:40,def:20,spd:20},best:9};ctx.state.working.points=999;const count=saves;ctx.persistTraining();assert.equal(saves,count);ctx.endBattle(false);assert.equal(ctx.storage.games.mix_challenge.stage,1);assert.equal(ctx.storage.games.mix_challenge.points,0);assert.equal(ctx.storage.games.mix_challenge.best,9);
ctx.state.testMode=true;ctx.state.testGame={stage:30};const before=saves;ctx.endBattle(true);assert.equal(saves,before);assert.equal(ctx.state.testGame.stage,30);
assert.equal(s,fs.readFileSync(path.join(__dirname,'..','keisan_dungeon_v48_enemy_balance_Index.html'),'utf8'));
console.log('Passed: loss/retry/win at stages 1,5,10,15,20,25,30; reload and training autosave; refund/cancel/repeat for all heroes; rewards, profile isolation, challenge reset, test isolation');
