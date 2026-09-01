/**
 * server/logic/species.js — species matching + fallback (T-04)
 * --------------------------------------------------------------
 * Resolves a free-text species string (from UI or agent) to a plants-db key
 * + care profile. Agents pass text like "monstera" — matching must be
 * forgiving (docs/data-model §Species Matching, supports C8).
 *
 * Resolution order:
 *   1. Exact key            ("monstera_deliciosa")
 *   2. Normalized key       ("Monstera Deliciosa" -> "monstera_deliciosa")
 *   3. common_name / aliases (case-insensitive)
 *   4. No match -> FALLBACK_PROFILE with species 'custom' (FR-1.4)
 */
import { loadPlantsDb } from '../db/seed.js';

/** Fallback care profile for unknown species (FR-1.4). */
export const FALLBACK_PROFILE = {
  common_name: 'Unknown plant',
  water_frequency_days: 7,
  light: 'medium',
  tips: 'Generic care: water when the top inch of soil is dry.',
};

/** Normalize a string for key matching: lowercase, trim, spaces/punct -> _. */
function normalize(str) {
  return String(str ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Resolve a free-text species string to { key, profile }.
 * Returns { key: 'custom', profile: FALLBACK_PROFILE } when no match.
 * @param {string} speciesText — free text from user or agent
 * @returns {Promise<{ key: string, profile: object, matched: boolean }>}
 */
export async function matchSpecies(speciesText) {
  const db = await loadPlantsDb();
  const input = String(speciesText ?? '').trim();
  if (!input) return { key: 'custom', profile: FALLBACK_PROFILE, matched: false };

  // 1. Exact key
  if (db[input]) return { key: input, profile: db[input], matched: true };

  // 2. Normalized key
  const norm = normalize(input);
  if (db[norm]) return { key: norm, profile: db[norm], matched: true };

  // 3. common_name or aliases (case-insensitive)
  const lower = input.toLowerCase();
  for (const [key, profile] of Object.entries(db)) {
    if (profile.common_name?.toLowerCase() === lower) {
      return { key, profile, matched: true };
    }
    if (Array.isArray(profile.aliases)) {
      for (const alias of profile.aliases) {
        if (alias.toLowerCase() === lower) {
          return { key, profile, matched: true };
        }
      }
    }
  }

  // 4. Fallback
  return { key: 'custom', profile: FALLBACK_PROFILE, matched: false };
}

/**
 * Get care tips array from a profile (used by POST /plants response).
 * @param {object} profile — matched or fallback profile
 * @returns {string[]}
 */
export function careTips(profile) {
  const tips = [];
  if (profile.tips) tips.push(profile.tips);
  if (profile.water_frequency_days) {
    tips.push(`Water every ~${profile.water_frequency_days} days.`);
  }
  if (profile.water_needs_inches_weekly) {
    tips.push(`Needs ~${profile.water_needs_inches_weekly} inches of water per week.`);
  }
  if (profile.light) {
    const lightLabels = {
      low: 'Tolerates low light.',
      medium: 'Prefers medium / indirect light.',
      bright_indirect: 'Prefers bright, indirect light.',
      direct: 'Needs direct sunlight.',
    };
    tips.push(lightLabels[profile.light] ?? `Light: ${profile.light}.`);
  }
  if (profile.toxic_to_pets) {
    tips.push('Toxic to pets — keep out of reach of cats and dogs.');
  }
  return tips;
}
