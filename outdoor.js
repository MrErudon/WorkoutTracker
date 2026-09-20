// Foreground GPS only. Coordinates stay on device unless the user exports them.
const OUTDOOR_KEY = 'athleticOutdoorV1';
let outdoor = null, outdoorWatch = null, outdoorWake = null, outdoorAnchor = null;
let outdoorMessage = 'Ready when you are. GPS permission is requested when you start.';
function gpsDistance(a,b) {
  const rad=x=>x*Math.PI/180, dlat=rad(b.lat-a.lat),dlon=rad(b.lon-a.lon);
  const h=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlon/2)**2;
  return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));
}
function outdoorSeconds(now=Date.now()) {return outdoor ? outdoor.seconds+(outdoor.running?(now-outdoor.since)/1000:0):0;}
function outdoorClock(seconds) {const n=Math.max(0,Math.floor(seconds));return `${Math.floor(n/3600)?Math.floor(n/3600)+':':''}${String(Math.floor(n/60)%60).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;}
function outdoorCalories() {
  if(!outdoor)return 0;
  // Same approximate gross MET model as manual logs, using this session's fixed body/pack weight.
  const kg=outdoor.bodyLbs*0.453592, met=outdoor.kind==='ruck'?7.5*(1+outdoor.packLbs/outdoor.bodyLbs*.5):9;
  return Math.round(met*kg*outdoorSeconds()/3600);
}
function persistOutdoor() {
  try {if(outdoor)localStorage.setItem(OUTDOOR_KEY,JSON.stringify({...outdoor,seconds:outdoorSeconds(),since:Date.now()}));else localStorage.removeItem(OUTDOOR_KEY);return true;}
  catch {outdoorMessage='Device storage is full. Keep this page open and export your route before leaving.';return false;}
}
function drawOutdoor() {
  const el=document.getElementById('outdoor');if(!el)return;
  const seconds=outdoorSeconds(),miles=(outdoor?.meters||0)/1609.344;
  document.getElementById('gpsTime').textContent=outdoorClock(seconds);
  document.getElementById('gpsDistance').textContent=miles.toFixed(2);
  document.getElementById('gpsPace').textContent=miles>.01?outdoorClock(seconds/miles):'—';
  document.getElementById('gpsCalories').textContent=outdoor?outdoorCalories():'—';
  document.getElementById('gpsStatus').textContent=outdoorMessage;
  document.getElementById('gpsStart').textContent=outdoor?.running?'Pause':outdoor?'Resume GPS':'Start GPS';
  document.getElementById('gpsSave').disabled=!outdoor || seconds<1 || outdoor.points.length<2;
  document.getElementById('gpsDiscard').hidden=!outdoor;
  document.getElementById('gpsExport').hidden=!outdoor?.points.length;
  ['gpsKind','gpsBody','gpsPack'].forEach(id=>document.getElementById(id).disabled=!!outdoor);
  const svg=document.getElementById('gpsRoute');svg.replaceChildren();
  const points=outdoor?.points||[];
  if(points.length>1){
    const latitude=points[0].lat,cos=Math.cos(latitude*Math.PI/180);
    const xs=points.map(p=>p.lon*cos),ys=points.map(p=>-p.lat),minx=Math.min(...xs),miny=Math.min(...ys);
    const scale=240/Math.max(Math.max(...xs)-minx,Math.max(...ys)-miny,.00001);
    const groups=[];points.forEach((p,i)=>{if(!i||p.break)groups.push([]);groups.at(-1).push(`${30+(xs[i]-minx)*scale},${20+(ys[i]-miny)*scale}`);});
    groups.forEach(group=>{const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');line.setAttribute('points',group.join(' '));line.setAttribute('fill','none');line.setAttribute('stroke','#d5f58a');line.setAttribute('stroke-width','3');svg.append(line);});
  }
}
function acceptOutdoorPosition(position) {
  if(!outdoor?.running)return;
  const c=position.coords, p={lat:c.latitude,lon:c.longitude,accuracy:c.accuracy,time:position.timestamp};
  if(![p.lat,p.lon,p.accuracy,p.time].every(Number.isFinite)||Math.abs(p.lat)>90||Math.abs(p.lon)>180||p.accuracy<0||p.accuracy>40||p.time<Date.now()-15000||p.time>Date.now()+5000){outdoorMessage='Waiting for a more accurate GPS fix. Distance is not being added.';drawOutdoor();return;}
  let distance=0;
  if(outdoorAnchor){
    const dt=(p.time-outdoorAnchor.time)/1000;
    if(dt<=0)return;
    distance=gpsDistance(outdoorAnchor,p);
    if(dt>30){p.break=true;outdoor.gaps++;distance=0;}
    else if(distance/dt>(outdoor.kind==='ruck'?6:12)){outdoorMessage='GPS jump ignored. Waiting for a stable fix.';drawOutdoor();return;}
    else if(distance<Math.max(4,Math.min(p.accuracy,outdoorAnchor.accuracy)*.5))return;
  }else p.break=true;
  if(outdoor.points.length>=20000){pauseOutdoor('Route limit reached. Save this session to begin another.');return;}
  outdoor.meters+=distance;outdoor.points.push(p);outdoorAnchor=p;
  outdoorMessage=`GPS ±${Math.round(p.accuracy)} m · ${outdoorWake?'screen awake':'keep screen open'}${outdoor.gaps?' · route has gaps':''}`;
  persistOutdoor();drawOutdoor();
}
async function startOutdoor() {
  if(outdoor?.running){pauseOutdoor('Paused. Tap Resume GPS when you are ready.');return;}
  if(!navigator.geolocation){outdoorMessage='GPS is unavailable in this browser. Use the manual activity fields below.';drawOutdoor();return;}
  if(!outdoor){
    const body=Number(document.getElementById('gpsBody').value),kind=document.getElementById('gpsKind').value,pack=kind==='ruck'?Number(document.getElementById('gpsPack').value):0;
    if(!Number.isFinite(body)||body<50||body>700||!Number.isFinite(pack)||pack<0||pack>200){showToast('Enter body weight (50–700 lb) and pack weight (0–200 lb).');return;}
    outdoor={id:crypto.randomUUID(),kind,bodyLbs:body,packLbs:pack,started:new Date().toISOString(),seconds:0,since:Date.now(),running:false,meters:0,points:[],gaps:0};
  }
  outdoor.running=true;outdoor.since=Date.now();outdoorAnchor=null;
  if(!persistOutdoor()){outdoor.running=false;drawOutdoor();return;}
  outdoorMessage='Finding GPS. Allow precise location when prompted.';drawOutdoor();
  outdoorWatch=navigator.geolocation.watchPosition(acceptOutdoorPosition,error=>pauseOutdoor(error.code===1?'Location permission denied. Allow location in browser settings, then resume.':'GPS unavailable. Session paused; move outdoors and resume.'),{enableHighAccuracy:true,maximumAge:0,timeout:20000});
  try{const wake=await navigator.wakeLock?.request('screen');if(!outdoor?.running){await wake?.release();return;}outdoorWake=wake;wake?.addEventListener('release',()=>{outdoorWake=null;});}catch{/* GPS still works while this page remains visible. */}
}
function pauseOutdoor(message='Paused.') {
  if(outdoor?.running){outdoor.seconds=outdoorSeconds();outdoor.running=false;}
  if(outdoorWatch!==null){navigator.geolocation.clearWatch(outdoorWatch);outdoorWatch=null;}
  outdoorWake?.release();outdoorWake=null;outdoorAnchor=null;outdoorMessage=message;persistOutdoor();drawOutdoor();
}
function saveOutdoor() {
  if(!outdoor)return;
  pauseOutdoor('Paused. Saving session…');
  if(outdoor.seconds<1 || outdoor.points.length<2){outdoorMessage='Record at least two valid GPS points before saving, or use the manual log below.';drawOutdoor();return;}
  const miles=outdoor.meters/1609.344,calories=outdoorCalories();
  const entry={id:outdoor.id,type:'run',label:outdoor.kind==='ruck'?'GPS Ruck':'GPS Run',date:outdoor.started,durationMin:Math.round(outdoor.seconds/60*10)/10,calories,
    runData:{[outdoor.kind]:`${miles.toFixed(2)} mi · ${outdoorClock(outdoor.seconds)} tracked · ${miles>.01?outdoorClock(outdoor.seconds/miles)+'/mi':'pace unavailable'} · ~${calories} estimated gross kcal${outdoor.gaps?' · GPS gaps excluded':''}`},
    outdoor:{...outdoor,distanceMiles:miles,calorieMethod:'Approximate gross MET; no heart-rate, grade or terrain adjustment'}};
  try{const next=log.some(e=>e.id===entry.id)?log:[entry,...log];localStorage.setItem('trainingLog',JSON.stringify(next));log=next;}
  catch{outdoorMessage='Unable to save history. Export your route and free device storage, then retry.';drawOutdoor();return;}
  outdoor=null;persistOutdoor();renderLog();refreshProgress();updateStreakDisplay();drawOutdoor();showToast('GPS session saved to Progress.');
}
function exportRoute(index) {
  const route=index===undefined?outdoor:log[index]?.outdoor;if(!route?.points.length){showToast('No GPS points to export.');return;}
  const groups=[];route.points.forEach(p=>{if(!groups.length||p.break)groups.push([]);groups.at(-1).push(`<trkpt lat="${p.lat}" lon="${p.lon}"><time>${new Date(p.time).toISOString()}</time></trkpt>`);});
  const xml=`<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="Athletic Tracker" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>${route.kind==='ruck'?'Ruck':'Run'}</name>${groups.map(g=>'<trkseg>'+g.join('')+'</trkseg>').join('')}</trk></gpx>`;
  const url=URL.createObjectURL(new Blob([xml],{type:'application/gpx+xml'})),a=document.createElement('a');a.href=url;a.download=`athletic-${route.kind}-${route.started.slice(0,10)}.gpx`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
document.addEventListener('DOMContentLoaded',()=>{
  const section=document.createElement('section');section.id='outdoor';section.className='outdoor-card';section.innerHTML=`<div class="brand-eyebrow">OUTDOOR SESSION</div><h2>Go the distance.</h2><p class="backup-note">Run or ruck with GPS. Keep this page visible: switching apps or locking the phone pauses tracking. Routes stay on this device.</p>
  <div class="outdoor-settings"><label>Activity<select id="gpsKind"><option value="ruck">Ruck</option><option value="run">Run</option></select></label><label>Body weight · lb<input id="gpsBody" type="number" min="50" max="700" inputmode="decimal"></label><label>Pack weight · lb<input id="gpsPack" type="number" value="25" min="0" max="200" inputmode="decimal"></label></div>
  <div class="outdoor-metrics"><div><small>TRACKED TIME</small><strong id="gpsTime">00:00</strong></div><div><small>DISTANCE · MI</small><strong id="gpsDistance">0.00</strong></div><div><small>AVG PACE · /MI</small><strong id="gpsPace">—</strong></div><div><small>EST. GROSS KCAL</small><strong id="gpsCalories">—</strong></div></div>
  <svg id="gpsRoute" viewBox="0 0 300 280" role="img" aria-label="Recorded route outline; north up, gaps are not connected"></svg><p id="gpsStatus" class="backup-note" role="status"></p>
  <div class="outdoor-actions"><button id="gpsStart" onclick="startOutdoor()">Start GPS</button><button id="gpsSave" onclick="saveOutdoor()" disabled>Finish & save</button></div><button id="gpsExport" class="backup-button" onclick="exportRoute()" hidden>Export current GPX</button><button id="gpsDiscard" class="backup-button" hidden>Discard session</button>
  <details><summary>About calorie estimates</summary><p class="backup-note">Approximate gross calories, including resting energy, based on tracked time, body weight and a pack-load adjustment. Not heart-rate measured. Terrain, grade and individual efficiency are not measured.</p></details>`;
  document.querySelector('#panel-run .workout-header').after(section);document.getElementById('gpsBody').value=goals.weight||210;
  document.getElementById('gpsKind').onchange=()=>{document.getElementById('gpsPack').closest('label').hidden=document.getElementById('gpsKind').value==='run';};
  document.getElementById('gpsDiscard').onclick=()=>{if(confirm('Discard this unsaved GPS session?')){pauseOutdoor();outdoor=null;persistOutdoor();drawOutdoor();}};
  try{outdoor=JSON.parse(localStorage.getItem(OUTDOOR_KEY)||'null');if(outdoor&&(!Array.isArray(outdoor.points)||!Number.isFinite(outdoor.seconds)||!Number.isFinite(outdoor.meters)))outdoor=null;}catch{outdoor=null;}
  if(outdoor){outdoor.running=false;document.getElementById('gpsKind').value=outdoor.kind;document.getElementById('gpsBody').value=outdoor.bodyLbs;document.getElementById('gpsPack').value=outdoor.packLbs;outdoorMessage='Saved session recovered and paused. Resume to continue GPS tracking.';}
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&outdoor?.running)pauseOutdoor('Paused because the app was hidden or locked. Resume GPS to continue.');});
  window.addEventListener('pagehide',()=>{if(outdoor?.running)pauseOutdoor('Paused when the page closed.');});
  setInterval(()=>{if(outdoor?.running){persistOutdoor();drawOutdoor();}},1000);drawOutdoor();
});
