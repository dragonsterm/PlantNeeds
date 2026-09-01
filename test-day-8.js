/**
 * test-day-8.js — Verification tests for Day 8 Backend (Planner + Growth Log)
 * ----------------------------------------------------------------------------
 * Verifies Task T-16 (Growth Log) logic & Task T-17 (Seasonal Planting Planner).
 * Tests calculation of sowing calendar, harvest days, and companion matrix.
 */
import { planSeasonalPlanting } from './server/logic/planner.js';

async function runTests() {
  console.log('🌱 Running Day 8 Backend Logic Tests (Planner + Seasonal Calendar)...\n');
  let pass = 0;
  let fail = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      pass++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      fail++;
    }
  }

  // 1. Test Seasonal Planner for Northern Temperate Location (e.g. New York, lat: 40.71, lon: -74.00)
  try {
    const resNorth = await planSeasonalPlanting({
      latitude: 40.71,
      longitude: -74.00,
      crops: ['Tomato', 'Basil', 'Pepper', 'Cucumber']
    });

    assert(resNorth.total_crops_planned === 4, 'Plans all 4 requested crops');
    assert(resNorth.location.zone === 'Northern Temperate', 'Identifies Northern Temperate climate zone');

    const tomatoPlan = resNorth.planting_plan.find(p => p.crop === 'Tomato');
    assert(tomatoPlan != null, 'Includes Tomato in planting plan');
    assert(tomatoPlan.companion_plants.includes('basil'), 'Tomato lists basil as companion plant');
    assert(tomatoPlan.avoid_planting_near.includes('fennel'), 'Tomato lists fennel as plant to avoid');
    assert(tomatoPlan.days_to_harvest === 70, 'Tomato days to harvest is 70 days');
    assert(tomatoPlan.start_indoors.includes('weeks before last frost'), 'Computes spring indoor start timeline');

    const basilPlan = resNorth.planting_plan.find(p => p.crop === 'Basil');
    assert(basilPlan != null, 'Includes Basil in planting plan');
    assert(basilPlan.companion_plants.includes('tomato'), 'Basil lists tomato as good neighbor');
  } catch (err) {
    assert(false, `Seasonal planner northern test failed: ${err.message}`);
  }

  // 2. Test Seasonal Planner for Tropical Location (e.g. Jakarta/Cirebon, lat: -6.72, lon: 108.55)
  try {
    const resTrop = await planSeasonalPlanting({
      latitude: -6.72,
      longitude: 108.55,
      crops: ['kemangi', 'cabai', 'buncis', 'jagung']
    });

    assert(resTrop.location.zone.includes('Tropical'), 'Identifies Tropical year-round climate zone');
    assert(resTrop.total_crops_planned === 4, 'Resolves Indonesian aliases (kemangi, cabai, buncis, jagung)');
    
    const kemangiPlan = resTrop.planting_plan.find(p => p.crop === 'Basil');
    assert(kemangiPlan != null, 'Kemangi alias successfully resolves to Basil profile');
  } catch (err) {
    assert(false, `Seasonal planner tropical test failed: ${err.message}`);
  }

  // 3. Test Validation Edge Cases
  try {
    await planSeasonalPlanting({ latitude: null, longitude: 100, crops: ['Tomato'] });
    assert(false, 'Should reject missing latitude');
  } catch (err) {
    assert(err.status === 400, 'Rejects missing coordinates with HTTP 400');
  }

  try {
    await planSeasonalPlanting({ latitude: 10, longitude: 100, crops: [] });
    assert(false, 'Should reject empty crops array');
  } catch (err) {
    assert(err.status === 400, 'Rejects empty crops array with HTTP 400');
  }

  console.log(`\n========================================`);
  console.log(`📊 Day 8 Backend Test Results: ${pass} passed, ${fail} failed.`);
  console.log(`========================================\n`);

  if (fail > 0) process.exit(1);
}

runTests();
