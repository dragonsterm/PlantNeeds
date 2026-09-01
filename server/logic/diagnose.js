/**
 * server/logic/diagnose.js — history-aware symptom diagnosis (C4, T-13)
 * ---------------------------------------------------------------------
 * Evaluates symptoms against care history and symptoms-matrix.json.
 * Safe rule evaluator without eval().
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pool } from '../db/pool.js';
import { matchSpecies, FALLBACK_PROFILE } from './species.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load matrix once at module load
let symptomsMatrix = [];
try {
  const matrixPath = join(__dirname, '../data/symptoms-matrix.json');
  symptomsMatrix = JSON.parse(readFileSync(matrixPath, 'utf-8'));
} catch (err) {
  console.error('[diagnose] Failed to load symptoms-matrix.json:', err.message);
}

/**
 * Safe whitelisted rule evaluator — NEVER uses eval().
 * Supports binary comparison expressions joined with '&&':
 * e.g., "avgWaterGap < recommendedGap * 0.6", "drainage === false"
 */
export function evaluateCondition(conditionStr, ctx) {
  if (!conditionStr || typeof conditionStr !== 'string') return false;

  const clauses = conditionStr.split('&&').map(s => s.trim());
  return clauses.every(clause => evaluateClause(clause, ctx));
}

function evaluateClause(clause, ctx) {
  // Regex for binary comparison: <left_expr> <op> <right_expr>
  // Operators: ===, !==, ==, !=, <=, >=, <, >
  const match = clause.match(/^(.+?)\s*(===|!==|==|!=|<=|>=|<|>)\s*(.+)$/);
  if (!match) return false;

  const [, leftRaw, op, rightRaw] = match;
  const leftVal = evalExpression(leftRaw.trim(), ctx);
  const rightVal = evalExpression(rightRaw.trim(), ctx);

  if (leftVal === null || leftVal === undefined || rightVal === null || rightVal === undefined) {
    if (op === '===' || op === '==') return leftVal === rightVal;
    if (op === '!==' || op === '!=') return leftVal !== rightVal;
    return false;
  }

  switch (op) {
    case '===':
    case '==':
      return leftVal === rightVal;
    case '!==':
    case '!=':
      return leftVal !== rightVal;
    case '<=':
      return Number(leftVal) <= Number(rightVal);
    case '>=':
      return Number(leftVal) >= Number(rightVal);
    case '<':
      return Number(leftVal) < Number(rightVal);
    case '>':
      return Number(leftVal) > Number(rightVal);
    default:
      return false;
  }
}

function evalExpression(expr, ctx) {
  // Number literal
  if (/^-?\d+(\.\d+)?$/.test(expr)) return parseFloat(expr);
  // Boolean literal
  if (expr === 'true') return true;
  if (expr === 'false') return false;
  // String literal ('direct', "high")
  if (/^['"].*['"]$/.test(expr)) return expr.slice(1, -1);

  // Multiplication: e.g. "recommendedGap * 0.6"
  if (expr.includes('*')) {
    const parts = expr.split('*').map(p => evalExpression(p.trim(), ctx));
    if (parts.some(p => typeof p !== 'number' || isNaN(p))) return null;
    return parts.reduce((acc, v) => acc * v, 1);
  }

  // Variable lookup from context
  if (Object.prototype.hasOwnProperty.call(ctx, expr)) {
    return ctx[expr];
  }

  return null;
}

function interpolate(template, ctx) {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = ctx[key];
    if (val === null || val === undefined) return '?';
    if (typeof val === 'number') return Number.isInteger(val) ? val.toString() : val.toFixed(1);
    return String(val);
  });
}

/**
 * Diagnose a plant problem given plant_id and symptoms array.
 * Scoped by userId to enforce per-user security.
 */
export async function diagnoseProblem(userId, { plant_id, symptoms }) {
  if (!plant_id) {
    const err = new Error('plant_id is required');
    err.status = 400;
    throw err;
  }
  if (!Array.isArray(symptoms) || symptoms.length === 0) {
    const err = new Error('symptoms array is required');
    err.status = 400;
    throw err;
  }

  // 1. Fetch plant with ownership check
  const plantRes = await pool.query(
    `SELECT * FROM plants WHERE id = $1 AND user_id = $2`,
    [plant_id, userId]
  );
  if (plantRes.rows.length === 0) {
    const err = new Error('Plant not found');
    err.status = 404;
    throw err;
  }
  const plant = plantRes.rows[0];

  // 2. Fetch care logs for the last 90 days
  const careRes = await pool.query(
    `SELECT activity, date FROM care_log
     WHERE plant_id = $1 AND date >= CURRENT_DATE - INTERVAL '90 days'
     ORDER BY date ASC`,
    [plant_id]
  );
  const careLogs = careRes.rows;

  // Compute care history metrics
  const now = new Date();
  const waterLogs = careLogs.filter(l => l.activity === 'watered');
  
  let avgWaterGap = null;
  if (waterLogs.length >= 2) {
    let totalGaps = 0;
    for (let i = 1; i < waterLogs.length; i++) {
      const d1 = new Date(waterLogs[i - 1].date);
      const d2 = new Date(waterLogs[i].date);
      const diffDays = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
      totalGaps += diffDays;
    }
    avgWaterGap = Math.round((totalGaps / (waterLogs.length - 1)) * 10) / 10;
  } else if (waterLogs.length === 1 && plant.last_watered) {
    const daysSince = Math.round((now - new Date(plant.last_watered)) / (1000 * 60 * 60 * 24));
    avgWaterGap = Math.max(1, daysSince);
  }

  const daysSinceWatered = plant.last_watered
    ? Math.max(0, Math.round((now - new Date(plant.last_watered)) / (1000 * 60 * 60 * 24)))
    : null;

  const fertilizeLogs = careLogs.filter(l => l.activity === 'fertilized');
  const lastFertilized = fertilizeLogs.length > 0 ? fertilizeLogs[fertilizeLogs.length - 1].date : null;
  const daysSinceFertilized = lastFertilized
    ? Math.max(0, Math.round((now - new Date(lastFertilized)) / (1000 * 60 * 60 * 24)))
    : 999;

  const repotLogs = careLogs.filter(l => l.activity === 'repotted');
  const lastRepotted = repotLogs.length > 0 ? repotLogs[repotLogs.length - 1].date : null;
  const daysSinceRepotted = lastRepotted
    ? Math.max(0, Math.round((now - new Date(lastRepotted)) / (1000 * 60 * 60 * 24)))
    : (plant.acquired_date
        ? Math.max(0, Math.round((now - new Date(plant.acquired_date)) / (1000 * 60 * 60 * 24)))
        : 999);

  const matched = await matchSpecies(plant.species);
  const speciesInfo = matched?.profile || FALLBACK_PROFILE;
  const recommendedGap = plant.water_frequency_days || (speciesInfo?.water_frequency_days ?? 7);
  const recommendedLight = speciesInfo?.light || 'medium';
  const humidityPref = speciesInfo?.humidity || 'medium';

  const context = {
    avgWaterGap,
    recommendedGap,
    daysSinceWatered,
    daysSinceFertilized,
    daysSinceRepotted,
    drainage: plant.pot_has_drainage,
    light: plant.light_exposure,
    recommendedLight,
    humidityPref,
    location: plant.location
  };

  // 3. Score candidate causes from symptomsMatrix
  const candidateScores = [];

  for (const item of symptomsMatrix) {
    const matchingSymptoms = item.symptoms.filter(s => symptoms.includes(s));
    if (matchingSymptoms.length === 0) continue;

    // Base score + proportion of matching symptoms
    let score = item.base_score || 0.4;
    if (matchingSymptoms.length > 1) {
      score += (matchingSymptoms.length - 1) * 0.05;
    }

    const evidence = [];
    if (Array.isArray(item.rules)) {
      for (const rule of item.rules) {
        if (evaluateCondition(rule.when, context)) {
          score += (rule.boost || 0);
          if (rule.evidence) {
            evidence.push(interpolate(rule.evidence, context));
          }
        }
      }
    }

    // Default evidence if no specific rule fired
    if (evidence.length === 0) {
      evidence.push(`Observed symptoms (${matchingSymptoms.join(', ')}) match pattern for ${item.cause.toLowerCase()}`);
    }

    const likelihood = Math.min(0.95, Math.round(score * 100) / 100);
    const suggested_fix = interpolate(item.suggested_fix, context);

    candidateScores.push({
      cause: item.cause,
      category: item.category || 'General',
      likelihood,
      evidence,
      suggested_fix
    });
  }

  // Sort descending by likelihood, take top 3
  candidateScores.sort((a, b) => b.likelihood - a.likelihood);
  const topDiagnosis = candidateScores.slice(0, 3);

  return {
    plant: {
      id: plant.id,
      name: plant.name,
      species: plant.species,
      location: plant.location
    },
    symptoms_analyzed: symptoms,
    diagnosis: topDiagnosis,
    care_context: {
      avg_water_gap_days: avgWaterGap,
      recommended_gap_days: recommendedGap,
      days_since_watered: daysSinceWatered,
      drainage: plant.pot_has_drainage,
      light: plant.light_exposure,
      location: plant.location
    },
    disclaimer: "Guidance for common issues — consult a local nursery or extension service for serious or spreading problems."
  };
}
