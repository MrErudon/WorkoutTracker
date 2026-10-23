> **Hybrid Calisthenics upgrade:** [Plan, storage compatibility, screenshots and regression checks](docs/hybrid-calisthenics.md).

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

### Independent workout log
The Log tab records workouts outside Hybrid. Choose equipment per exercise, search the built-in suggestions or enter a custom name, and log reps or seconds with optional load. Add/remove exercises and sets, enter a local date/time, duration and notes. Drafts persist separately and are included in complete backups. Saved entries share Progress history but never advance Hybrid. Custom text is escaped in history; failed saves retain the draft. Weight convention: per dumbbell or total barbell/machine load. No calorie estimate is invented for these sessions.

### Race Prep
Set an exact race date in Race to activate the reusable 10-mile checklist. The requested runs sit 18, 16, 14, 12, 10, 8, 5 and 3 days before the race; elapsed workouts remain visible in the full schedule and are not compressed into the future. The final long run is eight days out. This Week shows the next seven days, with the remaining build-up expandable. Today includes daily nutrition; the last seven days label Hybrid Reduced Leg Volume, and the final three days replace the calorie-deficit reminder with maintenance and familiar-carbohydrate fueling. This labels/recommends reduced strength volume without modifying entered sets.

Readiness (weight, sleep, legs, notes) persists by local date; checklist completions are isolated by race date. Weight trend uses available morning observations within the last seven calendar days and compares with the preceding seven; missing days are not fabricated. Readiness history appears in Progress and complete backups include Race Prep state. Sore legs flag that day's prescribed run without rewriting it.

Automatic run completion sums run mileage on the prescribed local calendar day, using structured manual run distance or GPS run distance and a compatibility parser for earlier run logs. Rucks and timed activities without known mileage do not qualify. Meeting the lower end of the prescribed range completes it, without asking for extra distance. Manual run entries can be backdated. Checkboxes alone do not invent workout history. Calorie targets are the user's requested rough targets, with an explicit fueling/recovery allowance; the dashboard does not promise nine-pound weight loss.

Race UI takes the sixth bottom-navigation slot; the existing push-up Challenge remains accessible from Intervals. Test with `tests/race.cjs` using the same Playwright environment as other browser checks.

### Mobile interaction polish
Selected navigation and exercise expansion/completion states are exposed to assistive technology. Touch controls have press feedback, larger exercise chevrons, and visible keyboard focus; long exercise names wrap. The ruck equipment and rest-duration selectors are named, and the ruck label meets text contrast requirements. Cache v11 preserves the existing origin and storage keys.

Run `tests/accessibility.cjs` with `playwright` and `@axe-core/playwright` available via `NODE_PATH`; optionally set `CHROME_PATH`. It scans the five primary views at 320, 390, 430, and 1280 pixels. The existing regression suite and v9-to-v11 offline upgrade check also pass in Chromium. Physical iPhone keyboard, safe-area, and touch behavior still need device testing.

### Impeccable and Taste refinement
Applied Impeccable 4.7.0's Operate/polish workflow and Taste's app-screen guidance. Direction: True-black flat, seed 1478854674, adapted to the existing green palette, system font, mobile column and bottom navigation. The screen answers “What should I train next?”; the signature is the existing next-session control and set completion display. Plans, exercise variants, equipment, sets/reps, durations, running schedules, readiness, history and goals remain the real data source. No illustrative production data was introduced.

The product title is now compact, metadata is at least 11px in the shared styles, secondary buttons and navigation are quieter, cards are flat, and activity bars display exact daily counts with no stub for zero. Existing exercise and run functionality is unchanged. Cache v12 delivers the update on the existing origin.

Review: the next-session action leads, card edges align, the existing green accent carries training progress, totals remain computed from history, and the phone keeps its familiar navigation. The desktop retains the deliberately narrow workout column. Taste's rendered check went from 5 failures to 0, with a documented exception for `covered-text`: its target is the hidden Hybrid heading inside the closed previous-overview disclosure, not visible overlapping content. The below-fold warning is retained because the workout is intentionally a sequential mobile logger, not a desktop dashboard. Source lint still flags pre-existing emoji equipment labels, legacy gradients and punctuation; these were not rewritten merely to satisfy a style rule. Impeccable's static heading warning does not account for the dynamically generated workout headings. Physical phone verification remains outstanding.

Validation includes five primary views at 320/390/430/768/1280px, existing workout/race regressions, and a real v9-to-v12 upgrade retaining legacy data. Network-first asset requests now fall back to cache after five seconds if the connection stalls; the upgrade check covers stalled and unavailable origins. Physical phone testing remains outstanding.

### Extra work during a session
Hybrid Calisthenics uses individual equipment selections and exercise swaps. Tap **Add exercise** below the planned lifts to search the exercise library, filter by equipment and choose 1–6 sets. Additions use the normal set logger, rest timer and previous performance; unfinished additions resume after reopening the app. Remove affects only that addition. Finishing saves all recorded exercises together in History and clears the session-only additions without changing the plan. The independent Log tab remains available for separate workouts and custom exercises.
