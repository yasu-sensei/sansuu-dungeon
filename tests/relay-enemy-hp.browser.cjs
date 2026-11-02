const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setContent(fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8'));const saved=await page.evaluate(()=>JSON.stringify(storage));
await page.evaluate(()=>{window.nativeTimeout=setTimeout;window.setTimeout=(fn,ms,...a)=>nativeTimeout(fn,Math.min(ms,5),...a);Math.random=()=>.9999;cpuAction=()=>({cmd:'heal'})});
for(const dungeon of ['mix','carry','borrow'])for(let stage=1;stage<=30;stage++){
 const data=await page.evaluate(({dungeon,stage})=>{state.dungeon=dungeon;state.testMode=true;state.testHero='attack';state.testStage=stage;state.testBossForm='normal';state.screen='testSetup';render();return {hp:enemyMaxHP(stage),base:STAGE_HP[stage-1],training:enemyPreview(stage)}},{dungeon,stage});
 const hp=dungeon==='borrow'&&stage%5!==0?Math.round(data.base*.7):data.base;assert.equal(data.hp,hp);assert((await page.locator('#body').textContent()).includes('HP '+hp+' / '+hp));assert(data.training.includes('HP '+hp));await page.evaluate(()=>launchTestBattle());assert.equal(await page.locator('#enemyHPText').textContent(),'HP '+hp+' / '+hp);
 if(dungeon==='borrow'&&stage%5!==0){
  await page.evaluate(()=>{state.fight.enemyHP=0;if(!arriveKeroberu())throw Error('No second wave');render()});assert.equal(await page.locator('#enemyHPText').textContent(),'HP '+hp+' / '+hp);assert.equal(await page.evaluate(()=>state.fight.maxEnemyHP),hp);
  await page.click('#enemySprite');assert((await page.locator('#monsterInfoOverlay').textContent()).includes(hp+' / '+hp));await page.locator('.inspect-close').click();
  await page.evaluate(()=>{state.fight.enemyHP--;state.fight.enemyUsedHeal=false});await page.evaluate(()=>takeTurn('defend'));assert.equal(await page.evaluate(()=>state.fight.enemyHP),hp);
 }
}
assert.equal(await page.evaluate(()=>JSON.stringify(storage)),saved);assert.equal(errors.length,0,errors.join('\n'));console.log('Passed: all 24 dungeon-three relay stages use rounded 70% max HP for both enemies; teacher/training/battle/inspection agree; wave 2 not reduced twice; healing capped at reduced max; bosses and dungeons 1/2 unchanged; no save writes');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
