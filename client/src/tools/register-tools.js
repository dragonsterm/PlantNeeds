/**
 * client/src/tools/register-tools.js — WebMCP registration (thin wrappers, C4/C7)
 * --------------------------------------------------------------------------------
 * The ONLY place the 7 tools are defined (spec-drift isolation). Each is a
 * thin wrapper: validate input → call client/logic/* (which calls the API)
 * → return structured JSON. NO business logic here. Guarded by feature
 * detection so the app stays 100% usable without WebMCP (C6).
 *
 * Full schemas + description-writing rules: docs/webmcp-tools.md.
 * Day 1: registration scaffolding + feature detection; tool bodies land Day 5 (T-10).
 */
import * as plants from '../logic/plants.js';
import * as weather from '../logic/weather.js';
import * as diagnose from '../logic/diagnose.js';
import * as planner from '../logic/planner.js';

/** Feature-detect WebMCP (spec §1). */
export function webmcpAvailable() {
  return 'modelContext' in document && Boolean(document.modelContext?.registerTool);
}

/**
 * Register all 7 tools. No-op when WebMCP is unavailable (C6).
 * Day 5 (T-10) fills in the 7 registerTool() calls with full schemas +
 * carefully-written descriptions (C7).
 */
export function registerAllTools() {
  if (!webmcpAvailable()) {
    console.info('[webmcp] modelContext.registerTool unavailable — app remains fully usable by humans (C6)');
    return false;
  }
  // Day 5: document.modelContext.registerTool({ name:'add_plant', ... execute: plants.addPlant })
  console.info('[webmcp] WebMCP detected — tools register on Day 5 (T-10)');
  return true;
}
