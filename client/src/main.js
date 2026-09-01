/**
 * client/src/main.js — app bootstrap
 * -----------------------------------
 * Mounts UI subscriptions, registers WebMCP tools (feature-detected, C6), and
 * applies base styles. Day 1 scaffold — auth flow + data loading land Day 3+.
 */
import './style.css';
import { mountUi } from './ui/render.js';
import { registerAllTools } from './tools/register-tools.js';

function boot() {
  mountUi();
  registerAllTools();
  console.info('[app] PlantNeeds client booted (Day 1 scaffold)');
}

boot();
