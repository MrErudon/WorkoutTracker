// Run: NODE_PATH=/path/to/jsdom/node_modules node tests/mobile.cjs
const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('node:fs');const assert=require('node:assert/strict');const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<script src="mobile.js"></script>',()=>`<script>${fs.readFileSync(path.join(root,'mobile.js'),'utf8')}</script>`);
async function boot(storage={}){
  const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(html,{url:'https://example.com/WorkoutTracker/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};Object.entries(storage).forEach(([k,v])=>w.localStorage.setItem(k,v));}});
  await new Promise(r=>dom.window.addEventListener('load',r));assert.deepEqual(errors,[]);return dom;
}
(async()=>{
  let dom=await boot({'trainingLog':JSON.stringify([{type:'run',label:'Existing run',date:'2026-09-01T12:00:00Z',runData:{}}])});let w=dom.window,d=w.document;
  assert.equal(d.querySelector('.goal-strip').parentElement.id,'panel-log');
  assert.equal(w.eval('Object.keys(sessionTimers).length'),0,'Browsing does not time a session');
  const id='upper-a-Press-0';
  d.getElementById(id+'-s1-reps').value='8';d.getElementById(id+'-s1-wt').value='45';
  d.getElementById(id+'-s1-reps').dispatchEvent(new w.Event('input',{bubbles:true}));
  d.getElementById(id+'-s1-done').click();
  assert.ok(w.eval("sessionTimers['upper-a']"));
  const storage=Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)]));dom.window.close();
  dom=await boot(storage);w=dom.window;d=w.document;
  assert.equal(d.getElementById(id+'-s1-reps').value,'8');assert.ok(d.getElementById(id+'-s1-done').classList.contains('done'));
  assert.equal(w.eval('log.length'),1);
  w.saveWorkout('upper-a');assert.equal(w.eval('log.length'),2);assert.equal(d.getElementById(id+'-s1-reps').value,'');
  w.saveWorkout('upper-a');assert.equal(w.eval('log.length'),2,'Second save is not duplicated');
  w.applySwap('upper-a-Press-0','Incline DB Press',null);
  d.querySelector('[data-tab="run"]').click();assert.ok(d.getElementById('panel-run').classList.contains('active'));
  d.querySelector('[data-tab="train"]').click();d.querySelector('[data-day="dbcircuit"]').click();
  d.getElementById('dbc-r0').click();w.saveDBCircuit();assert.equal(w.eval('log.length'),3);
  d.querySelector('[data-day="upper-b"]').click();d.getElementById('circ-0-r0').click();w.saveMetcon();assert.equal(w.eval('log.length'),4);
  d.getElementById('easy-dist').value='3';d.getElementById('easy-time').value='30:00';w.saveRun();assert.equal(w.eval('log.length'),5);
  assert.equal(w.eval('log[4].label'),'Existing run','Existing history survives');
  dom.window.close();console.log('PASS: startup, navigation, draft reload, timer resume, set saving, duplicate prevention, exercise swaps, circuits, metcon, run, existing history.');
})().catch(e=>{console.error(e);process.exit(1)});
