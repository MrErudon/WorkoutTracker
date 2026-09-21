/* Mobile presentation and resumable sessions. Existing history keys remain intact. */
const DRAFT_KEY = 'athleticDraftV2';
let draftReady = false;
function persistDraft() {
  if (!draftReady) return;
  const panels = {};
  document.querySelectorAll('.panel:not(#panel-free)').forEach(panel => {
    panels[panel.id] = {
      inputs: Array.from(panel.querySelectorAll('input[id],select[id]'), el => [el.id, el.type === 'checkbox' ? el.checked : el.value]),
      done: Array.from(panel.querySelectorAll('.done[id],.exercise-card.open[id]'), el => [el.id, el.classList.contains('done') ? 'done' : 'open']),
      checks: Array.from(panel.querySelectorAll('.warmup-item,.stretch-item'), el => el.classList.contains('checked'))
    };
  });
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({panels, swaps:sessionSwaps, timers:sessionTimers, tab:document.querySelector('.tab.active')?.dataset.tab, day:document.querySelector('.day-tab.active')?.dataset.day}));
    document.getElementById('draftStatus').textContent = 'Saved on this device';
  } catch { document.getElementById('draftStatus').textContent = 'Unable to autosave. Keep this tab open and export a backup.'; }
}
function sessionProgress(panel) {
  const all = panel.querySelectorAll('.complete-btn,.circuit-done-btn');
  const done = panel.querySelectorAll('.complete-btn.done,.circuit-done-btn.done');
  return {count:done.length,total:all.length};
}
function refreshSessionControls() {
  document.querySelectorAll('.session-control').forEach(el => {
    const key = el.dataset.session;
    const seconds = sessionTimers[key] ? Math.max(0, Math.floor((Date.now()-sessionTimers[key])/1000)) : 0;
    el.querySelector('strong').textContent = `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
    const {count,total} = sessionProgress(el.closest('.panel'));
    el.querySelector('small').textContent = `${count} / ${total} ${key === 'upper-b' || key === 'dbcircuit' ? 'rounds' : 'sets'} completed`;
    el.querySelector('.session-progress span').style.width = `${total ? count/total*100 : 0}%`;
    const btn = el.querySelector('button');
    btn.textContent = sessionTimers[key] ? 'In progress' : 'Start session';
    btn.disabled = !!sessionTimers[key];
  });
  document.querySelectorAll('.complete-btn').forEach(el => el.setAttribute('aria-pressed',el.classList.contains('done')));
}
function mobileAccessibility() {
  document.querySelectorAll('.tab,.day-tab,.exercise-header-left,.exercise-chevron,.warmup-item,.stretch-item,.swap-option').forEach(el => {
    el.setAttribute('role','button');el.tabIndex=0;
  });
  document.querySelectorAll('input[type=number]').forEach(el => {el.inputMode='decimal';el.min='0';});
  document.querySelectorAll('.set-input').forEach(el => {
    const name = el.closest('.exercise-card').querySelector('.exercise-name').textContent;
    el.setAttribute('aria-label',`${name}, set ${el.id.match(/-s(\d+)-/)?.[1]}, ${el.id.endsWith('-reps') ? 'reps' : 'weight or duration'}`);
  });
  document.querySelectorAll('.complete-btn').forEach(el => el.setAttribute('aria-label','Complete set '+el.id.match(/-s(\d+)-/)?.[1]));
}
function refreshProgress() {
  const chart=document.getElementById('weekBars');chart.replaceChildren();
  const today=new Date();today.setHours(0,0,0,0);
  const counts=Array.from({length:7},(_,i)=>{const d=new Date(today);d.setDate(d.getDate()-6+i);return {d,n:log.filter(e=>new Date(e.date).toDateString()===d.toDateString()).length};});
  const max=Math.max(1,...counts.map(x=>x.n));
  counts.forEach(({d,n})=>{const col=document.createElement('div');col.className='week-bar';const bar=document.createElement('i');bar.style.height=`${Math.max(3,n/max*60)}px`;bar.style.opacity=n?'1':'.15';col.append(bar,document.createTextNode(d.toLocaleDateString('en-US',{weekday:'short'})));col.title=`${n} sessions`;col.setAttribute('aria-label',`${d.toDateString()}: ${n} sessions`);chart.append(col);});
  const total=counts.reduce((s,x)=>s+x.n,0);
  document.getElementById('weekActivity').textContent=`${total} ${total===1?'session':'sessions'} · past 7 days`;
}
function exportBackup() {
  persistDraft();
  const data={version:1,exportedAt:new Date().toISOString(),data:{}};
  ['trainingLog','trainingGoals','exercisePRs','gtgChallenge','restDuration','athleticOutdoorV1','athleticFreeWorkoutV1',DRAFT_KEY].forEach(key=>{const v=localStorage.getItem(key);if(v!==null)data.data[key]=JSON.parse(v);});
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=`athletic-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#panel-log').prepend(document.querySelector('.goal-strip'));
  const insight=document.createElement('section');insight.className='mobile-insight';insight.innerHTML='<h2 id="weekActivity"></h2><div class="week-bars" id="weekBars" role="img" aria-label="Sessions during the past seven days"></div>';
  document.querySelector('#panel-log').prepend(insight);
  const backup=document.createElement('section');backup.innerHTML='<p class="backup-note">Your training data stays in this browser on this device. Export a complete backup to keep a separate copy.</p><button class="backup-button" onclick="exportBackup()">Export complete backup</button>';
  document.querySelector('#panel-log').append(backup);
  const status=document.createElement('div');status.id='draftStatus';status.setAttribute('role','status');document.querySelector('main').append(status);
  const icons={free:'M12 5v14M5 12h14',train:'M4 8v8m4-11v14m8-14v14m4-11v8M8 12h8',run:'m5 20 4-6m-3-5 5-3 3 5 5 2M11 6l1 8 5 6m-2-18h.01',emom:'M9 2h6M12 8v5l3 2M20 13a8 8 0 1 1-16 0 8 8 0 0 1 16 0',gtg:'m13 2-9 12h7l-1 8 10-13h-7z',log:'M5 20V12m7 8V4m7 16V8'};
  document.querySelectorAll('.tab').forEach(el=>{const key=el.dataset.tab;el.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[key]}"/></svg><span>${({free:'Log',train:'Train',run:'Run',emom:'Intervals',gtg:'Challenge',log:'Progress'})[key]}</span>`;});
  document.querySelectorAll('.warmup-card,.cooldown-card').forEach(card=>{const details=document.createElement('details');details.className=card.className;const summary=document.createElement('summary');summary.append(card.firstElementChild);details.append(summary);while(card.firstChild)details.append(card.firstChild);card.replaceWith(details);});
  document.querySelectorAll('.session-timer').forEach(timer=>{
    const key=timer.id.replace('timer-','');const controls=document.createElement('div');controls.className='session-control';controls.dataset.session=key;
    controls.innerHTML='<div><small></small><strong>0:00</strong><div class="session-progress"><span></span></div></div><button type="button">Start session</button>';
    controls.querySelector('button').onclick=()=>{startSessionTimer(key);persistDraft();refreshSessionControls();};
    timer.closest('.panel').querySelector('.workout-header').after(controls);
  });
  let draft;
  try{draft=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');}catch{showToast('Saved draft could not be read. Your workout history is unchanged.');}
  if(draft?.panels){
    Object.assign(sessionSwaps,draft.swaps||{});
    Object.keys(WORKOUTS).forEach(key=>{if(!WORKOUTS[key].isMetcon)renderWorkout(key);});
    const variant=draft.panels['panel-dbcircuit']?.inputs?.find(([id])=>id==='dbCircuitSelect');
    if(variant){document.getElementById(variant[0]).value=variant[1];renderDBCircuit();}
    Object.entries(draft.panels).forEach(([id,data])=>{
      const panel=document.getElementById(id);if(!panel)return;
      data.inputs?.forEach(([inputId,value])=>{const el=document.getElementById(inputId);if(el){if(el.type==='checkbox')el.checked=value;else {el.value=value;if(el.id.startsWith('equip-'))el.dataset.previousMode=value;}}});
      data.done?.forEach(([doneId,cls])=>{if(['done','open'].includes(cls))document.getElementById(doneId)?.classList.add(cls);});
      panel.querySelectorAll('.warmup-item,.stretch-item').forEach((el,i)=>el.classList.toggle('checked',!!data.checks?.[i]));
      panel.querySelectorAll('[id^=deload-][type=checkbox]').forEach(el=>toggleDeload(el.id.slice(7)));
    });
    Object.entries(draft.timers||{}).forEach(([key,value])=>{if(Number.isFinite(value)&&value>0&&document.getElementById('timer-'+key)){sessionTimers[key]=value;startSessionTimer(key);}});
    Array.from(document.querySelectorAll('.day-tab')).find(el=>el.dataset.day===draft.day)?.click();
    Array.from(document.querySelectorAll('.tab')).find(el=>el.dataset.tab===draft.tab)?.click();
  }
  // Clear only a successfully saved session; a second tap cannot duplicate it.
  const saves={saveWorkout:null,saveRun:'run',saveDBCircuit:'dbcircuit',saveMetcon:'upper-b',saveEMOM:'emom'};
  Object.entries(saves).forEach(([name,fixed])=>{
    const original=window[name];window[name]=function(...args){
      const key=fixed||args[0],panel=document.getElementById('panel-'+key),before=log.length;
      const invalid=Array.from(panel.querySelectorAll(key==='run'?'.run-option input[type=number]':'input[type=number]')).find(el=>el.value && (!Number.isFinite(Number(el.value)) || Number(el.value)<0));
      if(invalid){showToast('Use a positive number or zero.');invalid.focus();return;}
      try{original(...args);}catch(error){if(log.length>before)log.shift();showToast('Unable to save. Your session is still here; export a backup and try again.');return;}
      if(log.length>before){
        panel.querySelectorAll(key==='run'?'.run-option input': 'input:not([type=checkbox])').forEach(el=>el.value='');
        panel.querySelectorAll('.done,.checked').forEach(el=>el.classList.remove('done','checked'));
        clearInterval(sessionTimerIntervals[key]);delete sessionTimerIntervals[key];delete sessionTimers[key];
        if(activeRestExId)stopRestTimer(activeRestExId);
        if(key==='emom')emomReset();
        persistDraft();refreshSessionControls();refreshProgress();
      }
    };
  });
  // Successful logs use a non-blocking receipt; validation alerts remain explicit.
  const nativeAlert=window.alert.bind(window);window.alert=message=>/saved ✓/.test(message)?showToast(message):nativeAlert(message);
  document.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)&&e.target.matches('[role=button]')){e.preventDefault();e.target.click();}});
  document.addEventListener('input',e=>{if(e.target.closest('.panel')){const key=e.target.closest('.panel').id.slice(6);if(e.target.matches('.set-input,.circuit-notes'))startSessionTimer(key);persistDraft();}});
  document.addEventListener('change',()=>{mobileAccessibility();persistDraft();});
  document.addEventListener('click',e=>{
    if(e.target.closest('.complete-btn,.circuit-done-btn,.warmup-item')){const key=e.target.closest('.panel').id.slice(6);startSessionTimer(key);}
    if(e.target.closest('.tab')){refreshProgress();window.scrollTo(0,0);}
    mobileAccessibility();refreshSessionControls();persistDraft();
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)persistDraft();});
  window.addEventListener('pagehide',persistDraft);
  draftReady=true;mobileAccessibility();refreshSessionControls();refreshProgress();persistDraft();
  setInterval(refreshSessionControls,1000);
});
