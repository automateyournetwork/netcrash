# Feature Specification: NETCRASH First Playable (OSI Layer Crash)

**Feature Branch**: `001-netcrash-osi-game`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Please refer to the ./netcrash/SPEC.MD and build the specification"

## Overview

NETCRASH is a browser remake of the "Nanaca Crash" distance game, themed on computer networking.
The game starts with the character struck by a Catalyst 6500 switch, whose impact supplies the
initial energy and launches the character on a single, progressively harder level. The character
travels as far as it can on a limited supply of energy; a question appears whenever the character
stops on the road, one for each OSI layer from 1 to 7, followed by a final informal "Layer 8" boss.
Answering a network-recognition question correctly grants a power-up that adds energy and carries
the character farther; the session ends when the character runs out of energy and stops. Questions
are built around the OSI model, progressing from Layer 1 upward, so an entry-level network engineer
with no prior knowledge learns to recognize the basic building blocks of a network (for example
fiber, copper, Cat5/Cat6, LC/ST connectors, switches, racks, firewalls) and the layer each belongs
to. Each round shows the distance achieved and the points earned.

## Clarifications

### Session 2026-11-22 (twelfth)

- Q: What should happen when the character lands on a device? -> A: It MUST haul. A report showed a
  near-vertical fall onto a device that just rode on top and slid off slowly. Every landing on top of
  a device (including one with a poor contact quality, a steep fall, a tilt or spin) launches the
  character forward at high speed: the exit speed is at least `devices.padMinExitMps` x (0.6 + 0.4 x
  quality) along mostly the ideal angle (never less than `padAimFloor` of the way to it), on top of
  the contact result. Quality only adds to it. The character never rests on top of a device.

### Session 2026-11-22 (eleventh)

- Q: What happens after the Layer 7 question is answered? -> A: The same as after any question: the
  power-up and the re-aim dials, the bull's charge and the relaunch (a bug had skipped these and
  jumped straight to the Layer 8 question). The Layer 8 question is then asked at the NEXT stop on
  the road, like every other question. (This amends the earlier "appears immediately".)
- Q: What is the Layer 8 question now? -> A: The owner's own: "After the CEO's 'quick fix' causes a
  data breach, which Layer 8 frame dominates the post-mortem?" with options A) Three-way handshake,
  B) CYA encapsulation (correct), C) Cross-team blame routing, D) Mandatory trust-fall; explanation:
  "In Layer 8, truth is deprecated but liability is mandatory." This replaces the Office Space version.

### Session 2026-11-22 (tenth)

- Q: Why does the flight run out of momentum and drop straight down? -> A: Energy drained too fast
  and, at zero energy, horizontal speed bled away quickly. Changes: gravity is loosened (arcs stay up
  longer), the energy drain per meter is lower and the dry drag gentler (a gliding stop, not a drop),
  speeds are higher and the scene scrolls faster (more pixels per meter), and touching a device
  imparts much more power (bigger kick, forward gain, energy and vault boost).
- Q: Where is plaid now? -> A: Unchanged in rule (400 Gbps) but the speed scale is retuned for the
  faster flight: 400 Gbps is 200 m/s and plaid ends below 340 Gbps (170 m/s).

### Session 2026-11-22 (ninth)

- Q: Can a device ever send the character backwards? -> A: No. Contact with a device ALWAYS keeps and
  adds forward momentum: after any contact the forward speed is at least what it was before plus a
  forward gain. A side hit vaults the character up and over the device with a forward boost instead of
  rebounding; a character sliding on the road into a device vaults over it; a top landing adds forward
  speed on top of the contact result. Momentum from successive contacts adds up.
- Q: What is the "plaid" moment? -> A: A Spaceballs (1987) homage. When the displayed speed reaches
  400 Gbps the background switches to a fast-scrolling all-plaid scene and a cutaway of an RV cabin
  appears, in which two original cartoon characters (a human pilot, "Lone Starr", and his furry
  sidekick, "Barf") watch the plug streak past with darting eyes and a speech bubble: "He's gone
  plaid!?!". It ends when speed falls below 340 Gbps. The speed scale is set so 400 Gbps (150 m/s; retuned in the tenth session of 2026-11-22 to 200 m/s, see below) is
  reachable with a perfect Boost plus good bounces. Parody in original art, no film images.

### Session 2026-11-22 (eighth)

- Q: What happens when the character stops with no energy? -> A: A question is ALWAYS presented when
  the character has stopped and energy is zero, every time (no longer once per run). It is the
  "last chance" question: a correct answer gives the power-up and the run continues, a wrong answer
  ends the run. Running dry also brings the character down quickly (no long floating at zero energy).
- Q: How should the flight shape change? -> A: Flatter and faster: a lower ideal angle (about 35
  degrees) for the dial, the assist, the perfect Boost and the relaunch; more horizontal Boost; and a
  device bounce launches the character forward along a better angle the better the contact was,
  so devices are easy to chain and coming down onto them is not almost vertical.

### Session 2026-11-22 (seventh)

- Q: Does the bull charge again after a correct answer? -> A: Yes, on every launch: after the power-up
  re-aim the bull appears next to the plug, snorts and paws, then winds up, charges and rams it (an
  earlier clarification said the relaunch had no charge; that was wrong). After the ram it stays where
  it hit and scrolls away. The "Catalyst 6500" name on its belly MUST be readable (not hidden by a leg).

### Session 2026-11-22 (sixth)

- Q: What is the activity control on the phone and on desktop? -> A: One large button directly above
  the dial in the scene: "Lock" while aiming and "Boost" while flying. No instruction text sits over
  the gameplay during aiming and flight (assistive technology still gets it as hidden text).
- Q: How fast should it feel? -> A: Faster scrolling: higher launch, relaunch and top speeds, and
  contact with a device transfers much more energy and forward speed, so a good run flies farther and faster.
- Q: What does the Catalyst 6500 do at the start? -> A: It is an animated character with arms, legs and
  a face that emotes, behaving like an angry bull: it snorts and paws the ground while the player aims,
  then winds up and charges the plug and rams it; afterwards it stands smug.
- Q: How should the Layer 8 question read? -> A: As an Office Space-flavored joke (a boss asking about
  memos and cover sheets, a stapler, a printer, etc., as parody) while the answer key and the technical
  truth stay the same: Layer 8 is the people, management and office politics above the seven layers.
- Q: What happens after a correct answer? -> A: The power and angle dials appear again so the player
  can try to get the best out of the power-up; the relaunch uses the chosen values (Assist locks the
  fixed good values). The Catalyst charges again on every launch.

### Session 2026-11-22 (fifth)

- Q: How many boosts does the player have? -> A: Three at the start. Each Boost used (airborne, with
  energy) spends one. More are collected by flying into Boost power-ups placed along the way. Boosts
  are also stronger than before.
- Q: Can the game be reached from another machine? -> A: Yes: a small static server script serves the
  game on all network interfaces (LAN), blocking the copyrighted reference archive, so the owner can
  performance-test on another desktop. A `?fps=1` frame-rate meter reports average fps and the worst
  frame; if the measured rate stays low the game switches to a lighter drawing quality on its own.
- Q: Is there a phone version? -> A: Yes: a vertical (portrait) format. The game detects the browser
  type (user agent, touch input, screen shape) and chooses the format: a vertical layout for phones
  and tablets held upright, the full-window landscape layout for desktops. The player or tester can
  override with `?format=mobile|desktop`.
- Q: What do the plug's pins look like? -> A: Eight horizontal contact bars stacked along the head
  (not vertical stripes).

### Session 2026-11-22 (fourth)

- Q: How should the screen be laid out? -> A: The gameplay scene fills the whole window below a
  compact title bar. All text, controls, questions, feedback and the summary float over the scene in
  panels; this is safe because gameplay is paused whenever a question or feedback panel is open.
  The scene adapts its width to the window so nothing is cropped.

- Q: Should the character bounce off the sides of devices too? -> A: Yes. Devices are solid: any
  impact on a device (top, side, or underside, in the air or sliding on the road) MUST bounce the
  character off it by the same contact physics. Only a landing on the top is a rewarding bounce
  (energy, kick); a side or underside hit just rebounds it, adds spin, and makes the face wince.

- Q: What should the character look like? -> A: A side view of an RJ45 plug: the latch tab runs along
  the top from the front (right) to the back (left), the gold head at the front shows 8 distinct
  contact pins, and a cable boot sits at the rear where the tail attaches. Eyes and mouth are drawn
  on the side of the clear housing.
- Q: How much should a device bounce give? -> A: A solid bounce MUST be clearly rewarding: it adds at
  least 60 energy (the run starts with 140) and a visible speed gain; a poor one adds much less.
- Q: What does a perfectly timed Boost do? -> A: A Boost pressed in the optimal (green) range assumes
  the perfect angle: the character is relaunched along the optimal angle with a speed gain, and its
  spin is mostly cancelled. Boosts outside the green range keep the proportional push of FR-005c.

### Session 2026-11-22 (third)

- Q: How should the gauges look and where do they go? -> A: As analog dials (needle sweeping across a
  dial, like a fuel gauge) drawn inside the scene on the far right. The power and angle dials appear
  only while needed. The Boost dial also moves into the scene, and boost strength depends
  continuously on timing: the closer the needle to the optimum, the stronger the boost.
- Q: How are bounces decided? -> A: By rigid-body contact physics: the character has a center of
  gravity, an orientation and a spin; a bounce is an impulse at the contact point against the
  device's surface, so a flat landing gives a strong, well-angled bounce and a tilted or glancing one
  gives a weaker bounce and adds spin. Devices differ in springiness and surface tilt.
- Q: What does the character do on impact? -> A: It tumbles (spin comes from the impacts and the
  launch), its Cat6 tail swings as a rope under gravity, and its face shows emotion: happy on solid
  bounces, good boosts and correct answers; sad on misses (and wrong answers). The X eyes are
  replaced by human-like eyes (sclera, pupil, lids, brows) that can emote.

### Session 2026-11-22 (second)

- Q: How does a run start and how does the character move? -> A: The character stands still; the
  player starts the launch, locks a moving power gauge with one click and then a moving angle gauge
  (degrees) with one click; a Catalyst 6500 then streaks across the screen, hits the character and
  launches it. Flight uses simple projectile physics (gravity, bounces) and the character bounces
  off network devices along the road.
- Q: What about hints, worked solutions, briefings and item pictures? -> A: Removed by the project
  owner: a question screen shows only the question and its four lettered options (constitution
  v1.3.0). Per-answer feedback text remains.
- Q: Which questions? -> A: The eight multiple-choice questions the project owner pasted into the
  conversation (Layers 1-7 and the Layer 8 question), in that order. The answer key is the standard
  one (B, C, B, D, B, A, D, C) and is source-checked in T043.

### Session 2026-11-22

- Q: How should flight work? -> A: (Superseded by the second session above: launch gauges and
  projectile physics, FR-036 to FR-039; the hop model was removed.) The character is launched in arcs (hops) and bounces off network
  devices standing on the road. Each bounce relaunches it with extra energy. When a hop lands where
  there is no device (a miss), the character stops and a question is offered as the power-up that
  launches it again. The Boost steers a hop toward the next device.
- Q: Animation default and frame rate? -> A: Scene animation is on by default, even when the system
  reports reduced motion (project owner decision, constitution v1.2.0); the player can turn it off
  in-game, and the briefing says so when the system prefers reduced motion. The scene MUST render
  smoothly at 60 frames per second on a typical laptop.
- Q: Where do the questions come from? -> A: The project owner supplied an external OSI worksheet
  (Scribd 612567969) from which the 10 easiest questions are to be selected; its text could not be
  retrieved automatically, so the question set is pending that text (see Assumptions).

### Session 2026-11-21

- Q: Between questions, does the player control the character or does it travel automatically? → A: Light control: the player also presses one key or button to trigger a bounce or boost, as in the original game.
- Q: Does the timing of the bounce or boost press matter? → A: Yes, a well-timed press gives a bigger boost, with an accessible assist alternative; all gameplay is paused while a question is open.
- Q: What happens when energy reaches zero? → A: The player gets one final "last chance" question; correct continues the run, wrong ends it. Energy drain stops while a question is open.
- Q: Boss and last-chance details? → A: Last chance (superseded in the eighth session: now every time energy is zero at a stop), using the next unasked question in the sequence; the boss appears right after the Layer 7 question and allows unlimited retry without energy or point change.
- Q: After the first pass of seven questions, does the boss end the game or do questions cycle? → A: Single pass (Layers 1-7 once) then the boss. Defeating the boss gives a super energy boost and no more questions are asked; the run ends with a victory summary when energy runs out. A celebrating or mourning background animation follows each answer.
- Q: How should speed be shown, and how is energy balanced? → A: Speed is shown in network units (Mbps, Gbps, Tbps) while distance stays in meters; the mismatch is an intentional joke. Energy is tuned so a run with no well-timed boosts runs out before the boss, and a run with enough well-timed boosts (or Assist) reaches it.
- Q: What should the game look like? → A: It follows the layout of the original Flash game (reference screenshot `nanacacrash_flash_screenshot.png` in `netcrash/nanaca-crash_v110.zip`): a bright, daytime, 700x400-proportioned side-scrolling scene (sky, clouds, parallax tree rows, road with guardrail), a large tumbling character, and large corner readouts. All art is original and network-themed; no sprites, audio, or text from the Flash game are copied.
- Q: Which network item is the flying character? → A: An RJ45 plug with a cable tail and a dizzy face.
- Q: How is visual fidelity verified? → A: By the project owner reviewing the running game in a real browser against the reference screenshot; this is recorded as a human check and never claimed from automated tests.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Make and understand a decision (Priority: P1)

A learner starts a fresh session, reads a short how-to-play briefing, launches the character, then
answers a question by choosing one of four options and explicitly submitting. They see whether it was right, why, and what it
did to their run (energy gained or not, distance, points).

**Why this priority**: This is the core mechanic; without it there is no game and no learning.

**Independent Test**: Start a session, read the briefing, submit one correct and one incorrect
choice on separate runs, and confirm the result, explanation, and run state shown for each.

**Acceptance Scenarios**:

1. **Given** a fresh session, **When** I start, **Then** I see the how-to-play briefing, then the
   character standing still; after I lock power and angle (FR-036) the Catalyst 6500 impact launches
   the character with initial energy, before any challenge can be answered.
2. **Given** the Round 1 question "Which layer transmits raw bits over a physical medium?",
   **When** I select "1 - Physical" and submit, **Then** it is marked correct, an explanation
   appears, I score 1 point, and the character gains energy (power-up).
3. **Given** the same question, **When** I select "2 - Data Link" and submit, **Then** it is marked
   incorrect, the explanation states "Physical transmits bits; Data Link handles frames", no
   energy is gained, no points are added, the round stays open, and I can retry.
4. **Given** no selection, **When** I submit, **Then** "Select an option" appears and score,
   attempts, and completion are unchanged.
5. **Given** the run is flying, **When** I look at the heads-up display, **Then** I see distance in
   meters and the character's speed in Mbps, Gbps or Tbps, and the briefing says
   the mismatch of units is a joke.

---

### User Story 2 - Learn from help and finish the run (Priority: P1)

A learner sees their progress, attempts, and assistance used (assisted Boosts). The run ends when energy runs out, and a summary is shown.

**Why this priority**: Honest progress and help are required by the project constitution and make
the game usable for people with no prior knowledge.

**Independent Test**: Answer a round with a wrong then a right option, play to the end of
energy, and verify the summary reports rounds completed, valid attempts, and assistance separately.

**Acceptance Scenarios**:

1. **Given** an unanswered round, **When** I look at the screen, **Then** I see only the question and
   four lettered options, with no hint or worked-solution controls.
2. **Given** an unsolved round, **When** I make a valid submission, **Then** it counts as one
   attempt; a correct submission completes the round exactly once; submitting again (or
   double-clicking Submit) after completion changes nothing.
3. **Given** a wrong last-chance answer, or energy reaching zero after the last chance was used or
   after the boss was defeated, **When** the run ends, **Then** a summary shows distance, points, completed rounds, valid attempts, and assistance used.
4. **Given** a session in progress, **When** I choose Restart, **Then** I am asked to confirm;
   confirming clears the session and returns to the first briefing; cancelling preserves it.
5. **Given** a run where I make no well-timed Boost presses, **When** it plays out, **Then** I run
   out of energy before the boss. **Given** a run with Assist on, **Then** I can reach the boss.

---

### User Story 3 - Play with accessible controls (Priority: P1)

A keyboard-only user can inspect the challenge, choose, submit, get help, and advance without a
mouse.

**Why this priority**: Access is part of the core game (constitution, Principle IV).

**Independent Test**: Complete a full playthrough with the keyboard only, in a narrow window and
with reduced motion enabled.

**Acceptance Scenarios**:

1. **Given** any core control, **When** I navigate by keyboard, **Then** it has visible focus and an
   accessible name and every core action is reachable.
2. **Given** a result, **When** it appears, **Then** it includes text (not color alone), stays
   available to read, and is announced to assistive technology.
3. **Given** reduced-motion is preferred, **When** I play, **Then** no information is lost and no
   feedback or control is delayed by animation.
4. **Given** I answer a question, **When** the result appears, **Then** text feedback is shown
   immediately, and a celebrate or mourn animation plays in the background without delaying the
   controls. With reduced motion, I see a static textual cue instead.

---

### Edge Cases

- No selection or malformed input: input guidance is shown; no attempt, grade, or completion change.
- Repeated or double-click Submit on an answered round: no additional grade or completion.
- Every question has exactly four lettered options (A-D); any of them is a valid selection. The
  Layer 8 boss is a separate, clearly labeled non-OSI question.
- A wrong answer leaves the round open indefinitely; the player may retry any number of times.
- All gameplay is paused while a question is open, so thinking time is unlimited.
- Lowest possible final score is 0; incorrect answers never reduce the score below zero.
- Content errors disable grading and show a visible message while score and completion stay
  unchanged: missing or unknown answer key, a question without exactly four labeled options with
  reasons, an unknown source, or an answer key that conflicts with verified content.
- Reloading the page starts a fresh session; nothing is saved.
- Energy at zero, followed by the character stopping, triggers a last-chance question every time (FR-008); if it is answered
  wrong, the run ends without losing recorded score or
  attempts. Energy drain is stopped while any question is open.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Before the first launch the game MUST show a short briefing on how to play (launch,
  bounce, questions, Boost). It MUST NOT show per-concept briefings, hints, or worked solutions.
- **FR-002**: Each round MUST present only its question text and four lettered options (A to D),
  with nothing else on screen that could reveal or change the answer.
- **FR-003**: The player MUST select exactly one option and explicitly submit.
- **FR-004**: The game MUST grade a submission against the documented rule and challenge data,
  awarding 1 point for a correct answer and 0 for an incorrect one; score MUST never go below 0.
- **FR-005**: A correct answer MUST grant a power-up that adds energy (the relaunch is FR-033); an incorrect answer MUST NOT add energy and MUST NOT remove energy or points.
- **FR-005a**: A run MUST begin with the character struck by a Catalyst 6500, which supplies the
  initial energy. Energy MUST drain only with distance traveled, never with thinking time.
- **FR-005b**: (Count and pickups: FR-046, FR-047.) While airborne, the player MUST have exactly one in-flight action (Boost) triggered by a single keyboard-operable control with a visible focus state and an
  accessible name; no other steering or aiming is required.
- **FR-005c**: Boost strength MUST rise continuously with timing quality: the needle of the Boost
  dial sweeps back and forth and the closer it is to the optimum (dial center) when pressed, the
  stronger the boost, and a press inside the optimal (green) range MUST launch the character along the
  optimal angle (`config.airBoost.optimalAngleDeg`) with a speed gain and its spin mostly cancelled.
  An assist option MUST be available that makes every press count as perfectly
  timed, so no player is blocked by timing; using assist MUST be recorded and shown separately from
  independent play. Timing MUST NOT award points or affect the quiz score.
- **FR-005d**: All gameplay (movement, energy drain, and boost input) MUST be paused while a
  question is open (including the last-chance question) and resume when the round is correctly
  completed.
- **FR-006**: Every result MUST display text feedback with the relevant values and the rule that
  connects them; a wrong answer MUST explain what the chosen option actually is (its authored reason) and give a next step.
- **FR-007**: Each round MUST display distance achieved and points earned.
- **FR-008**: Whenever energy is zero and the character has come to a stop, the player MUST be given a
  "last chance" question, EVERY time this happens (not once per run): the next unasked question in the
  Layer 1-7 sequence. A correct answer grants a power-up and the run continues; an incorrect answer
  ends the run with no retry (the only exception to FR-022), with a summary showing distance,
  points, completed rounds, valid attempts, and assistance used. At zero energy the character MUST also lose horizontal
  speed quickly so it comes down and stops instead of floating on.
- **FR-009**: Empty or malformed submissions MUST show input guidance and MUST NOT count as an
  attempt, grade, or completion.
- **FR-010**: Repeated Submit actions on an already-graded round MUST NOT award progress or points
  twice.
- **FR-011**: There MUST be no hints and no worked solutions (owner decision). A wrong answer MUST
  explain what the chosen option actually is and a correct answer MUST explain why it is right, in
  text (FR-006).
- **FR-012**: Completed rounds, valid attempts, and assistance MUST be displayed separately.
- **FR-013**: Restart MUST require confirmation; confirm clears the session and returns to the first
  briefing, cancel preserves it.
- **FR-014**: Session progress MUST last only for the current page session; reload starts again.
- **FR-015**: Content with an invalid, missing, ambiguous, or conflicting answer key MUST show a
  visible "Content error" message, disable grading, and leave score and completion unchanged.
- **FR-016**: Level content, sources, and difficulty MUST be stored as editable data,
  validated before a challenge is shown, with domain rules separate from rendering and progress.
- **FR-017**: All core actions MUST be keyboard-operable with visible focus and accessible names;
  success and failure MUST be conveyed by text as well as color and announced to assistive
  technology.
- **FR-018**: The game MUST honor reduced-motion preferences and remain usable on a typical laptop
  and a narrow browser window; dense data MAY scroll in a labeled container without hiding actions.
- **FR-019**: The game MUST need no account, backend, live device, runtime AI, or API key, and MUST
  play from static files only.
- **FR-020**: There MUST be no lives, no wall-clock countdown, and no bonus for answering quickly;
  retries carry no penalty. (The character's speed rises per correct answer; that is a
  game effect, not a reward for answering fast.)
- **FR-021**: There MUST be one progressively harder level in a single pass. A question MUST be
  offered each time the character stops on the road (a miss, FR-037), asking the eight questions in
  order: Layers 1 to 7, then the Layer 8 question as the boss. Questions are not repeated.
- **FR-022**: Except for the last-chance question (FR-008), an incorrect answer MUST leave the
  round open for unlimited retry with no penalty. A
  round completes only on a correct submission; each valid submission counts as one attempt.
- **FR-023**: After the Layer 7 question is completed the player is relaunched like after any other
  question (power-up, re-aim dials, bull charge; FR-038), and a final "Layer 8" boss challenge MUST
  be presented at the next stop on the road (a stop with no energy is not a last chance here: the
  boss is simply asked). It MUST be labeled as informal and not part of the OSI model, and MUST
  have a documented, authored answer rule like any other round. An incorrect boss answer keeps the
  boss open for unlimited retry with no energy or point change; the boss does not award points.
  Defeating it grants a super energy boost (larger than a normal power-up). No further questions
  are asked after the boss: the character glides on the super boost, the player may still use
  Boost, and the run ends with a victory summary when energy runs out. Running out of energy
  before the boss ends the run only if a last-chance question is answered wrongly (FR-008).
- **FR-024**: After each graded answer, a scene animation MUST celebrate a correct result or
  mourn an incorrect one, including the boss. It MUST NOT delay feedback or controls, MUST be
  paired with text feedback, and MUST be replaced by a non-motion equivalent when reduced motion is
  preferred.

- **FR-025**: The character's speed MUST be shown in network bit-rate units (Mbps, Gbps, Tbps,
  scaling automatically) while distance is shown in meters. The mismatch is an intentional joke and
  MUST be stated in the briefing and the README so it is not read as a networking claim. Speed is
  the character's actual speed (FR-037) and MUST be much higher during the post-boss victory glide.
- **FR-026**: Energy MUST be balanced so that a player who answers every question correctly can
  reach the boss whatever the launch (strong, weak, steep, flat, with Assist, or with a few good
  boosts), because every stop with no energy asks a last-chance question (FR-008). Out-of-energy
  endings MUST remain possible: a wrong last-chance answer ends the run. Both MUST be verified by
  deterministic simulation tests (a scripted bot per launch type, and a harsh-drain configuration),
  not by playtesting alone. (Better play is rewarded with a longer, faster run, but that is tuning, not a tested guarantee.)

- **FR-027**: The play screen MUST present a bright, daytime, side-scrolling scene whose layout
  follows the reference screenshot (see Clarifications): a sky, drifting clouds, at least two
  tree rows scrolling at different speeds (parallax), and a road with a guardrail, all scrolling
  with distance traveled. The scene MUST fill the width of the play area at a 7:4 (700x400)
  proportion and MUST remain visible whenever a question is open.
- **FR-028**: The flying character MUST be a side-view RJ45 plug: a clear housing, a latch tab running
  along the top from the front (right) to the back (left), a gold head at the front with 8 visibly
  distinct, horizontal contact pins (stacked bars running along the head), and a cable boot at the rear where the Cat6 tail attaches; its face (human-like
  eyes, not X eyes, and a mouth) is on the side of the housing. It tumbles in the air (FR-041) and is
  launched at the start of a run by a Catalyst 6500 switch. All art MUST be original and
  network-themed (constitution purpose); no sprites, audio, or text from the original Flash game may
  be copied.
- **FR-029**: Seven roadside landmarks (network devices or media) MUST scroll toward the character,
  each standing on the road as a bounce target (FR-032), cycling through the seven designs; a Layer 8
  tower is scenery in the victory glide only. Landmarks are illustrations only: they
  MUST NOT carry layer numbers or names for Layers 1-7, MUST NOT be the item shown in the matching
  round, and MUST NOT reveal or change an answer. A last-chance question asked early does not move
  landmarks.
- **FR-030**: Large readouts MUST sit in the scene corners (text contrast at least 4.5:1 against
  its background, at least 18 px high at the 700 px scene width, and still legible at a 360 px wide
  window): top left, an energy label
  and bar with its numeric value; top right, distance, bounces, and speed
  (in the units of FR-025). The same values MUST remain available as text in the run status
  region, and the corner readouts MUST NOT replace the separate display of completed rounds,
  attempts, and assistance (FR-012).
- **FR-031**: A Boost MUST produce a visible effect (for example speed streaks) and the
  celebrate/mourn animation of FR-024 MUST play in the scene. A text equivalent of the scene state
  (distance, bounces, the latest bounce, miss, boost or mood cue) MUST be exposed to
  assistive technology; under reduced motion, scrolling, tumbling, and the effects MUST be
  replaced by a static scene with text cues, with no loss of information or control. The in-game "Scene animation" switch MUST default to ON regardless of the system preference (owner decision; constitution v1.2.0) and let the player turn the animation off; when the system reports reduced motion, the briefing MUST say so and point to the switch.

- **FR-032**: Between questions the character MUST bounce off network devices standing on the road
  (FR-037). A device bounce MUST relaunch the character at once with extra energy (bounce energy)
  and a visible bounce. Landing on the bare road bleeds speed; when the character stops, that is a
  miss and a question is offered. Boost timing in the air nudges the trajectory (FR-038); Assist
  makes every Boost count as well-timed. Contact is decided by the deterministic simulation, not by
  visual overlap.
- **FR-033**: A correct answer after a miss MUST relaunch the character with the power-up energy
  (FR-005); a wrong answer keeps the question open (FR-022). Energy reaching zero in the air does not stop the character: it flies on without further drain until it
  stops on the road, and then the last-chance rule applies (FR-008).
- **FR-034**: The scene MUST be drawn at the display's refresh rate, at least 60 frames per second
  on a typical laptop, by interpolating between simulation steps; the simulation itself MUST remain
  fixed-step and deterministic (Principle V). Per-frame work MUST avoid rebuilding the scene.
- **FR-035**: The player-facing questions MUST be the eight multiple-choice questions supplied by
  the owner (see Clarifications), each with a documented answer key and a source citation
  (Principle I). Layer 8 is the last of the eight and is labeled informal.

- **FR-036**: A run MUST start with the character standing still on the road. The player starts
  the launch with a keyboard-operable control. A power dial then appears inside the scene on the far
  right: an analog gauge whose needle sweeps continuously between low and high (like a fuel gauge);
  one click on the dial or on a Lock button (or Space/Enter) locks the value. Then an angle dial,
  in degrees (`config.physics.angleMinDeg` to `angleMaxDeg`, currently 8 to 62 degrees, ideal about 35), sweeps the same way and one click locks it. The dials MUST appear
  only while needed and the values MUST also be shown as text. Timing is the skill; Assist MUST lock
  a fixed good value (`config.gauge.assistPower`, `assistAngleDeg`: 80% and 35 degrees). Only after
  both are locked, a Catalyst 6500 MUST streak across the screen, hit the character, and launch it
  with the chosen power and angle. Needle positions come from the simulation clock (periods in
  `config.gauge`) and are covered by deterministic tests.
- **FR-037**: Flight MUST use deterministic rigid-body physics: gravity; the character as a
  rectangle with a center of gravity, orientation and angular velocity; bounces off the road that
  lose speed; and bounces off network devices computed as an impulse at the contact point against
  the device's top surface (with friction), where device kinds differ in springiness, width and
  surface tilt. A stopped character (speed below a threshold on the road) is a miss and a question
  is offered (FR-021). The displayed speed is the character's speed.
- **FR-038**: After a correct answer the power dial and then the angle dial MUST appear again (as in
  FR-036) and the character is relaunched from where it stands with the chosen power and angle; the
  relaunch speed is the chosen gauge power plus `config.relaunch.stepMps` for each question answered
  correctly so far (Assist locks the fixed good values). The Catalyst bull charges and rams the
  character again on every launch, including this one (FR-052). The Boost remains the one
  in-flight action (FR-005c, FR-046).
- **FR-039**: Devices MUST be placed deterministically along the road with gaps that grow, so a
  player eventually misses one and meets the next question even when bouncing well.

- **FR-045**: The play screen MUST use the full window below a compact title bar: the scene fills the
  remaining width and height (no letterboxing and no page scrolling), adapting its visible width to
  the window shape. Briefing, question, feedback, aiming and flight text and controls MUST float over
  the scene in panels that never hide the dials or the character during aiming and flight, scroll
  inside themselves when taller than the window, and stay usable at 360 px wide (FR-017 and
  Principle IV). Question, feedback and summary panels MAY cover the scene because gameplay is paused.
- **FR-046**: The player MUST start a run with 3 boosts. A Boost spends one; with none left, or with no
  energy, or on the ground, a press does nothing. The count MUST be shown as text and on the Boost dial.
  Boosts MUST be clearly strong (a perfect one adds at least 25 m/s of speed along the optimal angle).
- **FR-047**: Boost power-ups MUST be placed deterministically along the way, in the air and low over the
  road. Flying or sliding into one collects it (+1 boost, capped at `config.boost.maxCount`), with a
  visible pickup effect and a happy face. Collisions are decided by the simulation.
- **FR-048**: The game MUST be servable to other machines on the network with one command
  (`python3 serve.py`), listening on all interfaces, printing the LAN addresses, serving only the game
  files (not the reference Flash archive), and needing no build step. Its documentation MUST cover the
  Windows/WSL firewall and port-forwarding steps.
- **FR-049**: The game MUST provide a vertical (portrait) mobile format and a landscape desktop format and
  MUST detect the browser type to choose between them (user agent and client hints, touch input,
  screen shape), with `?format=mobile|desktop` as an override. The mobile format MUST use the full
  screen height, touch-sized controls, and the same dials and rules; the scene adapts to a tall
  shape without cropping the character or dials.
- **FR-050**: `?fps=1` MUST show a frame-rate meter (average fps over the last second and the worst
  frame time). If the average stays below 40 fps for 3 seconds of flight, the game MUST switch to a
  lighter drawing quality (fewer scenery layers) and say so in the title bar; `?quality=low|high`
  forces it. Quality never changes gameplay.
- **FR-051**: While aiming and while flying, exactly one action button MUST be shown, directly above
  the dial in the scene, on every format: "Lock" while aiming and "Boost" while flying. It MUST be
  large, touch-sized and keyboard-focusable, and no instruction text may cover the gameplay during
  aiming and flight; that text MUST remain available to assistive technology (hidden text).
- **FR-052**: The Catalyst 6500 MUST be an animated character with arms, legs and a face that
  emotes, behaving like an angry bull: it snorts steam and paws the ground while the player aims,
  winds up and charges the plug when the launch is locked, rams it (the impact launches the plug)
  and then stands smug. The charge takes `config.launch.impactMs` (1.1 s): the first 30% is the wind-up
  in place, the rest the run-up. This repeats on every launch, including after a correct answer. The
  "Catalyst 6500" label on its body MUST stay readable. No copied artwork.
- **FR-053**: The Layer 8 boss question MUST be the owner-supplied post-mortem question (see
  Clarifications, eleventh session): a humorous question with four lettered options, the key being
  "CYA encapsulation" (B), every option having an accurate-in-spirit funny reason, and the
  explanation "In Layer 8, truth is deprecated but liability is mandatory".
- **FR-055**: The camera MUST keep the road and the devices in view at any altitude: when the character's
  height on screen exceeds the height that fits (300 px in landscape, half the scene height in portrait)
  the world MUST zoom out about the road under the character in proportion, smoothly, never below 0.5x
  (`cameraZoom`), and the scenery tiles MUST cover the zoomed-out view.
- **FR-044**: Devices MUST be solid (the character cannot pass through any part of one) but MUST NEVER
  send the character backwards: a hit on a side face vaults the character up and over the device
  with a forward boost (no rebound), a character sliding on the road into a device vaults over it,
  and a wedged character is shaken loose forward. After any device contact the forward speed MUST be
  at least the speed before the contact (momentum is additive across contacts).
- **FR-040**: The quality of a device bounce MUST come from the contact calculation: how much of the
  impact impulse goes into the character's motion rather than its spin (a flat landing on the
  center of mass is efficient; a tilted, corner or glancing landing is not). A better bounce MUST give
  more bounce energy, more speed and a better launch angle; a poorer bounce less of each and more
  spin. A solid bounce (quality 0.8 or more) MUST add at least 100 energy and a forward speed gain of at least 25%. Every device bounce adds forward speed on top of the contact result (`config.devices.padAddVx` x quality), and every landing on top MUST leave at no less than `padMinExitMps` x (0.6 + 0.4 x quality) along a forward angle (the character never rides on top of a device, whatever the tilt, spin or steepness of the fall). Each bounce's quality is recorded for display and tests.
- **FR-041**: The character MUST tumble: its orientation and spin evolve from the launch and from
  each contact impulse about its center of gravity. The Cat6 tail MUST swing as a rope (a chain of
  point masses under gravity attached at the rear of the body), reacting to the character's
  rotation and acceleration, and MUST not pass through the road.
- **FR-042**: The face MUST emote with human-like eyes (sclera, pupil, eyelids, brows) and a mouth:
  neutral when standing, worried at launch, happy after a solid bounce, a good Boost, a correct answer
  or in the victory glide, sad after a miss or a wrong answer. Pupils look toward the direction of
  travel and the eyes blink. Emotion is presentation only and is also stated in the scene's text
  equivalent.
- **FR-043**: The Boost dial MUST be drawn inside the scene on the far right (same place as the other
  dials), visible while flying (and hidden when the character is stopped or a question is open), showing
  the boosts left and when it is ready or recharging; a Boost button with an
  accessible name and the `B` key remain available.

### Key Entities

- **Run/Session**: One play from briefing to the summary shown when energy runs out (a victory summary if the boss was defeated); holds energy, distance, score,
  completed rounds, valid attempts, and assistance used; resets on restart or reload.
- **Round/Challenge**: A multiple-choice question about an OSI layer (or Layer 8); has a prompt,
  four lettered options, an answer key, a reason for each option, a source citation, and
  difficulty.
- **Choice**: An integer layer ID from 1 to 7 with its layer name.
- **Power-up**: Energy reward granted by a correct answer.
- **Bounce/Boost**: The single in-flight action the player triggers between questions; timing
  affects boost size unless assist is on.
- **Level**: The single level of seven rounds (Layers 1-7) of rising difficulty, with a question offered at each missed device (FR-021).
- **Boss Round**: The final informal Layer 8 challenge.
- **Content Source**: Cited reference (GeeksforGeeks OSI article; Cisco Press Network Communication
  Models) with section for each rule.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time learner with no networking knowledge completes a first playthrough in 5-10
  minutes, with unlimited thinking time.
- **SC-002**: 100% of shipped questions and explanations match the cited references, verified by
  hand-checked correct, incorrect, and boundary cases.
- **SC-003**: Every acceptance scenario and case in the source case table has a recorded pass/fail
  result before release.
- **SC-004**: A teammate completes the full core flow (inspect, choose, submit, help, advance,
  restart) using only the keyboard, in a narrow window, and with Scene animation switched off.
- **SC-005**: In a playtest with at least 5 learners who have no networking background, at least
  80% correctly answer at least 5 of the 7 layer questions, on a short quiz
  after the first playthrough.
- **SC-006**: A clean browser session can play the full game using only the project's static files.
- **SC-007**: A trial challenge can be added through a data change alone, with no change to grading
  rules.
- **SC-008**: The project owner reviews the running game in a real desktop browser against the
  reference screenshot and records pass/fail for each of FR-027 to FR-031 (including a
  check of the Scene animation switch); until recorded, the status is "not run".
- **SC-009**: In a real browser the scene averages at least 58 frames per second over a 10 second
  flight (FR-034), measured with `requestAnimationFrame` timestamps and recorded with the browser
  and machine; until recorded, the status is "not run".

## Assumptions

- The learner has no assumed networking knowledge; the game teaches from scratch.
- Gameplay mirrors the original Nanaca Crash loop (launch, travel on limited energy, distance
  record, power-ups); the original's exact mechanics (launcher, bounce behavior) are adapted, not
  copied. The original Flash build and its screenshot were later consulted for visual layout only.
- Layer 8 is the informal, non-OSI "politics" layer described in the constitution.
- Each OSI layer is asked once (no repeated passes) as a four-option multiple-choice question; the
  owner supplied the eight questions.
- The source's seven-round case table is superseded by clarifications (a question at each stop on the road,
  retry allowed, Layer 8 boss, super-boost victory glide); its case rows for wrong answers completing a round, the 0/7 and 7/7
  results, and "no eighth round" must be rewritten before release. Its content-error and
  no-selection cases still apply.
- Starting values for energy, speed, boosts, and the super boost are in research.md and are tunable
  after playtest (the balance rule in FR-026 is fixed). The Layer 8 boss question content is an
  authoring detail, and its answer must be documented per the constitution.
- Out of scope: user accounts, multiplayer, backend, live infrastructure access, runtime AI,
  leaderboard, level editor, saving across reloads, simulation of adjacent protocols.
- Authoritative references: GeeksforGeeks OSI Model article and Cisco Press "Network Communication
  Models"; the source `netcrash/SPEC.md` case table supplies the expected outcomes.
- Gameplay reference for the original Nanaca Crash feel (launch, bounce, distance, pacing): speedrun
  video https://www.youtube.com/watch?v=W5vyHEz9lWk. It is a reference for characteristics to
  adapt, not a requirement to copy; the video could not be viewed by the build agent, so no observations from it are recorded.
- Source draft still contains unfilled template fields (pitch, visual metaphor, AC placeholders,
  "six rounds" wording); this spec replaces them with the concrete content above.
