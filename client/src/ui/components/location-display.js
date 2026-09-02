/**
 * client/src/ui/components/location-display.js — Weather location visibility
 */

export function renderLocationDisplay(container) {
  const locationContainer = document.createElement('div');
  
  // Common styles for the location widget
  const baseStyles = `
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 16px;
    padding: 16px;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  `;
  
  locationContainer.style.cssText = baseStyles;
  
  locationContainer.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <!-- Location Icon -->
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A3D94E" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
      
      <div style="flex: 1;">
        <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: #1a3a1a;">Your Weather Location</h4>
        <p id="location-coords" style="margin: 4px 0 0; font-size: 12px; color: #666;">Loading...</p>
        <p id="location-help" style="margin: 4px 0 0; font-size: 11px; color: #888;">Enter coordinates for accurate rain detection</p>
      </div>
    </div>
    
    <!-- Location Input Section (for manual override if needed) -->
    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0, 0, 0, 0.1);">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div>
          <label style="display: block; font-size: 10px; color: #888; margin-bottom: 4px;">Latitude</label>
          <input type="text" id="lat-input" placeholder="-90 to 90" 
            style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 8px; font-size: 11px;"
          />
        </div>
        <div>
          <label style="display: block; font-size: 10px; color: #888; margin-bottom: 4px;">Longitude</label>
          <input type="text" id="lon-input" placeholder="-180 to 180" 
            style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 8px; font-size: 11px;"
          />
        </div>
      </div>
      <button id="update-location-btn" style="
        margin-top: 8px;
        width: 100%;
        padding: 8px;
        background: #A3D94E;
        border: none;
        border-radius: 8px;
        color: white;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
      ">Update Location</button>
    </div>
  `;
  
  container.appendChild(locationContainer);
  
  // Get user's geolocation (with permission)
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude.toFixed(4);
      const lon = position.coords.longitude.toFixed(4);
      
      document.getElementById('location-coords').textContent = 
        `${lat}, ${lon} • ${getEstimatedCityName(lat, lon)}`;
      document.getElementById('lat-input').value = lat;
      document.getElementById('lon-input').value = lon;
      
      // Update localStorage for persistent location
      localStorage.setItem('plantneeds_weather_lat', lat);
      localStorage.setItem('plantneeds_weather_lon', lon);
    },
    (error) => {
      console.warn('[location] Geolocation denied:', error.message);
      // Fallback to saved location or demo cities
      const savedLat = localStorage.getItem('plantneeds_weather_lat');
      const savedLon = localStorage.getItem('plantneeds_weather_lon');
      
      if (savedLat && savedLon) {
        document.getElementById('location-coords').textContent = 
          `${savedLat}, ${savedLon} • Previously used location`;
        document.getElementById('lat-input').value = savedLat;
        document.getElementById('lon-input').value = savedLon;
      } else {
        // Default to Seattle (rainy demo location)
        document.getElementById('location-coords').textContent = 
          '47.61, -122.33 • Seattle, WA (Demo Default)';
        document.getElementById('lat-input').value = '47.61';
        document.getElementById('lon-input').value = '-122.33';
      }
    },
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
  );
  
  // Update location button handler
  document.getElementById('update-location-btn')?.addEventListener('click', () => {
    const lat = parseFloat(document.getElementById('lat-input').value);
    const lon = parseFloat(document.getElementById('lon-input').value);
    
    if (isNaN(lat) || isNaN(lon)) {
      alert('Please enter valid coordinates');
      return;
    }
    
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      alert('Invalid coordinates. Latitude: -90 to 90, Longitude: -180 to 180');
      return;
    }
    
    localStorage.setItem('plantneeds_weather_lat', lat.toFixed(4));
    localStorage.setItem('plantneeds_weather_lon', lon.toFixed(4));
    
    document.getElementById('location-coords').textContent = 
      `${lat.toFixed(4)}, ${lon.toFixed(4)} • Location updated`;
    
    // Emit event to update weather forecast
    window.dispatchEvent(new CustomEvent('weather-location-changed', { 
      detail: { latitude: lat, longitude: lon } 
    }));
  });
}

// Simple city name estimation (very basic - uses lat/lon ranges)
function getEstimatedCityName(lat, lon) {
  if (Math.abs(lat - 47.61) < 1 && Math.abs(lon + 122.33) < 1) return 'Seattle, WA';
  if (Math.abs(lat - 33.45) < 1 && Math.abs(lon + 112.07) < 1) return 'Phoenix, AZ';
  if (Math.abs(lat - 34.05) < 1 && Math.abs(lon + 118.24) < 1) return 'Los Angeles, CA';
  if (lat > 40 && lat < 42 && lon > -74 && lon < -73) return 'New York City area';
  if (lat > 51 && lat < 52 && lon > -0.1 && lon < 0.1) return 'London, UK';
  if (lat > 35 && lat < 36 && lon > 139 && lon < 140) return 'Tokyo, Japan';
  return 'Your Location';
}
