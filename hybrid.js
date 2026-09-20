/* One personal plan; reuse the existing logger, history and draft storage. */
const HYBRID_KEYS = ['hybrid-a','hybrid-b','hybrid-c'];
const hybridExercise = (name, scheme, sets, gym, hasWeight=true) => ({name,scheme,sets,hasWeight,gym});
const HYBRID_SESSIONS = [
  {key:'hybrid-a', title:'Foundation', focus:'Squat · horizontal push & pull', exercises:[
    hybridExercise('DB Goblet Squat','3×6–10',3,'Hack Squat Machine'),
    hybridExercise('DB Bench Press','3×6–10',3,'Barbell Bench Press'),
    hybridExercise('One-Arm DB Row','3×8–12/side',3,'Chest-Supported Machine Row'),
    hybridExercise('Dead Bug','2×8–12/side',2,'Dead Bug',false)]},
  {key:'hybrid-b', title:'Strength & Control', focus:'Hinge · shoulders · single-leg strength', exercises:[
    hybridExercise('DB Romanian Deadlift','3×6–10',3,'Barbell Romanian Deadlift'),
    hybridExercise('DB Overhead Press','3×6–10',3,'Machine Shoulder Press'),
    hybridExercise('Reverse Lunge','2×8–10/leg',2,'DB Reverse Lunge'),
    hybridExercise('DB Pullover','3×10–12',3,'Lat Pulldown')]},
  {key:'hybrid-c', title:'Total Body', focus:'Legs · upper body · trunk', exercises:[
    hybridExercise('DB Split Squat','3×8–10/leg',3,'DB Split Squat'),
    hybridExercise('Incline DB Press','3×8–12',3,'Incline Machine Chest Press'),
    hybridExercise('One-Arm DB Row','3×8–12/side',3,'Seated Cable Row'),
    hybridExercise('Side Plank','2×20–40 sec/side',2,'Side Plank',false)]},
  {key:'hybrid-d', title:'Optional Reset', focus:'Easy movement · mobility · recovery', exercises:[
    hybridExercise('Bodyweight Squat','2×10 easy',2,'Bodyweight Squat',false),
    hybridExercise('Bird Dog','2×8/side',2,'Bird Dog',false),
    hybridExercise('Hip 90/90 Switch','2×8/side',2,'Hip 90/90 Switch',false),
    hybridExercise('Thoracic Rotation','2×8/side',2,'Thoracic Rotation',false)]}
];
const hybridNav=document.querySelector('.day-subnav');
const legacyTabs=Array.from(hybridNav.children);
legacyTabs.forEach(el=>el.classList.remove('active'));
const legacy=document.createElement('details');legacy.className='hybrid-legacy';legacy.innerHTML='<summary>Previous routines</summary>';
legacyTabs.forEach(el=>legacy.append(el));
hybridNav.replaceChildren();
const overview=document.createElement('section');overview.className='hybrid-overview';
overview.innerHTML=`<div class="hybrid-eyebrow">YOUR PLAN · 3 DAYS + 1 OPTIONAL</div><h2>Hybrid</h2><p>Strength for running, rucking and everyday athleticism.</p><div id="hybridNext"></div><details><summary>How this plan works</summary><p>Rotate sessions 1 → 2 → 3, ideally with a recovery day between strength sessions. Missed a day? Continue with the next session. Session 4 is optional and never advances the main rotation.</p><p><b>45-minute strength session:</b> 5 minutes warming up, about 35 minutes lifting, then 5 minutes to finish and cool down. Rest 90–120 seconds on demanding sets and 45–60 seconds on trunk work. Skip the last accessory if time runs short.</p><p><b>Progression:</b> start with a load that leaves about 2 good reps in reserve. Build toward the top of the rep range. Once every set reaches it with controlled form, use the smallest available weight increase and return to the lower end. Previous sets appear in the logger. Keep each equipment variation on its own progression.</p><p><b>After every session:</b> walk or run at an easy, conversational effort. Choose the duration for your time and recovery. Log it separately under Run. Rucking is optional when you are home; there are no carries in this plan.</p></details>`;
document.getElementById('dayCategorySubnav').prepend(overview);
HYBRID_SESSIONS.forEach((session,i)=>{
  session.exercises.push(hybridExercise('Frog Crunches',i===3?'2×12–20':'3×12–20',i===3?2:3,'Frog Crunches',false));
  session.exercises.forEach(ex=>{if(ex.name==='Side Plank')ex.repsLabel='Secs';});
  WORKOUTS[session.key]={label:'Hybrid · '+session.title,sections:[{name:'Strength',exercises:session.exercises}]};
  const tab=document.createElement('div');tab.className='day-tab'+(i===0?' active':'');tab.dataset.day=session.key;tab.style.setProperty('--day-color','#c6f36a');tab.textContent=i===3?'4 · Optional':`${i+1} · ${session.title}`;hybridNav.append(tab);
  const panel=document.createElement('div');panel.className='panel';panel.id='panel-'+session.key;
  panel.innerHTML=`<div class="workout-header"><div><div class="workout-title">${session.title}</div><div class="workout-subtitle">${session.focus} · ${i===3?'15–25 min, optional':'45 min + walk/run'}</div></div><div class="equip-mode-wrap"><label class="equip-mode-label" for="equip-${session.key}">Mode</label><select class="equip-mode-select" id="equip-${session.key}" onchange="applyHybridMode('${session.key}',this)"><option value="default">Home / Hotel DB</option><option value="Commercial Gym">Commercial Gym</option></select></div></div><div class="session-timer" id="timer-${session.key}">0:00</div><div class="hybrid-note"><b>Prepare · 5 min</b><p>Easy marching or walking, controlled squats and arm circles, then light practice sets of your first lift. On Session 3, optional low hops: 2 × 5 controlled landings, if comfortable.</p></div><div id="${session.key}-exercises"></div><div class="hybrid-note"><b>Finish with a walk or run</b><p>Keep it conversational. After harder leg work, an easy walk is enough. Ruck instead when you are home and recovered.</p><button type="button" onclick="document.querySelector('[data-tab=run]').click()">Open run / ruck log</button></div><div class="save-bar"><button class="save-btn" onclick="saveWorkout('${session.key}')">Finish ${session.title}</button></div>`;
  document.querySelector('main').append(panel);
});
hybridNav.after(legacy);
function applyHybridMode(key,select){
  const panel=document.getElementById('panel-'+key);
  if(panel.querySelector('.complete-btn.done')||Array.from(panel.querySelectorAll('.set-input')).some(el=>el.value)){
    if(!confirm('Changing equipment resets the sets in this session. Continue?')){select.value=select.dataset.previousMode||'default';return;}
  }
  select.dataset.previousMode=select.value;
  WORKOUTS[key].sections[0].exercises.forEach((ex,i)=>{
    const id=key+'-Strength-'+i;delete sessionSwaps[id];
    if(select.value==='Commercial Gym')sessionSwaps[id]={...ex,name:ex.gym,scheme:ex.name==='One-Arm DB Row'?ex.scheme.replace('/side',''):ex.scheme};
  });
  renderWorkout(key);mobileAccessibility();persistDraft();refreshSessionControls();
}
function refreshHybridPlan(){
  const completed=log.filter(entry=>HYBRID_KEYS.includes(entry.type));
  const index=completed.length?(HYBRID_KEYS.indexOf(completed[0].type)+1)%3:0;
  const next=HYBRID_SESSIONS[index];
  const target=document.getElementById('hybridNext');target.replaceChildren();
  const button=document.createElement('button');button.type='button';button.textContent=`Next: ${index+1} · ${next.title} →`;
  button.onclick=()=>{document.querySelector('[data-tab=train]').click();document.querySelector(`[data-day=${next.key}]`).click();document.getElementById('panel-'+next.key).scrollIntoView({behavior:'smooth'});};target.append(button);
  const info=document.createElement('p');info.textContent=`${completed.length} core sessions completed · ${Math.floor(completed.length/3)} rotations`;target.append(info);
}
document.addEventListener('DOMContentLoaded',()=>{
  // Run after mobile.js restores drafts and wraps successful saves.
  queueMicrotask(()=>{
    let draft;try{draft=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');}catch{}
    const previousPanel=draft?.panels?.['panel-'+draft?.day];
    const hasPreviousWork=previousPanel?.inputs?.some(([id,value])=>/-s\d+-(reps|wt)$/.test(id)&&value)||previousPanel?.done?.some(([,state])=>state==='done');
    if(!draft?.day?.startsWith('hybrid-')&&!hasPreviousWork){
      document.querySelector('[data-day=hybrid-a]').click();
      document.querySelector('[data-tab=train]').click();
    }
    const save=window.saveWorkout;
    window.saveWorkout=function(key){save(key);refreshHybridPlan();};
    refreshHybridPlan();
  });
});
