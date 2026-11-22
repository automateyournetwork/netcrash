# Contract: engine modules

```text
evaluate(question, sources, choiceId) -> {
  status: "correct" | "incorrect" | "invalid-input" | "content-error",
  reasonCode: "OK" | "WRONG" | "NO_SELECTION" | "BAD_CHOICE" | "CONTENT",
  evidence: { sourceId, expectedChoice, chosen }
}
```
- Pure: no DOM, timers, network, randomness, or score changes. Works for rounds and the Layer 8 boss.
- The answer is `question.rule.correctChoice`, never the choice order or label.
- Empty choice -> `invalid-input` (no attempt); unknown id -> `invalid-input`; broken question -> `content-error`.
- `explain(result, question)` (feedback.js) returns `{tone, headline, body, nextStep}`; a wrong answer's body is that choice's own `why`.

```text
gaugeValue(ms, periodMs) -> 0..1 triangle wave (dial needle)   powerFromGauge(g, config) -> m/s   angleFromGauge(g, config) -> degrees
boostQuality(sweepMs, config) -> 0..1   // 1 at the dial center (needle at 0.5), 0 at both ends
createSim(config) -> sim (standing, devices built deterministically)
launch(sim, powerMps, angleDeg, spinRadS) -> sim (running, tumbling forward)
step(sim, {boostPressed, assist}, config, 50) -> sim'
```
- `sim = { x, y, vx, vy, th, w, tail[], speedMps, grounded, energy, bounces, roadBounces, misses, lastBounce, boostQuality, status, phase, devices[], boostCooldownMs, sweepMs, ... }`; `x`,`y` are the center of gravity.
- Each 50 ms step is split into `physics.subSteps`. The body is a rectangle (`bodyHalfW` x `bodyHalfH`, unit mass, `I = (a^2 + b^2) x inertiaK`) with gravity and spin drag.
- Contact point `r`: the lowest corner, or the middle of the bottom edge when nearly flat (blended over `flatBlendM`). Impulse along the surface normal `n`: `j = -(1+e) vn / (1 + (r x n)^2 / I)`, then a friction impulse along the tangent (`mu`), and `w += (r x J) / I`. The contact **efficiency** `1 / (1 + (r x n)^2 / I)` is the bounce quality `lastBounce.q`.
- Devices never send the character backwards. A corner inside a device box is pushed out (position only, speed is not reflected); `vx = max(vx, vaultMinMps)`; the first contact with a device (cooldown `vaultCoolMs`) ADDS `vaultBoostMps` and sets `vy` high enough to clear the top (`sqrt(2 g need) x vaultClimbMul`, capped `vaultMaxVy`), so the character rides up and over. Sliding on the road into a device does the same. After a top bounce `vx >= vxBefore + padAddVx x quality`, and the exit speed is at least `padMinExitMps x (0.6 + 0.4 x quality)` along a direction at least `padAimFloor` of the way to `padAngleDeg` (`padBounce`, used by every top landing path). The road never reverses `vx` either. A fuzz test asserts `vx >= 0` in all contacts.
- Plaid: `speedGbps(speedMps, config)`; `sim.plaid` turns on at `plaid.thresholdGbps` (400, i.e. 200 m/s with the default scale) and off below `plaid.exitGbps` (340); `sim.plaidSeq` counts entries (cruise phase only).
- Devices (top landing: descending lowest point crossing the top within `half`): `e` and normal tilt per kind; then `+padKickMps x q` along the normal, speed capped at `maxSpeedMps`, `+devices.energy x (energyMinFrac + (1 - energyMinFrac) x q)`.
- Road: restitution and friction, spin damped per contact; a slow landing sticks (grounded), the body rights itself (`rightRate`) and slides.
- Tail: Verlet rope of `tail.nodes` nodes of length `tail.segM` anchored at the rear of the body, under gravity, kept above the road.
- Energy drains by `drainPerMeter` per meter travelled, never below 0; at 0 the character loses horizontal speed at `physics.dryDragPerS` so it comes down and stops, and `state.js` then asks a last-chance question every time.
- `launch(sim, power, angle, spin, liftM)`: the ram lifts the body `liftM` off the road. After a device bounce the exit direction is blended toward `devices.padAngleDeg` by quality x `padAimBlend`, speed kept.
- `status` becomes `missed` when grounded, stopped (`stopMps`) and upright (about 3 degrees); `stopped` only in the glide at energy 0.
- Boosts are limited: `sim.boosts` starts at `boost.startCount` (3); a successful air Boost spends one; with none left (or no energy, or on the ground) a press does nothing, Assist included. Pickups (`buildPickups`) are collected when the body center is within `pickups.radius + bodyHalfH`: `+1` up to `boost.maxCount`, recorded in `taken`/`pickupSeq`/`lastPickup`.
- Boost only works in the air: `vx`/`vy` impulse interpolated between `airBoost.min*` and `max*` by timing quality (Assist = 1); `quality >= boost.goodQuality` counts as a good boost; cooldown applies.
- `ackQuestion`, `onCorrectAnswer` (+`powerUpEnergy`), `resume` (fallback relaunch at the `relaunch` power and angle; the game itself relaunches through the dials, see `state.js`), `startGlide` (+`superBoostEnergy`).
- No step is performed while the session phase is a question phase or an aiming phase.

```text
formatSpeed(speedMps, config) -> "500 Mbps" | "2.3 Gbps" | "1 Tbps"   // bps = speedMps x displayBitsPerMps
```

```text
session API (state.js): start(), lock(), tick(dtMs), submit(choiceId), next(), pressBoost(), toggleAssist(), restart(confirmed), view()
```
- After a correct answer `next()` enters `aim-power` again (`view().aim.relaunch === true`); the second `lock()` starts the bull's charge (`launch.impactMs`) and the impact launches with `powerFromGauge(lockedPower) + relaunch.stepMps x answersCorrect` at the locked angle.
- `lock()` locks power, then angle (the value is the gauge's value at that moment; Assist locks the fixed good values).
- `view()` adds `draw` (position interpolated between fixed steps for 60 fps drawing), `aim`, and `launchMs`.
- `submit` after the round is solved returns the same state (no double award). `restart(false)` changes nothing.
- There is no hint or worked-solution call.

## UI contract
- Core controls: Launch, one action button above the dial ("Lock" while aiming, "Boost" while flying; also Space/Enter when focused), Boost, Assist toggle, Scene animation switch, answer options (native radio group A-D), Submit, Next, Restart. Each has a visible focus ring and an accessible name.
- Power, angle and Boost are analog dials drawn in the scene's right side; they appear only when needed and can be clicked (Lock / Boost). Their values are also always shown as text ("Power: 63%", "Angle: 45 degrees", the Boost state line), and the Lock and Boost buttons and the B key remain.
- The face (eyes with sclera, pupils, lids, brows, mouth) shows neutral, worried, happy or sad; the emotion is also in the stage text.
- Feedback region is a live region; result text never relies on color alone.
- Distance, energy, score, completed rounds, attempts, and assistance are always visible text.

## Format detection contract (`ui/device.js`)
```text
chooseFormat({userAgent, uaMobile, coarse, width, height, override}) -> {format: "mobile" | "desktop", reason}
browserFamily(userAgent) -> "edge" | "opera" | "firefox" | "samsung" | "chrome" | "safari" | "other"
```
- Order: override (`?format=mobile|desktop`) > phone (client hints or user agent) > tablet (upright = mobile, sideways = desktop; iPadOS = Mac user agent plus touch) > small touch screen > desktop.
- `main.js` sets `html[data-format]`, `html[data-browser]`, `html[data-touch]`; `?quality=low|high` sets `html[data-quality]`; `?fps=1` shows the meter.
