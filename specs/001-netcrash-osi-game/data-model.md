# Data Model: NETCRASH First Playable

## Content (static, in `data/levels.json`, schema version 2)
| Entity | Fields | Rules |
|--------|--------|-------|
| Document | `schemaVersion` (2), `config`, `sources[]`, `rounds[]`, `boss` | Validated whole before start |
| Config | `initialEnergy`, `drainPerMeter`, `powerUpEnergy`, `superBoostEnergy`, `displayBitsPerMps`, `glide{speedMps,drainPerMeter}`, `boost{cooldownMs,sweepMs,goodQuality,startCount,maxCount}`, `pickups{count,firstX,gapM,radius,heights[]}`, `physics{dryDragPerS,gravity,subSteps,powerMinMps,powerMaxMps,angleMinDeg,angleMaxDeg,roadRestitution,roadFriction,roadMu,devMu,rollDamp,rightRate,spinDrag,slideDecel,stopMps,minBounceMps,maxSpeedMps,bodyHalfW,bodyHalfH,inertiaK,flatBlendM}`, `gauge{powerPeriodMs,anglePeriodMs,assistPower,assistAngleDeg}`, `launch{impactMs,settleMs,spinRadS,liftM}`, `plaid{thresholdGbps,exitGbps}`, `devices{padMinExitMps,padAimFloor,padAddVx,vaultBoostMps,vaultMinMps,vaultClearM,vaultMaxVy,vaultCoolMs,vaultClimbMul,padAngleDeg,padAimBlend,count,firstX,gapStartM,gapGrowM,energy,energyMinFrac,padKickMps,kinds[7]{halfM,top,e,tiltDeg}}`, `relaunch{mps,stepMps,angleDeg,spinRadS}`, `airBoost{minVx,maxVx,minVy,maxVy}`, `tail{nodes,segM,damp,iterations}` | Numbers > 0 (growth, step and spin values may be 0); angle range increasing and below 90; `kinds` has 7 entries with `halfM`, `top`, `e` > 0 and `tiltDeg` in -60..60; `goodQuality` in 0..1; `displayBitsPerMps` converts m/s to the bits per second shown (a deliberate joke unit mismatch) |
| Source | `id`, `title`, `url`, `section`, `claim`, `reviewPending?`, `reviewed` | Unique `id`; needs a `url` unless `reviewPending` |
| Round (Layers 1-7) | `id`, `layer` (1-7), `prompt`, `choices[{id,label,why}]` (exactly 4, unique ids), `rule{correctChoice, sourceId, explanation}` | `correctChoice` is one of the choice ids; `sourceId` exists; every choice has a label and a reason (`why`) |
| Boss (Layer 8) | same as Round plus `informal` (must be true) and `title` | Layer 8 is informal, not OSI |
| Choice | letter A-D shown, authored `id` kept | Answer comes from `rule.correctChoice`, never from option order |

There are no concepts, briefings, item descriptions, diagrams, hints or worked solutions (constitution v1.3.0).

## Session (in memory, `engine/state.js` and `engine/sim.js`)
| Field | Meaning |
|-------|---------|
| `phase` | `briefing`, `aim-power`, `aim-angle`, `launching`, `flying`, `awaiting-answer`, `feedback`, `last-chance`, `boss`, `glide`, `summary`, `error` |
| `sim` | `x`, `y` (center of gravity, m), `vx`, `vy` (m/s), `th` (orientation, rad), `w` (spin, rad/s), `tail[]` (rope nodes), `speedMps`, `grounded`, `energy`, `bounces` (devices), `roadBounces`, `misses`, `plaid`, `plaidSeq` (entries), `vaultId`/`vaultCoolMs`, `boosts` (left), `pickups[]`, `taken[]`, `pickupSeq`, `lastPickup`, `lastBounce{q,kind,seq}` (q = contact efficiency 0-1), `bounceSeq`, `boostQuality`, `boostSeq`, `status` (`standing`, `running`, `missed`, `paused`, `stopped`), `phase` (`cruise`, `glide`), `devices[]` (deterministic, `{id,x,kind,top,half,e,tilt}`), boost cooldown and sweep |
| `aim` | gauge clock, locked power (0-1) and angle (degrees) |
| `launchMs` | time since the first launch started; the Catalyst's charge ends in the impact at `launch.impactMs` (1.1 s). `relaunch`, `relaunchMs`: after a correct answer the dials pop up again and the bull charges again (same `launch.impactMs`) |
| `score` | Integer 0..7; never decremented; the boss awards no points |
| `completedRoundIds[]`, `attempts{id: n}` | Each round once; valid submissions only |
| `assistance{assistUsed, assistBoosts, assistedLaunch}` | Shown separately from mastery |
| `lastChanceUsed`, `bossDefeated`, `outcome` | `outcome` is `null`, `out-of-energy`, or `victory` |

## Transitions
```text
briefing -(Launch)-> aim-power -(lock)-> aim-angle -(lock)-> launching -(impactMs)-> flying
flying: rigid-body physics; device bounce (impulse at the contact point; quality sets energy, speed, angle, spin) | road bounce (slower, spins) | air Boost (strength by timing quality)
flying -(slides to a stop on the road = miss)-> awaiting-answer   (energy > 0)
                                              -> last-chance       (energy 0, EVERY time: correct -> continue, wrong -> summary)
awaiting-answer: invalid -> guidance (no attempt) | wrong -> feedback, retry (attempt+1)
                 correct -> feedback (+score, +energy) -> Next -> aim-power -> aim-angle -> bull charge (`launch.impactMs`) -> flying (the power-up re-aim)
last-chance: correct -> relaunch | wrong -> summary(out-of-energy)
Layer 7 completed -> power-up re-aim and relaunch as above -> next stop on the road -> boss (Layer 8; no last chance): wrong -> retry, no change | correct -> super boost -> glide -> energy 0 -> summary(victory)
content error -> error (grading disabled) | confirmed Restart -> briefing, fresh state
```
The sim is not stepped in question phases or while aiming. Gauges are driven by the gauge clock.
After every graded answer the UI plays a celebrate or mourn animation (presentation only).
