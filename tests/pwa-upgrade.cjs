// Real v12 -> v13 service-worker upgrade, with legacy browser data and offline reload.
const { chromium } = require("playwright"),
  { execFileSync } = require("node:child_process"),
  fs = require("node:fs"),
  http = require("node:http"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const root = path.join(__dirname, ".."),
  base = "f0d77ca9b1379defdf4cdcdb054e319174b2460c",
  old = {};
for (const file of [
  "index.html",
  "mobile.css",
  "mobile.js",
  "hybrid.js",
  "calisthenics.js",
  "speed.js",
  "manual.js",
  "outdoor.js",
  "race.js",
  "sw.js",
  "manifest.json",
  "icon.svg",
  "icon-180-v3.png",
  "icon-192-v3.png",
  "icon-512-v3.png",
])
  old[file] = execFileSync("git", ["show", `${base}:${file}`], {
    cwd: root,
    maxBuffer: 1024 * 1024,
  });
let upgraded = false, stalled = false;
const server = http
  .createServer((req, res) => {
    if (stalled) return;
    const file = req.url === "/" ? "index.html" : req.url.slice(1);
    res.setHeader(
      "Content-Type",
      file.endsWith(".js")
        ? "text/javascript"
        : file.endsWith(".css")
          ? "text/css"
          : file.endsWith(".png")
            ? "image/png"
            : "text/html",
    );
    res.setHeader("Cache-Control", "no-store");
    try {
      res.end(upgraded ? fs.readFileSync(path.join(root, file)) : old[file]);
    } catch {
      res.statusCode = 404;
      res.end();
    }
  })
  .listen(0);
(async () => {
  const b = await chromium.launch({
      headless: true,
      ...(process.env.CHROME_PATH
        ? { executablePath: process.env.CHROME_PATH }
        : {}),
      args: ["--no-sandbox"],
    }),
    context = await b.newContext(),
    page = await context.newPage();
  page.on("dialog", (d) => d.accept());
  await page.goto(`http://localhost:${server.address().port}`);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    localStorage.setItem(
      "trainingLog",
      JSON.stringify([
        {
          type: "run",
          label: "Retained run",
          date: "2026-10-01T12:00:00Z",
          runData: { easy: "3 mi" },
        },
      ]),
    );
    localStorage.setItem(
      "athleticRacePrepV1",
      JSON.stringify({
        date: "2026-10-01",
        checks: { saved: true },
        readiness: {},
      }),
    );
  });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  assert.ok(
    await page.evaluate(async () =>
      (await caches.keys()).includes("athletic-tracker-v12"),
    ),
  );
  upgraded = true;
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    await registration.update();
  });
  await page.waitForFunction(async () => {
    const keys = await caches.keys();
    return (
      keys.includes("athletic-tracker-v13") &&
      !keys.includes("athletic-tracker-v12")
    );
  });
  await page.reload();
  assert.equal(await page.locator("#hc-a-exercises .exercise-card").count(), 6);
  assert.equal(await page.evaluate(() => log[0].label), "Retained run");
  assert.ok(await page.evaluate(() => raceState.checks.saved));
  stalled = true;
  await page.reload();
  assert.equal(await page.locator("#hc-a-exercises .exercise-card").count(), 6);
  assert.equal(await page.evaluate(() => log[0].label), "Retained run");
  // Stop the origin to test a real network failure, including worker fetches.
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  await page.reload();
  assert.equal(await page.locator("#hc-a-exercises .exercise-card").count(), 6);
  await page.locator("[data-tab=speed]").click();
  assert.ok(await page.locator("#panel-speed").isVisible());
  await b.close();
  server.close();
  console.log(
    "PASS: real v12→v13 activation, old-cache cleanup, unchanged legacy data, stalled connection fallback, offline new plan and Speed.",
  );
})().catch((e) => {
  console.error(e);
  server.close();
  process.exit(1);
});
