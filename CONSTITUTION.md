# NETCRASH Constitution

**Purpose:** Help an entry-level network engineer practice recognition of network terminology
through a remake of the hit game Nanaca Crash. Characters and items the player interacts with MUST
be network items (e.g., fiber, copper, Cat5, Cat6, LC, ST, Ethernet switches, racks, firewalls).
Power-ups MAY be rewarded for correctly answered questions.

## Core Principles

### I. Technical Truth Is a Release Requirement (C1)

The game MUST never reward a technically incorrect answer. Grading MUST be reproducible from a
documented rule and the challenge inputs. Unsupported or ambiguous content is an authoring error:
the game MUST show an explanation that the challenge is unavailable and MUST prevent grading it.

The taught model (basic network concepts, artifact recognition, and the ability to define them)
MUST be documented. Simplifications MUST appear in the briefing and README wherever they affect
what the player can conclude. Fictional worlds and animations MAY illustrate a rule; they MUST NOT
change it.

**Evidence:** hand-checked correct, incorrect, and boundary cases; a source link and section for
each networking rule; review of all shipped briefings and explanations. Expected results are
recorded independently of the implementation under test.

### II. Every Round Teaches Through a Decision (C2)

The player's main action MUST exercise the target skill. A concept MUST be introduced before it is
tested, and the values needed to reason about the answer MUST be shown. A wrong answer MUST explain
the specific mistake and give a useful next step. A correct answer MUST explain why it works.

Learning sequence: the game MUST ask the OSI model questions progressing from layer 1 upward. "Layer 8" is the informal, non-OSI joke layer for politics
and organizational friction that blocks good innovation; it is the final boss at the end of the
game. The first version offers no hints and no worked solutions (owner decision, v1.3.0); a wrong
answer MUST still explain the mistake in text.

**Evidence:** a teammate can connect each player action to a learning outcome and describe what
they learned from a deliberately wrong choice.

### III. Progress Is Honest and Retry Is Safe (C3)

A round completes only on a valid, correct submission. Incorrect answers MUST keep the challenge
available. Empty or malformed submissions MUST give input guidance without counting as a wrong
attempt. Repeated Submit actions MUST NOT award progress twice.

The first version has no lives, wall-clock countdown, or bonus for answering quickly. Energy is a game resource
that drains only with distance traveled, never with elapsed time, and all gameplay MUST pause while
a question is open. Boost timing MAY change distance travelled but MUST NOT affect points, score, or
grading; an assist option MUST remove any timing barrier and its use MUST be recorded. Retries carry
no penalty.

Exception: when energy reaches zero the player gets exactly one final "last chance" question; a
wrong answer there ends the run with no retry. This is the only place a wrong answer closes a
question. The
UI MUST show completed rounds, attempts, and assistance separately; completion is not proof of
independent mastery. The specification MUST state exactly what advances a round, finishes a level,
and resets a session.

**Evidence:** wrong-answer, repeated-submit, completion, and reset checks match the
specification.

### IV. Access Is Part of the Core Game (C4)

All core actions MUST be usable by keyboard with visible focus, readable labels, and an
understandable order. Success and failure MUST be explained with text as well as color. Essential
diagrams MUST have a text equivalent. Scene animation MAY default to on, but the player MUST be able to turn it off with an
in-game switch reachable before play starts, and the game MUST tell players whose system reports
reduced motion that the switch exists. Animation MUST NOT delay the availability of feedback or
controls.

The challenge MUST be usable on a typical laptop and a narrow browser window. Dense technical data
MAY scroll within its own labeled container, but MUST NOT hide the action buttons.

**Evidence:** a keyboard-only playthrough, a narrow-window check, and a check that the in-game Scene animation switch turns motion off. Record
what was actually checked; do not claim full accessibility certification.

### V. The First Version Is Deterministic and Self-Contained (C5)

The game ships authored content and deterministic domain logic. It MUST require no account,
backend, live device connection, model, or API key. AI MAY help write code and assets during
development; its output receives the same review as any other contribution.

Runtime AI tutoring, generated questions, and free-text AI grading are stretch work. Adding them
requires an explicit change to this constitution, the specification, and the verification approach
before implementation.

**Evidence:** a clean browser session can play using only the project's static files; no external
content service decides an answer.

### VI. Content and Logic Can Be Reviewed Separately (C6)

Level content, sources, and difficulty MUST be stored in editable data. Domain rules MUST be
kept separate from rendering and progress tracking. Data MUST be validated before a challenge is
presented. Feedback MUST agree with the evaluator's reasoning; a hand-authored answer key MUST NOT
silently override the rule engine.

Adding another challenge that uses the existing mechanic MUST require only a data change and its
checks, not a new scoring path or a new screen implementation.

**Evidence:** inspect one level's data, trace one answer through the evaluator, and add a trial
challenge without modifying the rule engine.

### VII. Done Is Demonstrated (C7)

Only the agreed scope ships. Requirements, plan, tasks, and README MUST describe the same game. A
feature is complete when its acceptance criteria pass and its actual status is recorded. A
screenshot, a checked task box, or an agent saying "done" is insufficient by itself.

When time is short, scope MUST be reduced explicitly. Incorrect teaching and broken core
interactions MUST be fixed before visual effects are added. Failed and untested checks MUST remain
visible.

**Evidence:** reproducible run/test commands, recorded verification results, a fresh-start
playthrough, and a README another attendee can follow.

## Scope & Release Constraints

**First release:** one core mechanic (an OSI-layer question per 500 m of travel), one continuous
progressively harder level ending in a Layer 8 boss, delivered in a browser, and buildable in a
60-minute workshop. This budget changes only by updating the agreed scope (see Governance).

Technology is limited to what Principle V permits: static files, no backend, no accounts, no
runtime AI. Anything beyond this budget is stretch work and MUST NOT displace Principles I–IV.

## Development Workflow & Quality Gates

- The specification, plan, tasks, and README MUST agree before implementation begins and again
  before release (Principle VII).
- Every networking rule MUST cite a source and be hand-checked before its challenge ships
  (Principle I).
- A change is accepted only with recorded evidence for each affected principle, using the
  "Evidence" checks above.
- When scope is cut, the cut MUST be recorded in the spec and plan, not left implicit.

## Governance

This constitution supersedes other project practices. For any material change, the author MUST
record the reason, update the affected spec and plan, and rerun analysis. A conflict with this
constitution MUST be resolved openly; the build agent MUST NOT weaken a principle merely to make its
implementation pass.

Versioning follows semantic versioning: MAJOR for removed or redefined principles, MINOR for added
principles or materially expanded guidance, PATCH for clarifications and wording fixes. All
specs, plans, and reviews MUST verify compliance with Principles I–VII. Runtime guidance lives in
the project README and `netcrash/` spec and plan documents.

**Version**: 1.3.0 | **Ratified**: 2026-11-21 | **Last Amended**: 2026-11-22
