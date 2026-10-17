// NODE_PATH="$CODEX_PRIMARY_RUNTIME_NODE_MODULES" CHROME_PATH=/path/to/chrome node tests/calisthenics.cjs
const { chromium } = require("playwright"),
  fs = require("node:fs"),
  http = require("node:http"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const root = path.join(__dirname, ".."),
  server = http
    .createServer((req, res) => {
      const f = path.join(root, req.url === "/" ? "index.html" : req.url);
      res.setHeader(
        "Content-Type",
        f.endsWith(".js")
          ? "text/javascript"
          : f.endsWith(".css")
            ? "text/css"
            : f.endsWith(".png")
              ? "image/png"
              : "text/html",
      );
      try {
        res.end(fs.readFileSync(f));
      } catch {
        res.statusCode = 404;
        res.end();
      }
    })
    .listen(8767);
(async () => {
  const browser = await chromium.launch({
      headless: true,
      ...(process.env.CHROME_PATH
        ? { executablePath: process.env.CHROME_PATH }
        : {}),
      args: ["--no-sandbox"],
    }),
    context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      timezoneId: "America/Chicago",
    }),
    page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (d) => d.accept());
  await page.goto("http://localhost:8767");
  assert.equal(
    await page.locator(".panel.active").getAttribute("id"),
    "panel-hc-a",
  );
  assert.equal(await page.evaluate(() => hcState.maxima.pull), 6);
  assert.equal(await page.evaluate(() => hcState.maxima.dip), 10);
  assert.equal(await page.evaluate(() => hcState.maxima.push), null);
  for (const key of ["hc-a", "hc-b", "hc-c", "hc-d"])
    assert.equal(
      await page.locator(`#${key}-exercises .exercise-card`).count(),
      6,
    );
  assert.equal(
    await page.locator("#exscheme-hc-a-Strength-0").textContent(),
    "3 × 3–4",
  );
  assert.equal(
    await page.locator("#exscheme-hc-a-Strength-1").textContent(),
    "3 × 5–7",
  );
  await page.locator("#card-hc-a-Strength-0 .exercise-header-left").click();
  await page.locator("#hc-a-Strength-0-s1-reps").fill("4");
  await page.locator("#hc-a-Strength-0-s1-rir").fill("2");
  await page.locator("#hc-a-Strength-0-s1-done").click();
  assert.equal(await page.evaluate(() => restTimerRemaining), 120);
  await page.locator("#equip-hc-a").selectOption("Bodyweight Only");
  assert.equal(
    await page.locator("#hc-a-Strength-0-s1-reps").inputValue(),
    "4",
  );
  assert.ok(await page.evaluate(() => !hcAvailable("Strict Pull-Up", "hc-a")));
  await page.reload();
  assert.equal(
    await page.locator("#hc-a-Strength-0-s1-reps").inputValue(),
    "4",
  );
  assert.equal(await page.locator("#hc-a-Strength-0-s1-rir").inputValue(), "2");
  assert.ok(
    (
      await page.locator("#hc-a-Strength-0-s1-done").getAttribute("class")
    ).includes("done"),
  );
  await page.locator("#equip-hc-a").selectOption("default");
  await page.evaluate(() => {
    document.getElementById("hcDifficulty-hc-a").value = "Moderate";
    document.getElementById("hcTechnique-hc-a").value = "Controlled full range";
    document.getElementById("hcLegs-hc-a").value = "Normal";
  });
  for (let n = 2; n <= 3; n++) {
    await page.locator(`#hc-a-Strength-0-s${n}-reps`).fill("4");
    await page.locator(`#hc-a-Strength-0-s${n}-rir`).fill("2");
    await page.locator(`#hc-a-Strength-0-s${n}-done`).click();
  }
  await page.evaluate(() => saveWorkout("hc-a"));
  assert.equal(await page.evaluate(() => log.length), 1);
  assert.equal(await page.evaluate(() => log[0].sets[0].sets[0].rir), "2");
  assert.ok((await page.locator("#hcNext").textContent()).includes("Legs"));
  assert.ok(!(await page.locator("#hc-summary-hc-a").isHidden()));
  assert.ok(
    !(
      await page.evaluate(() =>
        hcProgression(WORKOUTS["hc-a"].sections[0].exercises[0]),
      )
    ).includes("Two controlled"),
  );
  await page.evaluate(() => {
    log[0].date = new Date(
      raceShift(raceDayKey(), -1) + "T12:00:00",
    ).toISOString();
    localStorage.setItem("trainingLog", JSON.stringify(log));
  });
  for (let n = 1; n <= 3; n++) {
    await page.locator(`#hc-a-Strength-0-s${n}-reps`).fill("4");
    await page.locator(`#hc-a-Strength-0-s${n}-rir`).fill("2");
    await page.locator(`#hc-a-Strength-0-s${n}-done`).click();
  }
  await page.evaluate(() => saveWorkout("hc-a"));
  assert.equal(await page.evaluate(() => log.length), 2);
  assert.ok(
    (
      await page.evaluate(() =>
        hcProgression(WORKOUTS["hc-a"].sections[0].exercises[0]),
      )
    ).includes("Two controlled"),
  );
  assert.equal(
    await page.locator("#exname-hc-a-Strength-0").textContent(),
    "Strict Pull-Up",
    "No automatic difficulty change",
  );
  await page
    .locator("#variant-hc-a-Strength-0")
    .selectOption({ label: "Advanced · Weighted Pull-Up" });
  await page.locator("#hc-a-Strength-0-s1-reps").fill("3");
  await page.locator("#hc-a-Strength-0-s1-wt").fill("10");
  await page.locator("#hc-a-Strength-0-s1-done").click();
  await page.evaluate(() => {
    raceState.readiness[raceDayKey()] = {
      weight: "212",
      sleep: "7",
      legs: "Sore",
    };
    saveRaceState(raceState);
    saveWorkout("hc-a");
  });
  assert.equal(await page.evaluate(() => log[0].sets[0].loadKind), "added");
  assert.equal(await page.evaluate(() => log[0].bodyweight), 212);
  await page.locator("[data-tab=log]").click();
  assert.ok(
    (await page.locator("#hcPerformance").textContent()).includes(
      "0.05× bodyweight",
    ),
  );
  assert.ok(
    (await page.locator("#hcPerformance").textContent()).includes("24"),
  );
  await page.locator("[data-tab=train]").click();
  await page.locator("[data-day=hc-a]").click();
  await page.locator("#variant-hc-a-Strength-0").selectOption("0");
  await page.locator("#hc-a-Strength-0-s1-reps").fill("6");
  await page.locator("#hc-a-Strength-0-s1-wt").fill("40");
  await page.locator("#hc-a-Strength-0-s1-done").click();
  await page.evaluate(() => saveWorkout("hc-a"));
  assert.equal(
    await page.evaluate(() => log[0].sets[0].loadKind),
    "assistance",
  );
  assert.equal(await page.evaluate(() => log[0].sets[0].totalVol), null);
  assert.ok(!(await page.evaluate(() => prs["Assisted Pull-Up"])));
  // Every variation renders correct sets/units and survives a reload through existing draft storage.
  await page.evaluate(() => {
    for (const { key } of HC_SESSIONS)
      for (const [i, ex] of WORKOUTS[key].sections[0].exercises.entries()) {
        const id = key + "-Strength-" + i;
        for (let n = 0; n < ex.variants.length; n++) {
          const select = document.getElementById("variant-" + id);
          select.value = n;
          hcChangeVariant(id, select);
          if (
            document.querySelectorAll("#logger-" + id + " .complete-btn")
              .length !== ex.sets
          )
            throw Error("Wrong sets " + id);
          const v = ex.variants[n];
          if (
            document.getElementById(id + "-s1-wt").disabled !==
            (v.loadKind === "bodyweight")
          )
            throw Error("Wrong load mode");
        }
      }
  });
  await page.locator("[data-day=hc-c]").click();
  await page.reload();
  assert.equal(
    await page.locator(".panel.active").getAttribute("id"),
    "panel-hc-c",
  );
  // Progression never counts two workouts on the same date, or a sore readiness day.
  assert.ok(
    await page.evaluate(() => {
      const saved = log;
      const exercise = WORKOUTS["hc-a"].sections[0].exercises[0];
      log = [0, 1].map(() => ({
        type: "hc-a",
        date: new Date().toISOString(),
        feedback: {
          technique: "Controlled full range",
          difficulty: "Moderate",
          legs: "Normal",
        },
        sets: [
          {
            exercise: exercise.name,
            sets: [1, 2, 3].map((s) => ({
              s,
              reps: "4",
              rir: "2",
              done: true,
            })),
          },
        ],
      }));
      const result = !hcProgression(exercise, "hc-a").includes(
        "Two controlled",
      );
      log = saved;
      return result;
    }),
  );
  // Bad reps and RIR cannot be completed/saved.
  await page.locator("#card-hc-c-Strength-0 .exercise-header-left").click();
  await page.locator("#hc-c-Strength-0-s1-reps").fill("1.5");
  const before = await page.evaluate(() => log.length);
  await page.locator("#hc-c-Strength-0-s1-done").click();
  assert.ok(
    !(
      await page.locator("#hc-c-Strength-0-s1-done").getAttribute("class")
    ).includes("done"),
  );
  await page.evaluate(() => saveWorkout("hc-c"));
  assert.equal(await page.evaluate(() => log.length), before);
  // Maxima edit remains separate from working sets.
  await page.evaluate(() => {
    document.getElementById("hc-max-push").value = 25;
    document.getElementById("hcSaveMax").click();
  });
  assert.equal(await page.evaluate(() => hcState.maxima.push), 25);
  assert.equal(await page.evaluate(() => log.length), before);
  // Speed schedule, historical-only pace, assessments, rescheduling, actual splits and deletion.
  await page.locator("[data-tab=speed]").click();
  assert.equal(await page.evaluate(() => speedSchedule().length), 12);
  assert.ok(
    (await page.evaluate(() => speedPace(speedSchedule()[0]))).includes(
      "Effort-based",
    ),
  );
  await page.evaluate(() => {
    document.getElementById("speedTestTime").value = "16:20";
    document.getElementById("speedSaveTest").click();
  });
  assert.equal(await page.evaluate(() => speedBaseline().seconds), 980);
  assert.ok(
    (await page.evaluate(() => speedPace(speedSchedule()[0]))).includes(
      "Recalibrated",
    ),
  );
  await page.evaluate(() => {
    const card = document.querySelector("[data-speed-id]");
    card.querySelector("[data-speed-date]").value = raceDayKey();
    card.querySelector("[data-speed-status]").value = "shortened";
    card.querySelector("[data-speed-miles]").value = "2";
    card.querySelector("[data-speed-time]").value = "25:00";
    card.querySelector("[data-speed-splits]").value = "60, 1:02, 61";
    speedSaveSession(card);
  });
  assert.equal(await page.evaluate(() => log[0].speed.status), "shortened");
  assert.deepEqual(
    await page.evaluate(() => log[0].speed.splits),
    [60, 62, 61],
  );
  assert.equal(
    await page.evaluate(() => speedSchedule()[0].status),
    "shortened",
  );
  await page.reload();
  assert.equal(
    await page.evaluate(() => speedSchedule()[0].status),
    "shortened",
  );
  assert.ok(
    (await page.locator("#hcPerformance").textContent()).includes("1:02"),
  );
  await page.evaluate(() => deleteEntry(0));
  assert.equal(await page.evaluate(() => speedSchedule()[0].status), "planned");
  await page.evaluate(() => {
    const card = document.querySelector("[data-speed-id]");
    card.querySelector("[data-speed-date]").value = raceShift(raceDayKey(), 3);
    card.querySelector("[data-speed-status]").value = "skipped";
    speedSaveSession(card);
  });
  assert.equal(await page.evaluate(() => speedSchedule()[0].status), "skipped");
  await page.locator("[data-tab=train]").click();
  assert.ok(
    (await page.locator("#hcTodayRun").textContent()).includes("sore legs"),
  );
  // Readiness uses the original shared records, and preserves the plan when legs are sore.
  await page.locator("[data-tab=train]").click();
  await page.locator("#hcReadiness summary").click();
  await page.locator("#hcReadyWeight").fill("211");
  await page.locator("#hcReadySleep").fill("7.5");
  await page.locator("#hcReadyLegs").selectOption("Heavy");
  await page.locator("#hcReadyNotes").fill("Recovery check");
  await page.evaluate(() => speedSaveReadiness());
  assert.equal(
    await page.evaluate(() => raceState.readiness[raceDayKey()].weight),
    "211",
  );
  assert.equal(
    await page.evaluate(() => raceState.readiness[raceDayKey()].sleep),
    "7.5",
  );
  assert.equal(
    await page.evaluate(() => raceState.readiness[raceDayKey()].legs),
    "Heavy",
  );
  assert.ok(
    (await page.locator("#hcRecovery-hc-b").textContent()).includes("Reassess"),
  );
  assert.equal(await page.evaluate(() => HC_SESSIONS[1].key), "hc-b");
  // Existing data bytes preserved on initialization; drafts restore to the original plan.
  const old = await browser.newPage();
  await old.addInitScript(() => {
    if (!localStorage.getItem("seeded")) {
      localStorage.setItem("seeded", "1");
      localStorage.setItem(
        "trainingLog",
        JSON.stringify([
          {
            type: "hybrid-a",
            label: "Old Hybrid",
            date: "2026-09-01T12:00:00Z",
            sets: [
              {
                exercise: "DB Goblet Squat",
                sets: [{ s: 1, reps: "8", wt: "50", done: true }],
              },
            ],
          },
        ]),
      );
      localStorage.setItem(
        "athleticRacePrepV1",
        JSON.stringify({
          date: "2026-10-01",
          checks: { "2026-10-01:morning:fuel": true },
          readiness: {},
        }),
      );
      localStorage.setItem(
        "athleticDraftV2",
        JSON.stringify({
          day: "hybrid-a",
          tab: "train",
          panels: {
            "panel-hybrid-a": {
              inputs: [["hybrid-a-Strength-0-s1-reps", "8"]],
              done: [],
            },
          },
        }),
      );
    }
  });
  await old.goto("http://localhost:8767");
  assert.equal(
    await old.locator(".panel.active").getAttribute("id"),
    "panel-hybrid-a",
  );
  assert.equal(
    await old.locator("#hybrid-a-Strength-0-s1-reps").inputValue(),
    "8",
  );
  assert.equal(
    await old.evaluate(() => log[0].sets[0].exercise),
    "DB Goblet Squat",
  );
  assert.ok(
    await old.evaluate(() => raceState.checks["2026-10-01:morning:fuel"]),
  );
  await old.close();
  // iPhone widths across primary screens and expanded controls.
  for (const width of [320, 375, 390, 393, 430]) {
    await page.setViewportSize({ width, height: 844 });
    for (const tab of ["train", "speed", "run", "free", "log"]) {
      await page.locator(`[data-tab=${tab}]`).click();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "overflow " + width + " " + tab,
      );
    }
  }
  fs.mkdirSync(path.join(root, "docs"), { recursive: true });
  const preview = await browser.newPage({
    viewport: { width: 390, height: 844 },
    timezoneId: "America/Chicago",
  });
  await preview.goto("http://localhost:8767");
  await preview.screenshot({
    path: path.join(root, "docs/calisthenics-today.png"),
  });
  await preview.locator("#hcNext button").click();
  await preview.locator("#card-hc-a-Strength-0 .exercise-header-left").click();
  await preview.locator("#hc-a-Strength-0-s1-reps").fill("4");
  await preview
    .locator("#card-hc-a-Strength-0")
    .evaluate((el) => el.scrollIntoView({ block: "start" }));
  await preview.screenshot({
    path: path.join(root, "docs/calisthenics-workout.png"),
  });
  await preview.locator("[data-tab=speed]").click();
  await preview.screenshot({
    path: path.join(root, "docs/calisthenics-speed.png"),
  });
  await preview.locator("[data-tab=log]").click();
  await preview.screenshot({
    path: path.join(root, "docs/calisthenics-progress.png"),
  });
  await preview.close();
  // Offline new assets and navigation survive a full reload.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await page.locator("[data-tab=speed]").click();
  assert.equal(
    await page.locator("#panel-speed .race-hero h2").textContent(),
    "Build your speed.",
  );
  await page.locator("[data-tab=train]").click();
  assert.equal(await page.locator("#hc-a-exercises .exercise-card").count(), 6);
  await context.setOffline(false);
  assert.deepEqual(errors, []);
  await browser.close();
  server.close();
  console.log(
    "PASS: all variants, baseline/working sets, equipment without reset, autosave, conservative progression, independent PRs, running schedule/assessment/status/splits, legacy data/draft, 5 iPhone widths, offline reload.",
  );
})().catch((e) => {
  console.error(e);
  server.close();
  process.exit(1);
});
