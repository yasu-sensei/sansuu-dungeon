const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const one=name=>s.split('\n').find(l=>l.startsWith('function '+name+'('));
const restart=s.slice(s.indexOf('function restartAdventure(){'),s.indexOf('function enterGame(){'));
const pick=s.slice(s.indexOf('function pickHero(id){'),s.indexOf('function quitAdventure(){'));
let accept=true,saves=0,started=0,snapshot,prompt;
const ctx=vm.createContext({state:{className:'1ねん1くみ',number:'1',dungeon:'mix',mode:'checkpoint',screen:'choose',hero:'attack',busy:false},storage:{games:{},className:'1ねん1くみ',number:'1',profileRegistered:true,loginRewards:{student:{mix:true}},masterUnlocks:{student:true}},DUNGEONS:[['mix','10まで'],['carry','20まで足し算'],['borrow','20まで引き算']],HEROES:{attack:{name:'ファイ',atk:26,def:17,spd:17,skill:'power'},defense:{name:'グリー',atk:17,def:26,spd:17,skill:'reflect'},speed:{name:'ソラ',atk:17,def:18,spd:25,skill:'swift'}},ASSETS:{},SKILLS:{power:['power'],reflect:['reflect'],swift:['swift']},confirm:text=>{prompt=text;return accept},clearMathFeedback:()=>{},clearInterval:()=>{},render:()=>{},save:()=>{saves++;snapshot=JSON.stringify(ctx.storage)},startMath:()=>{started++},backHome:()=>{ctx.state.screen='home'}});
vm.runInContext(one('profile')+'\nfunction current(){return storage.games[profile()]}\n'+one('blank')+'\n'+restart+'\n'+pick+'\n'+one('beginAdventure')+'\n'+one('choose'),ctx);
for(const mode of ['checkpoint'])for(const dungeon of ['mix','carry','borrow']){
 ctx.state.mode=mode;ctx.state.dungeon=dungeon;ctx.state.screen='choose';ctx.state.hero='attack';ctx.state.testMode=false;
 const key=ctx.profile();ctx.storage.games[key]={hero:'attack',stage:31,best:30,stats:{atk:80,def:60,spd:50},points:19,skills:['power','reflect'],equipped:['reflect'],correctTotal:99,answerTotal:111,checkpoint:{stage:26}};
 ctx.storage.games['other_profile']={stage:17,points:12};
 const before=JSON.stringify(ctx.storage),saveCount=saves;accept=false;ctx.restartAdventure();assert.equal(JSON.stringify(ctx.storage),before);assert.equal(saves,saveCount);assert.equal(ctx.state.screen,'choose');
 accept=true;ctx.restartAdventure();let g=ctx.current();assert.equal(g.stage,1);assert.equal(g.best,30);assert.equal(g.points,0);assert.equal(g.stats.atk,26);assert.equal(g.skills.join(','),'power');assert(g.pendingHeroSelection);assert.equal(g.correctTotal,0);assert.equal(ctx.state.screen,'choose');assert(prompt.includes('さいこうきろくと ごほうびは のこるよ'));
 const original=JSON.parse(before),after=JSON.parse(JSON.stringify(ctx.storage));delete original.games[key];delete after.games[key];assert.deepEqual(after,original);
 // Resume a reload while choosing a new hero, then select and persist Sora.
 ctx.storage=JSON.parse(snapshot);const b={};ctx.choose(b);assert(!b.innerHTML.includes('disabled'));assert(!b.innerHTML.includes('このぼうけんを はじめから'));
 ctx.pickHero('speed');g=ctx.current();assert.equal(g.hero,'speed');assert.equal(g.stats.spd,25);assert.equal(g.stats.atk,17);assert.equal(g.skills.join(','),'swift');assert.equal(g.best,30);assert(g.pendingHeroSelection);
 ctx.beginAdventure();assert.equal(ctx.state.screen,'math');assert(!ctx.current().pendingHeroSelection);assert.equal(JSON.parse(snapshot).games[key].hero,'speed');
 if(mode==='checkpoint'){ctx.state.screen='choose';ctx.choose(b);assert.equal((b.innerHTML.match(/disabled/g)||[]).length,3);ctx.pickHero('defense');assert.equal(ctx.current().hero,'speed')}
}
assert.equal(started,3);
ctx.state.screen='choose';ctx.state.mode='challenge';ctx.storage.games[ctx.profile()]={hero:'attack',stage:1,best:30,points:0};const challengeSnapshot=JSON.stringify(ctx.storage),challengeSaves=saves;ctx.restartAdventure();assert.equal(JSON.stringify(ctx.storage),challengeSnapshot);assert.equal(saves,challengeSaves);const challengeUI={};ctx.choose(challengeUI);assert(!challengeUI.innerHTML.includes('このぼうけんを はじめから'));
ctx.state.mode='checkpoint';const savedUI={};ctx.choose(savedUI);assert(savedUI.innerHTML.includes('このぼうけんを はじめから'));
ctx.earnedThemes=()=>[];ctx.esc=x=>x;vm.runInContext(one('home'),ctx);
for(const mode of ['checkpoint','challenge'])for(const dungeon of ['mix','carry','borrow']){
 ctx.state.mode=mode;ctx.state.dungeon=dungeon;const b={};ctx.home(b);assert(!b.innerHTML.includes('restartAdventure'));
 assert(b.innerHTML.indexOf('つづきからモード')<b.innerHTML.indexOf('チャレンジモード'));
 assert.equal((b.innerHTML.match(/✓ えらんでいるよ/g)||[]).length,2);assert.equal((b.innerHTML.match(/aria-pressed="true"/g)||[]).length,2);
 for(const id of ['mix','carry','borrow'])assert(b.innerHTML.includes('dungeon-'+id));
 assert(b.innerHTML.includes('mode-checkpoint'));assert(b.innerHTML.includes('mode-challenge'));
}
// White text meets WCAG AA contrast on all five choice colors.
for(const hex of ['195b91','69419c','963d4a','216b4b','99520d']){
 const rgb=hex.match(/../g).map(x=>parseInt(x,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 const lum=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];assert(1.05/(lum+.05)>=4.5);
}

ctx.state.mode='checkpoint';ctx.state.screen='battle';let count=saves;ctx.restartAdventure();assert.equal(saves,count);ctx.state.screen='home';ctx.state.testMode=true;ctx.restartAdventure();assert.equal(saves,count);ctx.state.testMode=false;ctx.state.busy=true;ctx.restartAdventure();assert.equal(saves,count);
assert(!s.includes('チェックポイント'));assert(s.includes('<strong>チャレンジモード</strong>'));assert(s.includes('<strong>つづきからモード</strong>'));
assert.equal(s,fs.readFileSync(path.join(__dirname,'..','keisan_dungeon_v48_enemy_balance_Index.html'),'utf8'));
console.log('Passed: checkpoint restart/cancel for 3 dungeons, no restart in challenge/home, choice ordering/colors/selected labels; isolated records, best/rewards retained, persisted hero selection, correct hero stats, selection lock after start, test/battle/busy guards, and labels');
