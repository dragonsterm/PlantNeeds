/**
 * Test weather API connection
 */
import { getWateringForecast } from './server/logic/weather.js';

// Test with coordinates from the user's location (you should update this to their actual location)
const TEST_COORDS = [
    { lat: 47.61, lon: -122.33, name: "Seattle, WA (rainy)" },
    { lat: 33.45, lon: -112.07, name: "Phoenix, AZ (dry)" },
    { lat: 34.05, lon: -118.24, name: "Los Angeles, CA" }
];

async function testWeatherAPI() {
    console.log('=== Testing Open-Meteo Weather API ===\n');
    
    for (const coords of TEST_COORDS) {
        console.log(`Testing ${coords.name}: (${coords.lat}, ${coords.lon})`);
        try {
            const result = await getWateringForecast(coords.lat, coords.lon);
            console.log('✓ Success!');
            console.log('  Data source:', result.data_source);
            console.log('  Recent rain:', result.recent_rain_mm?.toFixed(1) + 'mm' || 'N/A');
            console.log('  Forecast rain:', result.forecast_rain_mm?.toFixed(1) + 'mm' || 'N/A');
            console.log('');
        } catch (error) {
            console.log('✗ Failed:', error.message);
            console.log('');
        }
    }
}

testWeatherAPI();
