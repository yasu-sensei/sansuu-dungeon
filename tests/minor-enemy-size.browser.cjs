const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{const page=await browser.newPage();await page.setContent(fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8'));
for(const viewport of [{width:1366,height:768},{width:844,height:390},{width:568,height:320}]){
 await page.setViewportSize(viewport);for(const stage of [1,6,11,16,21,26])for(const hero of ['attack','defense','speed'])for(const [dungeon,wave] of [['mix',false],['carry',false],['borrow',false],['borrow',true]]){
 await page.evaluate(({hero,dungeon,wave,stage})=>{state.hero=hero;state.dungeon=dungeon;state.testMode=true;state.testGame={...blank(),stage,skills:['power'],equipped:['power']};startBattle();if(wave){state.fight.enemyHP=0;arriveKeroberu();render()}}, {hero,dungeon,wave,stage});
 await page.locator('#heroSprite').evaluate(img=>img.decode());await page.locator('#enemySprite').evaluate(img=>img.decode());
 const metric=await page.evaluate(()=>{sizeMinorEnemy();const measure=id=>{const img=$(id),b=visibleSpriteBounds(img),r=img.getBoundingClientRect(),f=Math.min(r.width/img.naturalWidth,r.height/img.naturalHeight);return Math.max(b.width*f,b.height*f)};return {ratio:measure('enemySprite')/measure('heroSprite'),scroll:document.documentElement.scrollHeight,viewport:innerHeight}});
 assert(Math.abs(metric.ratio-.75)<.025,JSON.stringify({viewport,hero,dungeon,wave,metric}));assert(metric.scroll<=metric.viewport+1);
 }
 console.log('Passed: visible enemy/hero size ~75% across 3 heroes, 3 dungeons, both waves at '+viewport.width+'x'+viewport.height);
}
await page.setViewportSize({width:1024,height:600});await page.evaluate(()=>{state.testGame.stage=5;startBattle()});await page.locator('#enemySprite').evaluate(img=>img.decode());assert.equal(await page.locator('#enemySprite').evaluate(img=>img.style.width),'');console.log('Boss size unchanged');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
