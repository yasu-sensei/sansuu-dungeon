const fs=require('fs'),vm=require('vm'),assert=require('assert');
const s=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const engine=s.slice(s.indexOf('// Calculation question engine:'),s.indexOf('// End calculation question engine.'));
const c=vm.createContext({});vm.runInContext(engine+';globalThis.engine=CalculationQuestions;',c);const engineAPI=c.engine;
function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
for(const [mode,min,max,size] of [['mix',0,10,11],['carry',11,18,8],['borrow',2,9,8]]){
 for(const random of [()=>0,()=>0.999999,rng(17),rng(999)]){
  const session=engineAPI.createSession(mode,random);let previous=null;
  for(let set=0;set<1000;set++){
   const questions=Array.from({length:size},()=>engineAPI.next(session));
   assert.deepEqual(questions.map(q=>q.ans).sort((a,b)=>a-b),Array.from({length:size},(_,i)=>min+i));
   if(mode==='mix')assert([5,6].includes(questions.filter(q=>q.op==='+').length));
   for(const q of questions){
    assert.equal(q.ans,q.op==='+'?q.a+q.b:q.a-q.b);
    if(previous){assert.notEqual(q.ans,previous.ans);assert.notEqual(q.id,previous.id)}
    if(mode==='mix'){assert(q.a>=0&&q.a<=10&&q.b>=0&&q.b<=10);assert(q.op==='+'?q.a+q.b<=10:q.a<=10)}
    if(mode==='carry')assert(q.a>=1&&q.a<=9&&q.b>=1&&q.b<=9&&q.a+q.b>10);
    if(mode==='borrow')assert(q.a>=11&&q.a<=18&&q.b>=2&&q.b<=9&&q.a%10<q.b);
    previous=q;
   }
   assert.equal(session.queue.length,0);assert(session.history.length<=32);
  }
 }
 const session=engineAPI.createSession(mode,rng(5)),seen=new Map();
 for(let i=0;i<size*10;i++){
  const q=engineAPI.next(session);
  if(mode!=='mix'&&seen.has(q.ans)&&!((mode==='carry'&&q.ans===18)||(mode==='borrow'&&q.ans===2)))assert.notEqual(q.id,seen.get(q.ans));
  seen.set(q.ans,q.id);
 }
 console.log(mode+': 4,000 sets verified, ranges, balance, boundaries, diversity, and bounded history');
}
let serial=0;const timers=new Map();const game={stage:1,points:0,correctTotal:0,stats:{atk:26,def:17,spd:17},skills:['power']};
const context=vm.createContext({state:{screen:'math',dungeon:'carry',correct:0,attempts:0,time:90},current:()=>game,beep:()=>{},render:()=>{},save:()=>{},clearInterval:()=>{},setTimeout:fn=>{timers.set(++serial,fn);return serial},clearTimeout:id=>timers.delete(id),$:()=>({textContent:''})});
const next=s.slice(s.indexOf('function nextQuestion(){'),s.indexOf('function startMath(){'));
const handlers=s.slice(s.indexOf('function keyPress(k){'),s.indexOf('function radarChart('));
vm.runInContext(engine+'\n'+next+'\n'+handlers+'\nnextQuestion()',context);
const state=context.state;
function answer(n){state.answer=String(n);context.submitAnswer()}
function flush(){const list=[...timers.values()];timers.clear();list.forEach(fn=>fn())}
let q=state.question,session=state.questionSessions.carry,remaining=session.queue.length;
answer(q.ans+1);assert.equal(state.attempts,1);assert.equal(state.correct,0);assert.equal(state.answerFeedback,'✕');assert.equal(state.question,q);assert.equal(session.queue.length,remaining);
answer(q.ans);assert.equal(state.attempts,1); // rapid extra tap ignored
flush();assert.equal(state.question,q);assert.equal(state.answer,'');assert.equal(session.queue.length,remaining);
answer(q.ans);assert.equal(state.correct,1);assert.equal(state.attempts,2);assert.equal(state.answerFeedback,'◯');flush();assert.notEqual(state.question,q);assert.equal(session.queue.length,remaining-1);
q=state.question;remaining=session.queue.length;answer(q.ans+1);flush();answer(q.ans+1);assert.equal(state.correct,1);assert.equal(state.attempts,4);assert.equal(state.answerFeedback,'✕');flush();assert.notEqual(state.question,q);assert.equal(session.queue.length,remaining-1);
for(let i=0;i<25;i++){answer(state.question.ans);flush()}assert.equal(state.correct,26);assert.equal(state.screen,'math');
answer(state.question.ans);state.time=0;context.finishMath();assert.equal(game.correctTotal,27);assert.equal(game.points,27);assert.equal(game.answerTotal,30);assert.equal(state.screen,'training');const finishedQuestion=state.question;flush();assert.equal(state.question,finishedQuestion);context.finishMath();assert.equal(game.points,27);
state.answer='0';context.submitAnswer();assert.equal(state.attempts,30);
const mathFn=s.split('\n').find(line=>line.startsWith('function math(b)'));
const ui=vm.createContext({state:{question:{text:'9 ＋ 9'},answer:'19',answerFeedback:'✕',mathFeedback:true,correct:0,attempts:1,time:90,questionAttempts:1},current:()=>game,formatTime:()=> '1:30'});vm.runInContext(mathFn,ui);const b={};ui.math(b);assert(b.innerHTML.includes('✕'));assert(b.innerHTML.includes('aria-live="polite"'));assert(!b.innerHTML.includes('18'));assert(b.innerHTML.includes('disabled'));
assert.equal(s,fs.readFileSync(require('path').join(__dirname,'..','keisan_dungeon_v48_enemy_balance_Index.html'),'utf8'));
console.log('Answer flow verified: retry, skip, correct retry, no answer disclosure, double taps, no 20-correct cap, separate saved totals, timer expiry, and duplicate finish');
