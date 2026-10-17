/* Four-week personal block. Calendar changes never mutate completed run history. */
const SPEED_KEY = "athleticSpeedV1";
let speedState;
try {
  speedState = JSON.parse(localStorage.getItem(SPEED_KEY) || "null");
} catch {}
if (!speedState || speedState.version !== 1)
  speedState = {
    version: 1,
    start: raceDayKey(),
    sessions: {},
    historical: { low: 930, high: 960, date: "2026-07-17" },
    assessments: [],
  };
function speedStore(next) {
  try {
    localStorage.setItem(SPEED_KEY, JSON.stringify(next));
    speedState = next;
    return true;
  } catch {
    showToast("Unable to save running plan. Keep this page open.");
    return false;
  }
}
const speedTab = document.createElement("div");
speedTab.className = "tab";
speedTab.dataset.tab = "speed";
speedTab.textContent = "Speed";
raceTab.before(speedTab);
raceTab.hidden = true;
const speedPanel = document.createElement("div");
speedPanel.className = "panel";
speedPanel.id = "panel-speed";
document.querySelector("main").append(speedPanel);
const SPEED_WEEKS = [
  {
    title: "Recover & reintroduce",
    distance: 200,
    repeats: 4,
    recovery: "90–120 sec walk/jog",
    tempo:
      "20–25 min easy. If fully recovered, 3 × 2 min steady with 2 min easy; otherwise keep all easy.",
  },
  {
    title: "Controlled 400s",
    distance: 400,
    repeats: 4,
    recovery: "2 min easy walk/jog",
    tempo:
      "10 min easy + 2 × 5 min comfortably hard (RPE 6/10), 3 min easy between + 5–10 min cooldown.",
  },
  {
    title: "Sustained 800s",
    distance: 800,
    repeats: 3,
    recovery: "3 min easy walk/jog",
    tempo:
      "10 min easy + 10–12 min comfortably hard (RPE 6/10) + 5–10 min easy. Shorten if recovery is poor.",
  },
  {
    title: "Reduce & assess",
    distance: 200,
    repeats: 3,
    recovery: "2 min easy walk/jog",
    tempo:
      "2-mile assessment only if recovered. 10–15 min easy + drills / 3 relaxed strides, then a controlled, evenly paced test and 10 min cooldown. Easy running is an alternative.",
  },
];
function speedSchedule() {
  return SPEED_WEEKS.flatMap((w, i) =>
    ["interval", "easy", "tempo"].map((kind, j) => {
      const id = `${speedState.start}:w${i + 1}:${kind}`,
        saved = speedState.sessions[id] || {};
      return {
        id,
        week: i + 1,
        kind,
        date: saved.date || raceShift(speedState.start, i * 7 + [1, 3, 6][j]),
        status: saved.status || "planned",
        ...w,
        ...saved,
      };
    }),
  );
}
function speedClock(n) {
  n = Math.round(n);
  return Number.isFinite(n) && n > 0
    ? `${Math.floor(n / 60)}:${String(Math.round(n % 60)).padStart(2, "0")}`
    : "—";
}
function speedParse(raw) {
  if (!/^\d{1,3}:[0-5]\d$/.test(raw || "")) return NaN;
  const [m, s] = raw.split(":").map(Number);
  return m * 60 + s;
}
function speedBaseline(kind = "2mile") {
  return speedState.assessments
    .filter((x) => x.kind === kind)
    .reverse()
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}
function speedReference() {
  return speedState.assessments
    .slice()
    .reverse()
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}
function speedMilePace() {
  const b = speedReference();
  return b ? b.seconds / (b.kind === "5k" ? 3.10686 : 2) : null;
}
function speedPace(run) {
  const b = speedReference();
  if (!b)
    return "Effort-based until a new assessment: smooth, controlled RPE 6–7/10; finish with another repeat available. Historical 15:30–16:00 is context only.";
  const seconds =
    (b.seconds / (b.kind === "5k" ? 5000 : 3218.688)) * run.distance;
  return `Recalibrated from ${b.kind === "5k" ? "5K" : "2-mile"} test ${raceLabel(b.date)}: ${run.distance} m in about ${speedClock(seconds * 1.02)}–${speedClock(seconds * 1.08)}. Use the slower end and adjust to recovery; these are estimates, not required splits.`;
}
function speedDescription(run) {
  if (run.kind === "easy")
    return `${run.week === 4 ? "15–20" : "20–35"} min conversational running or run/walk. Warm up and cool down gently; shorten as needed.`;
  if (run.kind === "tempo")
    return (
      run.tempo +
      (run.week !== 1 && run.week !== 4 && speedReference()
        ? ` Estimated steady pace: ${speedClock(speedMilePace() * 1.12)}–${speedClock(speedMilePace() * 1.2)} /mi; effort takes priority.`
        : "")
    );
  return `${run.repeats} × ${run.distance} m · ${run.recovery}. 10–15 min easy warm-up + mobility and 2–3 relaxed strides; 10 min easy cooldown. ${run.week === 1 ? "Recent race recovery first: replace repeats with easy walking/jogging if not ready. " : ""}${speedPace(run)}`;
}
function speedNext() {
  const today = raceDayKey();
  return speedSchedule()
    .filter((s) => s.status === "planned" && s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
}
function renderSpeed() {
  const today = raceDayKey(),
    next = speedNext(),
    legs = raceState.readiness[today]?.legs,
    week = Math.max(
      1,
      Math.min(
        4,
        Math.floor(
          (raceDayNumber(today) - raceDayNumber(speedState.start)) / 7,
        ) + 1,
      ),
    );
  speedPanel.innerHTML = `<section class="race-hero"><small>2-MILE / 5K DEVELOPMENT</small><h2>Build your speed.</h2><p>Four weeks · one interval, one easy run, one controlled tempo each week. Week 1 prioritizes recovery; Week 4 reduces volume.</p><div class="hc-metrics"><div><strong>15:00</strong><small>2-mile target</small></div><div><strong>14:30</strong><small>Stretch goal</small></div></div><p class="backup-note">Historical 2 miles: ${speedClock(speedState.historical.low)}–${speedClock(speedState.historical.high)} · approximately ${raceLabel(speedState.historical.date)}. Current fitness is untested until a new assessment. 5K goal: improve your latest verified baseline.</p><details><summary>Block dates & historical benchmark</summary><label>Start after race recovery<input id="speedStart" type="date" value="${speedState.start}"></label><label>Historical 2-mile lower time<input id="speedHistoryLow" value="${speedClock(speedState.historical.low)}" placeholder="15:30"></label><label>Historical upper time<input id="speedHistoryHigh" value="${speedClock(speedState.historical.high)}" placeholder="16:00"></label><label>Historical approximate date<input id="speedHistoryDate" type="date" value="${speedState.historical.date}"></label><button type="button" id="speedSaveStart">Save block settings</button><p class="backup-note">A new start date creates a new block. Previous statuses and logged runs stay saved. Missed runs stay in the past; continue with the next session or reschedule deliberately.</p></details></section>
<section class="race-section"><h3>Next run</h3>${["Heavy", "Sore"].includes(legs) ? '<p class="race-warning">Heavy / sore legs: reassess demanding running and lower-body work. Your schedule stays unchanged.</p>' : ""}<p>${next ? `${raceLabel(next.date)} · Week ${next.week} · ${next.kind === "tempo" && next.week === 4 ? "2-mile assessment" : next.kind}` : "Block complete or no upcoming sessions. Review your results before starting another block."}</p><p class="backup-note">Coordinate: A on day 1, intervals day 2, B on day 3, easy run day 4, C on day 5, recovery day 6, tempo day 7. Keep C’s squat sets submaximal; allow about 48 hours before tempo. Move sessions for your schedule and recovery. Optional D stays easy.</p><button type="button" data-speed-race>Race Prep & readiness history</button></section>
${SPEED_WEEKS.map(
  (w, i) =>
    `<details class="race-section" ${week === i + 1 ? "open" : ""}><summary>Week ${i + 1} · ${w.title}</summary>${speedSchedule()
      .filter((s) => s.week === i + 1)
      .map(
        (run) =>
          `<article class="speed-session" data-speed-id="${run.id}"><h3>${run.kind === "interval" ? run.distance + " m repeats" : run.kind === "easy" ? "Easy aerobic" : run.week === 4 ? "2-mile assessment" : "Controlled tempo"} <small>${run.status}</small></h3><p class="backup-note">${raceLabel(run.date)} · ${speedDescription(run)}</p><div class="free-fields"><label>Date<input type="date" data-speed-date value="${run.date}"></label><label>Status<select data-speed-status>${["planned", "completed", "shortened", "skipped"].map((x) => `<option ${run.status === x ? "selected" : ""}>${x}</option>`).join("")}</select></label></div><p class="backup-note">${run.status === "planned" && run.date < today ? "Missed date: continue forward or choose a new date. No catch-up required." : ""}</p><details><summary>Log actual performance</summary><div class="free-fields"><label>Total distance · miles<input data-speed-miles type="number" min="0" max="100" step="0.01" value="${run.miles ?? ""}"></label><label>Elapsed time · mm:ss<input data-speed-time inputmode="numeric" placeholder="30:00" value="${escapeText(run.time || "")}"></label>${run.kind === "interval" ? `<label>Repeat splits · seconds or mm:ss<input data-speed-splits placeholder="58, 60, 59, 61" value="${escapeText(run.splits || "")}"></label>` : ""}<label>Difficulty<select data-speed-difficulty><option value="">Optional</option>${["Easy", "Moderate", "Hard", "Very hard"].map((x) => `<option ${run.difficulty === x ? "selected" : ""}>${x}</option>`).join("")}</select></label><label>Notes<input data-speed-notes maxlength="500" value="${escapeText(run.notes || "")}"></label></div></details><button type="button" data-speed-save>Save session</button></article>`,
      )
      .join("")}</details>`,
).join("")}
<section class="race-section"><h3>Verify & recalibrate</h3><p class="backup-note">Enter a measured 2-mile or 5K test, not an estimate from another distance. This updates future pace suggestions; existing logs stay unchanged. Log the workout once through Run, GPS or a Speed session; this form records the benchmark only.</p><div class="free-fields"><label>Distance<select id="speedTestKind"><option value="2mile">2 miles</option><option value="5k">5K</option></select></label><label>Time · mm:ss<input id="speedTestTime" inputmode="numeric" placeholder="15:45"></label><label>Test date<input id="speedTestDate" type="date" value="${today}"></label></div><button type="button" id="speedSaveTest">Save verified result</button></section>`;
  document.getElementById("speedSaveStart").onclick = () => {
    const start = document.getElementById("speedStart").value,
      date = document.getElementById("speedHistoryDate").value,
      low = speedParse(document.getElementById("speedHistoryLow").value),
      high = speedParse(document.getElementById("speedHistoryHigh").value);
    if (
      !Number.isFinite(raceDayNumber(start)) ||
      !Number.isFinite(raceDayNumber(date)) ||
      date > today ||
      !(low > 0 && high >= low)
    ) {
      showToast("Check block dates and historical times.");
      return;
    }
    if (speedStore({ ...speedState, start, historical: { low, high, date } })) {
      renderSpeed();
      speedToday();
    }
  };
  document.getElementById("speedSaveTest").onclick = () => {
    const kind = document.getElementById("speedTestKind").value,
      date = document.getElementById("speedTestDate").value,
      seconds = speedParse(document.getElementById("speedTestTime").value);
    if (
      !Number.isFinite(raceDayNumber(date)) ||
      date > today ||
      !Number.isFinite(seconds) ||
      seconds < 120
    ) {
      showToast("Enter a valid measured time and a date today or earlier.");
      return;
    }
    if (
      speedStore({
        ...speedState,
        assessments: [
          ...speedState.assessments,
          {
            id: crypto.randomUUID(),
            kind,
            date,
            seconds,
            source: "Verified measured assessment",
          },
        ],
      })
    ) {
      renderSpeed();
      speedProgress();
      showToast("Assessment saved; estimated training paces updated ✓");
    }
  };
}
function speedSaveSession(card) {
  const run = speedSchedule().find((s) => s.id === card.dataset.speedId),
    date = card.querySelector("[data-speed-date]").value,
    status = card.querySelector("[data-speed-status]").value,
    milesRaw = card.querySelector("[data-speed-miles]").value,
    miles = Number(milesRaw),
    time = card.querySelector("[data-speed-time]").value.trim(),
    seconds = speedParse(time),
    splits = card.querySelector("[data-speed-splits]")?.value.trim() || "",
    difficulty = card.querySelector("[data-speed-difficulty]").value,
    notes = card.querySelector("[data-speed-notes]").value.trim(),
    parts = splits
      ? splits
          .split(",")
          .map((s) => s.trim())
          .map((s) => (s.includes(":") ? speedParse(s) : Number(s)))
      : [];
  if (
    !Number.isFinite(raceDayNumber(date)) ||
    (["completed", "shortened"].includes(status) &&
      (date > raceDayKey() ||
        !Number.isFinite(seconds) ||
        seconds <= 0 ||
        milesRaw === "" ||
        !Number.isFinite(miles) ||
        miles < 0 ||
        miles > 100)) ||
    parts.some((n) => !Number.isFinite(n) || n <= 0 || n > 3600) ||
    parts.length > 30
  ) {
    showToast(
      "Check date, elapsed time, distance and repeat splits. Completed runs need an elapsed time and actual mileage.",
    );
    return;
  }
  const saved = {
    date,
    status,
    miles: milesRaw === "" ? null : miles,
    time,
    splits,
    difficulty,
    notes,
  };
  // Session performance and training history share one durable write. Status-only changes stay in plan storage.
  const existing = log.find((e) => e.speed?.sessionId === run.id);
  if (
    existing &&
    !confirm(
      "Update this logged running session? Its actual performance and status will be replaced.",
    )
  )
    return;
  let nextLog = log.filter((e) => e.speed?.sessionId !== run.id);
  if (["completed", "shortened"].includes(status))
    nextLog.unshift({
      id: existing?.id || crypto.randomUUID(),
      type: "run",
      label: `Speed · ${run.kind === "tempo" && run.week === 4 ? "2-mile assessment" : run.kind} · ${status}`,
      date: new Date(date + "T12:00:00").toISOString(),
      durationMin: Math.round((seconds / 60) * 10) / 10,
      runData: {
        run: `${miles} mi · ${time}`,
        intervals: parts.length
          ? `${run.distance} m · ${parts.map(speedClock).join(", ")}`
          : "",
      },
      runMetrics: { easyMiles: miles },
      speed: {
        sessionId: run.id,
        week: run.week,
        kind: run.kind,
        status,
        distance: run.distance,
        splits: parts,
        difficulty,
        notes,
      },
    });
  const state = {
    ...speedState,
    sessions: { ...speedState.sessions, [run.id]: saved },
  };
  // Keep performance in trainingLog authoritative; reconcile status from it on reload.
  try {
    localStorage.setItem("trainingLog", JSON.stringify(nextLog));
  } catch {
    showToast("Unable to save run. Your entered values remain here.");
    return;
  }
  log = nextLog;
  if (!speedStore(state)) {
    showToast(
      "Run saved in Progress; plan status will recover from history on reload.",
    );
    return;
  }
  renderSpeed();
  renderLog();
  refreshProgress();
  speedProgress();
  speedToday();
  updateRaceIntegration();
  showToast("Running session saved ✓");
}
function speedMiles(e) {
  if (e.type !== "run") return 0;
  if (e.outdoor)
    return e.outdoor.kind === "run" ? Number(e.outdoor.distanceMiles) || 0 : 0;
  const easy = e.runMetrics
    ? Number(e.runMetrics.easyMiles) || 0
    : Number(
        /^\s*(\d+(?:\.\d+)?)\s*mi\b/.exec(
          e.runData?.easy || e.runData?.run || "",
        )?.[1],
      ) || 0;
  const interval = /^(\d+) × (\d+)m/.exec(e.runData?.intervals || "");
  return (
    easy +
    (interval ? (Number(interval[1]) * Number(interval[2])) / 1609.344 : 0)
  );
}
function speedToday() {
  const hardSoon = speedSchedule().some(
    (s) =>
      s.status === "planned" &&
      s.kind !== "easy" &&
      s.date >= raceDayKey() &&
      s.date <= raceShift(raceDayKey(), 1),
  );
  HC_SESSIONS.forEach(({ key }) => {
    document.getElementById("hcTiming-" + key).textContent =
      hardSoon && ["hc-b", "hc-c"].includes(key)
        ? "Demanding run today or tomorrow: consider upper-body work, recovery, or reduced leg volume. Keep lower-body work comfortable. Your rotation stays unchanged."
        : "";
  });
  HC_SESSIONS.forEach(({ key }) =>
    hcRecoveryWarning(
      key,
      document.getElementById("hcLegs-" + key).value ||
        raceState.readiness[raceDayKey()]?.legs,
    ),
  );
  const target = document.getElementById("hcTodayRun");
  if (!target) return;
  const today = raceDayKey(),
    next = speedNext(),
    r = raceState.readiness[today] || {},
    missed = speedSchedule().filter(
      (s) => s.status === "planned" && s.date < today,
    ).length;
  target.innerHTML = `<b>${next && next.date === today ? "Today’s run" : "Running · next up"}</b><p>${next ? `${raceLabel(next.date)} · ${next.kind === "interval" ? next.distance + " m repeats" : next.kind === "tempo" && next.week === 4 ? "2-mile assessment" : next.kind}` : "Review your block and recovery before starting the next one."}</p>${["Heavy", "Sore"].includes(r.legs) ? '<p class="race-warning">Heavy / sore legs: reassess demanding running or lower-body work today.</p>' : ""}<p class="backup-note">${r.sleep ? r.sleep + " h sleep · " : ""}${r.legs || "Readiness not recorded"}${missed ? " · " + missed + " past sessions: continue forward; no catch-up required." : ""}</p><button type="button" onclick="document.querySelector('[data-tab=speed]').click()">Open Speed</button><details id="hcReadiness"><summary>Daily readiness</summary><div class="race-readiness"><label>Morning weight · lb<input id="hcReadyWeight" type="number" min="50" max="700" step="0.1" value="${escapeText(r.weight || "")}"></label><label>Sleep · hours<input id="hcReadySleep" type="number" min="0" max="24" step="0.5" value="${escapeText(r.sleep ?? "")}"></label><label>Legs<select id="hcReadyLegs"><option value="">Choose</option>${["Fresh", "Normal", "Heavy", "Sore"].map((x) => `<option ${r.legs === x ? "selected" : ""}>${x}</option>`).join("")}</select></label><label>Notes<textarea id="hcReadyNotes" maxlength="1000" rows="2">${escapeText(r.notes || "")}</textarea></label></div><button type="button" onclick="speedSaveReadiness()">Save readiness</button></details>`;
}
function speedSaveReadiness() {
  const today = raceDayKey(),
    weight = document.getElementById("hcReadyWeight").value,
    sleep = document.getElementById("hcReadySleep").value,
    legs = document.getElementById("hcReadyLegs").value,
    notes = document.getElementById("hcReadyNotes").value.trim();
  if (
    (weight &&
      (!Number.isFinite(Number(weight)) ||
        Number(weight) < 50 ||
        Number(weight) > 700)) ||
    (sleep &&
      (!Number.isFinite(Number(sleep)) ||
        Number(sleep) < 0 ||
        Number(sleep) > 24))
  ) {
    showToast("Check weight (50–700 lb) and sleep (0–24 hours).");
    return;
  }
  if (
    saveRaceState({
      ...raceState,
      readiness: {
        ...raceState.readiness,
        [today]: { weight, sleep, legs, notes },
      },
    })
  ) {
    renderRace();
    updateRaceIntegration();
    speedToday();
    speedProgress();
    showToast("Readiness saved ✓");
  }
}
function speedProgress() {
  const target = document.getElementById("hcPerformance");
  if (!target) return;
  const today = raceDayKey(),
    start = raceShift(today, -6),
    recent = log.filter(
      (e) =>
        raceDayKey(new Date(e.date)) >= start &&
        raceDayKey(new Date(e.date)) <= today,
    ),
    pullNames = ["Strict Pull-Up", "Higher-Volume Strict Pull-Up"];
  const pullReps = recent.reduce(
      (n, e) =>
        n +
        (e.sets || [])
          .filter((x) => pullNames.includes(x.baseName || x.exercise))
          .reduce(
            (n, x) =>
              n +
              x.sets
                .filter((s) => s.done)
                .reduce((n, s) => n + Number(s.reps || 0), 0),
            0,
          ),
      0,
    ),
    miles = recent.reduce((n, e) => n + speedMiles(e), 0);
  const weighted = log
    .flatMap((e) =>
      (e.sets || [])
        .filter((x) => x.loadKind === "added")
        .map((x) => ({
          e,
          x,
          best: x.sets
            .filter((s) => s.done && Number(s.wt) > 0 && Number(s.reps) > 0)
            .sort(
              (a, b) =>
                Number(b.wt) - Number(a.wt) || Number(b.reps) - Number(a.reps),
            )[0],
        })),
    )
    .filter((x) => x.best);
  const records = Object.values(
    weighted.reduce((acc, r) => {
      if (
        !acc[r.x.exercise] ||
        Number(r.best.wt) > Number(acc[r.x.exercise].best.wt) ||
        (Number(r.best.wt) === Number(acc[r.x.exercise]?.best.wt) &&
          Number(r.best.reps) > Number(acc[r.x.exercise]?.best.reps))
      )
        acc[r.x.exercise] = r;
      return acc;
    }, {}),
  );
  const latest = Object.entries(raceState.readiness).sort(([a], [b]) =>
    b.localeCompare(a),
  )[0];
  const verified = (kind) =>
    speedState.assessments
      .filter((x) => x.kind === kind)
      .sort((a, b) => a.seconds - b.seconds)[0];
  const maxCard = (kind, title) => {
    const entries = hcState.benchmarks.filter((x) => x.kind === kind),
      best = entries.length ? Math.max(...entries.map((x) => x.value)) : null,
      latest = entries.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
    return `<div><strong>${best === null ? "Untested" : best}</strong><small>${title} · max test</small><small>${latest ? escapeText(latest.source) : "Establish a clean baseline"}</small></div>`;
  };
  target.innerHTML = `<h2>Performance</h2><div class="hc-metrics">${maxCard("pull", "Strict pull-ups")}${maxCard("dip", "Parallel-bar dips")}${maxCard("push", "Push-ups")}<div><strong>${pullReps}</strong><small>Strict pull-up reps · 7 days</small></div><div><strong>${miles.toFixed(1)} mi</strong><small>Logged running distance · 7 days</small></div><div><strong>${recent.filter((e) => e.type?.startsWith("hc-") && e.type !== "hc-d").length} / 3</strong><small>Core strength sessions · 7 days</small></div><div><strong>${recent.filter((e) => e.type === "run" && (e.outdoor?.kind === "run" || e.runData?.easy || e.runData?.run || e.runData?.intervals || e.runData?.tempo)).length} / 3</strong><small>Running sessions · 7 days</small></div>${["2mile", "5k"].map((k) => `<div><strong>${speedClock(verified(k)?.seconds)}</strong><small>Best verified ${k === "2mile" ? "2-mile" : "5K"}${verified(k) ? " · " + raceLabel(verified(k).date) : " · no measured test yet"}</small></div>`).join("")}</div><details><summary>Weighted records & relative strength</summary><p class="backup-note">Added load / recorded bodyweight, shown per variation. This is an external-load ratio, not a 1RM estimate. Assistance and substitutions never count as strict or weighted records.</p>${records.map(({ e, x, best }) => `<p>${escapeText(x.exercise)} · +${best.wt} lb × ${best.reps}${e.bodyweight ? " · " + (Number(best.wt) / e.bodyweight).toFixed(2) + "× bodyweight added" : " · add a morning bodyweight for future relative records"}</p>`).join("") || "<p>No completed weighted sets yet.</p>"}<h3>Recent relative-strength progression</h3>${weighted
    .slice(0, 12)
    .map(
      ({ e, x, best }) =>
        `<p>${raceLabel(raceDayKey(new Date(e.date)))} · ${escapeText(x.exercise)} · ${best.reps} × +${best.wt} lb · ${e.bodyweight ? (Number(best.wt) / e.bodyweight).toFixed(2) + "× added" : "bodyweight unrecorded"}</p>`,
    )
    .join(
      "",
    )}</details><details><summary>Running splits & pace progression</summary>${
    log
      .filter((e) => e.speed?.splits?.length)
      .slice(0, 6)
      .map(
        (e) =>
          `<p>${raceLabel(raceDayKey(new Date(e.date)))} · ${e.speed.distance} m · ${e.speed.splits.map(speedClock).join(" / ")}</p>`,
      )
      .join("") || "<p>No interval splits recorded yet.</p>"
  }${speedState.assessments
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(
      (a) =>
        `<p>${raceLabel(a.date)} · ${a.kind === "2mile" ? "2 miles" : "5K"} · ${speedClock(a.seconds)} · ${speedClock(a.seconds / (a.kind === "2mile" ? 2 : 3.10686))}/mi · verified</p>`,
    )
    .join(
      "",
    )}<p class="backup-note">Historical 2 miles: ${speedClock(speedState.historical.low)}–${speedClock(speedState.historical.high)} · not a current verified result.</p></details><details><summary>Recovery & session feedback</summary><p>${latest ? `${raceLabel(latest[0])} · ${escapeText(latest[1].sleep || "—")} h sleep · ${escapeText(latest[1].legs || "—")} · ${escapeText(latest[1].notes || "")}` : "Add daily readiness from Today."}</p>${log
    .filter((e) => e.feedback || e.speed?.difficulty)
    .slice(0, 8)
    .map(
      (e) =>
        `<p>${escapeText(e.label)} · ${escapeText(e.feedback?.difficulty || e.speed?.difficulty || "Not rated")}${e.feedback?.technique ? " · " + escapeText(e.feedback.technique) : ""}${e.feedback?.volume ? " · " + escapeText(e.feedback.volume) : ""}</p>`,
    )
    .join("")}</details>${raceTrendHTML(today)}`;
}
document.addEventListener("DOMContentLoaded", () => {
  // Reconcile any log saved before a plan-storage failure. No old keys are migrated destructively.
  for (const e of log.filter((e) => e.speed?.sessionId)) {
    const id = e.speed.sessionId;
    speedState.sessions[id] = {
      ...speedState.sessions[id],
      status: e.speed.status,
      date: raceDayKey(new Date(e.date)),
    };
  }
  speedStore(speedState);
  const performance = document.createElement("section");
  performance.className = "race-section";
  performance.id = "hcPerformance";
  document.getElementById("panel-log").prepend(performance);
  const strip = document.querySelector(".goal-strip"),
    earlier = document.createElement("details");
  earlier.className = "race-section";
  earlier.innerHTML =
    '<summary>Earlier goals & estimates</summary><p class="backup-note">Saved earlier values include manually entered benchmarks and pace projections. Newly measured tests are labeled in Performance above. Weekly mileage uses logged distances; time-only runs have no inferred mileage.</p>';
  strip.replaceWith(earlier);
  earlier.append(strip);
  // Five thumb-friendly destinations. Race Prep stays in Speed; conditioning stays in Run.
  document.querySelector("[data-tab=emom]").hidden = true;
  raceTab.hidden = true;
  const raceLink = document.createElement("button");
  raceLink.className = "backup-button";
  raceLink.textContent = "Open EMOM / conditioning";
  raceLink.onclick = () => document.querySelector("[data-tab=emom]").click();
  document.getElementById("panel-run").prepend(raceLink);
  document.querySelector("[data-tab=train] span").textContent = "Today";
  speedPanel.addEventListener("click", (e) => {
    const save = e.target.closest("[data-speed-save]");
    if (save) speedSaveSession(save.closest("[data-speed-id]"));
    if (e.target.closest("[data-speed-race]")) raceTab.click();
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest(".tab")) {
      renderSpeed();
      speedProgress();
      speedToday();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      renderSpeed();
      speedProgress();
      speedToday();
    }
  });
  queueMicrotask(() => {
    const save = window.deleteEntry;
    window.deleteEntry = function (index) {
      const id = log[index]?.speed?.sessionId,
        before = log.length;
      save(index);
      if (log.length < before && id) {
        const sessions = { ...speedState.sessions };
        delete sessions[id];
        speedStore({ ...speedState, sessions });
      }
      hcRefresh();
      speedProgress();
      speedToday();
    };
    renderSpeed();
    speedProgress();
    speedToday();
  });
});
