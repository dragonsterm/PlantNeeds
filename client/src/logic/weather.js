/**
 * client/src/logic/weather.js — watering forecast via server proxy (C4). Day 4 (T-09).
 */
import { api } from '../api/client.js';
import { emit } from '../state/store.js';

/** getWateringForecast({latitude, longitude}) → GET /api/weather/forecast → emits 'weather-updated'. */
export async function getWateringForecast({ latitude, longitude }) {
  const params = new URLSearchParams({ latitude, longitude });
  const result = await api(`/api/weather/forecast?${params}`);
  emit('weather-updated');
  return result;
}
