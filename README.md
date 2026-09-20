# Athletic Tracker

A personal, mobile-first workout tracker. Serve this folder over HTTP (for example, `python -m http.server 8080`) or use its existing static hosting. No build step or production dependencies.

## Mobile redesign

- Thumb-friendly bottom navigation, larger set controls, focused workout cards, collapsible warm-ups and cooldowns.
- Progress view combines seven-day activity, existing goals, weekly history and settings.
- In-progress inputs, completed sets/rounds, exercise substitutions, equipment selections and session start times survive reloads.
- Start the clock explicitly or begin entering sets. Browsing a routine does not start a timer.
- Successful session saves clear that session's inputs to prevent duplicate logs.
- Complete JSON backup export includes history, metrics, personal records, challenge and active drafts; existing CSV export remains available. JSON restore is not included.
- Existing `trainingLog`, `trainingGoals`, `exercisePRs`, `gtgChallenge`, and `restDuration` keys are preserved. Drafts use `athleticDraftV2`.
- Data is local to the browser/origin/device. No cloud synchronization. Keep the existing hosting origin to retain access to saved data.
- The service worker caches local assets for offline use and checks the network first for updates.

## Verification

`tests/mobile.cjs` uses jsdom for regression checks. Install test tooling outside the application if desired:

```sh
npm install --prefix /tmp/workout-test jsdom@26
NODE_PATH=/tmp/workout-test/node_modules node tests/mobile.cjs
```

Checks cover startup, navigation, draft reload, timer resume, completed set saving, duplicate prevention, exercise swaps, circuit/metcon/run logging, and preservation of existing history.

The redesign was also checked in headless Chromium at 320, 390, and 430 px widths across all five navigation tabs, with no horizontal document overflow or JavaScript errors. Physical iPhone/Safari and home-screen install testing remain to be done. EMOM's live interval countdown does not resume after a reload; entered reps do. Rest countdowns use a wall-clock deadline within a page session but are not restored after a reload.

## Commercial Gym and GPS

Commercial Gym is available on the three strength-day Mode selectors. It keeps the existing set structure and changes appropriate exercises to cable, machine, and commercial free-weight options. Switching equipment asks before clearing entered sets; Home restores the original routine.

The Run tab now includes a Run/Ruck GPS recorder: tracked time, GPS distance, average pace, body/pack weight, rough gross-calorie estimate, north-up route outline and GPX export. Saved routes also have a GPX export in Progress. Coordinates stay in browser storage. Complete backup exports now include the active GPS draft.

GPS requests permission only after Start. Tracking automatically pauses when the page becomes hidden or closes. Resume starts a new route segment, excluding unobserved travel. Reload restores a paused draft. Low-accuracy fixes, implausible jumps and long sample gaps are filtered; distance remains approximate. Keep the screen visible. A wake lock is requested where available, but the OS may refuse it. The cap is 20,000 route points per session. This is not native background GPS.

Calories reuse the app's rough gross MET model with body and pack weight. They are not Fitbit measurements or RuckWell's formula; terrain, elevation and heart rate are not included. Steps and elevation gain are not added in this version.

Apple Health writing requires an authorized native HealthKit bridge, which this browser app does not include. Fitbit Air sync is not connected. Google documents Air as syncing to the Google Health app; a future account integration requires Google Health API OAuth setup and validation of the available scopes/data. No credentials or fake connection controls are included.

Sources reviewed:
- https://ruckwell.com/pages/app
- https://support.google.com/googlehealth/answer/17033101?hl=en
- https://developers.google.com/health/get-started
- https://developer.apple.com/health-fitness/
- https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API

New vector icon source: `icon.svg`; versioned PNGs include 180 px Apple touch icon, 192 px and 512 px manifest icons. An existing iPhone home-screen shortcut may retain its old icon until re-added.

Browser regression: `NODE_PATH=/path/to/playwright/node_modules CHROME_PATH=/path/to/chrome node tests/outdoor.cjs`. Tests simulate location permission/fixes; a real outdoor iPhone walk is still needed for field accuracy and OS behavior.

### Hybrid personal plan
The Train screen now starts with Hybrid: three rotating full-body strength sessions (45 minutes each) plus walking/running afterward, and an optional lighter fourth session. No carries are programmed. Rucking remains a separate optional activity. Home/Hotel DB and Commercial Gym preserve the prescribed set counts and rep targets. The next-session button advances from saved core sessions; optional sessions do not advance it. History and drafts use the existing storage, and previous routines remain available under a collapsed section. Progression guidance uses rep ranges and small load increases; it is guidance, not automatic weight prescription. Existing exercise history appears in the logger.

Run `tests/hybrid.cjs` with Playwright available through NODE_PATH and, when needed, CHROME_PATH pointing at Chromium.
