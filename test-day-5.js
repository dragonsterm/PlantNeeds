/**
 * test-day-5.js — Unit / Mock verification for Day 5 WebMCP tool registration (T10, T11).
 */
import assert from 'assert';

// Mock browser globals for WebMCP
const registeredTools = new Map();
global.window = {};
global.document = {
  modelContext: {
    registerTool: (toolDef) => {
      registeredTools.set(toolDef.name, toolDef);
    }
  }
};

// Import module under test
const { webmcpAvailable, registerAllTools } = await import('./client/src/tools/register-tools.js');

console.log('--- Testing WebMCP Tools Registration (Day 5) ---');

// 1. Feature detection test
assert.strictEqual(webmcpAvailable(), true, 'WebMCP should be detected when modelContext exists');

// 2. Register all tools
const ok = registerAllTools();
assert.strictEqual(ok, true, 'registerAllTools() should return true');
assert.strictEqual(registeredTools.size, 7, 'Expected exactly 7 WebMCP tools registered');

const expectedTools = [
  'add_plant',
  'get_care_schedule',
  'get_watering_forecast',
  'diagnose_problem',
  'log_care_activity',
  'plan_seasonal_planting',
  'log_growth'
];

for (const name of expectedTools) {
  const tool = registeredTools.get(name);
  assert(tool, `Tool ${name} must be registered`);
  assert(tool.description && tool.description.length > 20, `Tool ${name} description must be detailed`);
  assert(tool.inputSchema && tool.inputSchema.type === 'object', `Tool ${name} inputSchema must be object`);
  assert(typeof tool.execute === 'function', `Tool ${name} execute must be a function`);
  console.log(`✅ Verified tool schema & registration: ${name}`);
}

// 3. Test schema error validation on execute()
const addPlantTool = registeredTools.get('add_plant');
const err1 = await addPlantTool.execute({});
assert(err1.error, 'add_plant should fail validation on empty input');

const weatherTool = registeredTools.get('get_watering_forecast');
const err2 = await weatherTool.execute({ latitude: 'invalid' });
assert(err2.error, 'get_watering_forecast should fail on non-numeric coordinates');

const careTool = registeredTools.get('log_care_activity');
const err3 = await careTool.execute({ plant_id: 'p1' });
assert(err3.error, 'log_care_activity should fail when missing activity');

console.log('✅ Validation checks passed on tool execution handlers');

// 4. Test graceful degradation when modelContext missing (C6)
delete global.document.modelContext;
assert.strictEqual(webmcpAvailable(), false, 'webmcpAvailable should return false without modelContext');
const resDegraded = registerAllTools();
assert.strictEqual(resDegraded, false, 'registerAllTools should return false when unsupported without crashing');

console.log('✅ Graceful degradation test (C6) passed');
console.log('All Day 5 WebMCP tool tests passed!');
