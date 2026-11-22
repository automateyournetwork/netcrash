# NETCRASH

A browser game **inspired by** the Flash launch game *Nanaca Crash* (no assets, code or text from it are used; all art is original SVG), themed on networking, for entry-level network
engineers. Your character stands on the road; you press Launch, lock a sweeping **power** dial and a sweeping
**angle** dial (analog gauges drawn in the scene, on the far right, shown only when needed) with one click each (timing is key), and a Catalyst 6500 streaks in and rams the character.
Flight uses rigid-body physics: the plug tumbles, its Cat6 tail swings, and you **bounce off network devices** along the road. Each bounce is calculated from the contact (a flat landing gives a strong, well-angled bounce and more energy; a tilted or glancing landing gives a weaker one and more spin), and the bare road slows you down. Its face shows how it feels: happy after solid bounces, good boosts and correct answers, sad after misses. When you stop on the road, a question asks about
the **OSI model** (eight multiple-choice questions: Layers 1-7, then an informal **Layer 8 boss** at the next stop after Layer 7); a correct answer
is the power-up that launches you again. Wrong answers cost nothing and can be retried. There are no hints, worked
solutions or briefings, just the question. Beating the boss gives a super energy boost and a victory glide. The
Layer 8 question is the informal joke layer (politics, not part of the OSI model) appears; beating it gives a super energy boost and a victory glide.

Authoritative design documents: `specs/001-netcrash-osi-game/` (spec, plan, tasks, data model,
contracts, quickstart) and `.specify/memory/constitution.md` (kept identical to `CONSTITUTION.md` here).

## Run

Static files only: no account, backend, or API key. Serve this folder over HTTP (JSON is fetched, so
`file://` does not work):

```sh
cd netcrash
python3 -m http.server 8000 --bind 127.0.0.1
```

- Game: http://127.0.0.1:8000/
- Tests: http://127.0.0.1:8000/tests/ (must show totals, no failures, and a non-zero test count)
- Optional, with Node 18+: `node tests/run-node.mjs` (engine tests) and `node tests/ui-smoke.mjs` (UI smoke test with a fake DOM)

### Playing from another computer or a phone (performance testing)

```sh
cd netcrash && python3 serve.py            # listens on all interfaces, port 8000
```

It prints the addresses to open, for example `http://192.168.1.20:8000/`. It serves only the game files
(the reference `*.zip` and `serve.py` return 404) and needs no build step.

**If this machine is Windows with the game inside WSL2** (use Option A or B below) (the case on the dev workstation) the other
device cannot see WSL directly. Do one of these in an **administrator** PowerShell:

```powershell
# Option A: forward the Windows port to WSL (re-run if the WSL address changes: `wsl hostname -I`)
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=8000 connectaddress=<WSL address> connectport=8000
New-NetFirewallRule -DisplayName "NETCRASH 8000" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8000
# Option B (Windows 11 22H2+): put `networkingMode=mirrored` under [wsl2] in %UserProfile%\.wslconfig, run `wsl --shutdown`, restart WSL, then only the firewall rule is needed.
```

Then browse to `http://<the Windows machine's LAN address>:8000/`. Remove the rule when done:
`Remove-NetFirewallRule -DisplayName "NETCRASH 8000"` and `netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=8000`.
Only expose it on a network you trust: the server has no login.

**Useful address options**

| Add to the address | Effect |
| --- | --- |
| `?fps=1` | Shows a frame-rate meter (average fps over the last second, worst frame, quality, format, browser). Use it to record the result for SC-009. |
| `?format=mobile` / `?format=desktop` | Forces the vertical phone layout or the landscape desktop layout (the game chooses by itself from the browser type, touch input and screen shape; there is also a Layout selector in the title bar). |
| `?quality=low` / `?quality=high` | Forces lighter or full scenery. If the frame rate stays under 40 fps for 3 seconds of flight the game switches to low by itself and says so in the title bar. |

## How it plays

- **The scene** follows the layout of the original Flash game: a bright side-scrolling road scene (sky, clouds,
  two tree rows, road and guardrail) with an RJ45-plug character launched by a Catalyst 6500. Seven unlabeled
  devices stand on the road as bounce targets (they are scenery and never hint an answer), and a Layer 8 tower appears in the victory glide.
  Energy sits top left; distance, bounces and speed sit top right. The scene is drawn every display frame
  (60 fps target) and the simulation is interpolated between its fixed 50 ms steps. All
  art is original inline SVG/CSS; nothing is copied from the Flash game. Scene animation is **on by default**, even if your system asks for reduced motion (project owner
  decision, constitution v1.2.0 and since; now v1.4.0); untick **Scene animation** at the top to freeze the scene. The same values always stay available as text.
- **Boost** (the single Boost button above the dial in the scene, the dial, or the `B` key), only in the air and **limited to 3 at the start**. Collect more by flying into the gold lightning orbs along the way (max 6). The closer the needle is to BEST when you press, the bigger the boost, and a press inside the green zone launches you along the ideal angle at high speed; 1.2 s cooldown. **Assist** makes every press and both launch dials perfect and is recorded separately. Boost timing never affects points.
- **Flight feel**: looser gravity, higher speeds, a faster-scrolling scene, a camera that zooms out when you fly high so the road and devices stay in view, a gentle glide (not a drop) when you run out of energy, and powerful device contacts (big kick, forward gain, energy and vault boost).
- **Landing on a device hauls**: every landing on top (even a steep, tilted or spinning one) throws you forward fast along a good angle; you never ride on top of one.
- **Contacts never send you backwards**: a side hit on a device vaults you up and over with extra forward speed, and top bounces add forward speed on top of the contact result, so momentum builds.
- **Gone plaid**: at 400 Gbps (200 m/s) the background switches to tartan and an RV-cabin cutaway shows two cartoon characters watching you streak past (a nod to a classic movie gag; original drawings, characters not named).
- Energy drains with **distance only**, and everything pauses while a question is open (unlimited thinking time).
- Wrong answers: no penalty, retry as often as you like; each wrong option has its own explanation.
- If you run out of energy and stop, you get a **last-chance** question **every time** (the next layer, asked early); a correct answer gives the power-up and you keep going, a wrong answer ends the run. Out of energy you lose horizontal speed quickly and come down.
- Flight is flat and fast: the ideal launch angle is about 35 degrees, a good device bounce launches you forward along a good angle, and boosts push mostly forward.
- **Joke alert:** speed is shown in network bit rates (Mbps, Gbps, Tbps) while distance is in meters.
  That mismatch is intentional humor and not a networking claim.
- Reloading starts a fresh session; nothing is saved.

## Repository layout

- `index.html`, `main.js`, `style.css`, `engine/` (pure, deterministic simulation and grading), `ui/` (rendering and controls), `data/levels.json` (all content and tuning), `tests/`, `serve.py`, `assets/images/title.png` (arcade card image).
- `specs/001-netcrash-osi-game/` and `.specify/`: the GitHub Spec Kit artifacts the game was built from (constitution, spec with dated clarifications, plan, tasks, research, data model, contracts, quickstart).
- `ARCADE.md`: the arcade submission file.

## Structure

- `engine/`: pure logic (`rules.js` grading, `content.js` validation, `sim.js` movement, `state.js` session, `feedback.js`)
- `ui/`: DOM rendering and input; `main.js`: load, validate, start
- `data/levels.json`: all authored content, tuning values, sources. Adding a question is a data change only.
- `tests/`: browser test runner (`index.html`) plus `run-node.mjs`

## Content status (Principle I)

- Every layer assignment cites a GeeksforGeeks section and a Cisco Press check, but **all sources are marked
  `reviewed: false`**: no one has yet hand-checked each briefing, question, and explanation against them.
- The Layer 8 boss has **no source yet** (`layer8-pending`). It must be sourced and reviewed before release.

## Verification record

Status as of 2026-11-22. Environment: WSL2 Linux, Node v22.23.5 (official build, checksum verified),
used only to run the tests. **No real browser run has been observed yet.**

| Check | Status | Evidence / note |
| --- | --- | --- |
| Automated tests via `node tests/run-node.mjs` | **pass** | 90 / 90 passed, 0 failed (content, rules, rigid-body physics and contact quality, tail, boost quality, state, energy balance). The count dropped from 73 because the hint, worked-solution, briefing and layer-concept tests were removed with those features |
| Energy balance (FR-026) | **pass** | every correct-answering run reaches the boss, even with no boosts; more good boosts and Assist give more bounces and more distance; a harsher drain (0.7/m) runs out of energy before the boss. Tuned values: drain 0.2/m, bounce +40, power-up +30, speed 80 m/s (+6 per answer), hop 1.6 s |
| UI smoke test via `node tests/ui-smoke.mjs` (fake DOM, full playthrough: briefing, power and angle gauges, Catalyst launch, flight, wrong/right answers, assist, boss, glide, summary, restart) | **pass** | checks for the scene: layers, readouts, unlabeled devices, devices on the road, scrolling, animation default on and the switch, boost streaks; it found and fixed one real bug (the text "null" would have appeared in the feedback box). It does not check layout, focus ring, CSS animation, or screen readers |
| Frame rate (SC-009, FR-034, FR-050) | **runs fine on another PC (no numbers); not measured** | the owner reported on 2026-11-22 that the animation runs fine on another PC (the dev workstation is slow). No fps figures were recorded yet: use `?fps=1` and record average fps, worst frame, browser and machine here (T088). The lower-quality mode logic is unit tested (`createQualityMonitor`); its effect on a slow machine is unmeasured |
| Bull Catalyst, relaunch dials, single action button, faster flight (FR-038, FR-040, FR-051, FR-052) | **not run (owner review pending)** | built and covered by unit and smoke tests; headless Edge screenshots on 2026-11-22 show the horned bull idling, charging with red eyes and steam, and the Lock/Boost button above the dial on desktop and in the vertical format; the feel needs a human |
| Forward-only contacts and the plaid scene (FR-044, FR-054) | **not run (owner review pending)** | unit tests (no backward velocity over a fuzz grid, additive bounces, plaid hysteresis) and smoke test pass; headless Edge screenshots on 2026-11-22 show the tartan background and the RV cabin with both characters and the bubble on desktop and in the vertical layout; the feel needs a human |
| Layer 8 post-mortem question (FR-053) | **built, answer key is the owner's (B)** | the owner supplied the question and key on 2026-11-22; wording of the wrong-option reasons is mine |
| Network access (FR-048) | **verified from another machine** | 2026-11-22: after Windows port forwarding and a firewall rule were set up (a local helper script, not part of the repo) the owner reached the game from another PC. `serve.py`'s refusals (404 for the zip, `.py`, `.ps1`) are covered by `tests/serve.test.js` |
| Phone format (FR-049) | **detection unit tested; real phone not tested** | `chooseFormat` is tested against iPhone, Android, iPad, Mac and Windows user agents; the vertical layout and the single Lock/Boost button were only seen in a headless desktop browser at a narrow, tall size |
| Bounce gameplay look (FR-032, FR-033) | **not run (owner review pending)** | headless Edge screenshots on 2026-11-22 show arcs, tumbling, devices on the road and the cone-marked road gap; the bounce feel needs a human |
| Question set from the owner's OSI worksheet (FR-035) | **built, answer key not independently checked** | the eight questions the owner pasted; the answer key (B C B D B A D, boss B) is the standard one but every source is still `reviewed: false` (T043) |
| Launch dials, contact physics, tumble, tail and face (FR-036 to FR-043) | **not run (owner review pending)** | headless Edge screenshots on 2026-11-22 show the in-scene power and boost dials, the aim arrow, the Catalyst streak, the tumbling plug with its swinging tail, human-like eyes, and the happy and sad faces; the feel of the timing, bounces and tumble needs a human |
| Automated tests in the browser (`tests/index.html`) | not run | needs a browser |
| Visual fidelity against the reference screenshot (SC-008, FR-027 to FR-031, quickstart 20-22) | **not run (owner review pending)** | the build agent only viewed headless Edge screenshots (animated and reduced-motion) on 2026-11-21: scene, corner readouts, large tumbling character and static mode rendered as designed. That is not the owner's sign-off |
| UI in a real browser (all quickstart scenarios 1-19) | **not run** | needs a human; the page was opened in the default browser from WSL, but nothing could be observed |
| Keyboard-only, narrow window, reduced motion | **not run** | needs a human |
| Source review of all briefings/questions/explanations | **not run** | all sources `reviewed: false` |
| Layer 8 boss source | open | `layer8-pending` |
| Playtest with 5+ learners (SC-005) | not run | out of workshop budget |

## Formats

The game picks its layout from the browser: a vertical touch layout (full height, touch-sized buttons) on
phones and upright tablets, and a full-window landscape layout on desktops. Both use the same rules and
dials. Everything except the title bar floats over the scene because play pauses whenever a question is open.

## Known limits

- One level, seven questions, one boss. No persistence, accounts, multiplayer, leaderboard, audio, or runtime AI.
- Tuning (energy, speeds, boost sizes) comes from a back-of-envelope model; adjust `config` in `data/levels.json` after a playtest.
- Gameplay feel is inferred from the original game description; the reference speedrun video has not been reviewed.

## License

MIT, see `LICENSE`. The Flash game that inspired this project is not included and none of its assets are used.
