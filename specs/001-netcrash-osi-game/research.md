# Research: NETCRASH First Playable

All Technical Context unknowns are resolved below. No NEEDS CLARIFICATION remain.

## R1 · Stack
- **Decision**: Vanilla HTML/CSS/ES modules; DOM controls plus inline SVG for item diagrams and the
  character track. No framework, no canvas library.
- **Rationale**: Constitution V (static, self-contained) and the 60-minute workshop budget.
- **Alternatives**: Canvas/Three.js (extra accessibility burden, dependency); a framework (build
  step, unneeded).

## R2 · Simulation model
- **Decision**: Fixed 50 ms tick pure function `step(state, input)`; the UI drives it with
  `requestAnimationFrame` accumulating elapsed time. The sim never reads the clock itself.
- **Rationale**: Deterministic and testable (Constitution V, VI); pause is simply "do not step".
- **Alternatives**: Variable-delta physics (non-deterministic across machines); CSS-only animation
  (cannot be tested or paused cleanly).

## R3 · Initial tuning values (all in `data/levels.json` `config`, editable)
| Value | Setting | Reasoning |
|-------|---------|-----------|
| Initial energy (Catalyst 6500 impact) | 140 | The starting budget; every stop with no energy asks a last-chance question (FR-008) |
| Drain | 0.05 energy per meter | Tied to distance, never wall-clock; dry drag 0.3/s glides a dry character to a stop |
| Power-up on correct answer | +80 energy and a power and angle re-aim with a bull charge | Tuned by the bot tests so every correct-answering run reaches the boss |
| Speed | Launch 55-126 m/s by the power dial (+3 per correct answer on a relaunch); top speed 230; glide 100,000 m/s | Shown in Gbps (Mbps below 1 Gbps, Tbps above 1000), FR-025 |
| Speed display | `displayBitsPerMps` = 2,000,000,000 | 1 m/s shows as 2 Gbps, so 200 m/s = 400 Gbps (plaid, FR-054); distance stays in meters (intentional joke) |
| Glide drain | 0.0005 energy per meter | 300 energy gives about 600,000 m, roughly 6 s at 1 Tbps |
| Question timing | when the character stops on the road (FR-021, FR-037) | Superseded: questions follow misses, not distance |
| Boost | Limited: 3 at the start, +1 per gold orb, max 6; strength grows with needle closeness to BEST, a press in the green zone relaunches along 50 degrees at 90+ m/s | Owner decisions 2026-11-22/23; numbers in `data/levels.json` |
| Boost cooldown | 1.2 s | Prevents spamming |
| Timing dial | The needle sweeps back and forth in 2 s; BEST is the center, green zone = quality of at least 0.75 | Deterministic; replaces the old sweeping bar |
| Boss position | Asked at the next stop after the Layer 7 power-up relaunch | Spec FR-023 (amended 2026-11-22) |
| Super boost on boss defeat | +300 energy; no further questions | Victory lap at Tbps speed; adjust after playtest |
| Result animation | A short celebrate or mourn background animation after each graded answer (about 1.5 s, non-blocking) | FR-024; replaced by a static textual cue under reduced motion |

These are starting points; tune after the first playtest and record changes.

### Balance check (FR-026, proven by simulation tests)
- Superseded by the physics model. Every run that answers all questions correctly reaches the boss whatever the launch (good, weak, steep, flat, Assist, three good boosts); a drain of 1.5 energy/m runs out of energy first and uses the last chance. Bounces add 140 x (0.2 + 0.8 x quality) energy; orbs add boosts, not energy.

## R4 · Accessible timing (superseded by R10)
- **Decision**: Assist makes every Boost press perfectly timed and both launch dials lock at fixed good values; its use is recorded and shown separately. The dials always sweep (they are controls); the Scene animation switch only freezes the scenery.
- **Rationale**: FR-005c, FR-036, Principle IV. **Alternatives**: remove timing entirely (loses the clarified original-game feel).

## R5 · Grading rule: authored answer key per question (superseded)
- **Decision**: every question (rounds and the Layer 8 boss) has four options and `rule.correctChoice`; one evaluator grades all of them and each option carries its own `why` text. The earlier concept registry, hints and briefings were removed by the owner (constitution v1.3.0).
- **Rationale**: the owner supplied the questions as plain multiple choice; an authored key plus per-option reasons keeps feedback consistent with grading, and the content check refuses a missing or unknown key.
- **Alternatives rejected**: keeping the concept registry (no longer matches the questions).

## R6 · Content cautions (Principle I)
- Use unambiguous items per layer: L1 fiber, copper, Cat5/Cat6, LC/ST connectors; L2 Ethernet switch
  forwarding by MAC, MAC address; L3 router, IP address; L4 TCP/UDP ports; L5 session
  setup/teardown; L6 data representation/encryption formats; L7 HTTP, DNS.
- Avoid or qualify multi-layer items: NIC, firewall, rack. Racks and cabling pathways are physical
  infrastructure; firewalls span layers 3-7 depending on type. If used, they appear in briefings as
  context, not as graded answers, unless the prompt specifies a type (e.g., packet-filter ACL → L3/4).
- All keys must be confirmed against the two cited references (GFG OSI article; Cisco Press
  Network Communication Models) before release.

## R7 · Layer 8 boss
- **Decision**: An authored scenario question (for example a failing-cable replacement blocked by
  budget approval) with a fixed documented best answer (present a documented business case), clearly
  labeled informal and not OSI. The answer rule and rationale are stored in data like any round.
- **Rationale**: FR-023, Principle I.
- **Open for content review**: choose and cite a source for the "Layer 8" informal usage and the
  rationale for the keyed answer. Tracked as a task, not a spec question.

## R8 · Original-game reference
- The speedrun video and wiki page were not reviewed (the video cannot be viewed by the build agent;
  StrategyWiki and TV Tropes refused automated fetches). Feel details (launch, bounce, pacing) are
  inferred; adjust tuning after the user supplies notes.
- The owner supplied the original Flash build (`netcrash/nanaca-crash_v110.zip`). Its screenshot
  and SWF metadata were reviewed for visuals only: 700x400 stage at 30 fps; daytime sky, clouds,
  parallax trees, road with guardrail; a large tumbling character; top-left red AERIAL label with
  boost meter; top-right large record, distance and speed readouts; a SPECIAL strip. The SWF's
  ActionScript was not run, so timing and hit behavior are not recorded.
- **Decision (visual style)**: reproduce the layout and feel, never the assets; draw original
  network-themed SVG art (spec FR-027 to FR-031).
- **Alternatives rejected**: reusing extracted Flash bitmaps (copyright, and not network items);
  raster sprite sheets (extra files, no text equivalent); canvas (harder to label for assistive
  technology and to test with the fake DOM).

## R9 · Physics and launch (FR-036 to FR-039)
- **Decision**: fixed-step projectile physics with 5 sub-steps per 50 ms (gravity, velocity vector, road and device bounces), a launch from two timing gauges, deterministic device placement with growing gaps, and 60 fps drawing by interpolating the last two steps.
- **Rationale**: owner request for real movement and timing skill; determinism keeps balance testable (Principle V).
- **Alternatives rejected**: the earlier fixed-arc hop model (no angle or power, no real bounce), a variable-step physics integration (not reproducible), canvas or a physics library (breaks the no-dependency rule).
- **Tuning (superseded)**: see the current table above and the later sections; the 2026-11-22 values (drain 0.09, bounce +40, power-up +30) no longer apply.

## R10 · Contact physics, dials, tail and face (FR-005c, FR-036 to FR-043)
- **Decision**: the character is a rigid rectangle with a center of gravity, orientation and spin. A bounce is an impulse at the contact point against the surface, so quality (the share of the impulse that becomes motion rather than spin) comes from the geometry of the landing; devices differ in springiness, width and surface tilt. Boost strength rises continuously with the needle's closeness to the dial center. The tail is a Verlet rope in the simulation. Power, angle and Boost are analog SVG dials inside the scene; the face is drawn from an emotion chosen from sim events.
- **Rationale**: owner request for physics-based, varied bounces and readable timing; everything stays deterministic and testable in the pure engine, and rendering only reads the state.
- **Alternatives rejected**: a scripted bounce table (not calculated), full polygon collision (overkill for flat device tops), a physics library (breaks the no-dependency rule), a purely cosmetic tail (the owner wants it to react to the impacts).
- **Known simplification**: a nearly flat landing uses the middle of the bottom edge as the contact point (blended to the lowest corner as tilt grows) instead of solving two simultaneous contacts.

## R11 · Forward-only contacts, hard landings, plaid, camera (FR-040, FR-044, FR-054, FR-055)
- **Decision**: a device never reflects the character backwards: side hits vault it up and over with extra forward speed; every top landing goes through one `padBounce` with an exit-speed floor (`padMinExitMps` x (0.6 + 0.4 x quality)) along mostly the ideal angle; the road never reverses forward speed. Plaid (400 Gbps = 200 m/s) swaps the scenery for tartan and an RV-cabin cutaway. A camera zoom (`cameraZoom`, min 0.5x) keeps the road in view on high arcs.
- **Rationale**: owner reports on 2026-11-22 (ninth and twelfth sessions) (no backward bounces, "haul" on every impact, momentum builds, aim at devices from altitude). **Alternatives rejected**: restitution-only bounces (rode on top when the contact was poor), a camera lift (hid the road), clamping altitude (changes the physics).
- **Superseded by this**: the old "camera lift" and the 2.667e9 speed scale.
