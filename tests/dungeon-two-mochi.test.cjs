const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8'),line=prefix=>s.split('\n').find(l=>l.startsWith(prefix));
const keys=['mochi_spring','mochi_summer','mochi_autumn','mochi_winter','mochi_dark','mochi_demon'],bosses=['boss','boss10','boss15','boss20','boss25','boss30'];
const c=vm.createContext({state:{dungeon:'mix',fight:{enemyEvolved:false}},ASSETS:Object.fromEntries([...keys,...bosses].map(k=>[k,'normal-'+k])),BOSS_EVOLUTION_IMAGES:Object.fromEntries(bosses.map(k=>[k,'evolved-'+k])),STAGE_HP:Array(30).fill(50),enemyStats:()=>({atk:10,def:10,spd:10,skills:[]})});
vm.runInContext(line('const DUNGEON_TWO_MOCHI_IMAGES=')+'\n'+s.slice(s.indexOf('const STAGE_ENEMIES='),s.indexOf('function heroBaseBonus(')).replace(line('const DUNGEON_TWO_MOCHI_IMAGES='),'')+'\n'+line('function enemyInfo(')+'\n'+line('function enemySpriteSource(')+'\n'+line('function enemyPreview(')+';globalThis.images=DUNGEON_TWO_MOCHI_IMAGES;',c);
assert.deepEqual(Object.keys(c.images),keys);assert.equal(new Set(Object.values(c.images)).size,6);
for(const src of Object.values(c.images))assert(src.startsWith('data:image/webp;base64,'));
for(const dungeon of ['mix','carry','borrow'])for(let stage=1;stage<=30;stage++){
 c.state.dungeon=dungeon;const info=c.enemyInfo(stage);const expected=dungeon!=='mix'&&!info.boss?c.images[info.key]:'normal-'+info.key;
 c.state.fight.enemyEvolved=false;assert.equal(c.enemySpriteSource(stage),expected);
 // Preview must ignore a stale evolved-boss flag from the previous battle.
 c.state.fight.enemyEvolved=true;assert(c.enemyPreview(stage).includes('src="'+expected+'"'));
 if(info.boss)assert.equal(c.enemySpriteSource(stage),dungeon==='carry'?'evolved-'+info.key:'normal-'+info.key);
 else assert.equal(c.enemySpriteSource(stage),expected);
}
const inspect=s.slice(s.indexOf('function showMonsterInfo('),s.indexOf('function closeMonsterInfo('));assert(inspect.includes(':enemySpriteSource(g.stage)'));
assert(s.includes(':enemySpriteSource(g.stage,ev.enemyEvolved,ev.keroberu)'));
assert.equal(s,fs.readFileSync(path.join(__dirname,'..','keisan_dungeon_v48_enemy_balance_Index.html'),'utf8'));assert(Buffer.byteLength(s)<4194304);
console.log('Passed: 6 distinct embedded evolved mochi assets; all 30 stages x 3 dungeons; carry/borrow evolved mochi; preview ignores stale boss state; inspection and skills share renderer; boss evolution retained; HTML under 4 MiB');
