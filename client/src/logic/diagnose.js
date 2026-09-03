/**
 * client/src/logic/diagnose.js — problem diagnosis via server (C4) with robust client-side fallback
 */
import { api } from '../api/client.js';
import { emit } from '../state/store.js';
import symptomsMatrix from '../data/symptoms-matrix.json' with { type: 'json' };

function evaluateClause(clause, ctx) {
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

  // Prevent NaN or non-number comparisons from triggering false rules
  if (op === '<=' || op === '>=' || op === '<' || op === '>') {
    if (typeof leftVal !== 'number' || typeof rightVal !== 'number' || isNaN(leftVal) || isNaN(rightVal)) {
      return false;
    }
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
  if (/^-?\d+(\.\d+)?$/.test(expr)) return parseFloat(expr);
  if (expr === 'true') return true;
  if (expr === 'false') return false;
  if (/^['"].*['"]$/.test(expr)) return expr.slice(1, -1);

  if (expr.includes('*')) {
    const parts = expr.split('*').map(p => evalExpression(p.trim(), ctx));
    if (parts.some(p => typeof p !== 'number' || isNaN(p))) return null;
    return parts.reduce((acc, v) => acc * v, 1);
  }

  if (Object.prototype.hasOwnProperty.call(ctx, expr)) {
    return ctx[expr];
  }

  return null;
}

function evaluateCondition(conditionStr, ctx) {
  if (!conditionStr || typeof conditionStr !== 'string') return false;
  const clauses = conditionStr.split('&&').map(s => s.trim());
  return clauses.every(clause => evaluateClause(clause, ctx));
}

function interpolate(template, ctx) {
  if (!template) return '';
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = ctx[key];
    if (val === null || val === undefined) return '?';
    if (typeof val === 'number') return Number.isInteger(val) ? val.toString() : val.toFixed(1);
    return String(val);
  });
}

/**
 * Local evaluation fallback using symptoms-matrix.json and saved local plants
 */
export function evaluateDiagnosisLocally({ plant, symptoms = [] }) {
  const currentPlant = plant || {
    id: '1',
    name: 'Houseplant',
    species: 'Monstera deliciosa',
    location: 'indoor',
    light_exposure: 'bright_indirect',
    pot_has_drainage: true,
    water_frequency_days: 7,
    days_since_watered: 2
  };

  const daysSinceWatered = currentPlant.days_since_watered ?? 2;
  const recommendedGap = currentPlant.water_frequency_days || 7;
  const avgWaterGap = daysSinceWatered;
  const recommendedLight = currentPlant.light_exposure || 'bright_indirect';

  const context = {
    avgWaterGap,
    recommendedGap,
    daysSinceWatered,
    daysSinceFertilized: null,
    daysSinceRepotted: null,
    drainage: currentPlant.pot_has_drainage !== false,
    light: currentPlant.light_exposure || 'bright_indirect',
    recommendedLight,
    humidityPref: 'medium',
    location: currentPlant.location || 'indoor'
  };

  const candidateScores = [];

  for (const item of symptomsMatrix) {
    const matchingSymptoms = item.symptoms.filter(s => symptoms.includes(s));
    if (matchingSymptoms.length === 0) continue;

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

  candidateScores.sort((a, b) => b.likelihood - a.likelihood);
  const topDiagnosis = candidateScores.slice(0, 3);

  return {
    plant: {
      id: currentPlant.id,
      name: currentPlant.name,
      species: currentPlant.species,
      location: currentPlant.location
    },
    symptoms_analyzed: symptoms,
    diagnosis: topDiagnosis,
    care_context: {
      avg_water_gap_days: avgWaterGap,
      recommended_gap_days: recommendedGap,
      days_since_watered: daysSinceWatered,
      drainage: currentPlant.pot_has_drainage,
      light: currentPlant.light_exposure,
      location: currentPlant.location
    },
    disclaimer: "Guidance for common issues — consult a local nursery or extension service for serious or spreading problems."
  };
}

/**
 * Formats the raw server or local result into normalized { top_diagnosis, differential_diagnoses, ... }
 * so both UI renderers and WebMCP tools receive consistent structures.
 */
export function normalizeDiagnosisResult(raw) {
  if (!raw) return null;
  
  let top_diagnosis = null;
  let differential_diagnoses = [];

  if (Array.isArray(raw.diagnosis) && raw.diagnosis.length > 0) {
    const first = raw.diagnosis[0];
    top_diagnosis = {
      condition: first.cause || 'Care Imbalance',
      confidence: Math.round((first.likelihood || 0.85) * 100),
      evidence: Array.isArray(first.evidence) ? first.evidence.join('. ') : (first.evidence || ''),
      suggested_fix: first.suggested_fix || 'Review water and lighting conditions.'
    };

    differential_diagnoses = raw.diagnosis.slice(1).map(d => ({
      condition: d.cause,
      confidence: Math.round((d.likelihood || 0.5) * 100)
    }));
  } else if (raw.top_diagnosis) {
    top_diagnosis = raw.top_diagnosis;
    differential_diagnoses = raw.differential_diagnoses || [];
  }

  return {
    ...raw,
    top_diagnosis,
    differential_diagnoses
  };
}

/**
 * diagnoseProblem({plant_id, symptoms, plant})
 * Tries backend POST /api/diagnose first; if offline or fails, falls back to local evaluator.
 * Emits 'diagnosis-performed' to trigger live UI updates (C5).
 */
export async function diagnoseProblem({ plant_id, symptoms, plant = null }) {
  let result = null;
  try {
    result = await api('/api/diagnose', { 
      method: 'POST', 
      body: { 
        plant_id, 
        symptoms,
        plant: plant ? {
          name: plant.name,
          species: plant.species,
          location: plant.location,
          light_exposure: plant.light_exposure,
          pot_has_drainage: plant.pot_has_drainage,
          water_frequency_days: plant.water_frequency_days,
          last_watered: plant.last_watered
        } : null
      } 
    });
  } catch (err) {
    console.warn('[diagnose] API call failed, falling back to client evaluation:', err?.message || err);
    result = evaluateDiagnosisLocally({ plant, symptoms });
  }

  const normalized = normalizeDiagnosisResult(result);
  emit('diagnosis-performed', normalized);
  return normalized;
}
