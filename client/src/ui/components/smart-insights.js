/**
 * client/src/ui/components/smart-insights.js
 * 100% Dynamic Smart Insights Generator derived from user plants & Open-Meteo weather telemetry.
 */
export function getSmartInsightsHtml({ plants = [], weatherData = null, theme = 'light' } = {}) {
  const isDark = theme === 'dark';
  const rainMm = typeof weatherData?.recent_rain_mm === 'number' ? weatherData.recent_rain_mm : null;

  const outdoorPlants = plants.filter(p => p.location === 'outdoor');
  const indoorPlants = plants.filter(p => p.location !== 'outdoor');

  let item1 = null;
  let item2 = null;

  // Insight 1: Indoor Plant Hydration & Air Condition
  if (indoorPlants.length > 0) {
    const focusPlant = indoorPlants.find(p => p.is_overdue || p.days_remaining <= 1) || indoorPlants[0];
    const remDays = isNaN(focusPlant.days_remaining) ? (focusPlant.water_frequency_days || 7) : focusPlant.days_remaining;
    item1 = {
      icon: 'water_drop',
      iconColor: isDark ? 'text-status-warning' : 'text-amber-600',
      title: `${focusPlant.name} Hydration`,
      desc: focusPlant.is_overdue
        ? `Soil moisture depleted. Recommended interval is every ${focusPlant.water_frequency_days || 7} days. Water today.`
        : `Hydration on track. Next watering estimated in ${remDays} days.`
    };
  } else {
    item1 = {
      icon: 'potted_plant',
      iconColor: isDark ? 'text-primary-fixed' : 'text-emerald-700',
      title: 'Indoor Garden',
      desc: 'Add indoor houseplants to monitor watering frequency and humidity requirements.'
    };
  }

  // Insight 2: Outdoor Weather Rain Shielding
  if (outdoorPlants.length > 0) {
    const plantNames = outdoorPlants.map(p => p.name).slice(0, 2).join(' & ');
    if (rainMm !== null && rainMm >= 5.0) {
      item2 = {
        icon: 'cloud',
        iconColor: isDark ? 'text-cyan-400' : 'text-cyan-700',
        title: 'Outdoor Rain Delay',
        desc: `${rainMm.toFixed(1)} mm natural rainfall detected. Rain covered ${outdoorPlants.length} outdoor crops — hold manual watering to prevent root rot.`
      };
    } else {
      item2 = {
        icon: 'wb_sunny',
        iconColor: isDark ? 'text-amber-400' : 'text-amber-600',
        title: 'Outdoor Garden',
        desc: `${rainMm !== null ? `${rainMm.toFixed(1)} mm rain recorded` : 'Minimal rain recorded'}. Monitor topsoil moisture for ${plantNames}.`
      };
    }
  } else {
    item2 = {
      icon: 'wb_cloudy',
      iconColor: isDark ? 'text-primary-fixed' : 'text-emerald-700',
      title: 'Weather Integration',
      desc: rainMm !== null 
        ? `Open-Meteo live: ${rainMm.toFixed(1)} mm precipitation this week. Add outdoor crops to activate rain skipping.`
        : 'Connect outdoor garden beds to automatically skip watering when natural rainfall occurs.'
    };
  }

  const cardStyle = isDark
    ? 'bg-white/5 border border-white/10 p-4 rounded-2xl flex gap-3 shadow-sm'
    : 'bg-black/5 border border-black/10 p-4 rounded-2xl flex gap-3 shadow-sm';

  const titleColor = isDark ? 'text-white' : 'text-[#1B3022]';
  const descColor = isDark ? 'text-sage-soft' : 'text-[#556353]';

  return `
    <div class="flex flex-col gap-4">
      <div class="${cardStyle}">
        <span class="material-symbols-outlined ${item1.iconColor} mt-0.5" style="font-size: 22px;">${item1.icon}</span>
        <div>
          <h4 class="font-body-sm font-semibold ${titleColor}">${item1.title}</h4>
          <p class="font-body-sm ${descColor} text-xs mt-1 leading-relaxed">${item1.desc}</p>
        </div>
      </div>
      <div class="${cardStyle}">
        <span class="material-symbols-outlined ${item2.iconColor} mt-0.5" style="font-size: 22px;">${item2.icon}</span>
        <div>
          <h4 class="font-body-sm font-semibold ${titleColor}">${item2.title}</h4>
          <p class="font-body-sm ${descColor} text-xs mt-1 leading-relaxed">${item2.desc}</p>
        </div>
      </div>
    </div>
  `;
}
