const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const one=name=>s.split('\n').find(l=>l.startsWith('function '+name+'('));
const restart=s.slice(s.indexOf('function restartAdventure(){'),s.indexOf('function enterGame(){'));
const pick=s.slice(s.indexOf('function pickHero(id){'),s.indexOf('function quitAdventure(){'));
let accept=true,saves=0,started=0,snapshot,prompt;
const ctx=vm.createContext({state:{className:'1ねん1くみ',number:'1',dungeon:'mix',mode:'checkpoint',screen:'home',hero:'attack',busy:false},storage:{games:{},className:'1ねん1くみ',number:'1',profileRegistered:true,loginRewards:{student:{mix:true}},masterUnlocks:{student:true}},DUNGEONS:[['mix','10まで'],['carry','20まで足し算'],['borrow','20まで引き算']],HEROES:{attack:{name:'ファイ',atk:26,def:17,spd:17,skill:'power'},defense:{name:'グリー',atk:17,def:26,spd:17,skill:'reflect'},speed:{name:'ソラ',atk:17,def:18,spd:25,skill:'swift'}},ASSETS:{},SKILLS:{power:['power'],reflect:['reflect'],swift:['swift']},confirm:text=>{prompt=text;return accept},clearMathFeedback:()=>{},clearInterval:()=>{},render:()=>{},save:()=>{saves++;snapshot=JSON.stringify(ctx.storage)},startMath:()=>{started++},backHome:()=>{ctx.state.screen='home'}});
vm.runInContext(one('profile')+'\nfunction current(){return storage.games[profile()]}\n'+one('blank')+'\n'+restart+'\n'+pick+'\n'+one('beginAdventure')+'\n'+one('choose'),ctx);
for(const mode of ['checkpoint','challenge'])for(const dungeon of ['mix','carry','borrow']){
 ctx.state.mode=mode;ctx.state.dungeon=dungeon;ctx.state.screen='home';ctx.state.hero='attack';ctx.state.testMode=false;
 const key=ctx.profile();ctx.storage.games[key]={hero:'attack',stage:31,best:30,stats:{atk:80,def:60,spd:50},points:19,skills:['power','reflect'],equipped:['reflect'],correctTotal:99,answerTotal:111,checkpoint:{stage:26}};
 ctx.storage.games['other_profile']={stage:17,points:12};
 const before=JSON.stringify(ctx.storage),saveCount=saves;accept=false;ctx.restartAdventure();assert.equal(JSON.stringify(ctx.storage),before);assert.equal(saves,saveCount);assert.equal(ctx.state.screen,'home');
 accept=true;ctx.restartAdventure();let g=ctx.current();assert.equal(g.stage,1);assert.equal(g.best,30);assert.equal(g.points,0);assert.equal(g.stats.atk,26);assert.equal(g.skills.join(','),'power');assert(g.pendingHeroSelection);assert.equal(g.correctTotal,0);assert.equal(ctx.state.screen,'choose');assert(prompt.includes('さいこうきろくと ごほうびは のこるよ'));
 const original=JSON.parse(before),after=JSON.parse(JSON.stringify(ctx.storage));delete original.games[key];delete after.games[key];assert.deepEqual(after,original);
 // Resume a reload while choosing a new hero, then select and persist Sora.
 ctx.storage=JSON.parse(snapshot);const b={};ctx.choose(b);assert(!b.innerHTML.includes('disabled'));assert(b.innerHTML.includes('このぼうけんを はじめから'));
 ctx.pickHero('speed');g=ctx.current();assert.equal(g.hero,'speed');assert.equal(g.stats.spd,25);assert.equal(g.stats.atk,17);assert.equal(g.skills.join(','),'swift');assert.equal(g.best,30);assert(g.pendingHeroSelection);
 ctx.beginAdventure();assert.equal(ctx.state.screen,'math');assert(!ctx.current().pendingHeroSelection);assert.equal(JSON.parse(snapshot).games[key].hero,'speed');
 if(mode==='checkpoint'){ctx.state.screen='choose';ctx.choose(b);assert.equal((b.innerHTML.match(/disabled/g)||[]).length,3);ctx.pickHero('defense');assert.equal(ctx.current().hero,'speed')}
}
assert.equal(started,6);
ctx.state.mode='checkpoint';ctx.state.screen='battle';let count=saves;ctx.restartAdventure();assert.equal(saves,count);ctx.state.screen='home';ctx.state.testMode=true;ctx.restartAdventure();assert.equal(saves,count);ctx.state.testMode=false;ctx.state.busy=true;ctx.restartAdventure();assert.equal(saves,count);
assert(!s.includes('チェックポイント'));assert(s.includes('<strong>チャレンジモード</strong>'));assert(s.includes('<strong>つづきからモード</strong>'));
assert.equal(s,fs.readFileSync(path.join(__dirname,'..','keisan_dungeon_v48_enemy_balance_Index.html'),'utf8'));
console.log('Passed: restart/cancel for 3 dungeons x 2 modes; isolated records, best/rewards retained, persisted hero selection, correct hero stats, selection lock after start, test/battle/busy guards, and labels');
