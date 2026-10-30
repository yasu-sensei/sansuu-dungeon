const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8'),line=p=>s.split('\n').find(l=>l.startsWith(p)),one=n=>line('function '+n+'(');
const keys=['boss','boss10','boss15','boss20','boss25','boss30'],mochi=['mochi_spring','mochi_summer','mochi_autumn','mochi_winter','mochi_dark','mochi_demon'];let saves=0;
const c=vm.createContext({state:{screen:'home',dungeon:'mix',mode:'checkpoint',hero:'attack',className:'1',number:'1'},storage:{games:{untouched:{points:123}}},ASSETS:Object.fromEntries([...keys,...mochi,'attack','defense','speed'].map(k=>[k,'normal-'+k])),EVO_IMAGES:{attack:'evo-attack',defense:'evo-defense',speed:'evo-speed'},BOSS_EVOLUTION_IMAGES:Object.fromEntries(keys.map(k=>[k,'evolved-'+k])),DUNGEON_TWO_MOCHI_IMAGES:Object.fromEntries(mochi.map(k=>[k,'evolved-'+k])),window:{prompt:()=> '0822',alert:()=>{}},render:()=>{},save:()=>{saves++}});
const data=['const STAGE_HP=','const BOSS_STATS=','const ENEMIES=','const HEROES=','const SKILLS=','const DUNGEONS=','const TEST_HERO_STATS='].map(line).join('\n')+'\n'+s.slice(s.indexOf('const STAGE_ENEMIES='),s.indexOf('const DUNGEON_TWO_MOCHI_IMAGES='));
const names=['heroBaseBonus','heroSpriteSource','enemyInfo','enemyStats','enemyCombatStats','enemySpriteSource','blank','testSetup','setTestDungeon','setTestBossForm','testEnemyPreview','setTestStage','launchTestBattle','startBattle','exitTestMode'];
vm.runInContext(data+'\n'+s.slice(s.indexOf('function openTestMode(){'),s.indexOf('const TEST_HERO_STATS='))+'\n'+names.map(one).join('\n')+'\nfunction current(){return state.testGame}',c);
const before=JSON.stringify(c.storage);c.openTestMode();assert.equal(c.state.testBossForm,'evolved');assert.equal(c.state.testOriginalDungeon,'mix');c.setTestDungeon('carry');
for(const stage of [5,10,15,20,25,30])for(const form of ['evolved','normal']){
 c.state.screen='testSetup';c.setTestStage(stage);c.setTestBossForm(form);const ui={};c.testSetup(ui);assert(ui.innerHTML.includes('ダンジョン2'));assert(ui.innerHTML.includes('しんかまえ'));assert(ui.innerHTML.includes('しんかご'));
 const key=c.enemyInfo(stage).key,bonus=form==='evolved'?7:0,base=c.enemyStats(stage);
 assert(ui.innerHTML.includes('src="'+(bonus?'evolved-':'normal-')+key+'"'));assert(ui.innerHTML.includes('こうげき '+(base.atk+bonus)));
 c.launchTestBattle();assert.equal(c.state.fight.enemyEvolved,!!bonus);assert.equal(c.state.fight.enemyHP,c.state.fight.maxEnemyHP);assert.equal(c.enemyCombatStats(stage).atk,base.atk+bonus);assert.equal(c.enemyCombatStats(stage).def,base.def+bonus);assert.equal(c.enemyCombatStats(stage).spd,base.spd+bonus);
}
for(const dungeon of ['mix','borrow']){c.state.screen='testSetup';c.setTestDungeon(dungeon);c.setTestStage(5);c.setTestBossForm('evolved');c.launchTestBattle();assert.equal(c.state.fight.enemyEvolved,false);assert.equal(c.enemySpriteSource(5),'normal-boss')}
c.state.screen='testSetup';c.setTestDungeon('carry');c.setTestStage(1);c.launchTestBattle();assert.equal(c.state.fight.enemyEvolved,false);assert.equal(c.enemySpriteSource(1),'evolved-mochi_spring');
c.exitTestMode();assert.equal(c.state.dungeon,'mix');assert.equal(c.state.testMode,false);assert.equal(c.state.testGame,null);assert.equal(saves,0);assert.equal(JSON.stringify(c.storage),before);
c.setTestDungeon('carry');assert.equal(c.state.dungeon,'mix');c.openTestMode();assert.equal(c.state.testBossForm,'evolved');
assert(Buffer.byteLength(s)<4194304);assert.equal(s,fs.readFileSync(path.join(__dirname,'..','keisan_dungeon_v48_enemy_balance_Index.html'),'utf8'));
console.log('Passed: teacher dungeon selector; all 6 bosses x 2 forms; matching preview/art/HP/+7 stats; evolved default; no form forcing in regular stages/other dungeons; dungeon restoration and no student writes');
