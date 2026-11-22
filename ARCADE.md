---
# ARCADE SUBMISSION — fill this file in, commit it to the ROOT of your game repository as ARCADE.md,
# then send John your GitHub URL. Everything between the two --- lines is machine-read.
#
# INSTRUCTIONS FOR THE BUILD AGENT (the coding agent that built this game):
#  1. You were there. Fill every field from your own session, your files and your tool list.
#  2. Do NOT invent. If something was not recorded or you do not know it, write "unknown".
#     A truthful "unknown" is better than a confident guess. Never estimate tokens or cost.
#  3. Ask the human ONLY for the fields marked (HUMAN): name, location, links, consent, first-project.
#  4. Keep strings on one line, quote any value containing a colon. Lists use [a, b, c] or "- item".
#  5. Do not put secrets, API keys, tokens, private URLs or file paths from the human's machine here.
#  6. Run the game once yourself and confirm the Runtime section is correct before you finish.
#  7. Then fill in the three short prose sections below the frontmatter. Plain language, no hype.
arcade_version: 1

game:
  title: "NETCRASH"
  slug: "netcrash"
  tagline: "Bounce a Cat6 plug through the OSI model and answer your way to Layer 8."
  summary: "You lock a power dial and an angle dial, an angry Catalyst 6500 rams a cartoon RJ45 plug, and it flies and bounces off network devices to build speed. When it stops on the road you answer an OSI multiple-choice question to be launched again. Seven questions cover Layers 1 to 7 and a joke Layer 8 boss ends the run, so you practise which devices, protocols and functions belong to which layer."
  topics: [OSI model, Layers 1-7, TCP and UDP, network devices, encapsulation]
  category: "network-fundamentals"
  skill_level: "beginner"
  play_minutes: 10          # design target from the spec (5-10 minutes); no timed playtest was run
  levels: 8                 # seven layer questions plus the Layer 8 boss, in one continuous run
  card_image: "assets/images/title.png"
  card_image_alt: "A horned cartoon Catalyst 6500 switch with arms and legs charges at a cartoon RJ45 plug lying on a road, with network devices and an aim arrow ahead."
  repo: "https://github.com/richdeprez/netcrash"
  repo_path: ""
  license: "MIT"

creator:                     # (HUMAN) only what was given or is on the repo is filled in
  name: "richdeprez"         # the handle on the repo and its first commit; a real name was not provided
  github: "richdeprez"       # from the repository URL the owner gave
  location: ""               # not provided (optional, hidden when empty)
  organization: ""
  links: []
  first_spec_project: true   # template default, not confirmed by the owner
  workshop: "NAF AC6"
  consent_to_publish: false  # stays false until the owner says yes to being listed

build:
  started: "2026-11-21T16:22:40Z"     # first message in the session transcripts
  finished: "2026-11-22T19:38Z"       # time of this file; the work after that, if any, is not recorded here
  wall_time: "unknown"                # elapsed time includes long idle gaps and a reboot, active time was not recorded
  spec_driven:
    framework: "GitHub Spec Kit"
    framework_version: "1.4.4.dev0"   # from .specify/init-options.json
    artifacts: [constitution, spec, clarify, plan, tasks, checklists, research, data-model, contracts, quickstart]
    task_count: 110
    loops_or_phases: 19               # phase headings in tasks.md
  model: "claude-sonnet-5-5"
  helper_models: ["unknown (web-fetch subagents were used for a few page reads; their model IDs were not reported)"]
  harness: "Claude Code"
  harness_version: "2.1.330"
  mcp_servers: ["claude.ai Claude Docs (connected, not used)", "IDE diagnostics (connected, not used)"]
  rag_and_sources:
    - "GeeksforGeeks, Layers of the OSI Model (cited per layer in data/levels.json, not independently reviewed)"
    - "Cisco Press, Network Communication Models (cited as an independent check, not independently reviewed)"
    - "Seven OSI multiple-choice questions and the Layer 8 question supplied by the owner"
    - "Wikipedia and other web pages about the 1987 film Spaceballs (web search, context for the plaid scene only)"
    - "The original Nanaca Crash Flash build and its screenshot (layout reference only, no assets reused)"
    - "automateyournetwork.com/arcade ARCADE.md template and submission page"
  skills_and_plugins: [speckit-constitution, speckit-specify, speckit-clarify, speckit-plan, speckit-tasks, speckit-analyze, speckit-implement, "anthropic-skills:chrome-browser (loaded, its browser tools were not available)"]
  other_tools: ["Node.js v22.23.5 (test runner)", "Python 3.14.4 (static server)", "Microsoft Edge 158.0.4370.33 headless (screenshots and the card image)", "git", "curl", "WebSearch and WebFetch tools"]
  human_prompts: 48         # counted from the session transcripts with a filter for system messages, so approximate
  usage:
    input_tokens: unknown
    output_tokens: unknown
    cost_note: "unknown"
  ai_generated_assets: ["graphics: all hand-authored SVG and CSS written by the coding agent, no image generator", "card image: a headless browser screenshot of the game", "audio: none", "text: question wording is the owner's; the per-option explanations and all other text were written by the agent"]

runtime:
  kind: "static-web"
  stack: [HTML, CSS, JavaScript ES modules, inline SVG]
  start: "python3 serve.py"
  url_after_start: "http://127.0.0.1:8000/"
  hosted_url: ""
  static_root: "."
  requires_install: false
  requires_network: false
  requires_api_key: false
  uses_ai_at_runtime: false
  browsers: ["Microsoft Edge 158.0.4370.33 (headless, screenshots only)", "the owner reported it runs fine on another PC (browser not recorded)"]
  accessibility: "All actions work from the keyboard (Lock and Boost buttons, B and Space keys), controls have visible focus and accessible names, every dial value and scene state also exists as text and in a live region, and a Scene animation switch turns motion off; animation defaults to ON even when the OS asks for reduced motion (an owner decision). Only automated fake-DOM tests and headless screenshots were run; no screen reader, no human keyboard-only playthrough and no real phone were tested."
  save_state: "none"

verification:
  tests: "node tests/run-node.mjs && node tests/ui-smoke.mjs"
  tests_passing: 90          # 90 engine tests plus one scripted UI smoke test with 70+ checks, all passing at the last run
  facts_sourced_from: ["GeeksforGeeks, Layers of the OSI Model", "Cisco Press, Network Communication Models", "owner-supplied worksheet questions"]
  known_limits:
    - "The answer key and explanations were not independently reviewed against the cited sources (all sources are marked reviewed false)"
    - "Seven questions use the standard device and protocol to layer mapping; Layer 8 is an informal joke layer, not part of the OSI model"
    - "Real-phone behaviour and frame rate numbers were not measured; only headless desktop browser screenshots and one report that it runs fine on another PC"
    - "Physics is a simple 2D rigid body with comedic scales: speed is shown in network bit rates while distance is in meters"
    - "Plaid scene, the angry-bull Catalyst and the plug character are original cartoon art and a parody nod, not a networking model"
    - "No hints or worked solutions by design; one multiple-choice attempt style with unlimited retries"
---

## In one paragraph

NETCRASH is a small browser game for people starting with networking. You time two dials to launch a cartoon RJ45 plug, bounce it off network devices to build speed, and whenever it stops on the road you answer a multiple-choice question about the OSI layers, from the physical layer up to the application layer, to get launched again. A joke Layer 8 question ends the run with a victory glide. It needs no install, no account and no network once served, and it works on desktop and in a vertical layout on phones.

## How it was built

The build followed GitHub Spec Kit in order: constitution, specification, clarification, plan, tasks, analysis, then implementation, with the code written only after the spec, plan and tasks were updated. The first graphics were rejected by the owner, so the original Flash game was used as a layout reference only and the visuals were redone through the same spec steps. The owner then changed direction several times: from fixed arcs to real physics and power and angle dials, from the supplied hint-based questions to plain multiple choice, and to bouncier, faster flight. Each change went into the spec as a dated clarification first. Bugs found and fixed along the way included a boss question that skipped the power-up, a landing that left the character riding on top of a device, tests that hung when a run lasted too long, and stale documents that analysis passes caught. We also corrected our own wrong session dates in the docs before submitting. Tests are a dependency-free harness plus a fake-DOM smoke test; real-browser checks were limited to headless screenshots.

## What we'd tell the next builder

- Keep the simulation pure and deterministic and write bot tests for balance; they caught more problems than playing by hand.
- Update the spec, plan and tasks before changing code, run the analysis pass after every batch, and write "not run" in the verification table until a human has actually checked it.
- Check screenshots at the real viewport size and in the layout a phone uses, and expect headless captures to be rescaled; a number or date written from memory is a bug, so take it from a file, the clock or the transcript.
