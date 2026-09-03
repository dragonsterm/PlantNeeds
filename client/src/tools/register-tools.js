/**
 * client/src/tools/register-tools.js — WebMCP registration (thin wrappers, C4/C7)
 * --------------------------------------------------------------------------------
 * The ONLY place the 7 tools are defined (spec-drift isolation). Each is a
 * thin wrapper: validate input → call client/logic/* (which calls the API)
 * → return structured JSON. NO business logic here. Guarded by feature
 * detection so the app stays 100% usable without WebMCP (C6).
 *
 * Full schemas + description-writing rules: docs/webmcp-tools.md.
 * Day 5 (T-10): All 7 WebMCP tools registered with exact schemas & descriptions.
 */
import * as plants from '../logic/plants.js';
import * as weather from '../logic/weather.js';
import * as diagnose from '../logic/diagnose.js';
import * as planner from '../logic/planner.js';

/** Feature-detect WebMCP (spec §1). */
export function webmcpAvailable() {
  return typeof window !== 'undefined' && 'modelContext' in document && Boolean(document.modelContext?.registerTool);
}

/**
 * Register all 7 tools. No-op when WebMCP is unavailable (C6).
 * Each tool provides input validation and passes source: 'agent' for actions.
 */
export function registerAllTools() {
  if (!webmcpAvailable()) {
    console.info('[webmcp] modelContext.registerTool unavailable — app remains fully usable by humans (C6)');
    return false;
  }

  const reg = (toolDef) => {
    try {
      const originalExecute = toolDef.execute;
      const securedTool = {
        ...toolDef,
        execute: async (input) => {
          // Check if user disabled WebMCP remote sync in Gardener Settings
          if (typeof localStorage !== 'undefined' && localStorage.getItem('plantneeds_pref_webmcp_sync') === 'false') {
            return {
              error: 'WebMCP remote sync has been disabled by the gardener in Settings.',
              code: 'SYNC_DISABLED'
            };
          }
          return originalExecute(input);
        }
      };

      document.modelContext.registerTool(securedTool);
      console.info(`[webmcp] registered tool: ${toolDef.name}`);
    } catch (err) {
      console.error(`[webmcp] failed to register tool ${toolDef.name}:`, err);
    }
  };

  // Tool 1 — add_plant
  reg({
    name: 'add_plant',
    description: 'Add a plant to the user\'s collection. Automatically attaches a care profile (watering frequency, light needs, tips) from the built-in species database. Use when the user wants to start tracking a plant.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: "Nickname, e.g. 'Kitchen Fern'" },
        species: { type: 'string', description: "e.g. 'Monstera deliciosa' or common name" },
        location: { type: 'string', enum: ['indoor', 'outdoor'] },
        light_exposure: { type: 'string', enum: ['low', 'medium', 'bright_indirect', 'direct'] },
        pot_has_drainage: { type: 'boolean' }
      },
      required: ['name', 'species', 'location']
    },
    execute: async (input) => {
      if (!input || !input.name || !input.species || !input.location) {
        return { error: 'Missing required fields: name, species, and location are required.' };
      }
      return plants.addPlant(input);
    }
  });

  // Tool 2 — get_care_schedule
  reg({
    name: 'get_care_schedule',
    description: 'Get the upcoming care schedule — which plants need watering and when, sorted by urgency. Use when the user asks what\'s due today, what\'s overdue, or about a specific plant\'s next watering. Omit plant_id for all plants.',
    inputSchema: {
      type: 'object',
      properties: {
        plant_id: { type: 'string', description: 'Optional specific plant ID to check' },
        days_ahead: { type: 'number', description: 'Number of days ahead to check (default 7)' }
      }
    },
    execute: async (input = {}) => {
      const { plant_id, days_ahead } = input || {};
      
      // Strict parameter validation (Fix finding 2)
      if (days_ahead !== undefined && (typeof days_ahead !== 'number' || isNaN(days_ahead) || days_ahead <= 0 || days_ahead > 90)) {
        return {
          error: 'Invalid input: "days_ahead" must be a positive integer between 1 and 90.',
          code: 'INVALID_DAYS_AHEAD'
        };
      }

      return plants.getCareSchedule({ plant_id, days_ahead: days_ahead ?? 7 });
    }
  });

  // 3. Tool 3 — get_watering_forecast (flagship)
  reg({
    name: 'get_watering_forecast',
    description: 'Get weather-adjusted watering recommendations using real local rainfall data (past 7 days + 7-day forecast). Outdoor plants are checked against actual precipitation — tells the user which outdoor plants they can SKIP because rain already watered them. Indoor plants are excluded from rain logic. If latitude and longitude are omitted, uses the user\'s current resolved location automatically.',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: { type: 'number', description: 'Optional latitude coordinate. Omit to use the user\'s current resolved location.' },
        longitude: { type: 'number', description: 'Optional longitude coordinate. Omit to use the user\'s current resolved location.' }
      }
    },
    execute: async (input = {}) => {
      let lat = input?.latitude;
      let lon = input?.longitude;

      // Reject non-numeric inputs if provided
      if (lat !== undefined && (typeof lat !== 'number' || isNaN(lat))) {
        return { error: 'Invalid coordinate: latitude must be a number.', code: 'INVALID_COORDINATES' };
      }
      if (lon !== undefined && (typeof lon !== 'number' || isNaN(lon))) {
        return { error: 'Invalid coordinate: longitude must be a number.', code: 'INVALID_COORDINATES' };
      }

      // If omitted, fallback to user's resolved location
      if (lat === undefined || lon === undefined) {
        const coords = await weather.resolveUserCoordinates(false);
        lat = coords.latitude;
        lon = coords.longitude;
      }

      return weather.getWateringForecast({
        latitude: lat,
        longitude: lon
      });
    }
  });

  // Tool 4 — diagnose_problem
  reg({
    name: 'diagnose_problem',
    description: 'Diagnose a sick plant from visible symptoms, cross-referenced with the plant\'s actual care history (watering frequency vs. recommended, light, drainage) — not just generic symptom lookup. Returns ranked likely causes with evidence and fixes. Use when the user reports yellow leaves, drooping, spots, pests, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        plant_id: { type: 'string', description: 'The ID of the sick plant' },
        symptoms: {
          type: 'array',
          items: {
            type: 'string',
            enum: [
              'yellow_leaves',
              'brown_tips',
              'drooping',
              'spots',
              'wilting',
              'pests_visible',
              'slow_growth',
              'leaf_drop',
              'mushy_stem'
            ]
          },
          description: 'Observed plant symptoms'
        }
      },
      required: ['plant_id', 'symptoms']
    },
    execute: async (input) => {
      if (!input || !input.plant_id || !Array.isArray(input.symptoms) || input.symptoms.length === 0) {
        return { error: 'Missing required fields: plant_id and symptoms array (non-empty) are required.' };
      }
      
      // Look up current plant name from cache or local storage if available to preserve nickname
      let localPlant = null;
      try {
        const saved = localStorage.getItem('plantneeds_local_plants');
        if (saved) {
          const parsed = JSON.parse(saved);
          localPlant = parsed.find(p => String(p.id) === String(input.plant_id));
        }
      } catch {}

      const res = await diagnose.diagnoseProblem({
        plant_id: input.plant_id,
        symptoms: input.symptoms,
        plant: localPlant
      });

      if (localPlant && res?.plant) {
        res.plant.name = localPlant.name || res.plant.name;
      }
      return res;
    }
  });

  // Tool 5 — log_care_activity
  reg({
    name: 'log_care_activity',
    description: 'Record that a care task was performed — watering, fertilizing, repotting, pruning, misting, or rotating. Updates the plant\'s schedule immediately. Use when the user says they just watered/fertilized/etc. a plant, or asks you to mark a task done. (For growth milestones like "first flower", use log_growth instead.)',
    inputSchema: {
      type: 'object',
      properties: {
        plant_id: { type: 'string', description: 'The ID of the plant receiving care' },
        activity: {
          type: 'string',
          enum: ['watered', 'fertilized', 'repotted', 'pruned', 'misted', 'rotated'],
          description: 'Type of care activity performed'
        },
        date: { type: 'string', description: 'ISO date string (YYYY-MM-DD), defaults to today' },
        notes: { type: 'string', description: 'Optional notes about the care activity' }
      },
      required: ['plant_id', 'activity']
    },
    execute: async (input) => {
      if (!input || !input.plant_id || !input.activity) {
        return { error: 'Missing required fields: plant_id and activity are required.' };
      }
      return plants.logCareActivity({
        ...input,
        source: 'agent'
      });
    }
  });

  // Tool 6 — plan_seasonal_planting
  reg({
    name: 'plan_seasonal_planting',
    description: 'Build a planting calendar for outdoor crops/vegetables based on location — when to start indoors, transplant, and expected days to harvest, with companion-planting hints. If latitude and longitude are omitted, uses the user\'s current resolved location automatically.',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: { type: 'number', description: 'Optional latitude coordinate' },
        longitude: { type: 'number', description: 'Optional longitude coordinate' },
        crops: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of crop names to plan'
        }
      },
      required: ['crops']
    },
    execute: async (input) => {
      if (!input || !Array.isArray(input.crops) || input.crops.length === 0) {
        return { error: 'Missing required field: crops array is required.' };
      }
      let lat = input.latitude;
      let lon = input.longitude;

      if (typeof lat !== 'number' || typeof lon !== 'number') {
        const coords = await weather.resolveUserCoordinates(false);
        lat = coords.latitude;
        lon = coords.longitude;
      }

      return planner.planSeasonalPlanting({
        latitude: lat,
        longitude: lon,
        crops: input.crops
      });
    }
  });

  // Tool 7 — log_growth
  reg({
    name: 'log_growth',
    description: 'Record a growth milestone in the plant\'s journal — e.g. "first new leaf", "flowered", height check. Use for milestones and progress notes, NOT for routine care tasks (use log_care_activity for those).',
    inputSchema: {
      type: 'object',
      properties: {
        plant_id: { type: 'string', description: 'The ID of the plant' },
        milestone: { type: 'string', description: 'Milestone description, e.g. "first new leaf", "flowered"' },
        height_cm: { type: 'number', description: 'Optional height in centimeters' },
        notes: { type: 'string', description: 'Optional notes' }
      },
      required: ['plant_id', 'milestone']
    },
    execute: async (input) => {
      if (!input || !input.plant_id || !input.milestone) {
        return { error: 'Missing required fields: plant_id and milestone are required.' };
      }

      let plantName = input.plant_name;
      try {
        const saved = localStorage.getItem('plantneeds_local_plants');
        if (saved) {
          const plants = JSON.parse(saved);
          const found = plants.find(p => String(p.id) === String(input.plant_id));
          if (found?.name) plantName = found.name;
        }
      } catch {}

      return planner.logGrowth({
        ...input,
        plant_name: plantName,
        source: 'agent'
      });
    }
  });

  console.info('[webmcp] all 7 tools registered successfully');
  return true;
}
