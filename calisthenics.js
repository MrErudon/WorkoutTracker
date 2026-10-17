/* Additive schema: old Hybrid IDs, drafts, PRs and logs keep their meaning. */
const HC_KEY = "athleticCalisthenicsV1";
const hcWasInstalled = !!localStorage.getItem(HC_KEY);
let hcPriorDraft;
try {
  hcPriorDraft = JSON.parse(localStorage.getItem("athleticDraftV2") || "null");
} catch {}
let hcState;
try {
  hcState = JSON.parse(localStorage.getItem(HC_KEY) || "null");
} catch {}
if (!hcState || hcState.version !== 1)
  hcState = {
    version: 1,
    maxima: { pull: 6, dip: 10, push: null },
    benchmarks: [
      {
        kind: "pull",
        value: 6,
        date: "2026-10-17",
        source: "User-reported strict max · approximately",
      },
      {
        kind: "dip",
        value: 10,
        date: "2026-10-17",
        source: "User-reported parallel bars · approximately 9–11",
      },
    ],
    choices: {},
    equipment: {},
    frequency: 3,
    minutes: 45,
  };
hcState.equipment ||= {};
hcState.frequency ||= 3;
hcState.minutes ||= 45;
function hcStore(next) {
  try {
    localStorage.setItem(HC_KEY, JSON.stringify(next));
    hcState = next;
    return true;
  } catch {
    showToast("Unable to save. Your current workout is still here.");
    return false;
  }
}
function hcBodyweight() {
  const weights = Object.entries(raceState.readiness)
    .filter(([d, r]) => d <= raceDayKey() && Number(r.weight) > 0)
    .sort(([a], [b]) => b.localeCompare(a));
  return weights.length ? Number(weights[0][1].weight) : null;
}
function hcV(
  name,
  range,
  loadKind = "bodyweight",
  level = "Intermediate",
  unit = "reps",
) {
  return {
    name,
    range,
    loadKind,
    level,
    unit,
    variant: name,
    hasWeight: loadKind !== "bodyweight",
  };
}
const HC_VARIANTS = {
  pull: [
    hcV("Assisted Pull-Up", "5–8", "assistance", "Beginner"),
    hcV("Strict Pull-Up", "3–4"),
    hcV("Higher-Volume Strict Pull-Up", "5–8"),
    hcV("Weighted Pull-Up", "3–6", "added", "Advanced"),
    hcV("Band Pulldown", "10–15", "bodyweight", "Beginner"),
    hcV("Lat Pulldown", "8–12", "external"),
    hcV("DB Supported Row", "8–12/side", "external"),
    hcV("Inverted Row", "6–12"),
  ],
  dip: [
    hcV("Assisted Parallel-Bar Dip", "6–10", "assistance", "Beginner"),
    hcV("Parallel-Bar Dip", "5–7"),
    hcV("Higher-Volume Parallel-Bar Dip", "8–12"),
    hcV("Weighted Parallel-Bar Dip", "4–8", "added", "Advanced"),
    hcV("Close-Grip Push-Up", "6–12"),
    hcV("DB Floor Press", "8–12", "external"),
  ],
  push: [
    hcV("Incline Push-Up", "8–12", "bodyweight", "Beginner"),
    hcV("Standard Push-Up", "6–12"),
    hcV("Close-Grip Push-Up", "6–12"),
    hcV("Decline Push-Up", "6–12", "bodyweight", "Advanced"),
    hcV("Weighted Push-Up", "6–10", "added", "Advanced"),
    hcV("DB Bench Press", "8–12", "external"),
  ],
  row: [
    hcV("Supported Bodyweight Row", "8–12", "bodyweight", "Beginner"),
    hcV("Inverted Row", "6–12"),
    hcV("Feet-Elevated Inverted Row", "6–12", "bodyweight", "Advanced"),
    hcV("DB Supported Row", "8–12/side", "external"),
    hcV("Band Row", "10–15", "bodyweight", "Beginner"),
    hcV("Prone Pull-Down", "10–15", "bodyweight", "Beginner"),
    hcV("Seated Cable Row", "8–12", "external"),
  ],
  press: [
    hcV("Elevated Pike Push-Up", "6–10", "bodyweight", "Beginner"),
    hcV("Pike Push-Up", "5–10"),
    hcV("Feet-Elevated Pike Push-Up", "4–8", "bodyweight", "Advanced"),
    hcV("DB Overhead Press", "6–10", "external"),
  ],
  frog: [
    hcV("Frog Crunches", "12–20", "bodyweight", "Beginner"),
    hcV("Hollow-Body Hold", "20–40", "bodyweight", "Intermediate", "seconds"),
    hcV("Hanging Knee Raise", "6–12"),
    hcV("Controlled Hanging Leg Raise", "6–10", "bodyweight", "Advanced"),
  ],
  split: [
    hcV("Supported Split Squat", "8–10/leg", "bodyweight", "Beginner"),
    hcV("Bodyweight Bulgarian Split Squat", "6–10/leg"),
    hcV("Weighted Bulgarian Split Squat", "6–10/leg", "external", "Advanced"),
  ],
  hinge: [
    hcV("Bodyweight Hip Hinge", "10–12", "bodyweight", "Beginner"),
    hcV("DB Romanian Deadlift", "6–10", "external"),
    hcV("Barbell Romanian Deadlift", "6–10", "external", "Advanced"),
  ],
  step: [
    hcV("Low Step-Up", "8–10/leg", "bodyweight", "Beginner"),
    hcV("Reverse Lunge", "8–10/leg"),
    hcV("Weighted Step-Up", "8–10/leg", "external", "Advanced"),
  ],
  calf: [
    hcV("Standing Calf Raise", "12–20", "bodyweight", "Beginner"),
    hcV("Single-Leg Calf Raise", "10–15/leg"),
    hcV("Weighted Calf Raise", "10–15", "external", "Advanced"),
  ],
  tib: [
    hcV("Wall Tibialis Raise", "12–20", "bodyweight", "Beginner"),
    hcV("Controlled Low Step-Down", "6–10/leg"),
    hcV("Weighted Tibialis Raise", "12–20", "external", "Advanced"),
  ],
  knee: [
    hcV("Reverse Crunch", "10–15", "bodyweight", "Beginner"),
    hcV("Hanging Knee Raise", "6–12"),
    hcV("Hanging Leg Raise", "6–10", "bodyweight", "Advanced"),
  ],
  chin: [
    hcV("Assisted Chin-Up", "5–8", "assistance", "Beginner"),
    hcV("Strict Chin-Up", "3–5"),
    hcV("Weighted Chin-Up", "3–6", "added", "Advanced"),
    hcV("Band Pulldown", "10–15", "bodyweight", "Beginner"),
    hcV("Lat Pulldown", "8–12", "external"),
    hcV("DB Supported Row", "8–12/side", "external"),
  ],
  squat: [
    hcV("Supported Bodyweight Squat", "8–12", "bodyweight", "Beginner"),
    hcV("Bodyweight Squat", "10–15"),
    hcV("Goblet Squat", "8–12", "external", "Advanced"),
    hcV("Heel-Elevated Goblet Squat", "8–10", "external"),
    hcV("Slant-Board Bodyweight Squat", "6–10"),
  ],
  hollow: [
    hcV("Tucked Hollow Hold", "15–25", "bodyweight", "Beginner", "seconds"),
    hcV("Hollow-Body Hold", "20–40", "bodyweight", "Intermediate", "seconds"),
    hcV("Hanging Knee Raise", "6–12", "bodyweight", "Advanced"),
  ],
  mobility: [hcV("Hip 90/90 Switch", "6–8/side", "bodyweight", "Beginner")],
  bird: [hcV("Bird Dog", "6–8/side", "bodyweight", "Beginner")],
  rotation: [hcV("Thoracic Rotation", "6–8/side", "bodyweight", "Beginner")],
  hang: [
    hcV("Supported Active Hang", "10–20", "bodyweight", "Beginner", "seconds"),
    hcV("Active Hang", "15–30", "bodyweight", "Intermediate", "seconds"),
  ],
};
function hcRecommended(movement) {
  const n = hcState.maxima[movement];
  if (["pull", "dip"].includes(movement)) return n !== null && n >= 5 ? 1 : 0;
  if (movement === "push") return n !== null && n >= 15 ? 1 : 0;
  return ["hinge", "row", "chin", "press", "hollow", "knee"].includes(movement)
    ? 1
    : 0;
}
function hcExercise(movement, sets) {
  const v =
    HC_VARIANTS[movement][hcRecommended(movement)] || HC_VARIANTS[movement][0];
  return {
    ...v,
    movement,
    sets,
    scheme: `${sets} × ${v.range}${v.unit === "seconds" ? " sec" : ""}`,
    variants: HC_VARIANTS[movement],
  };
}
const HC_PRESETS = {
  default: ["Pull-up bar", "Dip station", "Dumbbells", "Bench"],
  "Commercial Gym": [
    "Pull-up bar",
    "Dip station",
    "Dumbbells",
    "Bench",
    "Cables",
    "Machines",
    "Bands",
  ],
  "Minimal Equipment": ["Bands"],
  "Bodyweight Only": [],
};
const HC_SESSIONS = [
  {
    key: "hc-a",
    title: "Upper Body Strength",
    focus: "Strict reps · controlled push & pull",
    exercises: [
      ["pull", 3],
      ["dip", 3],
      ["push", 3],
      ["row", 3],
      ["press", 2],
      ["frog", 3],
    ],
  },
  {
    key: "hc-b",
    title: "Legs & Stability",
    focus: "Single-leg strength · hinge · joint control",
    exercises: [
      ["split", 3],
      ["hinge", 3],
      ["step", 2],
      ["calf", 3],
      ["tib", 2],
      ["knee", 3],
    ],
  },
  {
    key: "hc-c",
    title: "Full Body Athletic",
    focus: "Relative strength · movement quality",
    exercises: [
      ["chin", 3],
      ["push", 3],
      ["squat", 3],
      ["row", 3],
      ["hollow", 3],
      ["frog", 3],
    ],
  },
  {
    key: "hc-d",
    title: "Recovery / Skills",
    focus: "Easy technique · mobility · finish fresh",
    exercises: [
      ["mobility", 2],
      ["bird", 2],
      ["rotation", 2],
      ["hang", 2],
      ["push", 1],
      ["hollow", 1],
    ],
  },
];
// Keep both previous plans and their resumable sessions accessible.
Array.from(hybridNav.children).forEach((el) => {
  el.classList.remove("active");
  legacy.append(el);
});
const oldOverview = document.querySelector(".hybrid-overview");
const oldDetails = document.createElement("details");
oldDetails.className = "hc-previous-overview";
oldDetails.innerHTML = "<summary>Previous Hybrid overview</summary>";
oldOverview.replaceWith(oldDetails);
oldDetails.append(oldOverview);
const hcOverview = document.createElement("section");
hcOverview.className = "hybrid-overview";
hcOverview.innerHTML = `<div class="hybrid-eyebrow">TODAY · YOUR PERSONAL TRAINING PLAN</div><h2>Hybrid Calisthenics</h2><p>Strong at your bodyweight. Faster over two miles.</p><div id="hcNext"></div><div id="hcTodayRun" class="hybrid-note"></div><details><summary>Plan & progression</summary><p>A → B → C, ideally with recovery days between strength sessions. D is optional and does not advance the rotation. Aim for 45 minutes: 5-minute warm-up, 35 minutes strength, 5 minutes easy movement. Alternate push/pull exercises when useful; allow 90–120 seconds between hard sets and 45–60 seconds for core.</p><p>Leave about two clean reps in reserve. Pull-ups start at 3–4 reps; dips at 5–7. Reduce reps or use assistance as fatigue builds. Prioritize more total strict repetitions before external load. After two separate successful sessions at the top of every set range, consider the smallest progression yourself. Difficulty never changes automatically.</p><p>Use a stable bar or dip station only where available. Without a bar, use pulldowns, supported dumbbell rows or a safely supported inverted row. Without parallel bars, use close-grip push-ups or dumbbell pressing. Bench dips are not a dip-strength benchmark. Each variation has its own history.</p><p>Use the Speed schedule to place intervals away from leg training. Easy walking after strength is always an option. Recovery / Skills stays light.</p></details><details><summary>Starting abilities & check-ins</summary><p>Starting benchmarks: about 6 strict pull-ups and 9–11 parallel-bar dips, reported October 17. Push-up max is untested. Recommendations are suggestions; the exercise selector always overrides them.</p><div class="free-fields">${[
  ["pull", "Strict pull-ups"],
  ["dip", "Parallel-bar dips"],
  ["push", "Strict push-ups"],
]
  .map(
    ([k, label]) =>
      `<label>${label}<input id="hc-max-${k}" type="number" min="0" max="500" step="1" value="${hcState.maxima[k] ?? ""}" placeholder="Not established"></label>`,
  )
  .join(
    "",
  )}<label>Test date<input id="hcTestDate" type="date"></label></div><div class="free-fields"><label>Sessions weekly<input id="hcFrequency" type="number" min="3" max="4" value="${hcState.frequency}"></label><label>Strength minutes<input id="hcMinutes" type="number" min="15" max="120" value="${hcState.minutes}"></label></div><label class="hc-equipment"><input id="hcMaxVerified" type="checkbox">These were measured strict max tests</label><button type="button" id="hcSaveMax">Save abilities & preferences</button><p id="hcRecommendations" class="backup-note"></p></details>`;
document.getElementById("dayCategorySubnav").prepend(hcOverview);
HC_SESSIONS.forEach((s, i) => {
  WORKOUTS[s.key] = {
    label: "Hybrid Calisthenics · " + s.title,
    sections: [
      {
        name: "Strength",
        exercises: s.exercises.map(([m, n]) => hcExercise(m, n)),
      },
    ],
  };
  WORKOUTS[s.key].sections[0].exercises.forEach((ex, j) => {
    const slot = s.key + "-Strength-" + j;
    hcState.choices[slot] ||= ex.variant;
    const choice = hcState.choices[slot];
    const v = ex.variants.find((v) => v.variant === choice);
    if (v)
      Object.assign(ex, v, {
        scheme: `${ex.sets} × ${v.range}${v.unit === "seconds" ? " sec" : ""}`,
      });
  });
  const tab = document.createElement("div");
  tab.className = "day-tab" + (i === 0 ? " active" : "");
  tab.dataset.day = s.key;
  tab.textContent = ["A · Upper", "B · Legs", "C · Athletic", "D · Optional"][
    i
  ];
  hybridNav.append(tab);
  const p = document.createElement("div");
  p.className = "panel";
  p.id = "panel-" + s.key;
  p.innerHTML = `<div class="workout-header"><div><div class="workout-title">${s.title}</div><div class="workout-subtitle">${s.focus} · ${i === 3 ? "15–25 min easy" : "~45 min"}</div></div><div class="equip-mode-wrap"><label class="equip-mode-label" for="equip-${s.key}">Mode</label><select id="equip-${s.key}" class="equip-mode-select"><option value="default">Home / Hotel</option><option>Commercial Gym</option><option>Minimal Equipment</option><option>Bodyweight Only</option></select></div></div><p class="race-warning" id="hcTiming-${s.key}"></p>${hcEquipmentHTML(s.key)}<div class="session-timer" id="timer-${s.key}">0:00</div><div class="hybrid-note"><b>Prepare · 5 minutes</b><p>Easy walking, shoulder and hip movement, then light practice sets. ${i === 3 ? "Stay well short of fatigue; use the easiest variation." : "Use controlled reps and leave two good reps in reserve."}</p></div>${i === 1 ? '<details class="hybrid-note"><summary>Optional slant-board work</summary><p>Swap the Full Body squat for heel-elevated or slant-board squats. Start with bodyweight, comfortable depth and 1–2 easy sets; replace existing squat volume. Build depth, load or sets one at a time after recovery is consistently good. Keep new knee loading away from hard running.</p></details>' : ""}<div id="${s.key}-exercises"></div><div class="hybrid-note"><b>Then walk or run, if recovered</b><p>Keep easy days conversational. Check Speed before adding hard running after legs.</p><button type="button" onclick="document.querySelector('[data-tab=speed]').click()">Open running plan</button></div>${hcFeedbackHTML(s.key)}<div id="hc-summary-${s.key}" class="hybrid-note" hidden role="status"></div><div class="save-bar"><button class="save-btn" onclick="saveWorkout('${s.key}')">Finish ${s.title}</button></div>`;
  document.querySelector("main").append(p);
});
function hcVariantControl(id, base, ex) {
  return `<div class="hc-variant"><label for="variant-${id}">Variation / equipment</label><select id="variant-${id}" onchange="hcChangeVariant('${id}',this)">${base.variants.map((v, i) => `<option value="${i}" ${v.variant === ex.variant ? "selected" : ""}>${v.level} · ${v.name}${hcAvailable(v.name, id.slice(0, 4)) ? "" : " · equipment needed"}</option>`).join("")}</select><p class="backup-note">${ex.movement === "push" && hcState.maxima.push === null ? "Push-up maximum untested. Start with comfortable technique sets; establish a clean max when recovered before pursuing progression targets. " : ""}${ex.movement === "dip" ? "Parallel-bar strength is tracked separately from pressing substitutes." : ex.movement === "pull" ? "Strict pull-ups are tracked separately from rows and pulldowns." : "Choose for today’s equipment. Your plan rotation stays the same."}</p></div>`;
}
function hcSetLogger(id, ex) {
  const last = getLastSessionData(ex.name),
    guidance = hcProgression(ex, id.slice(0, 4));
  return `<p class="hc-last">${last ? "Previous: " + last.map((s) => `${escapeText(s.reps || "—")}${ex.unit === "seconds" ? " sec" : " reps"}${s.wt ? " · " + escapeText(s.wt) + " lb " + ex.loadKind : ""}`).join(" / ") : "First session with this variation"}</p><details class="hc-progression"><summary>${guidance.startsWith("Two controlled") ? "Progression available" : "Progression guidance"}</summary><p>${guidance}</p></details><div class="sets-grid sets-grid-header"><span>Set</span><span>${ex.unit === "seconds" ? "Seconds" : "Reps"}</span><span>${ex.loadKind === "assistance" ? "Assist · lb" : ex.loadKind === "external" ? "Load · lb" : ex.loadKind === "added" ? "Added · lb" : "Bodyweight"}</span><span>Done</span></div>${Array.from(
    { length: ex.sets },
    (_, j) => {
      const n = j + 1,
        s = last?.find((s) => s.s === n);
      return `<div class="sets-grid-wrap"><div class="sets-grid"><span class="set-num">${n}</span><input class="set-input" type="number" min="1" step="1" id="${id}-s${n}-reps" placeholder="${escapeText(s?.reps || "—")}"><input class="set-input" type="number" min="0" step="0.5" id="${id}-s${n}-wt" placeholder="${escapeText(s?.wt || "—")}" ${ex.loadKind === "bodyweight" ? 'disabled aria-label="Bodyweight, no external load"' : ""}><button class="complete-btn" id="${id}-s${n}-done" onclick="toggleDone('${id}',${n},'${ex.name}',false)">✓</button></div><label class="hc-rir">Reps in reserve (optional)<input id="${id}-s${n}-rir" type="number" min="0" max="10" step="1" placeholder="0–10"></label></div>`;
    },
  ).join("")}`;
}
function hcProgression(
  ex,
  key = document.querySelector(".day-tab.active")?.dataset.day,
) {
  const seenDates = new Set();
  const sessions = log
      .filter((e) => e.type?.startsWith("hc-"))
      .map((e) => ({
        entry: e,
        exercise: e.sets?.find((x) => x.exercise === ex.name),
      }))
      .filter((x) => {
        if (!x.exercise) return false;
        const day = raceDayKey(new Date(x.entry.date));
        if (seenDates.has(day)) return false;
        seenDates.add(day);
        return true;
      })
      .slice(0, 2),
    top = Number(ex.range.match(/–(\d+)/)?.[1] || ex.range.match(/\d+/)?.[0]);
  const ready =
    sessions.length === 2 &&
    hcAvailable(ex.name, key) &&
    !["Heavy", "Sore"].includes(raceState.readiness[raceDayKey()]?.legs) &&
    sessions.every(
      ({ entry, exercise: e }) =>
        entry.feedback?.technique === "Controlled full range" &&
        ["Easy", "Moderate"].includes(entry.feedback?.difficulty) &&
        ["Fresh", "Normal"].includes(entry.feedback?.legs) &&
        e.sets.length >= ex.sets &&
        e.sets.every(
          (s) =>
            s.done &&
            Number(s.reps) >= top &&
            s.rir !== "" &&
            s.rir !== undefined &&
            Number(s.rir) >= 2,
        ),
    );
  if (ex.movement === "push" && hcState.maxima.push === null)
    return "Establish a clean push-up baseline first; choose a variation that leaves clean reps in reserve.";
  return ready
    ? "Two controlled sessions at the upper range with reserve and good recovery. Consider a small progression if equipment permits; choose it manually."
    : "Build clean repetitions first. Progress suggestions need two controlled sessions, ≥2 reps in reserve, moderate/easy difficulty and normal/fresh recovery. Pull-up milestone: 10 strict, then 12–15. Weighted work is optional.";
}
function hcGetExercise(id) {
  const [a, b, , index] = id.split("-"),
    key = a + "-" + b,
    base = WORKOUTS[key].sections[0].exercises[Number(index)];
  return { base, active: sessionSwaps[id] || base };
}
function hcValidateSet(id, n, allowPlaceholder = true) {
  const r = document.getElementById(`${id}-s${n}-reps`),
    w = document.getElementById(`${id}-s${n}-wt`),
    reps = Number(r.value || (allowPlaceholder ? r.placeholder : "")),
    wt =
      w.value ||
      (allowPlaceholder && w.placeholder !== "—" ? w.placeholder : "");
  const needsLoad = ["added", "external"].includes(
    hcGetExercise(id).active.loadKind,
  );
  if (
    !Number.isInteger(reps) ||
    reps < 1 ||
    reps > 1000 ||
    (needsLoad && !(Number(wt) > 0)) ||
    (wt !== "" &&
      (!Number.isFinite(Number(wt)) || Number(wt) < 0 || Number(wt) > 2000))
  ) {
    showToast(
      "Enter positive whole reps/seconds. Weighted exercises need a positive load; assistance can be zero.",
    );
    return false;
  }
  return true;
}
function hcChangeVariant(id, select) {
  const { base, active } = hcGetExercise(id),
    logger = document.getElementById("logger-" + id);
  const next = base.variants[Number(select.value)];
  if (!next) return;
  if (
    (logger.querySelector(".done") ||
      Array.from(logger.querySelectorAll("input")).some((x) => x.value)) &&
    !confirm(
      "Change this exercise and clear its entered sets? Other exercises and your plan stay saved.",
    )
  ) {
    select.value = base.variants.findIndex((v) => v.variant === active.variant);
    return;
  }
  if (
    !hcStore({
      ...hcState,
      choices: { ...hcState.choices, [id]: next.variant },
    })
  ) {
    select.value = base.variants.findIndex((v) => v.variant === active.variant);
    return;
  }
  sessionSwaps[id] = {
    ...base,
    ...next,
    scheme: `${base.sets} × ${next.range}${next.unit === "seconds" ? " sec" : ""}`,
  };
  stopRestTimer(id);
  document.getElementById("exname-" + id).textContent = next.name;
  document.getElementById("exscheme-" + id).textContent =
    sessionSwaps[id].scheme;
  logger.innerHTML = hcSetLogger(id, sessionSwaps[id]);
  mobileAccessibility();
  persistDraft();
  refreshSessionControls();
}
function hcRefresh() {
  HC_SESSIONS.forEach((session, i) => {
    if (i < 3)
      document.querySelector(
        "#panel-" + session.key + " .workout-subtitle",
      ).textContent = session.focus + " · ~" + hcState.minutes + " min";
  });
  const core = log.filter((e) => ["hc-a", "hc-b", "hc-c"].includes(e.type));
  const i = core.length
    ? (["hc-a", "hc-b", "hc-c"].indexOf(core[0].type) + 1) % 3
    : 0;
  document.getElementById("hcNext").innerHTML =
    `<button type="button" onclick="document.querySelector('[data-tab=train]').click();document.querySelector('[data-day=${HC_SESSIONS[i].key}]').click();document.getElementById('panel-${HC_SESSIONS[i].key}').scrollIntoView({behavior:'smooth'})">Next · ${HC_SESSIONS[i].title} →</button><p>${core.length} core sessions · ${Math.floor(core.length / 3)} rotations · ${hcState.frequency}/week · ~${hcState.minutes} min</p>`;
  document.getElementById("hcRecommendations").textContent =
    `Suggested: ${HC_VARIANTS.pull[hcRecommended("pull")].name}, ${HC_VARIANTS.dip[hcRecommended("dip")].name}, ${HC_VARIANTS.push[hcRecommended("push")].name}. Current selections stay under your control.`;
}
document.addEventListener("DOMContentLoaded", () => {
  hcStore(hcState);
  document.getElementById("hcTestDate").value = raceDayKey();
  document.getElementById("hcSaveMax").onclick = () => {
    const date = document.getElementById("hcTestDate").value,
      values = Object.fromEntries(
        ["pull", "dip", "push"].map((k) => [
          k,
          document.getElementById("hc-max-" + k).value,
        ]),
      );
    if (
      !Number.isFinite(raceDayNumber(date)) ||
      date > raceDayKey() ||
      Object.values(values).some(
        (v) =>
          v !== "" &&
          (!Number.isInteger(Number(v)) || Number(v) < 0 || Number(v) > 500),
      )
    ) {
      showToast("Check date and whole repetition counts (0–500).");
      return;
    }
    const frequency = Number(document.getElementById("hcFrequency").value),
      minutes = Number(document.getElementById("hcMinutes").value);
    if (
      ![3, 4].includes(frequency) ||
      !Number.isFinite(minutes) ||
      minutes < 15 ||
      minutes > 120
    ) {
      showToast("Use 3–4 sessions and 15–120 minutes.");
      return;
    }
    const maxima = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, v === "" ? null : Number(v)]),
    );
    const benchmarks = [
      ...hcState.benchmarks,
      ...Object.entries(maxima)
        .filter(([, v]) => v !== null)
        .map(([kind, value]) => ({
          kind,
          value,
          date,
          source: document.getElementById("hcMaxVerified").checked
            ? "Verified max test"
            : "User-entered baseline",
        })),
    ];
    if (hcStore({ ...hcState, maxima, benchmarks, frequency, minutes })) {
      hcRefresh();
      speedProgress();
      showToast("Abilities & preferences saved ✓");
    }
  };
  HC_SESSIONS.forEach(({ key }) => {
    const mode = document.getElementById("equip-" + key);
    mode.value = hcState.equipment[key]?.mode || "default";
    mode.onchange = () => {
      const available = HC_PRESETS[mode.value];
      if (
        hcStore({
          ...hcState,
          equipment: {
            ...hcState.equipment,
            [key]: { mode: mode.value, available },
          },
        })
      ) {
        document
          .querySelectorAll(`[data-hc-equipment="${key}"]`)
          .forEach((x) => (x.checked = available.includes(x.value)));
        hcEquipmentAdvice(key);
      }
    };
    document.querySelectorAll(`[data-hc-equipment="${key}"]`).forEach(
      (x) =>
        (x.onchange = () => {
          const available = Array.from(
            document.querySelectorAll(`[data-hc-equipment="${key}"]:checked`),
            (x) => x.value,
          );
          hcStore({
            ...hcState,
            equipment: {
              ...hcState.equipment,
              [key]: { mode: mode.value, available },
            },
          });
          hcEquipmentAdvice(key);
        }),
    );
    hcEquipmentAdvice(key);
    hcRecoveryWarning(
      key,
      document.getElementById("hcLegs-" + key).value ||
        raceState.readiness[raceDayKey()]?.legs,
    );
  });
  queueMicrotask(() => {
    // Existing drafts remain on their original plan. Fresh installs start here.
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    const priorPanel = hcPriorDraft?.panels?.["panel-" + hcPriorDraft?.day];
    const hasPriorWork =
      priorPanel?.inputs?.some(([id, v]) => /-s\d+-(reps|wt)$/.test(id) && v) ||
      priorPanel?.done?.some(([, cls]) => cls === "done");
    if (
      !hcPriorDraft?.day ||
      (!hcWasInstalled && !hasPriorWork && hcPriorDraft.tab === "train")
    ) {
      document.querySelector("[data-day=hc-a]").click();
      document.querySelector("[data-tab=train]").click();
    }
    const save = window.saveWorkout;
    window.saveWorkout = function (key) {
      if (!key.startsWith("hc-")) return save(key);
      const panel = document.getElementById("panel-" + key);
      for (const ex of panel.querySelectorAll(".set-logger")) {
        const id = ex.id.slice(7);
        for (const input of ex.querySelectorAll('[id$="-reps"]')) {
          const n = Number(input.id.match(/-s(\d+)-/)[1]),
            w = document.getElementById(`${id}-s${n}-wt`);
          if (
            (input.value ||
              w.value ||
              document
                .getElementById(`${id}-s${n}-done`)
                .classList.contains("done")) &&
            !hcValidateSet(id, n, false)
          )
            return;
        }
      }
      const rirs = Array.from(panel.querySelectorAll("[id$=-rir]"));
      if (
        rirs.some(
          (x) =>
            x.value !== "" &&
            (!Number.isInteger(Number(x.value)) ||
              Number(x.value) < 0 ||
              Number(x.value) > 10),
        )
      ) {
        showToast("Use reps in reserve from 0–10.");
        return;
      }
      const before = log.length;
      save(key);
      if (log.length > before) {
        const e = log[0],
          sets = e.sets.reduce(
            (n, x) => n + x.sets.filter((s) => s.done).length,
            0,
          ),
          reps = e.sets.reduce(
            (n, x) =>
              n +
              x.sets.reduce(
                (n, s) => n + (x.unit === "seconds" ? 0 : Number(s.reps) || 0),
                0,
              ),
            0,
          );
        const summary = document.getElementById("hc-summary-" + key);
        summary.hidden = false;
        summary.textContent = `Session saved · ${e.sets.length} exercises · ${sets} completed sets · ${reps} repetitions${e.durationMin ? " · " + e.durationMin + " min" : ""}. Next time: build clean reps before load.`;
        const opened = Array.from(
          panel.querySelectorAll(".exercise-card.open"),
          (el) => el.id,
        );
        renderWorkout(key);
        opened.forEach((id) =>
          document.getElementById(id)?.classList.add("open"),
        );
        mobileAccessibility();
        persistDraft();
        refreshSessionControls();
        hcRefresh();
        speedProgress();
      }
    };
    hcRefresh();
  });
});

function hcEquipmentHTML(key) {
  const available = hcState.equipment[key]?.available ||
    HC_PRESETS?.default || ["Pull-up bar", "Dip station", "Dumbbells", "Bench"];
  return `<details class="hybrid-note"><summary>Equipment available today</summary><div class="hc-equipment">${["Pull-up bar", "Dip station", "Dumbbells", "Bench", "Cables", "Machines", "Bands"].map((x) => `<label><input type="checkbox" value="${x}" data-hc-equipment="${key}" ${available.includes(x) ? "checked" : ""}>${x}</label>`).join("")}</div><p id="equipment-advice-${key}" class="backup-note"></p></details>`;
}
function hcAvailable(name, key) {
  const have = hcState.equipment[key]?.available || [
    "Pull-up bar",
    "Dip station",
    "Dumbbells",
    "Bench",
  ];
  if (/Band/.test(name)) return have.includes("Bands");
  if (
    /DB |Weighted (Step|Bulgarian|Calf)|Goblet|Tibialis/.test(name) &&
    !name.includes("Wall")
  )
    return have.includes("Dumbbells");
  if (/Pulldown/.test(name))
    return have.includes("Machines") || have.includes("Cables");
  if (/Cable/.test(name)) return have.includes("Cables");
  if (/Barbell/.test(name)) return have.includes("Machines");
  if (/Inverted|Supported Bodyweight/.test(name))
    return have.includes("Pull-up bar");
  if (/Pull-Up|Chin-Up|Hang/.test(name)) return have.includes("Pull-up bar");
  if (/Parallel-Bar/.test(name)) return have.includes("Dip station");
  return true;
}
function hcEquipmentAdvice(key) {
  WORKOUTS[key].sections[0].exercises.forEach((base, i) => {
    const id = key + "-Strength-" + i;
    document
      .querySelectorAll("#variant-" + id + " option")
      .forEach((option, j) => {
        const v = base.variants[j];
        option.textContent =
          v.level +
          " · " +
          v.name +
          (hcAvailable(v.name, key) ? "" : " · equipment needed");
      });
  });
  const target = document.getElementById("equipment-advice-" + key);
  target.textContent =
    "Equipment preferences remembered. Select substitutions below; changes never reset your rotation.";
  WORKOUTS[key].sections[0].exercises.forEach((base, i) => {
    const id = key + "-Strength-" + i,
      ex = sessionSwaps[id] || base;
    if (!hcAvailable(ex.name, key)) {
      const alt = base.variants.find((v) => hcAvailable(v.name, key));
      target.textContent += ` ${ex.name}: consider ${alt?.name || "a comfortable floor variation"}.`;
    }
  });
}
function hcFeedbackHTML(key) {
  return `<details class="hybrid-note"><summary>Session feedback & recovery</summary><div class="free-fields"><label>Difficulty<select id="hcDifficulty-${key}"><option value="">Optional</option><option>Easy</option><option>Moderate</option><option>Hard</option><option>Very hard</option></select></label><label>Technique / range<select id="hcTechnique-${key}"><option value="">Not rated</option><option>Controlled full range</option><option>Needs practice</option><option>Reduced range</option></select></label><label>Legs<select id="hcLegs-${key}" onchange="hcRecoveryWarning('${key}',this.value)"><option value="">Use daily readiness</option><option>Fresh</option><option>Normal</option><option>Heavy</option><option>Sore</option></select></label><label>Volume<select id="hcVolume-${key}"><option>Normal</option><option>Reduced volume</option></select></label></div><p id="hcRecovery-${key}" class="race-warning"></p><p class="backup-note">Reduced week: manually skip the final set of lower-body exercises or select an easier variation. Log what you completed; your schedule stays in place.</p></details>`;
}
function hcRecoveryWarning(key, legs) {
  document.getElementById("hcRecovery-" + key).textContent = [
    "Heavy",
    "Sore",
  ].includes(legs)
    ? "Reassess demanding running and lower-body work today. Your plan has not been rewritten."
    : "";
}
