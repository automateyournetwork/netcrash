> **SUPERSEDED.** The authoritative documents for this game are in `specs/001-netcrash-osi-game/`
> (`spec.md`, `plan.md`, `tasks.md`) and `.specify/memory/constitution.md` (v1.3.1). This file is kept
> only as the original input. Where it disagrees with those documents, they win.

> **Editor note — personalize, then remove this note and the idea menu.**
> This is the input to **specify**. Describe observable behavior and learning;
> save implementation choices for `PLAN.md`. Replace every bracketed field.
> The defaults below deliberately fit a short workshop. Change them explicitly
> if your mechanic needs something else. Resolve grading and scope questions
> during **clarify**, before planning the implementation.

# NETCRASH · First playable specification

## The pitch

**[ONE SENTENCE: PLAYER + ACTION + SKILL + VISIBLE CONSEQUENCE].**

The player role and gameplay settings for the remake should be derived from the original here and adapted to the content of our game --> as described here --> https://strategywiki.org/wiki/NANACA†CRASH!!. Each round shows Distance achieved and pooints for correctly answered questions. A correct decision scoreboard; an incorrect decision. The session ends when character runs out of energy and stops.

## Who this is for

- **Learner:** Prospective network engineers.
- **Assumed knowledge:** NONE.
- **What the briefing teaches:** How to recognize the basic building blocks of a network.
- **Why interaction helps:** How a network communicates is too hard to understand.
- **Session target:** 5–10 minutes for a first playthrough, with unlimited thinking time.

## Learning outcomes and evidence

Use observable verbs such as identify, calculate, order, compare, or diagnose. Replace the rows with your topic's skills.

| ID | After playing, the learner can… | The game asks them to… | Evidence of success |
| --- | --- | --- | --- |
| LO1 | Recognize common building blocks for computer networks aligned to the OSI model | Identify them for powerups | provide more energy to go farther when they answer correctly |

## The technical model

- **Rule being taught:** recollection of common physical and logical building blocks of computer networking.
- **Context:** us the OSI model as a basis and discover artifiacts that align to each layer.
- **Assumptions:** you start with nothing.
- **Excluded behavior:** Lots of things.
- **Authoritative references:** https://www.geeksforgeeks.org/computer-networks/open-systems-interconnection-model-osi/

Tell the learner about these boundaries in plain language. If two answers can both be valid, define how the game accepts them or remove that ambiguity from the first version.

## The repeatable game loop

1. **Brief:** introduce one concept, its terms, and a worked example different from the challenge.
2. **Inspect:** show description and visualization with all decision-relevant values visible.
3. **Choose:** the player selects and explicitly submits the decision.
4. **Explain:** display the result, the relevant values, and the rule that connects them.
5. **Retry or advance:** a wrong answer leaves the round playable; a correct answer enables Next.
6. **Reflect:** the level summary shows completed rounds, valid attempts, and assistance used.

**Worked interaction:** refer to nananca crash gameplay refernce at https://strategywiki.org/wiki/NANACA†CRASH!!.

## Required stories and acceptance criteria

### US1 · Make and understand a decision — P1

As a learner, I want to apply the rule to visible evidence and understand the result.

- **AC1:** Given a fresh session, when I start, then I see the first briefing before answering a challenge.
- **AC2:** Given [SPECIFIC VALID CHALLENGE], when I submit [CORRECT CHOICE], then [EXACT OUTCOME] and an explanation appear.
- **AC3:** Given that challenge, when I submit [PLAUSIBLE WRONG CHOICE], then feedback identifies [SPECIFIC MISCONCEPTION], completion stays unchanged, and I can retry.
- **AC4:** Given no selection or malformed input, when I submit, then input guidance appears and attempts/completion remain unchanged.

### US2 · Learn from help and finish the game — P1

As a learner, I want help when stuck and a clear view of my progress.

- **AC5:** A hint first explains the method. Further help can show a worked solution; assistance is recorded without marking the round complete.
- **AC6:** Each valid submission counts as one attempt until the round is solved. Correct submission completes it once; repeated submission after success has no effect.
- **AC7:** A level completes after both of its rounds are solved. Next opens the following round or level; the final round opens a session summary.
- **AC8:** Restart asks for confirmation, then clears the current session and returns to the first briefing. Cancel preserves the session.

### US3 · Play with accessible controls — P1

As a keyboard user, I want to inspect the challenge, choose, submit, get help, and advance without a mouse.

- **AC9:** All core controls have visible focus and accessible names; keyboard interaction reaches every core action.
- **AC10:** Correct/incorrect feedback includes text, remains available to read, and is announced to assistive technology. Motion can be reduced without losing information.

## Version-one content

Default: **one progressivley harder level**. Use one new example each time the character misses a bounce device (see `specs/001-netcrash-osi-game/spec.md` FR-021) and the same core mechanic throughout. Change these counts and AC7 together if you choose a smaller scope.

**Progression:** sequential on first playthrough; retry without penalty. Completion occurs when you run out of energy to continue to move forward. Hints remain available. 

**Session behavior:** progress is held for the current page session; reload starts again. Saving across reloads is a stretch feature and must be specified before it is added.

## Cases the implementation must satisfy

> **Case table corrections (2026-11-21):** wrong answers no longer complete a round (retry is free), so "C"
> does not change on a wrong answer. The "minimum final score" and "no eighth round" rows were removed: the
> game now has seven OSI questions, then an informal Layer 8 boss (retry allowed), then a victory glide.
> After R7 a correct answer opens the boss instead of a results screen. Content-error and no-selection
> cases are unchanged. See `specs/001-netcrash-osi-game/spec.md` for the current rules.

**Game:** Seven rounds, one per OSI layer. Players select a layer from seven numbered choices.

**Grading rules:** Each round allows one graded submission. A correct answer earns 1 point; an incorrect answer earns 0 points and displays an explanation. Either submission completes the round. Players select **Next** to continue. Maximum score: **7/7**.

**Sources:**

- [GFG — Layers of the OSI Model](https://www.geeksforgeeks.org/computer-networks/open-systems-interconnection-model-osi/)
- [Cisco — Network Communication Models](https://www-stg.ciscopress.com/articles/article.asp?p=3131360&seqNum=6)

Questions are based on GFG. Layer assignments were independently checked against Cisco. Scoring and validation behavior are game rules.

Each case starts independently. **S** means score; **C** means completed rounds.

| Case | Input state | Player action | Expected result | Why / source |
| --- | --- | --- | --- | --- |
| Correct — R1 | S=0, C=0. Question: “Which layer transmits raw bits over a physical medium?” | Select **1 — Physical**; submit. | Correct; S=1, C=1. | Bit transmission belongs to Physical. GFG: Layer 1; Cisco: Table 5-3. |
| Plausible mistake — R1 | Same R1 question; S=0, C=0. | Select **2 — Data Link**; submit. | Incorrect; S=0, C=0; the round stays open for retry. Explain: “Physical transmits bits; Data Link handles frames.” | Confuses adjacent layers. Cisco: Table 5-3. |
| Correct — R2 | S=1, C=1. Question: “Which layer exchanges frames between devices sharing a medium?” | Select **2 — Data Link**; submit. | Correct; S=2, C=2. | Frames belong to Data Link. Cisco: Table 5-3. |
| Plausible mistake — R2 | Same R2 question; S=1, C=1. | Select **3 — Network**; submit. | Incorrect; S=1, C=1; the round stays open for retry. Explain: “Network routes packets; Data Link exchanges frames.” | Confuses packets with frames. GFG: Layers 2–3. |
| Correct — R3 | S=2, C=2. Question: “Which layer handles IP addressing and routing between networks?” | Select **3 — Network**; submit. | Correct; S=3, C=3. | IP addressing and routing belong to Network. Cisco: Table 5-4. |
| Plausible mistake — R3 | Same R3 question; S=2, C=2. | Select **2 — Data Link**; submit. | Incorrect; S=2, C=2; the round stays open for retry. Explain: “Data Link uses MAC addressing; Network handles IP routing.” | Confuses hardware and logical addressing. GFG: Layers 2–3. |
| Correct — R4 | S=3, C=3. Question: “Which layer segments and reassembles data for end-to-end communication?” | Select **4 — Transport**; submit. | Correct; S=4, C=4. | Segmentation and reassembly belong to Transport. Cisco: Table 5-3. |
| Plausible mistake — R4 | Same R4 question; S=3, C=3. | Select **3 — Network**; submit. | Incorrect; S=3, C=3; the round stays open for retry. Explain: “Network handles routing; Transport segments and reassembles data.” | Confuses routing with end-to-end transport. Cisco: Tables 5-3–5-4. |
| Correct — R5 | S=4, C=4. Question: “Which layer establishes, maintains, and terminates application sessions?” | Select **5 — Session**; submit. | Correct; S=5, C=5. | Session manages application dialogue. GFG: Layer 5; Cisco: Table 5-3. |
| Plausible mistake — R5 | Same R5 question; S=4, C=4. | Select **4 — Transport**; submit. | Incorrect; S=4, C=4; the round stays open for retry. Explain: “Session manages application dialogue; Transport handles end-to-end data transfer.” | Confuses session management with transport services. Cisco: Table 5-3. |
| Correct — R6 | S=5, C=5. Question: “Which layer provides a common data representation between applications?” | Select **6 — Presentation**; submit. | Correct; S=6, C=6. | Data representation belongs to Presentation. Cisco: Table 5-3. |
| Plausible mistake — R6 | Same R6 question; S=5, C=5. | Select **7 — Application**; submit. | Incorrect; S=5, C=5; the round stays open for retry. Explain: “Presentation handles representation; Application provides application-level communication protocols.” | Confuses representation with application services. Cisco: Table 5-3. |
| Correct — R7 | S=6, C=6. Question: “Which OSI layer is associated with HTTP?” | Select **7 — Application**; submit. | Correct; S=7, C=7. **Next** opens results showing **7/7**. | HTTP is associated with Application. GFG: Layer 7; Cisco: protocol-stack discussion and Table 5-3. |
| Plausible mistake — R7 | Same R7 question; S=6, C=6. | Select **4 — Transport**; submit. | Incorrect; S=6, C=6; the round stays open for retry. Explain: “HTTP belongs to Application; TCP provides transport.” | Confuses an application protocol with its transport. Cisco: protocol-stack discussion. |
| Boundary — no selection | R1; S=0, C=0; selected answer is empty. | Attempt to submit. | Display “Select a layer”; S=0, C=0; no grading. | Game rule: an answer is required. |
| Boundary — lowest layer | R1; S=0, C=0; valid choice IDs are integers **1–7 inclusive**. | Submit choice **1**. | Choice accepted and graded correct; S=1, C=1. | Physical is Layer 1. Cisco: Table 5-3. |
| Boundary — repeated submission | R4 already answered correctly; S=4, C=4. | Submit again or double-click Submit. | S=4, C=4; no additional grade or completion. | Game rule: each round is graded once. |
| Unsupported content — invalid key | R3 author data specifies `correctLayer=8`; S=2, C=2. | Open round. | Visible “Content error: answer must identify an OSI layer from 1 to 7”; grading disabled; S=2, C=2. | Authoring error; OSI has seven layers. Cisco: Table 5-3. |
| Unsupported content — ambiguous question | Author prompt: “Which layer handles addressing?” Options include **Data Link** and **Network**; only Network is keyed. S=2, C=2. | Open round. | Visible “Content error: specify MAC or IP addressing”; grading disabled; S=2, C=2. | Both layers handle addressing of different kinds. GFG: Layers 2–3. Requires content review before release. |
| Unsupported content — missing answer | R6 has `correctLayer=null`; S=5, C=5. | Open round. | Visible “Content error: missing answer key”; grading disabled; S=5, C=5. | Authoring error, not learner failure. |
| Unsupported content — conflicting key | R1 asks about raw-bit transmission but specifies `correctLayer=2`; S=0, C=0. | Open round. | Visible “Content error: answer key conflicts with verified content”; grading disabled; S=0, C=0. | Verified answer is Physical, Layer 1. Cisco: Table 5-3. Requires content review before release. |

## Experience direction

- **Visual metaphor:** [WHAT MAKES THE CONCEPT VISIBLE].
- **One memorable moment:** [A SMALL EFFECT THAT REVEALS CAUSE AND EFFECT].
- **Always visible:** [VALUES AND LABELS NEEDED TO REASON].
- **Feedback voice:** patient and specific; explain the observed choice before offering the next step.
- **Layout:** challenge first, action next, explanation beside or below it. Don't hide technical values behind hover-only interactions.

## Non-goals

No user accounts, multiplayer, backend, live infrastructure access, runtime AI, leaderboard, or level editor. No simulation of [ADJACENT SYSTEM OR PROTOCOL BEHAVIOR]. Visual polish must fit the existing mechanic.

## Open decisions for clarify

- [QUESTION THAT COULD CHANGE A RULE, A LEARNING OUTCOME, OR THE SCOPE].
- [QUESTION THAT COULD CHANGE WHAT COUNTS AS CORRECT].

Delete this section when resolved, or record the answer beside each question. Don't let unresolved decisions become silent implementation guesses.

## Release evidence

All required acceptance criteria must have a recorded result. All six rounds and their explanations must be checked against the references. A teammate must complete the core flow using only the keyboard. The README must describe implemented behavior, exact run/test commands, and any remaining limits.

---


