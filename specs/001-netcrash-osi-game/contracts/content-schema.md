# Contract: `data/levels.json` (schema version 2)

```json
{
  "schemaVersion": 2,
  "config": { "initialEnergy": 140, "drainPerMeter": 0.05, "powerUpEnergy": 80, "superBoostEnergy": 300, "displayBitsPerMps": 2000000000,
              "glide": { "speedMps": 100000, "drainPerMeter": 0.0005 },
              "boost": { "cooldownMs": 1200, "sweepMs": 2000, "goodQuality": 0.75, "startCount": 3, "maxCount": 6 },
              "physics": { "gravity": 12, "powerMinMps": 55, "powerMaxMps": 126, "angleMinDeg": 8, "angleMaxDeg": 62, "maxSpeedMps": 230, "dryDragPerS": 0.3, "bodyHalfW": 23.4, "bodyHalfH": 15.9, "...": "see data-model.md" },
              "gauge": { "powerPeriodMs": 1500, "anglePeriodMs": 1700, "assistPower": 0.8, "assistAngleDeg": 35 },
              "launch": { "impactMs": 1100, "settleMs": 500, "spinRadS": 2.4, "liftM": 10 },
              "devices": { "count": 60, "firstX": 150, "gapStartM": 50, "gapGrowM": 24, "energy": 220, "energyMinFrac": 0.2, "padKickMps": 50, "padSpeedGain": 0.45, "padAddVx": 30,
                           "padMinExitMps": 150, "padAimFloor": 0.85, "padAngleDeg": 32, "padAimBlend": 0.9, "vaultBoostMps": 22, "vaultMinMps": 20, "vaultClearM": 8, "vaultMaxVy": 90, "vaultCoolMs": 1200, "vaultClimbMul": 1.2, "poleHalfM": 2.5,
                           "kinds": [{ "halfM": 28, "boxHalfM": 14.5, "boxBottomM": 0, "top": 40, "e": 1.15, "tiltDeg": 22 }, "... 7 kinds ..."] },
              "relaunch": { "mps": 74, "stepMps": 3, "angleDeg": 35, "spinRadS": 1.2 },
              "airBoost": { "minVx": 14, "maxVx": 74, "minVy": 4, "maxVy": 28, "optimalAngleDeg": 35, "perfectMinMps": 120, "perfectGainMps": 36, "perfectSpinKeep": 0.25 },
              "pickups": { "count": 60, "firstX": 230, "gapM": 135, "radius": 9, "heights": [45, 18, 72, 26, 58, 20, 84, 32] },
              "plaid": { "thresholdGbps": 400, "exitGbps": 340 },
              "tail": { "nodes": 4, "segM": 10, "damp": 0.985, "iterations": 4 } },
  "sources": [{ "id": "gfg-l1", "title": "...", "url": "...", "section": "Layer 1", "claim": "...", "reviewed": false }],
  "rounds": [{ "id": "q1", "layer": 1, "prompt": "Which of the following devices ...?",
               "choices": [{ "id": "a", "label": "Router", "why": "A router works at Layer 3 ..." }, "... exactly four ..."],
               "rule": { "correctChoice": "b", "sourceId": "gfg-l1", "explanation": "..." } }],
  "boss": { "id": "boss-l8", "informal": true, "title": "...", "layer": 8, "prompt": "...", "choices": ["... four ..."],
            "rule": { "correctChoice": "b", "sourceId": "layer8-pending", "explanation": "..." } }
}
```

## Validation errors (block grading of that question, show "Content error: …", change no state)
| Condition | Message |
|-----------|---------|
| `rule.correctChoice` missing or not among the choice ids | answer key missing or not one of the options |
| not exactly four choices, duplicate ids, or a choice without label or reason | a question needs exactly four options with unique ids, labels, and reasons |
| `prompt` empty | question text is missing |
| `rule.sourceId` missing or unknown | source missing or unknown |
| more than one choice marked `correct: true` | more than one option is marked correct |
| wrong `schemaVersion`, no sources, no rounds, boss missing or not `informal`, non-positive config, bad `kinds`, bad angle range | field-specific fatal message (game shows the error screen) |
