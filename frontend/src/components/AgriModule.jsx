import React from 'react';

export default function AgriModule({ weatherData, tempUnit }) {
  if (!weatherData) return <div style={{ color: 'white', padding: '20px' }}>Loading Agricultural Intelligence...</div>;

  const current = weatherData.current || {};
  const hourly = weatherData.hourly || {};
  const temp = current.temperature_2m !== undefined ? current.temperature_2m : (current.temperature || 0);
  const precip = current.precipitation !== undefined ? current.precipitation : 0;
  const wind = current.wind_speed_10m !== undefined ? current.wind_speed_10m : (current.windspeed || 0);

  const cityTime = current.time ? new Date(current.time) : new Date();
  const nowHour = cityTime.getHours();

  // Soil Telemetry (New Open-Meteo variables parsed from hourly data)
  const soilMoisture = (hourly.soil_moisture_0_to_1cm && hourly.soil_moisture_0_to_1cm[nowHour])
    ? hourly.soil_moisture_0_to_1cm[nowHour] : (precip > 0 ? 0.35 : 0.15); // Fallback
  const soilTemp = (hourly.soil_temperature_0cm && hourly.soil_temperature_0cm[nowHour])
    ? hourly.soil_temperature_0cm[nowHour] : temp; // Fallback

  const smPerc = Math.round(soilMoisture * 100);

  // Humidity fallback
  const humidity = hourly.relative_humidity_2m ? hourly.relative_humidity_2m[nowHour] : (current.relative_humidity_2m || current.humidity || 50);

  // Logic Tree for Action Required
  let advice = "Conditions are optimal for field operations. Soil moisture levels are stable.";
  let icon = "bi-check-circle";
  let color = "#81c784"; // Green

  if (precip > 5) {
    advice = "Heavy rainfall detected. Pause sowing activities to avoid seed washout. Ensure drainage channels are clear.";
    icon = "bi-cloud-rain";
    color = "#4fc3f7";
  } else if (temp > 35) {
    advice = "High thermal stress. Irrigate crops during evening hours to minimize evaporation loss.";
    icon = "bi-thermometer-sun";
    color = "#ffb74d";
  } else if (humidity > 85 && temp > 25) {
    advice = "High fungal risk due to warm, humid conditions. Monitor for blight and rust.";
    icon = "bi-exclamation-triangle";
    color = "#ff8a65";
  } else if (wind > 20) {
    advice = "Strong winds detected. Secure tall crops (maize, sugarcane) and delay spraying operations.";
    icon = "bi-wind";
    color = "#e57373";
  }

  // Pest Risk calculation
  let pestRisk = "Low";
  let pestColor = "#69f0ae";
  if (humidity > 80 && temp > 28) {
    pestRisk = "High";
    pestColor = "#ff5252";
  } else if (humidity > 60) {
    pestRisk = "Moderate";
    pestColor = "#ffab40";
  }

  return (
    <div className="glass-panel" style={{ padding: '30px', margin: '20px 0', color: 'white', textAlign: 'left' }}>
      <h2 style={{ color: 'var(--accent-color)', marginBottom: '25px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <i className="bi bi-sprout"></i> Agricultural Intelligence Module
      </h2>
      <p style={{ opacity: 0.8, fontSize: '0.95rem', marginBottom: '30px', lineHeight: 1.6 }}>
        Atmospheric data mapped directly to micro-soil health profiles. Crop advisory updates every 60 minutes based on real-time relative humidity, temperature stress and soil hydration indices.
      </p>

      {/* Soil Telemetry Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            <i className="bi bi-moisture"></i> Soil Moisture
          </div>
          <div id="soil-moisture-val" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-color)' }}>
            {smPerc}%
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '5px' }}>
            Direct 0-1cm depth volumetric water fraction
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            <i className="bi bi-thermometer-half"></i> Soil Temperature
          </div>
          <div id="soil-temp-val" style={{ fontSize: '2rem', fontWeight: 700, color: '#ffb74d' }}>
            {Math.round(soilTemp)}°C
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '5px' }}>
            0cm depth surface soil temperature profile
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            <i className="bi bi-bug"></i> Pest Infestation Risk
          </div>
          <div id="pest-risk-display" style={{ fontSize: '1.5rem', fontWeight: 600, color: pestColor, display: 'flex', flexDirection: 'column' }}>
            <span>{pestRisk}</span>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 400, marginTop: '5px' }}>
              humidity/temp risk index
            </span>
          </div>
        </div>
      </div>

      {/* Crop Advisory */}
      <div
        id="agri-advisory"
        style={{
          background: 'rgba(255,255,255,0.02)',
          padding: '25px',
          borderRadius: '16px',
          border: `1px solid ${color}40`,
          boxShadow: `0 10px 30px ${color}10`,
          display: 'flex',
          alignItems: 'start',
          gap: '20px'
        }}
      >
        <i className={`bi ${icon}`} style={{ fontSize: '2.5rem', color: color }}></i>
        <div>
          <div style={{ fontWeight: 700, color: color, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            ACTION REQUIRED
          </div>
          <div style={{ fontSize: '1.05rem', lineHeight: 1.6, fontWeight: 300, opacity: 0.9 }}>
            {advice}
          </div>
        </div>
      </div>
    </div>
  );
}
