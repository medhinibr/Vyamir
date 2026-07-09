import React, { useEffect, useState } from 'react';

// Unit conversion helpers
const getTemp = (c, unit) => (unit === 'F' ? (c * 9) / 5 + 32 : c);
const getSpeed = (kph, unit) => (unit === 'F' ? kph * 0.621371 : kph);
const getDist = (km, unit) => (unit === 'F' ? km * 0.621371 : km);
const getPrecip = (mm, unit) => (unit === 'F' ? mm * 0.0393701 : mm);

const getSpeedUnit = (unit) => (unit === 'F' ? 'mph' : 'km/h');
const getDistUnit = (unit) => (unit === 'F' ? 'mi' : 'km');
const getPrecipUnit = (unit) => (unit === 'F' ? 'in' : 'mm');

function getWeatherIcon(code) {
  if (code === 0) return 'bi bi-sun';
  if (code === 1 || code === 2) return 'bi bi-cloud-sun';
  if (code === 3) return 'bi bi-cloud';
  if (code >= 45 && code <= 48) return 'bi bi-cloud-haze';
  if (code >= 51 && code <= 57) return 'bi bi-cloud-drizzle';
  if (code >= 61 && code <= 67) return 'bi bi-cloud-rain';
  if (code >= 71 && code <= 77) return 'bi bi-snow';
  if (code >= 80 && code <= 82) return 'bi bi-cloud-rain-heavy';
  if (code >= 85 && code <= 86) return 'bi bi-cloud-snow';
  if (code >= 95) return 'bi bi-lightning';
  return 'bi bi-cloud';
}

function getWeatherDescription(code) {
  const codes = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Rime fog', 51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
    56: 'Light Freezing Drizzle', 57: 'Dense Freezing Drizzle',
    61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
    66: 'Light Freezing Rain', 67: 'Heavy Freezing Rain',
    71: 'Slight Snow', 73: 'Moderate Snow', 75: 'Heavy Snow', 77: 'Snow grains',
    80: 'Rain Showers', 81: 'Moderate Showers', 82: 'Violent Showers',
    85: 'Slight Snow Showers', 86: 'Heavy Snow Showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail'
  };
  return codes[code] || 'Unknown';
}

export default function Dashboard({ weatherData, tempUnit, locationSource, onOpenVideo, onShowToast }) {
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  const city = weatherData?.city || 'Unknown Location';
  const current = weatherData?.current || {};
  const hourly = weatherData?.hourly || {};
  const daily = weatherData?.daily || {};
  const airQuality = weatherData?.air_quality || {};

  const temperature = current.temperature_2m !== undefined ? current.temperature_2m : current.temperature;
  const weatherCode = current.weathercode !== undefined ? current.weathercode : current.weather_code;
  const wind = current.wind_speed_10m !== undefined ? current.wind_speed_10m : current.windspeed;
  const pressure = current.pressure !== undefined ? current.pressure : (current.surface_pressure || 1013);
  const windDir = current.winddirection !== undefined ? current.winddirection : (current.wind_direction_10m || 0);

  // Align current hourly metrics by city local time hour index
  const cityTime = current.time ? new Date(current.time) : new Date();
  const nowHour = cityTime.getHours();

  // Find nearest hourly index
  const nowStr = current.time ? current.time.slice(0, 13) : '';
  let startHourlyIndex = hourly.time ? hourly.time.findIndex((t) => t.startsWith(nowStr)) : -1;
  if (startHourlyIndex === -1) startHourlyIndex = 0;

  // 1. Feels Like
  const feelsLike = hourly.apparent_temperature ? hourly.apparent_temperature[nowHour] : temperature;

  // 2. Precipitation
  const precipProb = hourly.precipitation_probability ? hourly.precipitation_probability[nowHour] : 0;
  const precipAmount = hourly.precipitation ? hourly.precipitation[nowHour] : 0;

  // 3. Humidity
  const humidity = hourly.relative_humidity_2m ? hourly.relative_humidity_2m[nowHour] : (current.relative_humidity_2m || 0);
  const dewPoint = Math.round(temperature - (100 - humidity) / 5);

  // 4. UV Index
  const uv = hourly.uv_index ? hourly.uv_index[nowHour] : 0;
  let uvDesc = 'Low';
  if (uv > 2) uvDesc = 'Moderate';
  if (uv > 5) uvDesc = 'High';
  if (uv > 7) uvDesc = 'Very High';

  // 5. Visibility
  const visRaw = hourly.visibility ? hourly.visibility[nowHour] : 10000;
  const visibility = visRaw / 1000;

  // 6. Pressure Trend (compare with 3 hours ago)
  const prevPressure = hourly.surface_pressure ? hourly.surface_pressure[Math.max(0, nowHour - 3)] : pressure;
  let pressDesc = 'Stable';
  if (pressure < prevPressure - 1) pressDesc = 'Falling';
  if (pressure > prevPressure + 1) pressDesc = 'Rising';

  // 7. Air Quality
  const aqi = airQuality.european_aqi ? airQuality.european_aqi[nowHour] : 0;
  const pm25 = airQuality.pm2_5 ? airQuality.pm2_5[nowHour] : 0;
  const pm10 = airQuality.pm10 ? airQuality.pm10[nowHour] : 0;
  const o3 = airQuality.ozone ? airQuality.ozone[nowHour] : 0;

  let aqiStatus = 'Good';
  let advice = 'Safe for outdoor activities.';
  if (aqi > 20) { aqiStatus = 'Fair'; advice = 'Sensitive groups should reduce exertion.'; }
  if (aqi > 40) { aqiStatus = 'Moderate'; advice = 'Mask recommended for sensitive nodes.'; }
  if (aqi > 60) { aqiStatus = 'Poor'; advice = 'Limit outdoor exposure. Wear a mask.'; }
  if (aqi > 80) { aqiStatus = 'Very Poor'; advice = 'Health Alert: Avoid all outdoor exertion.'; }

  // 8. Pollen Bio-Density
  const totalPollen = (airQuality.grass_pollen ? airQuality.grass_pollen[nowHour] : 0) +
    (airQuality.birch_pollen ? airQuality.birch_pollen[nowHour] : 0) +
    (airQuality.alder_pollen ? airQuality.alder_pollen[nowHour] : 0) +
    (airQuality.ragweed_pollen ? airQuality.ragweed_pollen[nowHour] : 0) +
    (airQuality.olive_pollen ? airQuality.olive_pollen[nowHour] : 0);

  let pollenStatus = 'Low/None';
  if (totalPollen > 1) pollenStatus = 'Low';
  if (totalPollen > 20) pollenStatus = 'Moderate';
  if (totalPollen > 100) pollenStatus = 'High';

  // 9. Sun & Moon
  const sunrise = daily.sunrise && daily.sunrise[0] ? new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
  const sunset = daily.sunset && daily.sunset[0] ? new Date(daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';

  // Moon Phase
  const cycle = 29.53059;
  const knownNewMoon = new Date('2000-01-06').getTime();
  const diffDays = (new Date().getTime() - knownNewMoon) / (1000 * 60 * 60 * 24);
  const age = diffDays % cycle;

  let phaseClass = 'new';
  let phaseTitle = 'New Moon';
  if (age < 1.84) { phaseClass = 'new'; phaseTitle = 'New Moon'; }
  else if (age < 5.53) { phaseClass = 'waxing-crescent'; phaseTitle = 'Waxing Crescent'; }
  else if (age < 9.22) { phaseClass = 'first-quarter'; phaseTitle = 'First Quarter'; }
  else if (age < 12.91) { phaseClass = 'waxing-gibbous'; phaseTitle = 'Waxing Gibbous'; }
  else if (age < 16.61) { phaseClass = 'full'; phaseTitle = 'Full Moon'; }
  else if (age < 20.30) { phaseClass = 'waning-gibbous'; phaseTitle = 'Waning Gibbous'; }
  else if (age < 23.99) { phaseClass = 'last-quarter'; phaseTitle = 'Last Quarter'; }
  else if (age < 27.68) { phaseClass = 'waning-crescent'; phaseTitle = 'Waning Crescent'; }
  else { phaseClass = 'new'; phaseTitle = 'New Moon'; }

  // Hazards alerts logic
  const hazards = [];
  if (weatherCode >= 95) {
    hazards.push({ icon: 'bi-lightning-charge', color: '#ffeb3b', title: `Severe Hub: ${city}`, desc: `Storm cells detected directly over ${city}. Lightning intensity is high. Seek shelter.` });
  } else if (weatherCode >= 71) {
    hazards.push({ icon: 'bi-snow', color: '#83a4d4', title: `Freeze Alert: ${city}`, desc: `Icy conditions impacting ${city} transit. Travel not recommended.` });
  } else if (weatherCode >= 51) {
    hazards.push({ icon: 'bi-umbrella', color: '#6b6bff', title: `Precipitation: ${city}`, desc: `Active rainfall across the ${city} metropolitan area.` });
  }
  if (aqi > 60) {
    hazards.push({ icon: 'bi-mask', color: '#ffab40', title: 'Air Quality Alert', desc: `High pollutant density detected in ${city}. Sensitive nodes should activate internal filtration.` });
  }
  if (temperature > 35) {
    hazards.push({ icon: 'bi-thermometer-high', color: '#f44336', title: `Thermal Spike: ${Math.round(getTemp(temperature, tempUnit))}°`, desc: `Intense heat identified in ${city}. Stay hydrated.` });
  } else if (temperature < 0) {
    hazards.push({ icon: 'bi-thermometer-snow', color: '#2196f3', title: `Cryo Notice: ${Math.round(getTemp(temperature, tempUnit))}°`, desc: `Sub-zero temperatures recorded near ${city}.` });
  }
  if (wind > 40) {
    hazards.push({ icon: 'bi-wind', color: '#ffeb3b', title: `High Vector: ${Math.round(getSpeed(wind, tempUnit))} ${getSpeedUnit(tempUnit)}`, desc: `Strong atmospheric flow sweeping through ${city}.` });
  }
  if (uv > 6) {
    hazards.push({ icon: 'bi-sun', color: '#ffd600', title: `Solar Warning: UV ${uv.toFixed(1)}`, desc: `High UV index recorded over ${city}. Solar shielding required.` });
  }

  // Fallback to safe zone if no active hazards
  if (hazards.length === 0) {
    hazards.push({ icon: 'bi-shield-check', color: '#4caf50', title: `${city}: Safe Zone`, desc: `Atmospheric stability confirmed for ${city}. No active threats.` });
  }

  const cityHash = city.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const insights = [
    "Atmospheric pressure indicates shifting local patterns.",
    "Ground-level turbulence is minimal for this quadrant.",
    "Stable ionosphere detected above city center.",
    "Local vector alignment suggests clear visibility ahead.",
    "Standard thermal currents active across the region."
  ];
  const localInsight = insights[cityHash % insights.length];

  // Fetch condition videos from backend proxy
  useEffect(() => {
    let active = true;
    const fetchVideos = async () => {
      setLoadingVideos(true);
      let query = 'starry night';
      const c = getWeatherDescription(weatherCode).toLowerCase();
      if (c.includes('clear') || c.includes('sun')) query = 'sunny blue sky';
      else if (c.includes('rain') || c.includes('drizzle')) query = 'raindrops on window';
      else if (c.includes('cloud')) query = 'moving dark clouds';
      else if (c.includes('thunderstorm') || c.includes('lightning')) query = 'lightning storm';
      else if (c.includes('snow')) query = 'falling snow';
      else if (c.includes('fog') || c.includes('mist')) query = 'foggy forest';

      try {
        const res = await fetch(`/api/pexels/videos?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (active) {
          if (data.videos && data.videos.length > 0) {
            const descriptors = [
              "Cinematic Flow", "Atmospheric Depth", "Horizon Perspective",
              "Ethereal Movement", "Primal Forces", "Visual Symphony",
              "Aerial Insight", "Dynamic Essence", "Core Patterns"
            ];
            const mapped = data.videos.map((v, idx) => {
              const titleBase = query.charAt(0).toUpperCase() + query.slice(1);
              const descriptor = descriptors[idx % descriptors.length];
              const optimalVideo = v.video_files.find(f => f.width >= 960 && f.width <= 1280)
                || v.video_files.find(f => f.quality === 'sd')
                || v.video_files[0];

              return {
                url: optimalVideo.link,
                thumb: v.image,
                title: `${titleBase}: ${descriptor}`,
                channel: v.user.name,
                time: 'Pexels'
              };
            });

            // Dynamic rotation: Pick 3 videos based on current hour
            const currentHour = new Date().getHours();
            const startIndex = (currentHour % (Math.floor(mapped.length / 3) || 1)) * 3;
            let vids = mapped.slice(startIndex, startIndex + 3);
            if (vids.length < 3) {
              vids.push(...mapped.slice(0, 3 - vids.length));
            }
            setVideos(vids);
          } else {
            throw new Error("No videos found.");
          }
        }
      } catch (err) {
        console.warn("Pexels load deferred:", err);
        if (active) {
          // Hardcoded offline fallback
          setVideos([{
            url: 'https://assets.mixkit.co/videos/preview/mixkit-starry-night-sky-with-a-galaxy-4080-large.mp4',
            thumb: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=500',
            title: 'Starry Night',
            channel: 'System Fallback',
            time: 'Static'
          }]);
        }
      } finally {
        if (active) setLoadingVideos(false);
      }
    };

    fetchVideos();
    return () => { active = false; };
  }, [weatherCode]);

  return (
    <div className="grid-container" style={{ opacity: 1, display: 'grid' }}>
      {/* Left Column */}
      <div className="left-col">
        {/* HERO WIDGET */}
        <div id="section-current">
          <div className="weather-hero glass-panel">
            <div className="hero-content">
              {/* Geolocation accuracy badges */}
              <div id="accuracy-note" className={`accuracy-badge ${locationSource}`}>
                {locationSource === 'gps' && <><i className="bi bi-geo-alt-fill"></i> Precise GPS Location Active</>}
                {locationSource === 'manual' && <><i className="bi bi-exclamation-circle"></i> Manual Search Mode: Enable GPS for pinpoint local mapping</>}
                {locationSource === 'offline' && <><i className="bi bi-geo-off"></i> Precise tracking unavailable. Search for a city or enable GPS for live data.</>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 className="location-title">{city}</h1>
                  <div className="condition-text">{getWeatherDescription(weatherCode)}</div>
                </div>
                <div style={{ fontSize: '3rem', color: '#fff' }}>
                  <i className={getWeatherIcon(weatherCode)}></i>
                </div>
              </div>

              <div className="hero-main-temp">
                <div className="temp-large">{Math.round(getTemp(temperature, tempUnit))}°</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Wind</div>
                  <div id="hero-wind" style={{ fontWeight: '600' }}>
                    {getSpeed(wind, tempUnit).toFixed(1)} {getSpeedUnit(tempUnit)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Humidity</div>
                  <div id="hero-humidity" style={{ fontWeight: '600' }}>{humidity}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Visibility</div>
                  <div id="hero-visibility" style={{ fontWeight: '600' }}>
                    {getDist(visibility, tempUnit).toFixed(1)} {getDistUnit(tempUnit)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Pressure</div>
                  <div id="hero-pressure" style={{ fontWeight: '600' }}>{Math.round(pressure)} hPa</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 48-HOUR HOURLY TRAJECTORY */}
        <div id="section-hourly">
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', marginTop: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#fff', fontWeight: 500 }}>48-Hour Trajectory</h3>
            <div style={{ display: 'flex', overflowX: 'auto', gap: '15px', paddingBottom: '10px' }} className="hourly-scroll-track">
              {hourly.time && hourly.time.slice(startHourlyIndex, startHourlyIndex + 48).map((timeStr, idx) => {
                const globalIdx = startHourlyIndex + idx;
                const time = new Date(timeStr);
                const hourLabel = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(':00', '');
                const tVal = hourly.temperature_2m ? hourly.temperature_2m[globalIdx] : 0;
                const codeVal = hourly.weathercode ? hourly.weathercode[globalIdx] : 0;
                const precipProbVal = hourly.precipitation_probability ? hourly.precipitation_probability[globalIdx] : 0;
                const windVal = hourly.windspeed_10m ? hourly.windspeed_10m[globalIdx] : 0;

                return (
                  <div key={idx} style={{ minWidth: '75px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '12px 5px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{hourLabel}</div>
                    <i className={getWeatherIcon(codeVal)} style={{ fontSize: '1.5rem', color: '#fff' }}></i>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{Math.round(getTemp(tVal, tempUnit))}°</div>
                    <div style={{ fontSize: '0.75rem', color: '#81d4fa' }}><i className="bi bi-droplet-fill"></i> {precipProbVal}%</div>
                    <div style={{ fontSize: '0.75rem', color: '#ccc' }}><i className="bi bi-wind"></i> {Math.round(getSpeed(windVal, tempUnit))}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 15-DAY EXTENDED FORECAST LIST */}
        <div id="section-7day">
          <div className="daily-list-vertical glass-panel" style={{ marginTop: '20px', padding: '25px', borderRadius: '30px' }}>
            <div style={{ fontWeight: '600', marginBottom: '15px', fontSize: '1.1rem' }}>15-Day Extended Forecast</div>
            {daily.time && daily.time.slice(0, 15).map((timeStr, idx) => {
              const date = new Date(timeStr);
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              const iconCode = daily.weathercode ? daily.weathercode[idx] : 0;
              const tempMin = daily.temperature_2m_min ? daily.temperature_2m_min[idx] : 0;
              const tempMax = daily.temperature_2m_max ? daily.temperature_2m_max[idx] : 0;

              return (
                <div key={idx} className="daily-row">
                  <div className="daily-day" style={{ fontSize: '0.9rem' }}>{dayName}</div>
                  <div className="daily-icon-group">
                    <i className={getWeatherIcon(iconCode)} style={{ fontSize: '1.2rem', width: '30px', textAlign: 'center' }}></i>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8, marginLeft: '10px' }}>{getWeatherDescription(iconCode)}</span>
                  </div>
                  <div className="daily-temp-group">
                    <span className="day-temp-low">{Math.round(getTemp(tempMin, tempUnit))}°</span>
                    <div className="temp-bar"><div className="temp-fill" style={{ width: '50%' }}></div></div>
                    <span className="day-temp-high">{Math.round(getTemp(tempMax, tempUnit))}°</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="right-col">
        {/* DETAILS GRID */}
        <div id="section-details">
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontWeight: '500' }}>Current Weather Details</h3>
            <div className="details-grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>

              {/* 1. Feels Like */}
              <div className="detail-card glass-inner">
                <div className="detail-header"><i className="bi bi-thermometer-half"></i> Feels Like</div>
                <div className="detail-value">{Math.round(getTemp(feelsLike, tempUnit))}°</div>
                <div className="detail-desc">
                  {getTemp(feelsLike, tempUnit) < getTemp(temperature, tempUnit) ? "Cooler due to wind" : "Similar to actual"}
                </div>
              </div>

              {/* 2. Precipitation */}
              <div className="detail-card glass-inner">
                <div className="detail-header"><i className="bi bi-cloud-drizzle"></i> Precipitation</div>
                <div className="detail-value">
                  {getPrecip(precipAmount, tempUnit).toFixed(1)} {getPrecipUnit(tempUnit)}
                </div>
                <div className="detail-desc">{precipProb}% chance in next hour</div>
              </div>

              {/* 3. Wind Compass */}
              <div className="detail-card glass-inner">
                <div className="detail-header"><i className="bi bi-wind"></i> Wind</div>
                <div className="detail-chart-area">
                  <div className="compass-circle">
                    <div id="wind-arrow" className="compass-arrow" style={{ transform: `rotate(${windDir}deg)` }}>
                      <i className="bi bi-arrow-up"></i>
                    </div>
                    <div className="compass-label">N</div>
                  </div>
                  <div className="wind-info">
                    <div className="detail-value">
                      {getSpeed(wind, tempUnit).toFixed(1)}
                    </div>
                    <div className="detail-desc">{getSpeedUnit(tempUnit)}</div>
                  </div>
                </div>
              </div>

              {/* 4. Humidity */}
              <div className="detail-card glass-inner">
                <div className="detail-header"><i className="bi bi-droplet"></i> Humidity</div>
                <div className="detail-value">{humidity}%</div>
                <div className="detail-desc">The dew point is {Math.round(getTemp(dewPoint, tempUnit))}°</div>
              </div>

              {/* 5. UV Index */}
              <div className="detail-card glass-inner">
                <div className="detail-header"><i className="bi bi-sun"></i> UV Index</div>
                <div className="detail-value">{uv}</div>
                <div className="detail-desc">{uvDesc}</div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${Math.min((uv / 11) * 100, 100)}%` }}></div>
                </div>
              </div>

              {/* 6. Visibility */}
              <div className="detail-card glass-inner">
                <div className="detail-header"><i className="bi bi-eye"></i> Visibility</div>
                <div className="detail-value">
                  {getDist(visibility, tempUnit).toFixed(1)} {getDistUnit(tempUnit)}
                </div>
                <div className="detail-desc">
                  {visibility > 8 ? 'Good visibility' : visibility > 4 ? 'Moderate visibility' : 'Low visibility'}
                </div>
              </div>

              {/* 7. Pressure */}
              <div className="detail-card glass-inner">
                <div className="detail-header"><i className="bi bi-speedometer2"></i> Pressure</div>
                <div className="detail-value">{Math.round(pressure)} hPa</div>
                <div className="detail-desc">{pressDesc}</div>
              </div>

              {/* 8. Air Quality */}
              <div className="detail-card glass-inner" style={{ gridColumn: 'span 1 / -1' }}>
                <div className="detail-header"><i className="bi bi-lungs"></i> Air Quality Intelligence</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                  <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '5px' }}>AQI</div>
                    <div className="detail-value" style={{ fontSize: '1.8rem' }}>{aqi}</div>
                    <div className="detail-desc" style={{ fontSize: '0.8rem', marginTop: '5px' }}>{aqiStatus}</div>
                  </div>
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#888' }}>PM2.5</div>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{Math.round(pm25)}</div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#888' }}>PM10</div>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{Math.round(pm10)}</div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#888' }}>Ozone</div>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{Math.round(o3)}</div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#888' }}>Advice</div>
                      <div style={{ fontSize: '0.65rem', lineHeight: '1.1', color: 'var(--accent-color)' }}>{advice}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 9. Pollen Aggregate */}
              <div className="detail-card glass-inner">
                <div className="detail-header"><i className="bi bi-flower1"></i> Pollen</div>
                <div className="detail-value">{Math.round(totalPollen)}</div>
                <div className="detail-desc">Total Bio-Density: {pollenStatus}</div>
              </div>

              {/* 10. Sun & Moon (Sunrise/Sunset & Moon phase) */}
              <div className="detail-card glass-inner" style={{ gridColumn: 'span 1 / -1' }}>
                <div className="detail-header"><i className="bi bi-moon-stars"></i> Sun & Moon</div>
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: '10px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'var(--gold)', marginBottom: '5px' }}><i className="bi bi-sunrise"></i> Sunrise</div>
                    <div style={{ fontWeight: 600 }}>{sunrise}</div>
                  </div>
                  <div className="moon-phase-container">
                    <div style={{ color: 'var(--accent-color)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Moon Phase
                    </div>
                    <div className={`moon-visual ${phaseClass}`}></div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, opacity: 0.9 }}>{phaseTitle}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#ff9800', marginBottom: '5px' }}><i className="bi bi-sunset"></i> Sunset</div>
                    <div style={{ fontWeight: 600 }}>{sunset}</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* HAZARD RADAR */}
        <div id="section-hazards" style={{ marginTop: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontWeight: '500' }}>Active Hazard Radar</h3>
            <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <i className="bi bi-patch-check-fill" style={{ color: 'var(--accent-color)' }}></i>
              Verified Active: {cityTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Local Data Sync)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {hazards.map((haz, idx) => (
                <div key={idx} className="hazard-item" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`bi ${haz.icon}`} style={{ color: haz.color }}></i>
                  </div>
                  <div>
                    <div style={{ fontWeight: '600' }}>{haz.title}</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '3px' }}>{haz.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', color: 'var(--accent-color)', fontStyle: 'italic' }}>
              <i className="bi bi-info-circle" style={{ marginRight: '5px' }}></i> {localInsight}
            </div>
          </div>
        </div>

        {/* WEATHER VIDEOS (CINEMATIC LOOPS) */}
        <div id="section-video" style={{ marginTop: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontWeight: '500' }}>Weather Videos</h3>
            <div id="video-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {loadingVideos ? (
                <>
                  <div className="skeleton-media" style={{ background: 'linear-gradient(135deg, #1a1c2c 0%, #0d1117 100%)', borderRadius: '20px', aspectRatio: '16/9' }}></div>
                  <div className="skeleton-media" style={{ background: 'linear-gradient(135deg, #1a1c2c 0%, #0d1117 100%)', borderRadius: '20px', aspectRatio: '16/9' }}></div>
                  <div className="skeleton-media" style={{ background: 'linear-gradient(135deg, #1a1c2c 0%, #0d1117 100%)', borderRadius: '20px', aspectRatio: '16/9' }}></div>
                </>
              ) : (
                videos.map((vid, idx) => {
                  const descriptions = [
                    `Witness the atmospheric depth of current ${getWeatherDescription(weatherCode).toLowerCase()} patterns.`,
                    `Cinematic observation of high-fidelity ${getWeatherDescription(weatherCode).toLowerCase()} vectors.`,
                    `Immersive environmental analysis revealing local ${getWeatherDescription(weatherCode).toLowerCase()} traits.`
                  ];
                  return (
                    <div
                      key={idx}
                      className="video-card"
                      onClick={() => onOpenVideo(vid.url, vid.title)}
                      style={{
                        position: 'relative',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        aspectRatio: '16/9',
                        background: '#000',
                        border: '1px solid rgba(255,255,255,0.05)',
                        transition: '0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'scale(1.02) translateY(-5px)';
                        e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.3)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1) translateY(0)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                      }}
                    >
                      {/* LAZY LOAD VIDEO loops using poster image and preload none */}
                      <video
                        src={vid.url}
                        loop
                        muted
                        playsInline
                        preload="none"
                        poster={vid.thumb}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)' }}
                      />
                      <div style={{ position: 'absolute', top: '15px', left: '15px', background: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', color: 'var(--accent-color)', backdropFilter: 'blur(5px)', border: '1px solid rgba(88, 166, 255, 0.2)' }}>
                        LIVE VECTORS
                      </div>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, padding: '15px', background: 'linear-gradient(transparent, rgba(13, 17, 23, 0.98))', width: '100%' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white', marginBottom: '2px' }}>{vid.title}</div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', lineHeight: '1.2' }}>
                          {descriptions[idx % descriptions.length]}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
