# Quickstart: Validating NETCRASH

## Prerequisites
- Python 3 (static server) and a current desktop browser. No installs required.

## Run (after implementation creates the files)
```sh
cd netcrash && python3 -m http.server 8000 --bind 127.0.0.1
```
- Game: http://127.0.0.1:8000/
- Tests: http://127.0.0.1:8000/tests/ — must show totals, zero failures, and nonzero test count.

## Validation scenarios
1. **Launch and correct path**: Press Launch; the character stands still. Click Lock once on the moving power gauge, then once on the moving angle gauge (values shown as text); the Catalyst 6500 streaks in, hits the character and launches it. Fly until it stops on the road, choose the correct option, submit → correct text feedback, +1 point, energy increases, play resumes (US1 AC2).
2. **Wrong path**: Submit a wrong option → that option's own explanation, no energy/points, same
   question stays open, retry works (US1 AC3, FR-022).
3. **No selection**: Submit with nothing chosen → "Select an option", attempts unchanged (FR-009).
4. **Duplicate submit**: Double-click Submit after a correct answer → no extra score (FR-010).
5. **No help screens**: The question screen shows only the question and four lettered options, with no hint, worked-solution, briefing, picture or diagram (FR-001, FR-002, FR-011).
6. **Boost and assist**: Press Boost with the needle near BEST and near an end: the first is clearly stronger; turn Assist on and confirm every press and both launch dials are perfect and shown separately in the summary (FR-005c).
7. **Pause**: Leave a question open for 60 s → distance and energy unchanged (FR-005d).
8. **Last chance** (reachable by temporarily raising `drainPerMeter` in `data/levels.json`, e.g. to 1.5): Let energy reach 0 and the character stop → a last-chance question is ALWAYS presented, every time this happens; correct continues, wrong ends the run. Out of energy the character loses horizontal speed quickly and comes down (FR-008).
9. **Boss**: Complete Layers 1-7, get relaunched, and stop again → the Layer 8 boss appears, labeled informal; wrong keeps it open; correct gives a super boost, no more questions, and a victory summary when energy runs out.
10. **Content errors**: Edit the data to each broken case (unknown key, null key, three options, duplicate option ids, unknown source) → visible "Content error", grading disabled, state unchanged.
11. **Restart**: Confirm restarts at the first briefing; cancel preserves the session.
12. **Accessibility**: Keyboard-only playthrough, narrow window, and reduced-motion check; record what was
    checked.
13. **Add a trial challenge** via `data/levels.json` only; no engine edits (SC-007).
14. **Reload**: Reload mid-run → fresh first briefing, score zero, no saved state (FR-014).
15. **How-to-play briefing**: Before the first launch a short briefing explains launch, bounces, questions and Boost; there are no per-concept briefings (FR-001).
16. **Result animation**: After a correct and an incorrect answer, a celebrate or mourn animation plays in the background without delaying the text feedback or controls; with reduced motion it becomes a static textual cue (FR-024).
17. **Speed units**: The HUD shows speed in Mbps/Gbps/Tbps and distance in meters; the briefing and README say this is a joke (FR-025). Speed is the character's actual speed, so it changes with the arc, and jumps in the glide.
18. **Self-contained and no countdown**: Disable the network after the page loads (or run from the static server only) and play a full run → it works with no account, backend, or API key (FR-019). Confirm the game shows no lives and no wall-clock countdown, and that retries cost nothing (FR-020).
19. **Responsiveness**: Submit an answer → text feedback appears within 100 ms; a cold load of the game from the local static server finishes within 2 s on a typical laptop (plan Performance Goals).

20. **Scene and readouts**: Start a run. The scene fills the window below the title bar: sky, clouds, tree rows, road and guardrail, an animated Catalyst 6500, and the RJ45-plug character; layers scroll at different speeds as it flies. Top left shows the energy label, bar and value; top right shows distance, bounces and speed (FR-027, FR-028, FR-030, FR-045). Compare with the reference screenshot (SC-008).
21. **Devices and effects**: Network devices stand along the road, none carries a layer number or name; a Layer 8 tower appears only in the victory glide. A Boost in the air shows speed streaks; the celebrate/mourn animation plays after an answer (FR-029, FR-031).
22. **Animation switch and text**: Scene animation starts ON even when the system prefers reduced motion (the briefing says so); unticking "Scene animation" freezes scrolling, arcs and effects while the readouts, status text and controls keep working.
23. **Bounce and miss**: Land on a device top: the character is thrown up faster and bounces gain energy; land on the road: it slows and slides to a stop, and a question appears; a correct answer relaunches it (FR-032, FR-037, FR-038).
25. **Timing and angle matter**: Lock power at the low end and at the high end, and angle at the two ends of the dial (8 and 62 degrees; the ideal is about 35); the flights differ visibly (FR-036). With Assist on, the lock uses power 80% and 45 degrees and the summary shows an assisted launch.
24. **Frame rate**: over a 10 second flight the scene averages at least 58 fps in a real browser (SC-009); record the result.26. **Analog dials**: Press Launch. A POWER dial appears inside the scene on the far right with a sweeping needle (click it, or Lock/Space, to lock); then an ANGLE dial replaces it; neither is visible at other times. While flying, a BOOST dial shows ready/recharging; pressing when the needle is near BEST gives a clearly bigger boost than pressing near either end (FR-005c, FR-036, FR-043).
27. **Bounce quality**: Watch several device bounces: landing flat gives a high, forward bounce and more energy; a tilted or glancing landing gives a weaker bounce and more spin; different device kinds bounce differently (FR-037, FR-040).
28. **Tumble, tail and face**: The plug tumbles after the launch and each impact; the Cat6 tail swings around and never goes through the road; the eyes are human-like (no X), the face is worried at launch, happy after a solid bounce, a good Boost or a correct answer, and sad after a miss or a wrong answer (FR-041, FR-042).
29. **Boosts and orbs**: A run starts with 3 boosts (title bar, Boost dial and Boost text all say "3 left"). Each Boost spends one and is clearly strong (a perfect one launches you fast along the ideal angle). Fly into a gold orb to gain one (burst ring, happy face); with 0 left the dial says EMPTY and a press does nothing (FR-046, FR-047).
30. **Network access**: On the dev machine run `python3 serve.py`; open a printed LAN address on another computer or phone. The reference `.zip` and `serve.py` return 404 (FR-048).
31. **Mobile format**: Open the game on a phone (or `?format=mobile` on a desktop): a vertical layout fills the height, buttons are touch-sized, the dials sit mid-height at the right and work by tap; `?format=desktop` gives the landscape layout; the Layout selector in the title bar switches (FR-049).
32. **Frame rate**: Open with `?fps=1`; the meter shows fps and worst frame; record it per machine (SC-009). Force `?quality=low` and confirm the clouds and far trees disappear and play is unchanged (FR-050).
33. **Single action button**: While aiming, one big "Lock" button sits directly above the dial; while flying it reads "Boost". No instruction text covers the gameplay on a phone or on desktop (FR-051).
34. **Angry bull**: Before the launch the Catalyst 6500 snorts steam and paws the ground; when you lock the angle it winds up and charges the plug with a furious face, rams it, and stands smug afterwards (FR-052).
35. **Power-up re-aim**: After a correct answer and Next, the power dial and then the angle dial appear again; the relaunch uses what you locked (a better lock flies faster); Assist locks the fixed good values; the bull appears, snorts, charges and rams again before the relaunch (FR-038, FR-052).
36. **Layer 8 question**: After the Layer 7 answer you get the power-up re-aim, the bull's charge and a relaunch (no skipping); the Layer 8 question appears at the NEXT stop: "After the CEO's quick fix causes a data breach, which Layer 8 frame dominates the post-mortem?" Option B (CYA encapsulation) is correct; each wrong option explains itself (FR-023, FR-053).
37. **Forward-only contacts**: Fly low into the side of a device (or slide into one): you are carried up and over it with MORE forward speed; nothing ever sends you backwards, and top bounces add forward speed on top of the result (FR-044, FR-040).
38. **Plaid**: Reach a speed readout of 400 Gbps (200 m/s; a perfect Boost plus a good bounce does it): the background becomes fast-scrolling tartan, speed streaks appear, and an RV-cabin cutaway shows two cartoon characters watching the plug streak past with a speech bubble "He's gone plaid!?!". It ends below 340 Gbps. The text equivalent announces it and the run summary says whether plaid was reached (FR-054).
39. **Flight feel and camera**: Gravity is loose, you scroll fast, touching a device throws you forward hard; fly a high arc: the camera zooms out so the road and devices stay visible; run out of energy: you glide to a stop instead of dropping straight down (FR-040, FR-044).
40. **Hard launch**: Fall almost vertically (or tilted, spinning) onto a device from high up: the character is thrown forward fast along a good angle and never rides on top of it; a flat landing hauls even faster (FR-040).
41. **Camera**: Fly a very high arc: the world zooms out smoothly so the road and the devices stay visible (never below 0.5x) and zooms back in on the way down (FR-055).
