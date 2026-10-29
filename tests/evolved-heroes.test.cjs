const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8'),one=name=>s.split('\n').find(l=>l.startsWith('function '+name+'(')),line=prefix=>s.split('\n').find(l=>l.startsWith(prefix));
const helpers=s.slice(s.indexOf('function persistTraining(){'),s.indexOf('function training(b){'));
const begin=s.indexOf('async function takeTurn('),end=s.indexOf(' // Show actions one at a time.',begin),turn=s.slice(begin,end)+'state.busy=false;return events;}';
(async()=>{
 for(const dungeon of ['mix','carry','borrow'])for(const mode of ['challenge','checkpoint'])for(const hero of ['attack','defense','speed']){
  let g,c,radar,initiativeStats;const hits=[],math=Object.create(Math);math.random=()=>.9999;
  c=vm.createContext({Math:math,state:{dungeon,mode,hero,screen:'choose',busy:false,testMode:false,skillChoice:null},ASSETS:{attack:'normal-attack',defense:'normal-defense',speed:'normal-speed'},EVO_IMAGES:{attack:'evolved-attack',defense:'evolved-defense',speed:'evolved-speed'},STAGE_HP:Array(30).fill(150),BOSS_EVOLUTION_IMAGES:{},current:()=>g,save:()=>{},render:()=>{},confirm:()=>true,radarChart:stats=>{radar=stats;return ''},enemyPreview:()=>'',enemyInfo:()=>({name:'敵',key:'normal',boss:false}),enemyCombatStats:()=>({atk:20,def:20,spd:20}),cpuAction:()=>({cmd:'attack'}),initiative:(p,e)=>{initiativeStats=[p,e];return true},evade:()=>false,damage:(atk,def)=>{hits.push({atk,def});return 3},beep:()=>{},battleHelpOpen:false,EVOLVE_THRESHOLD:15});
  vm.runInContext(line('const HEROES=')+'\n'+line('const SKILLS=')+'\n'+['heroBaseBonus','heroDisplayStats','heroSpriteSource','heroCanEvolve','blank','choose','training','startBattle'].map(one).join('\n')+'\n'+helpers+'\n'+turn,c);
  g=c.blank();const original=JSON.stringify(g),bonus=dungeon==='carry'?7:0;
  const ui={};c.choose(ui);assert(ui.innerHTML.includes('src="'+(bonus?'evolved-':'normal-')+hero+'"'));
  const base=JSON.parse(JSON.stringify(g.stats));c.startBattle();assert.equal(c.state.fight.evolved,!!bonus);assert.equal(JSON.stringify(g),original);assert.equal(c.state.fight.usedSkill,false);
  c.state.fight.enemyHP=150;c.state.fight.maxEnemyHP=150;
  await c.takeTurn('attack');assert.equal(hits[0].atk,base.atk+bonus);assert.equal(hits[1].def,base.def+bonus);assert.equal(initiativeStats[0],base.spd+bonus);
  c.state.screen='training';c.state.busy=false;c.state.working={stats:{...g.stats},points:5,skills:[...g.skills],equipped:[...g.equipped]};c.training(ui);
  for(const key of ['atk','def','spd'])assert.equal(radar[key],base[key]+bonus);
  assert(ui.innerHTML.includes('src="'+(bonus?'evolved-':'normal-')+hero+'"'));
  c.state.working.stats.atk+=2;c.resetAbilities();assert.equal(c.state.working.points,13);assert.equal(c.state.working.stats.atk,base.atk);c.resetAbilities();assert.equal(c.state.working.points,13);
  // Reopening and replaying never changes or repeatedly upgrades saved training stats.
  g=JSON.parse(original);c.startBattle();assert.equal(JSON.stringify(g),original);assert.equal(c.state.fight.evolved,!!bonus);
  if(bonus){g.stage=15;c.startBattle();c.state.fight.usedSkill=true;c.state.fight.evoDamage=14;await c.takeTurn('attack');assert(c.state.fight.evolved);assert(c.state.fight.usedSkill);assert.equal(c.state.fight.evoDamage,14)}
 }
 assert(Buffer.byteLength(s)<4194304);assert.equal(s,fs.readFileSync(path.join(__dirname,'..','keisan_dungeon_v48_enemy_balance_Index.html'),'utf8'));
 console.log('Passed: 3 heroes x 3 dungeons x 2 modes; evolved carry artwork from selection through training/battle, effective +7 attack/defense/speed, raw save preservation, no refund exploit, restart/reload, no second evolution or skill recharge');
})().catch(e=>{console.error(e);process.exitCode=1});
