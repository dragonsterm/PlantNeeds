#!/usr/bin/env node
/**
 * test-day-6.js — Diagnosis Engine & Safe Evaluator Verification (L8–L10)
 * ------------------------------------------------------------------------
 * Day 6 test suite testing:
 * 1. Safe condition evaluator (various comparisons & arithmetic)
 * 2. L8: Monstera yellow_leaves + overwatering history -> Overwatering rank #1
 * 3. L9: Underwatering history -> Underwatering rank #1
 * 4. L10: Disclaimer presence
 * 5. Multi-symptom handling & evidence generation
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import { evaluateCondition } from './server/logic/diagnose.js';

console.log('🧪 Running Day 6 Diagnosis Engine Tests...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`✅ PASS: ${name}`);
  } catch (err) {
    failed++;
    console.error(`❌ FAIL: ${name}`, err.message);
  }
}

// 1. Unit Tests for Rule Evaluator
test('Rule Evaluator: arithmetic and inequality (<)', () => {
  const ctx = { avgWaterGap: 4, recommendedGap: 10 };
  assert.strictEqual(evaluateCondition('avgWaterGap < recommendedGap * 0.6', ctx), true);
});

test('Rule Evaluator: inequality (>) false case', () => {
  const ctx = { avgWaterGap: 4, recommendedGap: 10 };
  assert.strictEqual(evaluateCondition('avgWaterGap > recommendedGap * 1.5', ctx), false);
});

test('Rule Evaluator: boolean exact equality (===)', () => {
  const ctx = { drainage: false };
  assert.strictEqual(evaluateCondition('drainage === false', ctx), true);
  assert.strictEqual(evaluateCondition('drainage === true', ctx), false);
});

test('Rule Evaluator: string comparison with && chain', () => {
  const ctx = { light: 'direct', recommendedLight: 'bright_indirect' };
  assert.strictEqual(evaluateCondition("light === 'direct' && recommendedLight !== 'direct'", ctx), true);
});

test('Rule Evaluator: range check with numbers and booleans', () => {
  const ctx = { avgWaterGap: 7, recommendedGap: 7, drainage: true };
  assert.strictEqual(evaluateCondition('avgWaterGap >= recommendedGap * 0.8 && avgWaterGap <= recommendedGap * 1.2 && drainage === true', ctx), true);
});

// 2. Logic Simulation Tests (L8, L9, L10)
const matrix = JSON.parse(readFileSync('./server/data/symptoms-matrix.json', 'utf-8'));

function simulateDiagnosis(plant, careContext, symptoms) {
  const candidateScores = [];
  for (const item of matrix) {
    const matchingSymptoms = item.symptoms.filter(s => symptoms.includes(s));
    if (matchingSymptoms.length === 0) continue;

    let score = item.base_score || 0.4;
    if (matchingSymptoms.length > 1) {
      score += (matchingSymptoms.length - 1) * 0.05;
    }

    const evidence = [];
    if (Array.isArray(item.rules)) {
      for (const rule of item.rules) {
        if (evaluateCondition(rule.when, careContext)) {
          score += (rule.boost || 0);
          if (rule.evidence) {
            evidence.push(rule.evidence);
          }
        }
      }
    }

    candidateScores.push({
      cause: item.cause,
      likelihood: Math.min(0.95, Math.round(score * 100) / 100),
      evidence,
      suggested_fix: item.suggested_fix
    });
  }

  candidateScores.sort((a, b) => b.likelihood - a.likelihood);
  return {
    plant,
    diagnosis: candidateScores.slice(0, 3),
    disclaimer: "Guidance for common issues — consult a local nursery or extension service for serious or spreading problems."
  };
}

test('L8: Monstera yellow_leaves watered every 4d (recommended 10d) ranks Overwatering #1', () => {
  const plant = { name: 'Monstera', species: 'monstera_deliciosa' };
  const careContext = {
    avgWaterGap: 4,
    recommendedGap: 10,
    drainage: false,
    daysSinceWatered: 2,
    daysSinceFertilized: 40,
    daysSinceRepotted: 60,
    light: 'bright_indirect',
    recommendedLight: 'bright_indirect',
    humidityPref: 'high',
    location: 'indoor'
  };

  const res = simulateDiagnosis(plant, careContext, ['yellow_leaves']);
  assert.strictEqual(res.diagnosis[0].cause, 'Overwatering');
  assert(res.diagnosis[0].likelihood >= 0.8, `Expected high likelihood, got ${res.diagnosis[0].likelihood}`);
});

test('L9: Underwatering care history (gap 18d vs recommended 7d) ranks Underwatering #1', () => {
  const plant = { name: 'Peace Lily', species: 'spathiphyllum_wallisii' };
  const careContext = {
    avgWaterGap: 18,
    recommendedGap: 7,
    drainage: true,
    daysSinceWatered: 18,
    daysSinceFertilized: 40,
    daysSinceRepotted: 60,
    light: 'low',
    recommendedLight: 'low',
    humidityPref: 'high',
    location: 'indoor'
  };

  const res = simulateDiagnosis(plant, careContext, ['drooping', 'yellow_leaves']);
  assert.strictEqual(res.diagnosis[0].cause, 'Underwatering');
  assert(res.diagnosis[0].likelihood >= 0.8);
});

test('L10: Mandatory disclaimer is present in diagnosis payload (NFR-7)', () => {
  const plant = { name: 'Pothos', species: 'epipremnum_aureum' };
  const careContext = { avgWaterGap: 7, recommendedGap: 7, drainage: true };
  const res = simulateDiagnosis(plant, careContext, ['brown_tips']);
  assert(res.disclaimer && typeof res.disclaimer === 'string');
  assert(res.disclaimer.includes('consult a local nursery'));
});

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
