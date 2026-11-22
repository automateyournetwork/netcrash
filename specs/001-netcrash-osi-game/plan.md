# Implementation Plan: NETCRASH First Playable (OSI Layer Crash)

**Branch**: `001-netcrash-osi-game` | **Date**: 2026-11-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-netcrash-osi-game/spec.md`

## Summary

A static, framework-free browser game (speed is shown in Mbps/Gbps/Tbps against distance in meters, an intentional joke). A Catalyst 6500 hits the character, giving it initial energy;
the player locks a power and an angle gauge to launch it, it flies under simple physics and bounces off devices, and the player may press one air Boost control (timing-based, with
an assist option). When the character stops on the road the simulation pauses and an OSI-layer multiple-choice question
appears; correct answers grant energy (power-up) and points, wrong answers allow free retry.
A stop at zero energy triggers a last-chance question every time. The game asks Layers 1-7 once, then a
"Layer 8" boss; beating the boss grants a super energy boost and no further questions, and the run
ends in victory when energy runs out. A celebrate/mourn background animation follows each answer. A pure rule engine grades answers from an authored answer key
per question (never from answer position), a pure simulation module moves the character, and a state
module owns progress, attempts, assistance, and restart. All content lives in editable JSON.
Approach and decisions: [research.md](research.md).

## Technical Context

**Language/Version**: JavaScript (ES2022 native modules), HTML5, CSS3

**Primary Dependencies**: None (no framework, bundler, or runtime library)

**Storage**: N/A (in-memory session only; reload starts fresh, per FR-014)

**Testing**: Dependency-free browser test runner at `netcrash/tests/index.html`, plus a recorded manual
verification note (keyboard, narrow viewport, reduced motion)

**Target Platform**: Current evergreen desktop browsers, served as static files (including a
repository subpath)

**Project Type**: Single-page static web app

**Performance Goals**: Simulation steps at a fixed 50 ms tick regardless of frame rate; input
feedback visible within 100 ms; page load under 2 s on a typical laptop from local static files

**Constraints**: No backend/account/API key/runtime AI (FR-019); keyboard-complete; works on a
narrow viewport; reduced-motion safe; deterministic grading and simulation (no random choice)

**Scale/Scope**: One level, 7 OSI rounds (one per layer, asked once), 1 boss round; 5-10 minute first playthrough

**Workshop cut line**: after the foundational slice and US1 with Layers 1-3 authored, the game is
demonstrable. If time runs short, cut in this order: tuning, celebrate/mourn animation polish, detail for Layers 4-6.
Never cut grading tests, keyboard control, content-error handling, or the source review.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | How the plan satisfies it |
|-----------|--------|---------------------------|
| I. Technical truth | Pass (review open) | One authored answer key and source id per question, plus a reason for every wrong option; validator rejects missing/unknown keys, wrong option counts and unknown sources (FR-015); content review (T043) is a release gate and is still open |
| II. Teaches through a decision | Pass (v1.4.0) | Layers 1-7 in order then Layer 8; each answer explained in text (correct: why; wrong: what the chosen option is). No hints or worked solutions, by owner decision recorded in v1.3.1 |
| III. Progress Is Honest and Retry Is Safe | Pass (v1.4.0) | Last-chance question at every zero-energy stop (a wrong answer there ends the run), distance-based drain, non-scoring boost timing, boosts as a limited collectible resource, free retries everywhere else |
| IV. Access | Pass | Native controls, one keyboard-operable Boost, assist mode, text equivalents, reduced-motion path, paused play during questions |
| V. Deterministic, self-contained | Pass | Static files only, pure functions, no randomness |
| VI. Content/logic separate | Pass | `data/levels.json` plus `engine/` split from `ui/`; trial challenge by data only |
| VII. Done is demonstrated | Pass | Quickstart with recorded results per acceptance criterion; README mirrors spec |
| Scope & Release Constraints | Pass (v1.4.0) | Scope now describes one continuous level ending in a Layer 8 boss |

**Post-design re-check**: all gates pass against constitution v1.4.0. The visual design (below) was
checked against Principles I, IV and V: scenery never alters an answer, every scene value has a text
equivalent, reduced motion gets a static scene, and all art is self-contained inline SVG/CSS.

## Project Structure

### Documentation (this feature)

```text
specs/001-netcrash-osi-game/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── content-schema.md     # data/levels.json contract
│   └── engine-api.md         # evaluate / simulate / session contracts
├── checklists/requirements.md
└── tasks.md                  # /speckit-tasks output (not created here)
```

### Source Code (game lives in `netcrash/`)

```text
netcrash/
├── index.html                Semantic page shell and module entry point
├── style.css                 Layout, focus, feedback states, reduced motion
├── main.js                   Load → validate → start; loading/error screens
├── engine/
│   ├── rules.js              Pure evaluate(round, choice); no DOM or progress
│   ├── content.js            Validate levels.json, registry, sources
│   ├── sim.js                Pure fixed-step simulation (distance, energy, boost)
│   ├── state.js              Session transitions, attempts, assistance, restart
│   └── feedback.js           Turn evaluation results into explanation text
├── ui/
│   ├── render.js             How-to-play briefing, launch gauges, question, feedback, HUD, summary, scene (SVG) + corner readouts
│   └── controls.js           Input events, keyboard/focus, live-region announcements
├── data/
│   └── levels.json           Config, sources, rounds (4 options each), boss
├── tests/
│   ├── index.html            Browser runner with visible totals; zero tests = failure
│   ├── rules.test.js         Cases from the spec, expected values independent of engine
│   ├── sim.test.js           Energy/distance/boost/pause determinism
│   ├── state.test.js         Attempts, assistance, duplicate submit, last-chance, restart
│   └── content.test.js       Invalid/missing/ambiguous/conflicting authored data
└── README.md                 Actual run instructions, behavior, verification record
```

**Structure Decision**: Single static project rooted at `netcrash/` (alongside its existing docs),
with `engine/` (pure, testable) separated from `ui/` (DOM). Run with
`python3 -m http.server 8000 --bind 127.0.0.1` from `netcrash/`.

## Visual Design (FR-027 to FR-031, SC-008)

Reference: the original Flash screenshot (research.md R8). All art is drawn by us as inline SVG
built in `ui/render.js` and styled in `style.css`; no image, audio, or font files and no copied
Flash assets (Principle V, FR-028).

| Element | Approach |
|---------|----------|
| Scene | One SVG, `viewBox 0 0 700 400`, scaled to the play-area width at 7:4. Sky is a CSS gradient behind it |
| Layers (back to front) | Clouds (0.15x scroll), far trees (0.35x), near hedge (0.6x), road and guardrail (1x), landmarks, launcher, boost streaks, character |
| Scroll model | Every layer offset is a pure function of `sim.x` (px = metres x 1.6 x layer factor, camera follows `sim.x`, wrapped to the tile width), so the scene is deterministic and needs no animation timer |
| Landmarks | Eight small SVG groups with no layer labels (Layers 1-7 are generic devices that are not the item in the matching round; the Layer 8 tower appears in the victory glide). They stand along the road as bounce targets (FR-037) |
| Launcher | A large Catalyst 6500 drawn at the start line that scrolls away as the run begins |
| Character | RJ45 plug with cable tail and dizzy face; position bobs with distance, rotation follows distance |
| Corner readouts | HTML overlay on the scene (`aria-hidden`; the same values stay in the header status region): top left energy label, bar and value; top right distance, next question, speed |
| Boost and mood | Streaks show while the boost cooldown is active or in the glide; celebrate/mourn keep the existing CSS animations on the character |
| Reduced motion | `matchMedia('(prefers-reduced-motion: reduce)')` freezes scroll, spin and bob; landmarks are shown statically; text cues remain |
| Text equivalent | `#stage-text` (screen-reader only) reports distance and distance to the next question; SVG has a role and label |
| Verification | Fake-DOM smoke test checks the scene updates and corner readouts; fidelity to the reference is a human check recorded under SC-008 |

## Implementation Order

| Slice | Deliverable | Evidence before next slice |
|-------|-------------|----------------------------|
| 1 · Prove the rule | `rules.js`, `content.js` validator, spec cases | Rule/content tests pass with independently written expectations |
| 2 · Prove the run | `sim.js` and `state.js` (energy, physics, stop = question, pause, last chance, boss) | State/sim tests pass |
| 3 · One playable round | Launch gauges, flight, question, feedback, retry, Boost, HUD | One correct and one wrong path work in browser |
| 4 · Curriculum | The owner's eight questions (7 layers + boss) with per-option reasons, sources | Each round reviewed against sources |
| 5 · Make it usable | Keyboard/focus, assist, reduced motion, narrow layout, errors | Manual checks recorded |
| 6 · Package | README, verification record | Another attendee can run and explain it |

## Complexity Tracking

No unresolved violations. The earlier exceptions (last-chance without retry, distance-based energy
and boost timing, single level) are now covered by constitution v1.4.0.

## Frame Rate and Animation Default (FR-034, SC-009)

(The earlier hop/target-device model described here was removed; see the next section.)

| Decision | Detail |
|---|---|
| 60 fps | `state.view()` exposes `draw` values interpolated between the previous and current fixed step; `controls.js` draws each `requestAnimationFrame`; `render.js` writes DOM only when a value changed. |
| Animation default | `render.js` default is on; the briefing notes the system preference and the switch (constitution v1.4.0). |

## Launch Sequence, Physics and Question Format (FR-001 to FR-003, FR-011, FR-035 to FR-039)

| Decision | Detail |
|---|---|
| Phases | `briefing -> aim-power -> aim-angle -> launching -> flying -> (question) -> flying ... -> glide -> summary`. `state.js` owns the gauge clock (`gaugeMs`) and the launch cinematic timer; gauge value is a triangle wave of the clock, locked with the clock plus the leftover frame time so the player gets what they saw. |
| Physics | `engine/sim.js`: fixed 50 ms step split into 5 sub-steps; gravity, velocity vector, road bounce (restitution 0.45, friction), device bounce (restitution above 1 plus a minimum kick, `+bounce.energy`), sliding to a stop = miss. Energy drains per meter travelled; at zero energy the character just carries on until it stops, then the last-chance rule applies. Boost = air impulse. |
| Devices | Static deterministic list built in `createSim` from `config.devices` (first gap, growing gaps, per-kind top heights, contact half width). No randomness. |
| Questions | `data/levels.json` schema version 2: each round has a prompt, four lettered choices each with a reason, a correct choice, and a source id. The Layer 8 question is the boss (informal). `engine/rules.js` has one evaluator for all questions; the old concept/briefing/hint model is removed. |
| Rendering | Same scene; adds aim arrow, gauges (buttons), bull-Catalyst charge (later section), an altitude zoom-out camera (`cameraZoom`, see "Looser Gravity" below) for high arcs, standing character on the briefing screen. Frame interpolation uses prev/current position. |

## Rigid-Body Contact, Tail, Face and Dials (FR-005c, FR-028, FR-036 to FR-043)

| Decision | Detail |
|---|---|
| Body | `engine/sim.js`: character = rectangle (half sizes `physics.body`), state `x,y` (center of gravity), `th`, `w`, plus a 4-node Verlet tail chain anchored at the rear. 5 sub-steps per 50 ms; pure and deterministic. |
| Contact | Lowest corner (or the bottom-edge midpoint when nearly flat, blended by tilt) is the contact point `r`. Impulse `j = -(1+e) vn / (1/m + (r x n)^2 / I)` along the surface normal `n` (device tilt), friction impulse along the tangent, `w += (r x J)/I`. Efficiency `eta = 1/(1 + (r x n)^2 / I)` is the bounce quality (0-1): bounce energy, extra kick and launch angle scale with it. Per-device-kind `e`, `halfM`, `tiltDeg` in config. |
| Road | Same solver with road restitution and friction; spin damped per contact; a slow landing sticks, the body rights itself and slides to a stop (= miss). |
| Boost | Needle = triangle wave of the sweep clock; quality = 1 - 2 abs(p - 0.5); impulse interpolates min..max by quality; `quality >= boost.goodQuality` counts as a good boost for statistics. Assist = quality 1. |
| Dials | SVG analog gauges drawn in the scene's right side (power, angle, boost share one slot, shown only when needed); clicking a dial triggers Lock or Boost; text readouts and buttons remain for keyboard and screen readers. |
| Face and tail | `render.js`: eyes (sclera, pupil, lids, brows) and mouth driven by an emotion chosen from sim events (bounce quality, boost quality, miss) and the UI mood; the tail is drawn from the sim's chain. |

## Side-view Plug, Stronger Bounces, Perfect Boost (FR-005c, FR-028, FR-040)

| Decision | Detail |
|---|---|
| Plug art | Side view: boot (rear), clear housing with the face, latch tab sloping along the top from front to back, gold head with 8 pin bars at the front. Drawn at scale 1.7; physics half sizes scaled to match (`bodyHalfW` 23.4, `bodyHalfH` 15.9). |
| Bounce reward | `devices.energy` 90 (scaled by quality, floor `energyMinFrac`), bigger `padKickMps`, plus a forward speed gain `padSpeedGain x quality`. |
| Perfect boost | In `sim.step`, a press with quality at or above `boost.goodQuality` sets the velocity direction to `airBoost.optimalAngleDeg`, speed = max(speed, `perfectMinMps`) + `perfectGainMps` x quality (capped), and multiplies spin by `perfectSpinKeep`. Other presses keep the proportional impulse. |

## Full-Screen Layout (FR-045)

| Decision | Detail |
|---|---|
| Structure | `body` is a full-height flex column: compact `#hud` title bar, then `main` filling the rest. `main` holds the scene (`position:absolute; inset:0`) and one floating `.panel` for the current screen's text and controls. |
| Scene width | The SVG keeps a 400-unit height; `render.js` sets the viewBox width to 400 x (main width / main height), clamped to 430-1000, on build and on window resize. The character sits at 30% of the width and the dials at the right edge. Tiles (clouds, trees, road, lines) are generated wide enough for the maximum width. |
| Panels | Briefing, question, feedback, summary and error: a centered card near the top. Aiming and flight: a small bar at the bottom (Lock / Boost button and text) so the character and dials stay visible. |

## Boost Limit, Pickups, Network Access, Mobile Format, Frame-Rate Meter (FR-046 to FR-050)

| Decision | Detail |
|---|---|
| Boosts | `sim.boosts` (start `boost.startCount` 3, cap `boost.maxCount` 6); a successful air Boost spends one. Stronger `airBoost` numbers and `perfectMinMps`/`perfectGainMps`. |
| Pickups | `config.pickups`: deterministic list (`firstX`, `gapM`, heights pattern, radius). Collected when the body center is within `pickupR + body half height`; `sim.pickups[]` carries a `taken` flag; `pickupSeq` for the face and effect. |
| Network | `netcrash/serve.py`: `ThreadingHTTPServer` on 0.0.0.0, prints LAN IPs, refuses `.zip` and `Zone.Identifier`; README covers WSL2 portproxy and the Windows firewall. |
| Format | `ui/device.js` (pure, tested): `chooseFormat({userAgent, uaMobile, coarse, width, height, override})`; `main.js` sets `html[data-format]`. Mobile = a portrait column (full height, width capped) with touch-sized buttons. |
| Portrait scene | viewBox `0 (400-h) w h` keeps the ground at y=400; width 420 and height up to 900 in portrait; the dials move to mid-height right. |
| FPS meter | `controls.js`: rolling 1 s average and worst frame; auto `data-quality=low` after 3 s below 40 fps (hides clouds and far trees). |

## Action Button, Bull Launcher, Relaunch Dials, Layer 8, Speed (FR-038, FR-040, FR-051 to FR-053)

| Decision | Detail |
|---|---|
| Action button | One HTML button inside `.stage`, positioned from the dial's SVG coordinates (`render.js`), id `lock-btn` (aim) or `boost-btn` (flight). The bottom `.panel.bar` becomes visually hidden (screen-reader text only) for aiming, launching and flight on all formats. |
| Bull | `launcher()` redrawn as the Catalyst with arms, legs, horns, an emoting face and steam. Animated from time and phase: idle paw/snort while aiming; wind-up then charge during `launching` (`launch.impactMs` 1100); smug after impact. |
| Relaunch | `state.next()` after a correct answer enters `aim-power` with `relaunch`; locks use the same gauges; the same charge (`launch.impactMs`) with the bull placed at `launch.x` (sim x at impact) plus the hit gap; power = gauge power + `relaunch.stepMps` x correct answers. |
| Speed | Higher `powerMin/MaxMps`, `relaunch.mps`, `maxSpeedMps`, gravity scaled to keep arcs; larger `devices.energy`, `padKickMps`, `padSpeedGain`. |
| Layer 8 | Boss text rewritten in `data/levels.json` (same key `c`). |
| Testability | `ui/device.js` gains pure `sceneSize(W, H)` and `createQualityMonitor()`; `tests/serve.test.js` checks `serve.py` (200 for the game, 404 for zip/py/ps1). |

## Out-of-Energy Question, Dry Drag, Flatter Flight (FR-008, FR-040)

| Decision | Detail |
|---|---|
| Question at every dry stop | `state.js handleStatus`: a `missed` stop with zero energy opens the next question as a last chance every time; only a wrong last-chance answer (or no questions left) ends the run. `lastChances` counts them. |
| Dry drag | `sim.js`: at zero energy horizontal speed decays at `physics.dryDragPerS`, so the character comes down and stops instead of floating. |
| Flatter flight | Angle dial range `angleMinDeg`..`angleMaxDeg` (8..62, center 35); `gauge.assistAngleDeg`, `relaunch.angleDeg`, `airBoost.optimalAngleDeg` about 35; more `airBoost.*Vx`, less `*Vy`; device kinds tilt more forward. |
| Bounce angle | After a device bounce the velocity direction is blended toward `devices.padAngleDeg` by contact quality x `devices.padAimBlend`; speed is kept. Better contact, better angle. |

## Forward-Only Contacts and Plaid (FR-040, FR-044, FR-054)

| Decision | Detail |
|---|---|
| Vault | `sim.js collideSolid`: a corner inside a device box is pushed out horizontally (position only), the velocity is never reflected: `vx = max(vx, vaultMinMps)`; on the first contact with that device (cooldown `vaultCoolMs`) add `vaultBoostMps` and a vertical speed that clears the top (`sqrt(2 g need)`, capped `vaultMaxVy`); while still pressed against the wall the rise continues. Sliding into a device un-grounds and vaults. |
| Additive bounce | After a top bounce `vx = max(vx, vxBefore + padAddVx x quality)`. A fuzz test checks `vx` never goes negative in any contact. |
| Plaid | `sim.js`: `plaid` flag with hysteresis (`speedGbps >= thresholdGbps` on, `< exitGbps` off), `plaidSeq` entry counter; cruise phase only. `render.js`: tartan SVG pattern background (hides sky, clouds, trees), speed streaks, an RV-cabin cutaway (`rv` group) with two original cartoon characters whose eyes dart and whose mouths gape, and the speech bubble. |
| Speed scale | `displayBitsPerMps` 2.667e9 so 150 m/s = 400 Gbps (SUPERSEDED: now 2e9 and 200 m/s, see "Looser Gravity"); `perfectMinMps` 100, `perfectGainMps` 30 (a perfect boost alone reaches about 340 Gbps; bounces add the rest). |

## Looser Gravity, Faster Scroll, Stronger Contacts (FR-040, FR-044, FR-054)

| Decision | Detail |
|---|---|
| Gravity and speed | `physics.gravity` 12 (was 18), launch and boost speeds about 1.2x, `maxSpeedMps` 230. |
| Scroll | `SCENE.pxPerM` 2.0 (was 1.6) with art scales raised to match (`charScale` 1.95, `devScale` 1.05); the view width in meters shrinks accordingly. A `world` group is zoomed out about the road under the character when it flies high (min 0.5x, smoothed), replacing the old camera lift, so the road and devices always stay in view. |
| No dropping | `drainPerMeter` 0.05 (was 0.14) and `dryDragPerS` 0.3 (was 0.9): a dry character glides to a stop instead of falling straight down. |
| Contact power | `padKickMps` 50, `padAddVx` 30, `padSpeedGain` 0.45, `devices.energy` 220, `vaultBoostMps` 22, `vaultMinMps` 20. |
| Plaid scale | `displayBitsPerMps` 2e9: 200 m/s = 400 Gbps; device gaps grow 24 m per device. |

## Boss After the Layer 7 Relaunch, New Layer 8 Question (FR-023, FR-053)

| Decision | Detail |
|---|---|
| Flow | `state.js submit`: a correct Layer 1-7 answer always leads to `pendingNext = 'flying'` (the re-aim); `handleStatus` on a `missed` stop opens the boss when all 7 rounds are done and it is not yet defeated (`openBoss`: no last chance, retries free). |
| Content | `data/levels.json` boss replaced with the owner's CYA-encapsulation question, key `b`. |

## Hard Launch on Every Top Landing (FR-040)

| Decision | Detail |
|---|---|
| One bounce routine | `sim.js padBounce` is used by both the plane-crossing landing and the "corner already inside the top" fallback in `collideSolid`, so no landing path leaves the character resting on top. |
| Haul floor | After the contact result, kick and angle blend (never below `padAimFloor` 0.85), exit speed = max(speed, `padMinExitMps` 150 x (0.6 + 0.4 x quality)), capped at `maxSpeedMps`; forward speed is still additive (`padAddVx`). |
| Test | Grid of near-vertical falls (kinds 1, 2, 4-7; four tilts and spins): exit vx >= 75 and at least 150 m covered in 2 s. |

## Camera Zoom (FR-055)

| Decision | Detail |
|---|---|
| Pure function | `ui/device.js cameraZoom(heightPx, fitPx, minZoom = 0.5)`: 1 while low, `fit / height` above it, clamped; used by `render.js` with fit 300 px (landscape) or half the scene height (portrait) and smoothed per frame. |
