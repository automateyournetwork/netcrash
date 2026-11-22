---

description: "Task list for NETCRASH First Playable (OSI Layer Crash)"
---

# Tasks: NETCRASH First Playable (OSI Layer Crash)

**Input**: Design documents from `/specs/001-netcrash-osi-game/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included. The constitution (Principles I, VII) and plan require a browser test runner with independently written expected values.

**Organization**: Grouped by user story. All game code lives under `netcrash/` (see plan.md Structure Decision). Run from `netcrash/` with `python3 -m http.server 8000 --bind 127.0.0.1`.

> **Note (2026-11-22):** Phases 5c and 5d supersede parts of the earlier completed tasks below (concepts, per-concept briefings, hints and worked solutions, "500 m" question triggers, the hop model). Those tasks stay as history of what was built then; current behavior is in spec.md, plan.md and Phases 5c/5d.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 = Make and understand a decision, US2 = Learn from help and finish the run, US3 = Accessible controls
- Data-model citations use `data-model.md` and the exact `Entity.field`

## Phase 1: Setup

- [X] T001 Create the directory layout from plan.md: `netcrash/{engine,ui,data,tests}/` with empty module files `engine/{rules,content,sim,state,feedback}.js`, `ui/{render,controls}.js`, `main.js`
- [X] T002 [P] Create `netcrash/index.html` semantic shell (header with HUD region, main challenge area, explanation region, `aria-live` feedback region, module entry `main.js`) using relative paths only
- [X] T003 [P] Create `netcrash/style.css` base layout, visible focus ring, feedback states (text plus color), and `prefers-reduced-motion` rules
- [X] T004 [P] Create `netcrash/tests/index.html` dependency-free runner that imports all `*.test.js`, shows pass/fail totals and failing case IDs, and reports zero discovered tests as failure
- [X] T005 [P] Create `netcrash/README.md` skeleton: purpose, run command, test URL, behavior summary, empty verification table (pass/fail/not run, date, environment, evidence)

---

## Phase 2: Foundational (blocks all stories)

- [X] T006 Before writing tests: rewrite the case table in `netcrash/SPEC.md` (wrong answer keeps the round open, scoring, no "eighth round") or retire it; retire or sync `netcrash/PLAN.md` so it matches (`netcrash/CONSTITUTION.md` was already synced to constitution v1.1.1 and is kept identical to `.specify/memory/constitution.md`), and ensure the docs match the clarified game, `specs/001-netcrash-osi-game/`, and constitution v1.1.0
- [X] T007 Define the content document shape in `netcrash/data/levels.json` per contracts/content-schema.md, with `config` values per data-model.md `Config.initialEnergy`, `Config.drainPerMeter`, `Config.questionSpacingM`, `Config.powerUpEnergy`, `Config.superBoostEnergy`, `Config.speed.launchMps`, `Config.speed.stepMps`, `Config.glide.speedMps`, `Config.glide.drainPerMeter`, `Config.displayBitsPerMps`, `Config.boost.goodM`, `Config.boost.mistimedM`, `Config.boost.cooldownMs`, `Config.boost.sweepMs`, and `Config.boost.goodWindowPct` (research.md R3 starting values), plus `sources` for GFG OSI and Cisco Press
- [X] T008 Implement `netcrash/engine/content.js` validator per contracts/content-schema.md: uniqueness per data-model.md `Source.id`, `Concept.id`, `Round.id`; references per `Concept.sourceId`; hints per `Round.hints`; the four error messages for `Round.correctLayer` against `Concept.layer` (range 1-7, null, conflict, ambiguous without qualifier); the `Concept.ambiguous`/`Round.qualifier` rule, and boss validation per data-model.md `Boss.informal`, `Boss.choices`, `Boss.rule` (missing/unknown `rule.correctChoice` or missing `rule.sourceId` → content error)
- [X] T009 [P] Write `netcrash/tests/content.test.js` covering spec cases: key 8, null key, ambiguous addressing prompt, conflicting key (R1 keyed to 2), each yielding a "Content error" with round ID; expected strings written from the spec, not from the validator
- [X] T010 Implement `netcrash/engine/rules.js` `evaluate(round, concepts, choice)` per contracts/engine-api.md; answer derived from `Concept.layer`, invalid input for empty/non-integer/out-of-range choice; also implement `evaluateBoss(boss, concepts, choiceId)` per contracts/engine-api.md (answer is `Boss.rule.correctChoice` per data-model.md, not choice order)
- [X] T011 [P] Write `netcrash/tests/rules.test.js` with the spec case table rows (R1-R7 correct and plausible-mistake, lowest/highest layer, no selection) as independent expectations; wrong-answer expectations use retry semantics (no round completion on wrong); add boss cases: correct, wrong (boss stays open for retry), unknown choice ID
- [X] T012 Implement `netcrash/engine/feedback.js` turning evaluation results plus `Round.misconceptions` into explanation text naming the misconception and a next step (FR-006)
- [X] T013 Implement `netcrash/engine/sim.js` `step(simState, input, config)` per contracts/engine-api.md: fixed 50 ms tick, distance advancing by speed (`Config.speed.launchMps` plus `Config.speed.stepMps` per correct answer, `Config.glide.speedMps` in glide), distance-based drain (`Config.glide.drainPerMeter` in glide), a `formatSpeed` helper using `Config.displayBitsPerMps`, energy floor 0 (data-model.md `Session.energy`), boost values per `Config.boost.goodM`, `Config.boost.mistimedM`, `Config.boost.cooldownMs`, `Config.boost.sweepMs`, `question-due` every `questionSpacingM`, `stopped` at 0 energy, boost with cooldown and good-window sweep, `assist` flag
- [X] T014 [P] Write `netcrash/tests/sim.test.js`: determinism for identical inputs, drain per meter, question trigger at 500 m multiples, energy never negative, well-timed vs mistimed vs assist boost, cooldown, no stepping when paused, speed ramp and `formatSpeed` outputs (Mbps, Gbps, Tbps), and the balance check (FR-026): scripted runs with 0 or 1 well-timed boosts end out-of-energy before the boss, runs with 2 to 4 reach it only via the Layer 7 last chance, runs with 5 or more reach it without the last chance, and an Assist run reaches the boss (adjust the counts if tuning changes); the last-chance tie rule from contracts/engine-api.md
- [X] T015 Implement `netcrash/engine/state.js` session core per data-model.md: `Session.phase` transitions (including `glide`), `Session.score` never decreasing, `Session.completedRoundIds` unique IDs, valid-attempt counting per `Session.attempts`, `Session.lastChanceUsed`, `Session.bossDefeated`, `Session.outcome`, duplicate-submit guard, and `restart(confirmed)`
- [X] T016 [P] Write `netcrash/tests/state.test.js` for the transitions above (wrong answer keeps round open, repeated submit, no-selection no attempt, content error leaves state unchanged, restart/cancel)
- [X] T017 Implement `netcrash/main.js` load-validate-start flow: fetch `data/levels.json` via relative URL, run validator, show loading and content-error screens (no learner attempt counted)
- [X] T018 Add a per-concept briefing step to `netcrash/engine/state.js` and `netcrash/ui/render.js`: show data-model.md `Round.briefing` with a worked example different from the challenge before the first question for a concept not yet seen (FR-001), and cover it in `netcrash/tests/state.test.js`

**Checkpoint**: Open http://127.0.0.1:8000/tests/ — all foundational tests green, nonzero test count.

---

## Phase 3: User Story 1 - Make and understand a decision (Priority: P1) MVP

**Goal**: Briefing, launch by Catalyst 6500, automatic flight with Boost, a question at 500 m, correct/wrong feedback with retry.

**Independent Test**: Quickstart scenarios 1-3, 7.

- [X] T019 [US1] Author Layer 1 content in `netcrash/data/levels.json`: concept `raw-bit-transmission` (cite GFG Layer 1 and Cisco Table 5-3), round with item Cat6 cable, briefing, prompt "Which layer transmits raw bits over a physical medium?", `Round.correctLayer`=1, misconception for layer 2, hints per `Round.hints`
- [X] T020 [P] [US1] Author Layer 2 and Layer 3 rounds and concepts in `netcrash/data/levels.json` using unambiguous items (switch forwarding by MAC; router and IP addressing, prompt qualifies MAC vs IP) with `Concept.layer` and `Round.correctLayer`
- [X] T021 [US1] Implement `netcrash/ui/render.js` views: first briefing, Catalyst 6500 impact launch, HUD (distance in meters, speed in Mbps/Gbps/Tbps, energy, score) and a briefing line explaining that the speed units are an intentional joke (FR-025), challenge (item description plus SVG with `diagramText` text equivalent), feedback/explanation area
- [X] T022 [US1] Implement `netcrash/ui/controls.js`: layer choice radio group 1-7, Submit, Boost button, rAF loop that accumulates time and calls `sim.step`, pausing while a question is open (FR-005d)
- [X] T023 [US1] Wire correct answer to +1 point, power-up energy from `config.powerUpEnergy`, completion once, and Next resuming flight; wrong answer shows explanation, no energy/points, stays open (FR-004, FR-005, FR-022)
- [X] T024 [US1] Show "Select a layer" guidance for empty submissions with no attempt/grade change (FR-009); disable Submit after success and guard duplicates in state (FR-010)
- [ ] T025 [US1] Record the US1 acceptance results (quickstart 1-3, 7, 14, 17) in `netcrash/README.md` verification table

**Checkpoint**: A learner can play from briefing to the first answered question.

---

## Phase 4: User Story 2 - Learn from help and finish the run (Priority: P1)

**Goal**: Hints, assistance and progress tracking, full OSI sequence, last-chance, Layer 8 boss with victory lap, result animations, summary, restart.

**Independent Test**: Quickstart scenarios 4, 5, 8, 9, 11.

- [X] T026 [P] [US2] Author Layers 4-7 rounds and concepts in `netcrash/data/levels.json` (TCP/UDP ports, session setup/teardown, data representation/encryption formats, HTTP and DNS), each citing source and section; avoid NIC, firewall, rack as graded answers (research.md R6)
- [X] T027 [US2] Add the super-boost victory lap in `netcrash/engine/sim.js` and `netcrash/engine/state.js`: boss defeat grants `Config.superBoostEnergy`, enters `glide` with no further questions, Boost still usable, and the run ends with `Session.outcome`=`victory` when energy runs out (FR-023)
- [X] T028 [US2] Author the informal Layer 8 boss in `netcrash/data/levels.json` per data-model.md `Boss.informal`, `Boss.choices`, `Boss.rule`: non-OSI labeled choices, `Boss.rule` with `correctChoice`, a required `sourceId`, and an explanation; a source for "Layer 8" is required before release (gated by the source review task)
- [X] T029 [US2] Implement hints in `netcrash/engine/state.js` and `netcrash/ui/controls.js`: method hint then worked solution per `Round.hints`; record viewing as assistance, never completing the round (FR-011) (hints per data-model.md `Round.hints`)
- [X] T030 [US2] Implement the question sequence and boss trigger in `netcrash/engine/state.js`: Layers 1-7 once in order; the boss appears immediately after the Layer 7 question completes (not at a 500 m mark); a wrong boss answer keeps it open for retry with no energy or point change; boss success hands off to the glide phase (FR-021, FR-023)
- [X] T031 [US2] Implement last-chance in `netcrash/engine/state.js`: at zero energy one question (the next unasked layer, asked early and not repeated), at most once per run; correct grants a power-up and resumes, wrong ends the run with no retry; a later zero-energy event ends the run without a question (FR-008)
- [X] T032 [P] [US2] Extend `netcrash/tests/state.test.js` for hints/assistance, single-pass sequence, boss trigger, glide after boss with no questions, last-chance both outcomes, and no energy drain during questions; also cover boss retry, once-per-run last chance, immediate boss trigger, and victory outcome only after the boss
- [X] T033 [US2] Implement the summary view in `netcrash/ui/render.js`: distance, points, completed rounds, valid attempts, and assistance shown separately, with outcome (victory or out-of-energy) (FR-012)
- [X] T034 [US2] Implement Restart with confirmation dialog (confirm clears to first briefing, cancel preserves) in `netcrash/ui/controls.js` (FR-013)
- [X] T035 [US2] Implement the celebrate (correct) and mourn (wrong, including boss) background animations in `netcrash/ui/render.js` and `netcrash/style.css`: non-blocking, paired with the text feedback, never delaying controls, with a static textual cue under `prefers-reduced-motion` (FR-024)
- [ ] T036 [US2] Record US2 acceptance results (quickstart 4, 5, 8, 9, 11, 15, 16) in `netcrash/README.md`

**Checkpoint**: A full run, including the boss, can be played and summarized.

---

## Phase 5: User Story 3 - Play with accessible controls (Priority: P1)

**Goal**: Complete keyboard play, assist, announced feedback, reduced motion, narrow layout.

**Independent Test**: Quickstart scenarios 6, 12.

- [X] T037 [US3] Implement the Assist toggle in `netcrash/ui/controls.js` feeding `input.assist` to `sim.step`; record use as assistance and show it in the summary (FR-005c)
- [X] T038 [US3] Ensure every core control has an accessible name, visible focus, and logical tab order across `netcrash/index.html` and `netcrash/ui/render.js`; move focus deliberately after screen changes (FR-017)
- [X] T039 [US3] Announce results through the live region in `netcrash/ui/controls.js`; verify feedback text does not depend on color alone and remains available to read
- [X] T040 [P] [US3] Implement reduced-motion behavior in `netcrash/style.css` and `netcrash/ui/render.js`: replace sweeping marker and flight animation with a textual "Boost window: open/closed" and stepped distance; offer Assist at start (research.md R4)
- [X] T041 [P] [US3] Make the layout work on a typical laptop and a narrow window in `netcrash/style.css`; dense data scrolls in a labeled container without hiding action buttons (FR-018)
- [ ] T042 [US3] Perform and record keyboard-only, narrow-window, and reduced-motion checks (quickstart 6, 12) in `netcrash/README.md`, noting what was actually checked

---

## Phase 5c: Bounce gameplay, 60 fps, default animation (FR-032 to FR-035, SC-009)

- [X] T057 Amend the constitution to v1.2.0 (Principle IV: animation default on, switch before play) in `.specify/memory/constitution.md` and `netcrash/CONSTITUTION.md`
- [X] T058 Replace the cruise model in `netcrash/engine/sim.js` with hops, devices, bounce and miss per plan "Bounce Gameplay"; update `netcrash/engine/content.js` config validation and `netcrash/data/levels.json` (`bounce` block, remove `questionSpacingM`)
- [X] T059 Update `netcrash/engine/state.js`: question on `missed`, relaunch after correct answer, interpolated `draw` values in `view()`
- [X] T060 Rewrite the scene motion in `netcrash/ui/render.js` and `netcrash/ui/controls.js`: devices on the road, arc height, bounce squash, per-frame drawing, default animation on, briefing note
- [X] T061 Rewrite `netcrash/tests/sim.test.js` and `netcrash/tests/state.test.js` for hops/bounce/miss/balance and keep `netcrash/tests/ui-smoke.mjs` passing
- [ ] T062 (merged into T088) Measure frame rate in a real browser (SC-009) and record the result in `netcrash/README.md`; owner confirms the bounce feel (extends T055)
- [X] T063 (superseded by T065; questions supplied by the owner) Replace the question set with the 10 easiest worksheet questions (FR-035) once the owner supplies the worksheet text; update `data/levels.json`, sources (T043) and tests

---

## Phase 5d: Launch gauges, physics, owner questions (FR-001 to FR-003, FR-011, FR-035 to FR-039)

- [X] T064 Amend the constitution to v1.3.0 (no hints/worked solutions, no per-concept briefings) in `.specify/memory/constitution.md` and `netcrash/CONSTITUTION.md`
- [X] T065 Replace the questions in `netcrash/data/levels.json` with the owner's eight multiple-choice questions (schema version 2, one reason per option); rewrite `netcrash/engine/content.js`, `netcrash/engine/rules.js`, `netcrash/engine/feedback.js` for the new shape
- [X] T066 Rewrite `netcrash/engine/sim.js` as projectile physics with devices, road/device bounce, air boost and relaunch (FR-037, FR-038, FR-039)
- [X] T067 Update `netcrash/engine/state.js`: aim-power, aim-angle and launching phases, gauge clock and lock, last chance after stopping with zero energy, no hints/briefings
- [X] T068 Update `netcrash/ui/render.js`, `netcrash/ui/controls.js`, `netcrash/style.css`: standing character, gauges, aim arrow, Catalyst streak, physics-driven character, camera lift, question screen with options only
- [X] T069 Rewrite `netcrash/tests/*.test.js` and `netcrash/tests/ui-smoke.mjs` for the new model and keep them passing; they cover FR-001 to FR-003, FR-011, FR-021, FR-026, FR-032, FR-033, FR-036 to FR-039 (FR-034/SC-009 and the owner's feel check are T062/T070)
- [ ] T070 (merged into T077) Owner review of the launch sequence and physics feel in a real browser (extends T055/T062)

---

## Phase 5e: Dials, rigid-body contact, tail and face (FR-005c, FR-028, FR-036 to FR-043)

- [X] T071 Rewrite `netcrash/engine/sim.js` as a rigid body (center of gravity, orientation, spin), impulse-based road and device contact with quality, quality-based Boost, and a Verlet tail chain; update `netcrash/engine/content.js` validation and `netcrash/data/levels.json` (FR-005c, FR-037, FR-040, FR-041)
- [X] T072 Update `netcrash/engine/state.js` for the new sim fields (bounce quality, boost quality, `launch` spin) and the dial values in `view()`
- [X] T073 Build the analog dials (power, angle, boost) in the scene's right side, clickable and shown only when needed, in `netcrash/ui/render.js`, `netcrash/ui/controls.js`, `netcrash/style.css` (FR-036, FR-043)
- [X] T074 Draw the tumbling character with swinging tail and the emoting face with human-like eyes in `netcrash/ui/render.js` (FR-028, FR-041, FR-042)
- [X] T075 Rewrite `netcrash/tests/sim.test.js`, `state.test.js`, `ui-smoke.mjs` for rigid-body contact quality, boost quality, tail, dials and emotions; keep all tests passing
- [X] T076 Update `data-model.md`, `contracts/engine-api.md`, `contracts/content-schema.md`, `research.md` R9, `quickstart.md`, README for the above
- [ ] T077 Owner review of everything playable in a real browser, one checklist (absorbs T055, T070, T096, T099, T104, T106, T109): launch dials and bull charge, power-up re-aim, bounces, hard landings and forward-only contacts, tumble/tail/face, plaid scene, flight feel and scroll speed, camera zoom, the single Lock/Boost button on a phone and a desktop, the out-of-energy flow, the Layer 8 question

---

## Phase 5f: Side-view plug, stronger bounces, perfect boost (FR-005c, FR-028, FR-040)

- [X] T078 Update `netcrash/engine/sim.js`, `engine/content.js`, `data/levels.json`: bigger bounce energy, kick and speed gain; perfect-angle launch on a green-range Boost; scaled body size
- [X] T079 Redraw the plug as a side view in `netcrash/ui/render.js` (boot, housing, top latch, 8-pin gold head, side face)
- [X] T082 Full-screen layout: compact title bar, full-window scene with adaptive viewBox, floating panels (FR-045) in `netcrash/ui/render.js`, `netcrash/ui/controls.js`, `netcrash/style.css`, `netcrash/index.html`; update smoke test and verify at 1280x720 and 360 px wide
- [X] T083 Horizontal pins on the plug head (`netcrash/ui/render.js`) (FR-028)
- [X] T084 Boost count (start 3), stronger boosts, collectible Boost pickups: `netcrash/engine/sim.js`, `engine/content.js`, `data/levels.json`, render, tests (FR-046, FR-047)
- [X] T085 `netcrash/serve.py` LAN server and README instructions for WSL/Windows (FR-048)
- [X] T086 `netcrash/ui/device.js` format detection with tests, mobile portrait layout and touch CSS, `main.js` wiring (FR-049)
- [X] T087 FPS meter and automatic low-quality mode in `netcrash/ui/controls.js` and `netcrash/style.css` (FR-050)
- [ ] T088 Owner performance test on another desktop and a phone (2026-11-22: runs fine on another PC and the server is reachable; fps numbers still to be recorded with `?fps=1`); record fps and device in `netcrash/README.md` (SC-009)
- [X] T080 Update tests (`sim.test.js`, `ui-smoke.mjs`), data-model, engine-api contract, quickstart and README; keep all tests passing
- [X] T081 Add solid device collision (sides, underside, sliding) to `netcrash/engine/sim.js` with per-kind `boxHalfM`/`boxBottomM` in config, tests, and rendering of the wince (FR-044)

---

## Phase 5g: Action button, bull launcher, relaunch dials, Layer 8, speed (FR-038, FR-040, FR-051 to FR-053)

- [X] T089 Faster flight: raise speeds and device energy/kick/speed gain in `netcrash/data/levels.json`; retune balance and tests (FR-040)
- [X] T090 Relaunch through the dials after a correct answer in `netcrash/engine/state.js` (aim phases with `relaunch`), tests and bots updated (FR-038)
- [X] T091 Rewrite the Layer 8 boss question with an Office Space flavor in `netcrash/data/levels.json`; tests keep key `c` (FR-053)
- [X] T092 Single action button above the dial; hide bottom instruction panels visually on all formats in `netcrash/ui/render.js` and `netcrash/style.css` (FR-051)
- [X] T093 Animated angry-bull Catalyst 6500 with arms, legs, emoting face, steam, wind-up and charge in `netcrash/ui/render.js` (FR-052)
- [X] T094 Pure helpers `sceneSize` and `createQualityMonitor` in `netcrash/ui/device.js` with tests; `netcrash/tests/serve.test.js` for `serve.py` (analysis C1)
- [X] T095 Spec Kit catch-up edits from the 2026-11-22 analysis: README Boost bullet and verification rows, research R3/R4 numbers, quickstart scenarios, constitution Principle III note, task cleanup (I1-I6, C2, C3, C5)
- [ ] T096 (merged into T077) Owner review of the bull, relaunch dials, speed and the new button on a phone and desktop

---

## Phase 5h: Bull on every launch, readable label (FR-038, FR-052)

- [X] T097 The bull appears, charges and rams on every launch including the power-up re-aim; `view().launch` carries the impact position; remove `launch.relaunchMs`; keep the "Catalyst 6500" label clear of the legs; update tests, data-model, contracts, quickstart, README

---

## Phase 5i: Always a question when out of energy, dry drag, flatter flight (FR-008, FR-040)

- [X] T098 `netcrash/engine/state.js`: a question at every zero-energy stop; `netcrash/engine/sim.js`: dry drag, bounce angle blend; `data/levels.json`, `content.js`: flatter angles, more horizontal boost; update tests, bots, dial labels, docs
- [ ] T099 (merged into T077) Owner review of the new flight shape and the out-of-energy flow

---

## Phase 5j: Forward-only additive contacts, plaid scene (FR-040, FR-044, FR-054)

- [X] T100 Replace side rebounds with forward vaults and make bounces additive in `netcrash/engine/sim.js`, `engine/content.js`, `data/levels.json`; tests incl. a no-backwards fuzz test
- [X] T101 Plaid state (hysteresis, `plaidSeq`) and the speed scale in `netcrash/engine/sim.js`, `data/levels.json`; tests
- [X] T102 Plaid scene in `netcrash/ui/render.js`, `netcrash/style.css`: tartan background, speed streaks, RV-cabin cutaway with two cartoon characters and the speech bubble, text equivalent, summary line; smoke test
- [X] T103 Update data-model, contracts, quickstart, README, RESUME
- [ ] T104 (merged into T077) Owner review of the contact feel and the plaid scene

---

## Phase 5k: Looser gravity, faster scroll, stronger contacts (FR-040, FR-044, FR-054)

- [X] T105 Retune `netcrash/data/levels.json` (gravity, speeds, drain, dry drag, contact power, plaid scale), `SCENE.pxPerM` and an altitude-zoom camera in `netcrash/ui/render.js`; update tests, bots, docs
- [ ] T106 (merged into T077) Owner review of the flight feel (momentum, scroll speed, contact power)

---

## Phase 5l: Boss after the Layer 7 relaunch, new Layer 8 question (FR-023, FR-053)

- [X] T107 `netcrash/engine/state.js`: relaunch after Layer 7 and ask the boss at the next stop; new boss in `netcrash/data/levels.json` (key b); tests, smoke test, docs

---

## Phase 5m: Hard launch on every top landing (FR-040)

- [X] T108 One `padBounce` for every top landing, `padMinExitMps`/`padAimFloor`, tests (grid of near-vertical falls), docs
- [ ] T109 (merged into T077) Owner review: does touching a device now make the character haul?

---

## Phase 5n: Analysis catch-up 2026-11-22

- [X] T110 Apply the 2026-11-22 analysis edits: FR-026 rewritten to what is tested, new FR-055 and pure `cameraZoom` with a test, FR-038/FR-052 wording, content-schema example, research tables, data-model diagram, quickstart, plan constitution rows and superseded notes, README/RESUME, owner-review tasks merged into T077

---

## Phase 5b: Visual presentation (FR-027 to FR-031, SC-008)

**Goal**: the play screen looks and feels like the original's layout using original network art.
**Independent test**: open the game; scene, landmarks, character and corner readouts match the spec and update with distance; reduced motion shows a static scene with text cues.

- [X] T050 [US1] Build the scene in `netcrash/ui/render.js`: SVG 700x400 with clouds, two tree rows, road and guardrail, eight unlabeled landmarks (seven generic devices that are not the matching round item, plus the Layer 8 tower just after the Layer 7 point), Catalyst 6500 launcher, RJ45-plug character, boost streaks, and the corner-readout overlay; scene offsets are pure functions of `sim.distanceM` (FR-027, FR-028, FR-029, FR-030, FR-031; plan.md Visual Design)
- [X] T051 [US1] Style the scene in `netcrash/style.css`: sky gradient, 7:4 scene proportion at any width, corner readouts with text contrast at least 4.5:1, at least 18 px at the 700 px scene width and legible at 360 px, energy bar, question panel and action buttons visible below at laptop and narrow widths; celebrate/mourn animations still target `#character` (FR-027, FR-030, FR-018, FR-024)
- [X] T052 [P] [US3] Verify and style the reduced-motion path of the scene in `netcrash/ui/render.js` and `netcrash/style.css`: scroll, spin and bob frozen; landmarks static; `#stage-text` and mood text present (FR-031, FR-018)
- [X] T053 [P] [US1] Extend `netcrash/tests/ui-smoke.mjs` to assert the scene structure exists, layer offsets and corner readouts change with distance, boost streaks show during cooldown, and no `null`/`undefined` text appears (FR-030, FR-031)
- [X] T054 Re-run `node tests/run-node.mjs` and `node tests/ui-smoke.mjs` after the visual change; the 69 engine tests must be unchanged and passing (constitution VII)
- [ ] T055 Owner review of the running game in a real browser against the reference screenshot (quickstart 20-22), including a reduced-motion check; record pass/fail per FR-027 to FR-031 in `netcrash/README.md` (SC-008). Remains "not run" until the owner reports
- [X] T056 Update `netcrash/README.md` and `netcrash/PLAN.md`/`SPEC.md` notes so the described visuals match the spec (constitution VII)

## Phase 6: Polish & Cross-Cutting

- [ ] T043 [P] Review every shipped briefing, question, and explanation against the cited GFG and Cisco sources; record the review in `netcrash/README.md` (SC-002, Principle I); the Layer 8 boss must have a cited source before release
- [ ] T044 [P] Add the trial-challenge check: add one round through `netcrash/data/levels.json` only and confirm no engine edit is needed (SC-007, quickstart 13)
- [ ] T045 Run all content-error cases in the browser (quickstart 10) and record results
- [ ] T046 Tune `config` values in `netcrash/data/levels.json` after the T049 playtest and, if the user supplies speedrun notes, adjust feel; record changes in `netcrash/README.md`
- [ ] T047 Complete `netcrash/README.md`: implemented behavior, exact run/test commands, limits, a note that speed in bits per second versus distance in meters is an intentional joke (FR-025), and a fresh-start playthrough result (SC-001, SC-006)
- [ ] T048 Run the full quickstart.md and the test runner on a clean browser session; record pass/fail/not run for every acceptance criterion, including scenarios 18 (FR-019, FR-020) and 19 (100 ms feedback, 2 s load)
- [ ] T049 Post-build: run a playtest with at least 5 learners who have no networking background per SC-005 (short layer quiz after the first playthrough, no hints) and record the results in `netcrash/README.md`; T046 follows it

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → US1 → US2 → US3 → Polish. US2 builds on US1's round flow; US3 refines both.
- Within Phase 2: T007 → T008 → T009/T010; T010 → T011/T012; T013 → T014; T015 needs T010, T012, T013.
- The briefing step (T018) needs state.js (T015); the SPEC/PLAN cleanup (T006) must finish before the test tasks.
- The boss handoff (T030) needs the glide phase (T027).
- The animation task (T035) needs render.js feedback from T023.
- Visual phase: T050 before T051-T053; T054 after all of them; T055 needs a human and cannot be marked done by the build agent.
- T019-T020 (content) can run in parallel with T021 once T008 exists.

## Parallel Opportunities

- Setup: T002, T003, T004, T005 together.
- Foundational tests: T009, T011, T014, T016 each in separate files.
- US2: T026 (content) and T027 (sim/state) in parallel; T032 in parallel with T033.
- US3: T040 and T041 in parallel.
- Visual: T052 and T053 in parallel after T050.
- T046 runs after the T049 playtest.

## Implementation Strategy

- **MVP**: Phases 1-3 (US1): one correct and one wrong path in the browser with grading, retry, and flight.
- Then US2 for the full run and boss; US3 for access (all three are P1 per spec, so ship all before release).
- Workshop cut line: after Phase 3 with Layers 1-3 authored the game is demonstrable. Cut order if time is short: animation polish (T035), then tuning (T046), never accessibility or technical-truth checks (constitution VII).
