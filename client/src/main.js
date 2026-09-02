/**
 * client/src/main.js — app bootstrap
 * -----------------------------------
 * Mounts UI subscriptions, registers WebMCP tools (feature-detected, C6), and
 * activates live-sync toast notifications (C5).
 */
import './style.css';
import { mountUi } from './ui/render.js';
import { registerAllTools } from './tools/register-tools.js';
import { initToastSubscriptions } from './ui/components/toast-notification.js';

function boot() {
  mountUi();
  registerAllTools();
  initToastSubscriptions();
  console.info('[app] PlantNeeds client booted with WebMCP & Live-Sync');
}

boot();
