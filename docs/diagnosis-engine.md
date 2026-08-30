---
tags: [diagnosis, docs, algorithm]
type: doc
---
# 🔍 Diagnosis Engine

> How `diagnose_problem` turns symptoms into ranked causes. Contract: [[specification#3.3 diagnose.js|spec §3.3]]. Tool schema: [[docs/webmcp-tools#Tool 4 — diagnose_problem|webmcp-tools]].

## Why Not Just a Lookup Table?

A static "yellow leaves → overwatering" table is what every existing plant app does — and it's often wrong (yellow leaves can ALSO be underwatering, nitrogen deficiency, or normal aging). **Our differentiator (FR-4.3): cross-reference the plant's ACTUAL care history** to rank causes. This is the "reasoning app, not reference book" pitch made concrete.

## The Algorithm (3 steps)

```
INPUT: plant_id, symptoms[]
─────────────────────────────────────────────
STEP 1 — GATHER CONTEXT
  plant        = db.plants.get(plant_id)
  waterEvents  = db.care_log.where({plant_id, activity:'watered'}).last(30 days)
  avgWaterGap  = mean days between waterEvents   (null if < 2 events)
  context      = { avgWaterGap,
                   recommendedGap: plant.water_frequency_days,
                   light: plant.light_exposure,
                   drainage: plant.pot_has_drainage,
                   location: plant.location }

STEP 2 — SCORE CANDIDATES
  candidates = all matrix entries whose symptoms[] intersect input symptoms[]
  for each candidate:
    likelihood = baseScore                        // 0.4 — symptom match alone
    for each evidence_rule in candidate.rules:
      if rule matches context: likelihood += rule.boost
    likelihood = min(likelihood, 0.95)

STEP 3 — RANK & EXPLAIN
  sort desc by likelihood → take top 3
  for each: evidence[] = human-readable strings of WHICH rules fired
  attach care_context + disclaimer (NFR-7, mandatory)
```

## Symptom Matrix Format (`src/data/symptoms-matrix.json`)

```json
[
  {
    "cause": "Overwatering",
    "symptoms": ["yellow_leaves", "mushy_stem", "drooping", "leaf_drop"],
    "base_score": 0.4,
    "rules": [
      { "when": "avgWaterGap < recommendedGap * 0.6", "boost": 0.4,
        "evidence": "Watered every {avgWaterGap}d but this plant prefers every {recommendedGap}d" },
      { "when": "drainage === false", "boost": 0.15,
        "evidence": "Pot has no drainage — water accumulates" }
    ],
    "suggested_fix": "Let soil dry completely. Skip {recommendedGap} days, then resume at recommended frequency. Check roots for rot."
  },
  {
    "cause": "Underwatering",
    "symptoms": ["yellow_leaves", "drooping", "brown_tips", "wilting"],
    "base_score": 0.4,
    "rules": [
      { "when": "avgWaterGap > recommendedGap * 1.5", "boost": 0.4,
        "evidence": "Watered every {avgWaterGap}d but this plant needs every {recommendedGap}d" }
    ],
    "suggested_fix": "Water thoroughly now; return to every-{recommendedGap}-day schedule."
  }
]
```

**Rule condition language:** a small whitelisted set of comparisons over the context fields (`<`, `>`, `===`, `!==` against numbers/booleans/strings). Implement as a tiny safe evaluator — **never `eval()`**.

## Target Coverage (~20 causes — Day 6 work, [[tasks/day-06]])

| Category | Causes |
|---|---|
| Water | Overwatering, Underwatering |
| Light | Too much direct sun, Insufficient light |
| Roots/soil | Root rot, Root bound, Poor drainage, Nutrient deficiency (N), Nutrient deficiency (Fe) |
| Environment | Low humidity, Cold stress, Heat stress, Draft shock |
| Pests | Spider mites, Fungus gnats, Mealybugs, Aphids |
| Other | Natural aging, Fertilizer burn, Transplant shock |

## Worked Example (the demo moment)

Monstera, `water_frequency_days: 10`, watered every 4 days, symptom `["yellow_leaves"]`:
1. Candidates matching symptom: Overwatering, Underwatering, Nutrient deficiency, Natural aging
2. Overwatering: base 0.4 + rule(4 < 6) boost 0.4 + drainage boost 0.15 → **0.95** ✅
3. Underwatering: rule(4 > 15) false → stays 0.4
4. Result: Overwatering ranked #1, with evidence *"Watered every 4d but this plant prefers every 10d"* — the agent can SAY that. That's the magic.

## Output Contract Reminder

Always include `disclaimer`: *"Guidance for common issues — consult a local nursery or extension service for serious or spreading problems."* (NFR-7)

**Related:** [[specification]] · [[docs/data-model]] · [[docs/webmcp-tools]] · [[docs/testing-strategy]]
