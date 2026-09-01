/**
 * client/src/ui/render.js — UI subscriptions (live-sync mechanism, C5)
 * ---------------------------------------------------------------------
 * Subscribes components to store events once at boot. Agent tool calls emit
 * the same events as human clicks, so the UI re-renders for BOTH — no page
 * reload. Day 1: wiring + placeholders; components land Day 3+.
 */
import { on } from '../state/store.js';

/** Register all UI subscriptions. Called once from main.js. */
export function mountUi() {
  on('plants-changed', () => {
    // Day 3: renderPlantGrid(); renderDueBadge();
    console.debug('[ui] plants-changed');
  });
  on('care-logged', () => {
    // Day 3+: renderTimeline();
    console.debug('[ui] care-logged');
  });
  on('weather-updated', () => {
    // Day 4: renderTodayBanner(); renderWeatherWidget();
    console.debug('[ui] weather-updated');
  });
  on('growth-logged', () => {
    // Day 8: renderJournal();
    console.debug('[ui] growth-logged');
  });
  on('auth-changed', () => {
    // render AuthForm on logout / 401
    console.debug('[ui] auth-changed');
  });
}
