/* Session-only additions share the normal logger and history. */
const EXTRA_LIBRARY = [...new Map([
  ...Object.entries(HC_VARIANTS).flatMap(([movement, variants]) => variants.map(v => ({...v, movement, equipment: v.name.startsWith('Barbell') ? 'Barbell' : /DB |Goblet|Weighted (Step|Bulgarian|Calf|Tibialis)/.test(v.name) ? 'Dumbbell' : /Cable/.test(v.name) ? 'Cable' : /Pulldown/.test(v.name) ? 'Machine' : /Band/.test(v.name) ? 'Band' : 'Bodyweight'}))),
  ...Object.entries(FREE_EXERCISES).flatMap(([equipment, names]) => names.map(name => {
    const title = equipment === 'Bodyweight' ? name : (equipment === 'Dumbbell' ? 'DB' : equipment) + ' ' + name;
    const unit = /Plank|Hold/.test(name) ? 'seconds' : 'reps';
    return {...hcV(title, unit === 'seconds' ? '20–40' : '8–12', ['Bodyweight','Band'].includes(equipment) ? 'bodyweight' : 'external', 'Intermediate', unit), movement:'extra', equipment};
  }))
].map(ex => [ex.name, ex])).values()];
hcState.extraWork ||= {};
function hcSyncExtras(key) {
  WORKOUTS[key].sections = WORKOUTS[key].sections.filter(s => s.name !== 'Additional exercises');
  const exercises = hcState.extraWork[key] || [];
  if (exercises.length) WORKOUTS[key].sections.push({name:'Additional exercises', exercises});
}
function hcRedrawExtras(key) {
  const panel = document.getElementById('panel-' + key);
  const inputs = Array.from(panel.querySelectorAll('input[id],select[id]'), el => [el.id, el.type === 'checkbox' ? el.checked : el.value]);
  const classes = Array.from(panel.querySelectorAll('.done[id],.exercise-card.open[id]'), el => [el.id, el.classList.contains('done') ? 'done' : 'open']);
  hcSyncExtras(key);
  renderWorkout(key);
  inputs.forEach(([id, value]) => {const el = document.getElementById(id); if(el) {if(el.type==='checkbox')el.checked=value; else el.value=value;}});
  classes.forEach(([id, cls]) => document.getElementById(id)?.classList.add(cls));
  mobileAccessibility(); refreshSessionControls(); persistDraft();
}
function hcClearExtras(key) {
  if (!hcStore({...hcState, extraWork:{...hcState.extraWork, [key]:[]}})) return;
  hcSyncExtras(key);
}
function hcRemoveExtra(key, id) {
  const card = document.getElementById('card-' + id);
  if (Array.from(card.querySelectorAll('input')).some(el => el.value) && !confirm('Remove this added exercise and its entered sets?')) return;
  if (!hcStore({...hcState, extraWork:{...hcState.extraWork, [key]:(hcState.extraWork[key] || []).filter(ex => ex.id !== id)}})) return;
  if(activeRestExId === id) stopRestTimer(id);
  hcRedrawExtras(key);
}
let extraSession = null, extraReturnFocus = null;
const extraDialog = document.createElement('dialog');
extraDialog.id='exerciseLibrary';
extraDialog.innerHTML=`<div class="library-heading"><div><small>YOUR SESSION</small><h2>Add an exercise</h2></div><button type="button" id="libraryClose" aria-label="Close exercise library">×</button></div><p class="backup-note">Optional extra work, saved with this session. Your next workout stays on plan.</p><label class="free-notes">Search exercises<input id="librarySearch" type="search" placeholder="Rows, curls, squats…" autocomplete="off"></label><div class="free-fields library-filters"><label>Equipment<select id="libraryEquipment"><option value="">All equipment</option>${FREE_EQUIPMENT.filter(x=>x!=='Other').map(x=>`<option>${x}</option>`).join('')}</select></label><label>Sets<select id="librarySets">${[1,2,3,4,5,6].map(n=>`<option ${n===3?'selected':''}>${n}</option>`).join('')}</select></label></div><p id="libraryCount" class="backup-note" role="status"></p><div id="libraryResults"></div>`;
document.body.append(extraDialog);
function hcLibraryResults() {
  const q=document.getElementById('librarySearch').value.toLowerCase().trim(), equipment=document.getElementById('libraryEquipment').value;
  const results=EXTRA_LIBRARY.map((ex,i)=>({ex,i})).filter(({ex})=>(!equipment||ex.equipment===equipment)&&ex.name.toLowerCase().includes(q));
  document.getElementById('libraryCount').textContent=results.length ? `${results.length} exercises · tap to add` : 'No matches. Try another name or equipment filter.';
  document.getElementById('libraryResults').innerHTML=results.map(({ex,i})=>`<button type="button" data-library-index="${i}"><span><strong>${escapeText(ex.name)}</strong><small>${ex.equipment} · ${ex.unit==='seconds'?'Timed hold':ex.loadKind==='bodyweight'?'Bodyweight':'Reps + weight'}</small></span><span aria-hidden="true">+</span></button>`).join('');
}
function hcOpenLibrary(key, button) {
  extraSession=key; extraReturnFocus=button;
  document.getElementById('librarySearch').value='';
  document.getElementById('libraryEquipment').value='';
  hcLibraryResults(); extraDialog.showModal();
}
document.getElementById('libraryClose').onclick=()=>extraDialog.close();
extraDialog.addEventListener('close',()=>extraReturnFocus?.focus());
document.getElementById('librarySearch').oninput=hcLibraryResults;
document.getElementById('libraryEquipment').onchange=hcLibraryResults;
document.getElementById('libraryResults').onclick=e=>{
  const button=e.target.closest('[data-library-index]'); if(!button)return;
  const selected=EXTRA_LIBRARY[Number(button.dataset.libraryIndex)], key=extraSession;
  const sets=Number(document.getElementById('librarySets').value);
  const id=key+'-Extra-'+crypto.randomUUID().replaceAll('-','');
  const ex={...selected, id, extra:true, sets, scheme:`${sets} sets · log your ${selected.unit==='seconds'?'seconds':'reps'}`};
  if(!hcStore({...hcState, extraWork:{...hcState.extraWork,[key]:[...(hcState.extraWork[key]||[]),ex]}}))return;
  hcRedrawExtras(key); extraDialog.close();
  document.getElementById('card-'+id).classList.add('open');
  document.getElementById('card-'+id).scrollIntoView({behavior:'smooth',block:'start'});
  persistDraft(); showToast(selected.name+' added');
};
HC_SESSIONS.forEach(({key})=>{
  hcSyncExtras(key);
  const button=document.createElement('button'); button.type='button';button.className='add-exercise-button';button.textContent='+ Add exercise';button.dataset.addExercise=key;
  button.onclick=()=>hcOpenLibrary(key,button);
  document.getElementById(key+'-exercises').after(button);
});
