// Native date inputs must stay within their own field in Chromium and WebKit.
const { chromium, webkit } = require("playwright"),
  fs = require("node:fs"),
  http = require("node:http"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const root = path.join(__dirname, ".."),
  server = http
    .createServer((req, res) => {
      const file = path.join(root, req.url === "/" ? "index.html" : req.url);
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
      try {
        res.end(fs.readFileSync(file));
      } catch {
        res.statusCode = 404;
        res.end();
      }
    })
    .listen(8769);
(async () => {
  for (const [name, engine] of [
    ["chromium", chromium],
    ["webkit", webkit],
  ]) {
    if (
      !(process.env.LAYOUT_BROWSERS || "chromium,webkit")
        .split(",")
        .includes(name)
    )
      continue;
    const browser = await engine.launch({
        headless: true,
        ...(name === "chromium" && process.env.CHROME_PATH
          ? { executablePath: process.env.CHROME_PATH }
          : {}),
      }),
      page = await browser.newPage({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        locale: "en-US",
      });
    await page.goto("http://localhost:8769");
    await page.locator("[data-tab=speed]").click();
    await page
      .locator(".speed-session")
      .first()
      .locator("details")
      .evaluate((el) => (el.open = true));
    for (const width of [320, 375, 390, 393, 430, 680]) {
      await page.setViewportSize({ width, height: 844 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        name + " page overflow " + width,
      );
      const boxes = await page
        .locator("#panel-speed .free-fields")
        .evaluateAll((groups) =>
          groups
            .filter((el) => el.getBoundingClientRect().height)
            .map((group) => ({
              group: group.getBoundingClientRect().toJSON(),
              fields: Array.from(group.querySelectorAll("input,select"), (el) =>
                el.getBoundingClientRect().toJSON(),
              ),
            })),
        );
      for (const { group, fields } of boxes) {
        for (const field of fields) {
          assert.ok(
            field.x >= group.x - 0.5 && field.right <= group.right + 0.5,
            name + " field escapes grid " + width,
          );
          assert.ok(field.height >= 44, name + " touch target");
        }
        for (let i = 0; i < fields.length; i++)
          for (let j = i + 1; j < fields.length; j++) {
            const a = fields[i],
              b = fields[j];
            assert.ok(
              a.right <= b.x ||
                b.right <= a.x ||
                a.bottom <= b.y ||
                b.bottom <= a.y,
              name + " overlapping fields " + width,
            );
          }
      }
      if (width < 600) {
        const date = await page
            .locator("[data-speed-date]")
            .first()
            .boundingBox(),
          status = await page
            .locator("[data-speed-status]")
            .first()
            .boundingBox();
        assert.ok(
          status.y >= date.y + date.height + 10,
          name + " date/status must stack " + width,
        );
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page
      .locator(".speed-session")
      .first()
      .evaluate((el) => el.scrollIntoView({ block: "start" }));
    await page.screenshot({ path: "/tmp/speed-layout-" + name + ".png" });
    await browser.close();
    console.log(
      "PASS: " +
        name +
        " native date/status and expanded performance fields at 320, 375, 390, 393, 430, 680 px.",
    );
  }
  server.close();
})().catch((e) => {
  console.error(e);
  server.close();
  process.exit(1);
});
