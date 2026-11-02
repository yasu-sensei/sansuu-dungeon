const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setContent(fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8'));
const saved=await page.evaluate(()=>{const k=masterStudentKey();storage.games[profile()]={...blank(),stage:27,best:26,points:29,correctTotal:123};storage.loginRewards[k]={mix:true,carry:true,borrow:true};storage.masterUnlocks[k]=true;return JSON.stringify(storage.games)});
for(const viewport of [{width:1366,height:768},{width:844,height:390},{width:568,height:320}]){
 await page.setViewportSize(viewport);
 for(const theme of ['mix','carry','borrow']){
 await page.evaluate(theme=>{storage.loginThemes[masterStudentKey()]=theme;state.screen='landing';render()},theme);
 const sizes=await page.evaluate(async theme=>{const art=document.querySelector('.landing-art'),hit=document.querySelector('.landing-hit'),background=getComputedStyle(art).backgroundImage,src=rewardPreviewSource(theme);if(!src||!background.includes(src)||REWARD_PREVIEWS[theme]!==src)throw Error('Preview/background mismatch');const image=new Image();image.src=src;await image.decode();const a=art.getBoundingClientRect(),b=hit.getBoundingClientRect();return {naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,x:(b.x-a.x)/a.width,y:(b.y-a.y)/a.height,width:b.width/a.width,height:b.height/a.height,scroll:document.documentElement.scrollHeight,viewport:innerHeight}},theme);
 assert.equal(sizes.naturalWidth,640);assert.equal(sizes.naturalHeight,427);assert(Math.abs(sizes.x-({mix:.27,carry:.28,borrow:.30}[theme]))<.001);assert(Math.abs(sizes.y-({mix:.83,carry:.83,borrow:.84}[theme]))<.001);assert(sizes.width>=.39&&sizes.height>=.129);assert(sizes.scroll<=sizes.viewport+1);
 await page.locator('.landing-hit').click();assert.notEqual(await page.evaluate(()=>state.screen),'landing');assert.equal(await page.evaluate(()=>JSON.stringify(storage.games)),saved);
 if(viewport.width===1366){await page.evaluate(()=>{state.screen='landing';render()});await page.screenshot({path:'/workspace/work/reward-final-'+theme+'.png'})}
 }
}
// Earned themes stay earned under the same keys; locked previews remain coarse mosaics.
await page.evaluate(()=>{delete storage.loginRewards[masterStudentKey()].borrow;state.screen='wardrobe';render()});assert.equal(await page.locator('.reward-choice.locked canvas[width="6"][height="4"]').count(),1);assert.equal(await page.locator('.reward-choice:not(.locked) img').count(),2);assert((await page.locator('#body').textContent()).includes('てんくうていえん'));assert((await page.locator('#body').textContent()).includes('がいせん'));assert.equal(await page.evaluate(()=>JSON.stringify(storage.games)),saved);assert.equal(errors.length,0,errors.join('\n'));
console.log('Passed: 3 revised reward artworks; matching gallery previews; correctly placed login hit areas at desktop and 2 landscape mobile sizes; login works; earned keys and adventure records preserved; locked mosaic retained');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
