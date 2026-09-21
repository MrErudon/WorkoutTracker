/* Independent workouts share history, but never advance the Hybrid rotation. */
const FREE_KEY='athleticFreeWorkoutV1';
const FREE_EQUIPMENT=['Dumbbell','Barbell','Cable','Machine','Kettlebell','Bodyweight','Band','Other'];
const FREE_EXERCISES={
  Dumbbell:['Bench Press','Incline Press','Overhead Press','Row','Goblet Squat','Romanian Deadlift','Lunge','Split Squat','Lateral Raise','Hammer Curl','Biceps Curl','Triceps Extension','Calf Raise'],
  Barbell:['Back Squat','Front Squat','Deadlift','Romanian Deadlift','Bench Press','Overhead Press','Row','Hip Thrust','Biceps Curl'],
  Cable:['Row','Lat Pulldown','Face Pull','Chest Fly','Lateral Raise','Triceps Pushdown','Hammer Curl','Pallof Press'],
  Machine:['Chest Press','Shoulder Press','Row','Lat Pulldown','Leg Press','Hack Squat','Leg Extension','Leg Curl','Calf Raise'],
  Kettlebell:['Swing','Goblet Squat','Deadlift','Press','Row','Turkish Get-Up'],
  Bodyweight:['Push-Up','Pull-Up','Chin-Up','Dip','Squat','Lunge','Frog Crunches','Dead Bug','Side Plank','Plank','Glute Bridge','Bird Dog'],
  Band:['Pull-Apart','Row','Face Pull','Press','Biceps Curl','Triceps Extension'],Other:[]
};
function freshFreeWorkout(){return {id:crypto.randomUUID(),date:new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16),title:'',minutes:'',notes:'',exercises:[]};}
let freeWorkout;
try{freeWorkout=JSON.parse(localStorage.getItem(FREE_KEY)||'null');}catch{}
if(!freeWorkout||!Array.isArray(freeWorkout.exercises))freeWorkout=freshFreeWorkout();
if(log.some(e=>e.id===freeWorkout.id))freeWorkout=freshFreeWorkout();
const freeTab=document.createElement('div');freeTab.className='tab';freeTab.dataset.tab='free';freeTab.textContent='Log';
document.querySelector('[data-tab=run]').after(freeTab);
const freePanel=document.createElement('div');freePanel.className='panel';freePanel.id='panel-free';
freePanel.innerHTML=`<div class="workout-header"><div><div class="workout-title">Log a workout</div><div class="workout-subtitle">Train your way · outside the program</div></div></div>
<div class="free-fields"><label>Workout name<input id="freeTitle" maxlength="80" placeholder="Evening gym session"></label><label>When<input id="freeDate" type="datetime-local"></label><label>Duration · minutes (optional)<input id="freeMinutes" type="number" min="1" max="1440" inputmode="numeric"></label></div>
<div class="hybrid-note"><b>Add an exercise</b><p>Choose the equipment, then search or type your own exercise. Equipment is recorded per exercise.</p><div class="free-fields"><label>Equipment<select id="freeEquipment">${FREE_EQUIPMENT.map(x=>`<option>${x}</option>`).join('')}</select></label><label>Exercise<input id="freeName" list="freeSuggestions" maxlength="80" placeholder="Search or enter a custom exercise" autocomplete="off"><datalist id="freeSuggestions"></datalist></label></div><button type="button" id="freeAdd">Add exercise</button></div>
<div id="freeExercises"></div><label class="free-notes">Session notes (optional)<textarea id="freeNotes" maxlength="1000" rows="3" placeholder="How it felt, substitutions, anything to remember"></textarea></label><p class="backup-note">Use weight per dumbbell, or total weight for a barbell/machine. Leave weight blank for unweighted sets. For holds, switch Reps to Seconds.</p><div class="save-bar"><button class="save-btn" id="freeSave">Save workout</button></div><button class="backup-button" id="freeDiscard">Discard draft</button><p id="freeStatus" class="backup-note" role="status"></p>`;
document.querySelector('main').append(freePanel);
function persistFree(){try{localStorage.setItem(FREE_KEY,JSON.stringify(freeWorkout));document.getElementById('freeStatus').textContent='Draft saved on this device';}catch{document.getElementById('freeStatus').textContent='Unable to save draft. Keep this page open.';}}
function freeSuggestions(){
 const equipment=document.getElementById('freeEquipment').value;
 const previous=log.flatMap(e=>(e.sets||[]).filter(ex=>ex.equipment===equipment&&ex.baseName).map(ex=>ex.baseName));
 document.getElementById('freeSuggestions').innerHTML=[...new Set([...FREE_EXERCISES[equipment],...previous])].map(x=>`<option value="${escapeText(x)}"></option>`).join('');
}
function drawFree(){
 document.getElementById('freeTitle').value=freeWorkout.title;document.getElementById('freeDate').value=freeWorkout.date;document.getElementById('freeMinutes').value=freeWorkout.minutes;document.getElementById('freeNotes').value=freeWorkout.notes;
 document.getElementById('freeExercises').innerHTML=freeWorkout.exercises.map((ex,i)=>`<section class="free-exercise"><div class="free-heading"><div><h3>${escapeText(ex.name)}</h3><small>${escapeText(ex.equipment)}</small></div><button type="button" data-remove="${i}" aria-label="Remove ${escapeText(ex.name)}">Remove</button></div><label class="free-unit">Measure<select data-unit="${i}"><option value="reps" ${ex.unit==='reps'?'selected':''}>Reps</option><option value="seconds" ${ex.unit==='seconds'?'selected':''}>Seconds</option></select></label><div class="free-sets"><span>Set</span><span>${ex.unit==='seconds'?'Seconds':'Reps'}</span><span>Weight · lb</span><span></span>${ex.sets.map((s,j)=>`<span>${j+1}</span><input type="number" min="0" step="1" aria-label="${escapeText(ex.name)} set ${j+1} ${ex.unit}" data-ex="${i}" data-set="${j}" data-field="reps" value="${escapeText(s.reps)}"><input type="number" min="0" step="0.5" aria-label="${escapeText(ex.name)} set ${j+1} weight" data-ex="${i}" data-set="${j}" data-field="wt" value="${escapeText(s.wt)}"><button type="button" data-drop="${i}" data-set="${j}" aria-label="Remove set ${j+1}">×</button>`).join('')}</div><button type="button" class="backup-button" data-add-set="${i}">+ Add set</button></section>`).join('')||'<p class="backup-note">Add your first exercise to begin. Mix equipment freely.</p>';
}
function saveFreeWorkout(){
 if(log.some(e=>e.id===freeWorkout.id))return;
 const date=new Date(freeWorkout.date),duration=Number(freeWorkout.minutes);
 if(!Number.isFinite(date.getTime())||date.getTime()>Date.now()+60000){showToast('Choose a valid workout time, today or earlier.');return;}
 if(freeWorkout.minutes&&(!Number.isFinite(duration)||duration<=0||duration>1440)){showToast('Enter a duration from 1 to 1440 minutes.');return;}
 const sets=[];
 for(const ex of freeWorkout.exercises){
  const entered=ex.sets.filter(s=>s.reps!==''||s.wt!=='');
  if(!entered.length){showToast(`Enter a set for ${ex.name}, or remove the exercise.`);return;}
  if(entered.some(s=>!Number.isFinite(Number(s.reps))||Number(s.reps)<=0||!Number.isInteger(Number(s.reps))||!Number.isFinite(Number(s.wt))||Number(s.wt)<0)){showToast('Each entered set needs positive whole reps/seconds and a valid nonnegative weight.');return;}
  sets.push({exercise:`${ex.name} · ${ex.equipment}`,baseName:ex.name,equipment:ex.equipment,unit:ex.unit,sets:entered.map((s,i)=>({s:i+1,reps:s.reps,wt:s.wt,done:true})),totalVol:ex.unit==='seconds'?null:entered.reduce((sum,s)=>sum+Number(s.reps)*Number(s.wt),0)});
 }
 if(!sets.length){showToast('Add at least one exercise and log a set.');return;}
 const entry={id:freeWorkout.id,type:'free',source:'manual',label:freeWorkout.title.trim()||'Independent workout',date:date.toISOString(),durationMin:duration||null,notes:freeWorkout.notes.trim(),sets};
 const next=[entry,...log].sort((a,b)=>new Date(b.date)-new Date(a.date));
 try{localStorage.setItem('trainingLog',JSON.stringify(next));}catch{showToast('Unable to save workout. Your draft is still here.');return;}
 log=next;freeWorkout=freshFreeWorkout();persistFree();drawFree();freeSuggestions();renderLog();refreshProgress();updateStreakDisplay();showToast('Workout saved ✓');
}
document.addEventListener('DOMContentLoaded',()=>{
 drawFree();freeSuggestions();
 document.getElementById('freeEquipment').onchange=freeSuggestions;
 document.getElementById('freeAdd').onclick=()=>{const input=document.getElementById('freeName'),name=input.value.trim();if(!name){input.focus();return;}freeWorkout.exercises.push({name,equipment:document.getElementById('freeEquipment').value,unit:'reps',sets:[{reps:'',wt:''},{reps:'',wt:''},{reps:'',wt:''}]});input.value='';persistFree();drawFree();};
 freePanel.addEventListener('input',e=>{const el=e.target;if(el.dataset.field){freeWorkout.exercises[Number(el.dataset.ex)].sets[Number(el.dataset.set)][el.dataset.field]=el.value;}else{const field={freeTitle:'title',freeDate:'date',freeMinutes:'minutes',freeNotes:'notes'}[el.id];if(!field)return;freeWorkout[field]=el.value;}persistFree();});
 freePanel.addEventListener('change',e=>{if(e.target.dataset.unit!==undefined){freeWorkout.exercises[Number(e.target.dataset.unit)].unit=e.target.value;persistFree();drawFree();}});
 freePanel.addEventListener('click',e=>{const el=e.target.closest('button');if(!el)return;const d=el.dataset;
  if(d.remove!==undefined){if(!confirm('Remove this exercise and its entered sets?'))return;freeWorkout.exercises.splice(Number(d.remove),1);}
  else if(d.addSet!==undefined)freeWorkout.exercises[Number(d.addSet)].sets.push({reps:'',wt:''});
  else if(d.drop!==undefined){const rows=freeWorkout.exercises[Number(d.drop)].sets;if((rows[Number(d.set)].reps||rows[Number(d.set)].wt)&&!confirm('Remove this entered set?'))return;rows.splice(Number(d.set),1);}
  else return;persistFree();drawFree();
 });
 document.getElementById('freeSave').onclick=saveFreeWorkout;
 document.getElementById('freeDiscard').onclick=()=>{if(confirm('Discard this unsaved workout?')){freeWorkout=freshFreeWorkout();persistFree();drawFree();}};
});
