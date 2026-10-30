const {chromium}=require('playwright'),fs=require('fs'),vm=require('vm'),assert=require('assert');
const s=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');for(const m of s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
for(const [width,height,touch] of [[1366,768,false],[1024,600,false],[844,390,true],[667,375,true],[740,360,true],[568,320,true],[390,844,true]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(s);await page.evaluate(()=>{state.dungeon='borrow';state.testMode=true;state.testGame={...blank(),stage:21,skills:Object.keys(SKILLS),equipped:['power','reflect','swift'],stats:{atk:50,def:50,spd:50}};startBattle()});
 await page.waitForTimeout(100);
 const metrics=await page.evaluate(()=>{const box=id=>{const r=document.getElementById(id).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};return {scroll:document.documentElement.scrollHeight,viewport:innerHeight,notice:getComputedStyle(document.querySelector('.rotate-notice')).display,hero:box('heroSprite'),enemy:box('enemySprite'),buttons:['cmdAttack','cmdDefend','cmdSkill','cmdHeal'].map(box),footer:document.querySelector('.battle-footer').getBoundingClientRect().bottom}});
 console.log(width,height,JSON.stringify(metrics));assert.equal(errors.length,0,errors.join(','));
 if(width<height){assert.notEqual(metrics.notice,'none');}else{assert.equal(metrics.notice,'none');assert(metrics.scroll<=height+1,'vertical overflow');assert(metrics.footer<=height,'footer overflow');for(const b of metrics.buttons){assert(b.height>=44);assert(b.bottom<=height);assert(b.x<metrics.hero.x);assert.equal(b.x,metrics.buttons[0].x)}
 await page.click('#cmdSkill');await page.waitForTimeout(40);assert(await page.locator('#skillBox').isVisible());await page.keyboard.press('Escape');assert(!(await page.locator('#skillBox').isVisible()));
 }

 await context.close();
}await browser.close()})().catch(e=>{console.error(e);process.exitCode=1});
