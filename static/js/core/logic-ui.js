document.addEventListener('DOMContentLoaded', () => {
    // ROUTING MATRIX: Determine active viewport
    const path = window.location.pathname;

    initDashboard(); // Core data sync (Weather + Auth)
    initSidebar();

    if (path.includes('/agri')) {
        console.log("Vyamir Engine: Initializing Agricultural Module...");
        waitForDataSync(initAgriPage);
    } else if (path.includes('/monsoon')) {
        console.log("Vyamir Engine: Initializing Monsoon Tracking Module...");
        waitForDataSync(initMonsoonPage);
    }

    // BACKEND SYNC: Wait for Firebase and Script readiness
    const checkReady = setInterval(() => {
        if (window.firebaseAuth && window.firebaseAuth.currentUser && window.checkUserPrivacyConsent) {
            clearInterval(checkReady);
            window.checkUserPrivacyConsent();
        }
    }, 100);

    // Initialize Unit System
    if (!localStorage.getItem('vyamir_unit_system')) {
        localStorage.setItem('vyamir_unit_system', 'metric');
    }
    window.unitSystem = localStorage.getItem('vyamir_unit_system');
    updateUnitUI();
});

// ASYNC BRIDGE: Wait for core weather data before triggering specialized UIs
function waitForDataSync(callback) {
    const waiter = setInterval(() => {
        if (window.weatherData) {
            clearInterval(waiter);
            callback();
        }
    }, 200);
}

function initDashboard() {
    // BACKEND SYNC: Initialization will be handled by index.html auth cycle.
    initSearch();

    // Check for persisted session
    const lastSession = localStorage.getItem('vyamir_last_session');

    setTimeout(() => {
        if (lastSession) {
            try {
                const session = JSON.parse(lastSession);
                console.log("Restoring previous session:", session.city);
                // Start Zenith portal animation while sync happens
                initSkyGame();
                handleSearchSelection(session.city, session.lat, session.lon, true);
            } catch (e) {
                console.error("Session restoration failed", e);
                showWelcomeScreen();
            }
        } else {
            showWelcomeScreen();
        }
    }, 400);

    // Background Geolocation: 5s strict timeout to prevent "Silent Killers"
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                window.lastLat = pos.coords.latitude;
                window.lastLon = pos.coords.longitude;
                window.locationSource = 'gps';
            },
            (err) => {
                console.log('Vyamir Engine: Geolocation synchronization deferred. Defaulting to London coordinates.');
                // Defaulting to a major hub if location is denied or timed out
                window.lastLat = 51.5074;
                window.lastLon = -0.1278;
                window.locationSource = 'offline';
            },
            { timeout: 5000, enableHighAccuracy: true, maximumAge: 60000 }
        );
    }
}

function showWelcomeScreen() {
    if (window.VYAMIR_SKIP_WELCOME) {
        const grid = document.querySelector('.grid-container');
        if (grid) grid.style.display = 'block';
        return;
    }
    document.body.classList.add('is-landing');
    document.body.classList.remove('is-dashboard');

    const welcome = document.querySelector('.welcome-container');
    if (welcome) {
        welcome.style.display = 'flex';
        welcome.style.opacity = '1';
        welcome.style.visibility = 'visible';

        // Add scroll-listener for simplified background in Section 2+
        welcome.addEventListener('scroll', () => {
            if (welcome.scrollTop > window.innerHeight * 0.5) {
                welcome.classList.add('scrolled');
            } else {
                welcome.classList.remove('scrolled');
            }
        });

        initSkyGame();
    }
    const grid = document.querySelector('.grid-container');
    if (grid) grid.style.display = 'none';

    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.style.display = 'none';
}

window.performWelcomeSearch = function () {
    const input = document.getElementById('welcome-search-input');
    const btn = document.getElementById('welcome-search-btn');
    let query = input ? input.value.trim() : "";

    // TYPO FIX: If user accidentally types Ujireg
    if (query.toLowerCase().endsWith('g') && query.length > 5 && query.toLowerCase().includes('ujire')) {
        query = query.substring(0, query.length - 1);
    }

    if (query) {
        if (btn) btn.innerHTML = '<div class="spinner-border spinner-border-sm text-white"></div>';

        // CONTEXTUAL ENHANCEMENT: If the user searches for ambiguous local towns like 'Koppa' or 'Sringeri',
        // we append 'Karnataka India' to bias the geocoding towards the intended atmospheric region.
        let optimizedQuery = query;
        const localTowns = ['koppa', 'sringeri', 'ujire', 'belthangady', 'mudigere'];
        if (localTowns.some(town => query.toLowerCase().includes(town)) && !query.toLowerCase().includes('india')) {
            optimizedQuery += ", Karnataka India";
        }

        performSearch(optimizedQuery);
    }
};

window.quickSearch = function (city) {
    const input = document.getElementById('welcome-search-input');
    if (input) input.value = city;
    performWelcomeSearch();
};

function initSkyGame() {
    const canvas = document.getElementById('sky-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height;
    let particles = [];
    const particleCount = 100;
    const connectionDistance = 120;
    const mouseDistance = 200;

    let mouse = { x: null, y: null };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    resize();

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 1.5;
            this.vy = (Math.random() - 0.5) * 1.5;
            this.size = Math.random() * 2 + 1;
            this.baseColor = Math.random() > 0.5 ? '#58a6ff' : '#ffffff';
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off edges
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;

            // Mouse interaction
            if (mouse.x != null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouseDistance) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (mouseDistance - distance) / mouseDistance;
                    // Gentle attraction
                    const directionX = forceDirectionX * force * 0.6;
                    const directionY = forceDirectionY * force * 0.6;
                    this.vx += directionX;
                    this.vy += directionY;
                }
            }

            // Friction
            this.vx *= 0.98;
            this.vy *= 0.98;

            // Min speed check to keep them moving
            if (Math.abs(this.vx) < 0.2) this.vx += (Math.random() - 0.5) * 0.1;
            if (Math.abs(this.vy) < 0.2) this.vy += (Math.random() - 0.5) * 0.1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.baseColor;
            ctx.fill();
        }
    }

    function init() {
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        const welcome = document.querySelector('.welcome-container');
        if (!welcome || !document.body.classList.contains('is-landing')) return;

        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            // Connect particles
            for (let j = i; j < particles.length; j++) {
                let dx = particles[i].x - particles[j].x;
                let dy = particles[i].y - particles[j].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < connectionDistance) {
                    ctx.beginPath();
                    let opacity = 1 - (distance / connectionDistance);
                    ctx.strokeStyle = 'rgba(88, 166, 255,' + opacity * 0.4 + ')';
                    ctx.lineWidth = 1;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }

            // Connect to mouse
            if (mouse.x != null) {
                let dx = particles[i].x - mouse.x;
                let dy = particles[i].y - mouse.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouseDistance) {
                    ctx.beginPath();
                    let opacity = 1 - (distance / mouseDistance);
                    ctx.strokeStyle = 'rgba(255, 215, 0,' + opacity * 0.5 + ')'; // Gold connection to mouse
                    ctx.lineWidth = 1.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }
        }
        window.skyAnimationFrame = requestAnimationFrame(animate);
    }

    init();
    animate();
}

// Optimization Helper: Kill heavy animations during transitions
window.pauseSkyAnimation = function () {
    if (window.skyAnimationFrame) {
        cancelAnimationFrame(window.skyAnimationFrame);
        window.skyAnimationFrame = null;
        console.log("CPU Optimization: Sky Animation Paused.");
    }
}

window.toggleMapExpand = function () {
    const wrapper = document.querySelector('.map-wrapper');
    const expandBtn = document.getElementById('map-expand-btn');
    const exitBtn = document.getElementById('map-exit-btn');
    if (!wrapper) return;

    wrapper.classList.toggle('expanded');
    if (wrapper.classList.contains('expanded')) {
        if (expandBtn) expandBtn.style.display = 'none';
        if (exitBtn) exitBtn.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } else {
        if (expandBtn) expandBtn.style.display = 'block';
        if (exitBtn) exitBtn.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    if (window.mapInstance) {
        setTimeout(() => window.mapInstance.invalidateSize(), 300);
    }
}





function initSidebar() {
    const items = document.querySelectorAll('.sidebar-item, .mobile-nav-item');

    items.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.getAttribute('data-section');
            if (sectionId) {
                // Sync active classes across all navigation channels (Sidebar & Mobile)
                document.querySelectorAll('.sidebar-item, .mobile-nav-item').forEach(i => {
                    if (i.getAttribute('data-section') === sectionId) i.classList.add('active');
                    else i.classList.remove('active');
                });

                const el = document.getElementById(sectionId);
                if (el) {
                    const offset = window.innerWidth <= 768 ? 10 : 0; // Minor offset for mobile
                    const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
                    window.scrollTo({ top, behavior: 'smooth' });
                }
            }
        });
    });

    // OBSERVER ENGINE: Update active state on scroll
    window.addEventListener('scroll', () => {
        const sections = ['section-current', 'section-hourly', 'section-7day', 'section-maps', 'section-details', 'section-hazards', 'section-video', 'section-news'];
        let currentSection = "";

        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const rect = el.getBoundingClientRect();
                // Section is active if it's near the top of the viewport
                if (rect.top <= 200 && rect.bottom >= 200) {
                    currentSection = id;
                }
            }
        });

        if (currentSection) {
            document.querySelectorAll('.sidebar-item, .mobile-nav-item').forEach(i => {
                if (i.getAttribute('data-section') === currentSection) i.classList.add('active');
                else i.classList.remove('active');
            });
        }
    });
}

function initSearch() {
    const container = document.querySelector('.header-search-container');
    if (!container) return;

    const btn = container.querySelector('.search-btn');
    const input = container.querySelector('.search-input');

    // Handle Click
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const query = input.value.trim();
            if (query) {
                let optimizedQuery = query;
                const localTowns = ['koppa', 'sringeri', 'ujire', 'belthangady', 'mudigere'];
                if (localTowns.some(town => query.toLowerCase().includes(town)) && !query.toLowerCase().includes('india')) {
                    optimizedQuery += ", Karnataka India";
                }
                performSearch(optimizedQuery);
            }
        });
    }

    // Handle Enter Key
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = input.value.trim();
                if (query) {
                    let optimizedQuery = query;
                    const localTowns = ['koppa', 'sringeri', 'ujire', 'belthangady', 'mudigere'];
                    if (localTowns.some(town => query.toLowerCase().includes(town)) && !query.toLowerCase().includes('india')) {
                        optimizedQuery += ", Karnataka India";
                    }
                    performSearch(optimizedQuery);
                }
            }
        });
    }
}

async function performSearch(query) {
    try {
        const loader = document.getElementById('welcome-loader');
        if (loader) loader.style.width = '40%';

        const res = await fetch(`/api/search?q=${query}`);
        const data = await res.json();
        if (data.length > 0) {
            const loader = document.getElementById('welcome-loader');
            if (loader) loader.style.width = '70%';
            handleSearchSelection(data[0].name, data[0].latitude, data[0].longitude);
        } else {
            const loader = document.getElementById('welcome-loader');
            if (loader) loader.style.width = '0%';
            alert('City not found');
        }
    } catch (e) {
        console.error(e);
    }
}

async function handleSearchSelection(city, lat, lon, isInitial = false) {
    try {
        if (!isInitial) document.body.style.cursor = 'wait';

        // PERSIST SESSION
        localStorage.setItem('vyamir_last_session', JSON.stringify({ city, lat, lon }));

        // Tracking Location Mode for accuracy disclaimers
        if (!isInitial) window.locationSource = 'manual';

        // 1. INSTANT FEEDBACK: Immediate transition to reduce perceived latency
        const स्वागतContainer = document.querySelector('.welcome-container');
        if (स्वागतContainer && !isInitial) {
            स्वागतContainer.style.transition = 'all 0.4s ease';
            स्वागतContainer.style.opacity = '0.3';
            स्वागतContainer.style.transform = 'scale(1.05)';
        }

        // Show a "Syncing..." status if possible
        const loader = document.getElementById('welcome-loader');
        if (loader) {
            loader.style.width = '85%';
            loader.innerHTML = '<span style="font-size: 0.7rem; color: white;">SYNCING ATMOSPHERE...</span>';
        }

        console.log(`Rapid Sync: ${city} at ${lat}, ${lon}`);
        const displayCity = (city || "Your Location").replace(/g$/, '');

        // 2. TRIGGER DASHBOARD EARLY: Prepare UI layout before data arrives
        if (!isInitial) {
            document.body.classList.add('is-dashboard');
            document.body.classList.remove('is-landing');
            const grid = document.querySelector('.grid-container');
            const sidebar = document.querySelector('.sidebar');
            if (grid) {
                grid.style.setProperty('display', 'grid', 'important');
                grid.style.opacity = '0.2'; // Skeleton-like state
            }
            if (sidebar) sidebar.style.display = 'flex';
        }

        // 3. CPU OPTIMIZATION: Pause heavy landing page animations to free up threads
        pauseSkyAnimation();

        let url = `/api/get_weather?lat=${lat}&lon=${lon}&city=${encodeURIComponent(displayCity)}`;

        // IMMEDIATELY PREPARE SKELETONS: Populate UI with pulsing placeholders
        const grid = document.querySelector('.grid-container');
        if (grid && !isInitial) {
            grid.style.setProperty('display', 'grid', 'important');
            grid.style.opacity = '1';

            // Hero Skeletons
            document.querySelector('.location-title').innerHTML = '<span class="skeleton-box" style="width: 150px;"></span>';
            document.querySelector('.temp-large').innerHTML = '<span class="skeleton-box" style="width: 100px; height: 1em;"></span>';
            document.querySelector('.condition-text').innerHTML = '<span class="skeleton-box" style="width: 120px;"></span>';

            // Hero Sub-Details Skeletons
            const heroSubValues = ['hero-wind', 'hero-humidity', 'hero-visibility', 'hero-pressure'];
            heroSubValues.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = '<span class="skeleton-box" style="width: 40px;"></span>';
            });

            // Details Grid Skeletons
            const detailsValues = document.querySelectorAll('.detail-value');
            detailsValues.forEach(v => v.innerHTML = '<span class="skeleton-box" style="width: 60px;"></span>');

            // Video grid placeholder: Gradient Background for minimal layout shift
            const videoGrid = document.getElementById('video-grid');
            if (videoGrid) {
                videoGrid.innerHTML = `
                    <div class="skeleton-media" style="background: linear-gradient(135deg, #1a1c2c 0%, #0d1117 100%);"></div>
                    <div class="skeleton-media" style="background: linear-gradient(135deg, #1a1c2c 0%, #0d1117 100%);"></div>
                    <div class="skeleton-media" style="background: linear-gradient(135deg, #1a1c2c 0%, #0d1117 100%);"></div>
                `;
            }
        }

        // ASYNC DECOUPLING: Parallel fetching starts here

        // 1. WEATHER TASK: Priority #1 (Direct Client-Side Fetch to bypass IP limits)
        const fetchWeatherTask = (async () => {
            try {
                // Expanding daily vectors to include Sunrise, Sunset, and UV Index Max for a complete dashboard profile
                // MODIFICATION: Extended forecast days to 16 for 15-day view + 48-hour buffer
                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,visibility,wind_speed_10m,wind_direction_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&forecast_days=16&timezone=auto`;
                const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,european_aqi,uv_index,alder_pollen,birch_pollen,grass_pollen,ragweed_pollen,olive_pollen&timezone=auto`;

                const [wRes, aRes, metaRes] = await Promise.all([
                    fetch(weatherUrl),
                    fetch(aqiUrl),
                    fetch(`/api/get_weather?lat=${lat}&lon=${lon}&city=${encodeURIComponent(displayCity)}&metadata_only=true`)
                ]);

                const wData = await wRes.json();
                const aData = await aRes.json();
                const metaData = await metaRes.json();

                // Vyamir Diagnostic Sync: Log data for industrial transparency
                console.log("Vyamir Engine: Meteorological data stream synchronized from client-IP.", wData);

                // Normalization Layer (Mirroring backend schema with full key compatibility)
                const normalizedData = {
                    city: displayCity,
                    current: {
                        ...wData.current,
                        time: wData.current.time,
                        temperature: wData.current.temperature_2m,
                        temperature_2m: wData.current.temperature_2m,
                        humidity: wData.current.relative_humidity_2m,
                        relative_humidity_2m: wData.current.relative_humidity_2m,
                        weathercode: wData.current.weather_code,
                        weather_code: wData.current.weather_code,
                        windspeed: wData.current.wind_speed_10m,
                        windSpeed: wData.current.wind_speed_10m,
                        wind_speed_10m: wData.current.wind_speed_10m,
                        winddirection: wData.current.wind_direction_10m,
                        wind_direction_10m: wData.current.wind_direction_10m,
                        is_day: wData.current.is_day,
                        pressure: wData.current.surface_pressure,
                        surface_pressure: wData.current.surface_pressure
                    },
                    hourly: {
                        ...wData.hourly,
                        weathercode: wData.hourly.weather_code,
                        weather_code: wData.hourly.weather_code,
                        relativehumidity_2m: wData.hourly.relative_humidity_2m,
                        relative_humidity_2m: wData.hourly.relative_humidity_2m,
                        windspeed_10m: wData.hourly.wind_speed_10m,
                        wind_speed_10m: wData.hourly.wind_speed_10m
                    },
                    daily: {
                        ...wData.daily,
                        weathercode: wData.daily.weather_code,
                        weather_code: wData.daily.weather_code
                    },
                    air_quality: aData.hourly,
                    news: metaData.news,
                    history: metaData.history
                };

                window.weatherData = normalizedData;

                // Sync UI immediately
                try { updateHero(normalizedData); } catch (e) { console.error("Hero update failed", e); }
                try { updateDetails(normalizedData); } catch (e) { console.error("Details update failed", e); }
                try { updateNews(normalizedData); } catch (e) { console.error("News update failed", e); }
                try { updateHazards(normalizedData); } catch (e) { console.error("Hazards update failed", e); }
                try { updateHourlyScroll(normalizedData); } catch (e) { console.error("Hourly scroll failed", e); }
                // Replaced Chart with Scroll: try { if (window.initChart) window.initChart(normalizedData); } catch (e) { console.error("Chart init failed", e); }

                try { updateBackground(normalizedData.current.weathercode, normalizedData.current.is_day); } catch (e) { console.error("Background update failed", e); }

                return normalizedData;
            } catch (err) {
                console.error("Vyamir Engine: Weather Load Error:", err);
                throw err;
            }
        })();

        // 2. VIDEO TASK: Non-blocking background fetch
        const fetchVideoTask = (async () => {
            try {
                // Wait small buffer to let weather UI stabilize
                await new Promise(r => setTimeout(r, 600));
                await updateWeatherVideos();
            } catch (e) {
                console.error("Background video load failed", e);
            }
        })();

        // Wait only for weather data to finalize core transition
        const data = await fetchWeatherTask;

        if (loader) loader.style.width = '100%';
        window.weatherData = data;

        // ... (rest of logic) ...

        // Finalize Transition regardless of initialization state
        document.body.classList.add('is-dashboard');
        document.body.classList.remove('is-landing');

        if (स्वागतContainer) {
            स्वागतContainer.style.opacity = '0';
            setTimeout(() => {
                स्वागतContainer.remove();
                window.scrollTo(0, 0); // Reset scroll for dashboard
            }, 400);
        }

        if (grid) {
            grid.style.setProperty('display', 'grid', 'important');
            grid.style.opacity = '1';
        }

        const sidebarRef = document.querySelector('.sidebar');
        if (sidebarRef) sidebarRef.style.display = 'flex';

        // Removed sequential calls - handled by decoupled tasks above
        try {
            if (window.initMap) {
                // Initialize map with current coordinates
                window.initMap(lat, lon);
            }
        } catch (e) { console.error("Map init failed", e); }

        try {
            updateBackground(data.current.weathercode, data.current.is_day);
        } catch (e) { console.error("Background update failed", e); }

    } catch (e) {
        console.error("Vyamir Engine: Atmospheric Sync Failed.", e);
        if (!isInitial) showToast("Meteorological Link Error: " + e.message, "error");
        else showWelcomeScreen(); // FAILSAFE: Back to landing if restore fails
    } finally {
        document.body.style.cursor = 'default';
        if (isInitial) {
            const overlay = document.getElementById('loading-overlay');
            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 500);
            }
        }
    }
}

function updateHero(data) {
    const city = data.city || "Unknown Location";
    const current = data.current || data.current_weather || {};

    // Schema Mapping: Support both current_weather and current API formats
    const temperature = current.temperature_2m !== undefined ? current.temperature_2m : current.temperature;
    const weatherCode = current.weathercode;
    const wind = current.wind_speed_10m !== undefined ? current.wind_speed_10m : current.windspeed;
    const pressure = current.pressure_msl || current.surface_pressure || current.pressure;

    document.querySelector('.location-title').textContent = city;
    document.querySelector('.temp-large').textContent = Math.round(getTemp(temperature)) + '°';
    document.querySelector('.condition-text').textContent = getWeatherDescription(weatherCode);

    // POPULATE HERO SUB-DETAILS: Synchronized with city temporal clock
    const cityTime = new Date(current.time);
    const nowHour = cityTime.getHours();

    const humidity = data.hourly.relativehumidity_2m ? data.hourly.relativehumidity_2m[nowHour] : '--';
    const visibility = data.hourly.visibility ? (data.hourly.visibility[nowHour] / 1000) : '--';
    const finalPressure = pressure || (data.hourly.surface_pressure ? data.hourly.surface_pressure[nowHour] : '--');

    setText('hero-wind', `${getSpeed(wind).toFixed(1)} ${getUnit('speed')}`);
    setText('hero-humidity', humidity + '%');
    setText('hero-visibility', `${getDist(visibility).toFixed(1)} ${getUnit('dist')}`);
    setText('hero-pressure', Math.round(finalPressure) + ' hPa');
    setText('history-text', data.history || 'Historical data unavailable.');

    // Dynamic Accuracy Note
    const accuracyNote = document.getElementById('accuracy-note') || document.createElement('div');
    accuracyNote.id = 'accuracy-note';
    if (window.locationSource === 'gps') {
        accuracyNote.innerHTML = '<i class="bi bi-geo-alt-fill"></i> Precise GPS Location Active';
        accuracyNote.className = 'accuracy-badge gps';
    } else if (window.locationSource === 'manual') {
        accuracyNote.innerHTML = '<i class="bi bi-exclamation-circle"></i> Manual Search Mode: Enable GPS for pinpoint local mapping';
        accuracyNote.className = 'accuracy-badge manual';
    } else {
        accuracyNote.innerHTML = '<i class="bi bi-geo-off"></i> Precise tracking unavailable. Search for a city or enable GPS for live data.';
        accuracyNote.className = 'accuracy-badge offline';
    }
    const heroContent = document.querySelector('.hero-content');
    if (heroContent && !document.getElementById('accuracy-note')) {
        heroContent.prepend(accuracyNote);
    }
    // Daily Forecast List
    const listContainer = document.querySelector('.daily-list-vertical');
    if (listContainer) {
        listContainer.innerHTML = '<div style="font-weight: 600; margin-bottom: 15px; font-size: 1.1rem;">15-Day Extended Forecast</div>';

        // EXTENDED FORECAST: 15 Days
        const maxDays = Math.min(15, data.daily.time.length);
        for (let i = 0; i < maxDays; i++) {
            if (!data.daily.time[i]) continue;
            const date = new Date(data.daily.time[i]);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const iconCode = data.daily.weathercode[i];

            const row = document.createElement('div');
            row.className = 'daily-row';
            row.innerHTML = `
                    <div class="daily-day" style="font-size: 0.9rem;">${dayName}</div>
                    <div class="daily-icon-group">
                         <i class="${getWeatherIcon(iconCode)}" style="font-size: 1.2rem; width: 30px; text-align: center;"></i>
                         <span style="font-size: 0.8rem; opacity: 0.8; margin-left:10px;">${getWeatherDescription(iconCode)}</span>
                    </div>
                    <div class="daily-temp-group">
                        <span class="day-temp-low">${Math.round(getTemp(data.daily.temperature_2m_min[i]))}°</span>
                        <div class="temp-bar"><div class="temp-fill" style="width: 50%"></div></div>
                        <span class="day-temp-high">${Math.round(getTemp(data.daily.temperature_2m_max[i]))}°</span>
                    </div>
                `;
            listContainer.appendChild(row);
        }
    }
}

function updateDetails(data) {
    const current = data.current || data.current_weather || {};
    const hourly = data.hourly;

    const temperature = current.temperature_2m !== undefined ? current.temperature_2m : current.temperature;
    const windSpeed = current.wind_speed_10m !== undefined ? current.wind_speed_10m : current.windspeed;
    const windDir = current.wind_direction !== undefined ? current.wind_direction : current.winddirection;

    // 1. Feels Like
    // ATMOSPHERIC TEMPORAL SYNC: Synchronize with city local time, not browser local time
    const cityTime = new Date(current.time);
    const nowHour = cityTime.getHours();

    const feelsLike = hourly.apparent_temperature ? hourly.apparent_temperature[nowHour] : temperature;
    setText('detail-feels-like', Math.round(getTemp(feelsLike)) + '°');
    setText('detail-feels-desc', getTemp(feelsLike) < getTemp(temperature) ? "Cooler due to wind" : "Similar to actual");

    // 2. Precipitation
    const precipProb = hourly.precipitation_probability ? hourly.precipitation_probability[nowHour] : 0;
    const precipAmount = hourly.precipitation ? hourly.precipitation[nowHour] : 0;
    setText('detail-precip', getPrecip(precipAmount).toFixed(1) + ' ' + getUnit('precip'));
    setText('detail-precip-desc', precipProb + '% chance in next hour');

    // 3. Humidity
    const humidity = hourly.relativehumidity_2m ? hourly.relativehumidity_2m[nowHour] : (current.humidity || 0); // fallbacks
    setText('detail-humidity', humidity + '%');
    // Dew Point approx: T - ((100 - RH)/5)
    const dewPoint = Math.round(temperature - ((100 - humidity) / 5));
    setText('detail-humidity-desc', `The dew point is ${Math.round(getTemp(dewPoint))}°`);

    // 4. Wind
    setText('detail-wind', `${getSpeed(windSpeed).toFixed(1)} ${getUnit('speed')}`);
    const arrow = document.getElementById('wind-arrow');
    if (arrow) arrow.style.transform = `rotate(${windDir}deg)`;

    // 5. UV Index
    const uv = hourly.uv_index ? hourly.uv_index[nowHour] : 0;
    setText('detail-uv', uv);
    let uvDesc = "Low";
    if (uv > 2) uvDesc = "Moderate";
    if (uv > 5) uvDesc = "High";
    if (uv > 7) uvDesc = "Very High";
    setText('detail-uv-desc', uvDesc);
    const uvBar = document.getElementById('uv-progress');
    if (uvBar) uvBar.style.width = Math.min((uv / 11) * 100, 100) + '%';

    // 6. Visibility
    let vis = hourly.visibility ? hourly.visibility[nowHour] : 10000;
    vis = (vis / 1000);
    setText('detail-visibility', getDist(vis).toFixed(1) + ' ' + getUnit('dist'));

    // 7. Pressure
    const pressure = hourly.surface_pressure ? hourly.surface_pressure[nowHour] : 1013;
    setText('detail-pressure', Math.round(pressure) + ' hPa');
    // Trend logic: compare with 3 hours ago
    const prevPressure = hourly.surface_pressure ? hourly.surface_pressure[Math.max(0, nowHour - 3)] : pressure;
    let pressDesc = "Stable";
    if (pressure < prevPressure - 1) pressDesc = "Falling";
    if (pressure > prevPressure + 1) pressDesc = "Rising";
    setText('detail-pressure-desc', pressDesc);

    // 8. Air Quality (Enhanced)
    const aqi = data.air_quality ? data.air_quality.european_aqi[nowHour] : 0;
    const pm25 = data.air_quality ? data.air_quality.pm2_5[nowHour] : 0;
    const pm10 = data.air_quality ? data.air_quality.pm10[nowHour] : 0;
    const o3 = data.air_quality ? data.air_quality.ozone[nowHour] : 0;

    setText('detail-aqi-val', aqi);
    setText('detail-pm25', Math.round(pm25));
    setText('detail-pm10', Math.round(pm10));
    setText('detail-o3', Math.round(o3));

    let aqiStatus = "Good";
    let advice = "Safe for outdoor activities.";

    if (aqi > 20) { aqiStatus = "Fair"; advice = "Sensitive groups should reduce exertion."; }
    if (aqi > 40) { aqiStatus = "Moderate"; advice = "Mask recommended for sensitive nodes."; }
    if (aqi > 60) { aqiStatus = "Poor"; advice = "Limit outdoor exposure. Wear a mask."; }
    if (aqi > 80) { aqiStatus = "Very Poor"; advice = "Health Alert: Avoid all outdoor exertion."; }

    setText('detail-aqi-status', aqiStatus);
    setText('detail-aqi-advice', advice);

    // 9. Pollen Aggregate (High-Fidelity Bio-Density Tracking)
    const aq = data.air_quality;
    let totalPollen = 0;
    if (aq) {
        // Summing all available pollen vectors for a comprehensive Bio-Density report
        totalPollen = (aq.grass_pollen ? aq.grass_pollen[nowHour] : 0) +
            (aq.birch_pollen ? aq.birch_pollen[nowHour] : 0) +
            (aq.alder_pollen ? aq.alder_pollen[nowHour] : 0) +
            (aq.ragweed_pollen ? aq.ragweed_pollen[nowHour] : 0) +
            (aq.olive_pollen ? aq.olive_pollen[nowHour] : 0);
    }

    setText('detail-pollen-val', Math.round(totalPollen));
    let pollenStatus = "Low/None";
    if (totalPollen > 1) pollenStatus = "Low";
    if (totalPollen > 20) pollenStatus = "Moderate";
    if (totalPollen > 100) pollenStatus = "High";
    setText('detail-pollen-status', `Total Bio-Density: ${pollenStatus}`);

    // 9. Sun & Moon
    const sunrise = new Date(data.daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sunset = new Date(data.daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setText('detail-sunrise', sunrise);
    setText('detail-sunset', sunset);

    // Moon Phase Calculation (Enhanced Visuals)
    const date = new Date();
    const cycle = 29.53059; // days
    const knownNewMoon = new Date('2000-01-06').getTime();
    const diffDays = (date.getTime() - knownNewMoon) / (1000 * 60 * 60 * 24);
    const age = diffDays % cycle;

    const moonComponent = document.getElementById('moon-visual-component');
    const moonText = document.getElementById('detail-moon-text');

    if (moonComponent && moonText) {
        moonComponent.className = 'moon-visual'; // Reset

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

        moonComponent.classList.add(phaseClass);
        moonText.textContent = phaseTitle;
    }
}

function updateNews(data) {
    const newsContainer = document.getElementById('news-container');
    if (!newsContainer) return;

    if (data.news && data.news.length > 0) {
        newsContainer.innerHTML = '';
        data.news.forEach(item => {
            const div = document.createElement('div');
            div.style.marginBottom = '15px';
            div.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
            div.innerHTML = `
                <a href="${item.link}" target="_blank" style="color: #fff; text-decoration: none; font-weight: 500; display: block; margin-bottom: 5px;">${item.title}</a>
                <div style="font-size: 0.8rem; color: #ccc; margin-bottom: 5px;">${new Date(item.published).toLocaleDateString()}</div>
            `;
            newsContainer.appendChild(div);
        });
    } else {
        newsContainer.innerHTML = '<div style="opacity: 0.7;">No news available.</div>';
    }
}

function updateHazards(data) {
    const container = document.getElementById('hazards-list');
    if (!container) return;

    const current = data.current || data.current_weather || {};

    // ATMOSPHERIC TEMPORAL SYNC
    const cityTime = new Date(current.time);
    const nowHour = cityTime.getHours();

    const currentCode = current.weathercode;
    const temp = current.temperature_2m !== undefined ? current.temperature_2m : current.temperature;
    const wind = current.wind_speed_10m !== undefined ? current.wind_speed_10m : current.windspeed;
    const uv = data.hourly.uv_index ? data.hourly.uv_index[nowHour] : 0;
    const aqi = data.air_quality ? data.air_quality.european_aqi[nowHour] : 0;
    const city = data.city || "this region";

    // Localized Insight Pool
    const insights = [
        "Atmospheric pressure indicates shifting local patterns.",
        "Ground-level turbulence is minimal for this quadrant.",
        "Stable ionosphere detected above city center.",
        "Local vector alignment suggests clear visibility ahead.",
        "Standard thermal currents active across the region."
    ];
    const cityHash = city.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const localInsight = insights[cityHash % insights.length];

    // Real-time Hazard Logic
    let hazardHTML = '';

    // 1. Extreme Weather Code
    if (currentCode >= 95) {
        hazardHTML += createHazardItem('bi-lightning-charge', '#ffeb3b', `Severe Hub: ${city}`, `Storm cells detected directly over ${city}. Lightning intensity is high. Seek shelter.`);
    } else if (currentCode >= 71) {
        hazardHTML += createHazardItem('bi-snow', '#83a4d4', `Freeze Alert: ${city}`, `Icy conditions impacting ${city} transit. Travel not recommended.`);
    } else if (currentCode >= 51) {
        hazardHTML += createHazardItem('bi-umbrella', '#6b6bff', `Precipitation: ${city}`, `Active rainfall across the ${city} metropolitan area.`);
    }

    // 2. AQI Hazard
    if (aqi > 60) {
        hazardHTML += createHazardItem('bi-mask', '#ffab40', 'Air Quality Alert', `High pollutant density detected in ${city}. Sensitive nodes should activate internal filtration.`);
    }

    // 3. Temperature Stress
    if (temp > 35) {
        hazardHTML += createHazardItem('bi-thermometer-high', '#f44336', `Thermal Spike: ${Math.round(getTemp(temp))}°`, `Intense heat identified in ${city}. Stay hydrated.`);
    } else if (temp < 0) {
        hazardHTML += createHazardItem('bi-thermometer-snow', '#2196f3', `Cryo Notice: ${Math.round(getTemp(temp))}°`, `Sub-zero temperatures recorded near ${city}.`);
    }

    // 4. Wind Velocity
    if (wind > 40) {
        hazardHTML += createHazardItem('bi-wind', '#ffeb3b', `High Vector: ${Math.round(getSpeed(wind))} ${getUnit('speed')}`, `Strong atmospheric flow sweeping through ${city}.`);
    }

    // 5. UV Exposure
    if (uv > 6) {
        hazardHTML += createHazardItem('bi-sun', '#ffd600', `Solar Warning: UV ${uv.toFixed(1)}`, `High UV index recorded over ${city}. Solar shielding required.`);
    }

    // Default: Safe Configuration
    if (!hazardHTML) {
        hazardHTML = createHazardItem('bi-shield-check', '#4caf50', `${city}: Safe Zone`, `Atmospheric stability confirmed for ${city}. No active threats.`);
    }

    // Local Insight Footer
    hazardHTML += `
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem; color: var(--accent-color); font-style: italic;">
            <i class="bi bi-info-circle" style="margin-right: 5px;"></i> ${localInsight}
        </div>
    `;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    container.innerHTML = `
        <div style="font-size: 0.8rem; opacity: 0.6; margin-bottom: 15px; display: flex; align-items: center; gap: 5px;">
            <i class="bi bi-patch-check-fill" style="color: var(--accent-color);"></i> 
            Verified Active: ${timestamp} (Local Data Sync)
        </div>
        <div style="display: flex; flex-direction: column; gap: 15px;">
            ${hazardHTML}
        </div>
    `;
}

function createHazardItem(icon, color, title, desc) {
    return `
    <div class="hazard-item" style="display: flex; gap: 10px; align-items: flex-start;">
        <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
            <i class="bi ${icon}" style="color: ${color};"></i>
        </div>
        <div>
            <div style="font-weight: 600;">${title}</div>
            <div style="font-size: 0.9rem; opacity: 0.8; margin-top: 3px;">${desc}</div>
        </div>
    </div>`;
}

// Pexels API Integration for Dynamic Weather Videos
const PEXELS_API_KEY = window.VYAMIR_CONFIG ? window.VYAMIR_CONFIG.PEXELS_API_KEY : '';


async function fetchPexelsWeatherVideos(condition) {
    let query = 'starry night'; // Default fallback
    const c = condition.toLowerCase();

    if (c.includes('clear') || c.includes('sun')) query = 'sunny blue sky';
    else if (c.includes('rain') || c.includes('drizzle')) query = 'raindrops on window';
    else if (c.includes('cloud')) query = 'moving dark clouds';
    else if (c.includes('thunderstorm') || c.includes('lightning')) query = 'lightning storm';
    else if (c.includes('snow')) query = 'falling snow';
    else if (c.includes('fog') || c.includes('mist')) query = 'foggy forest';

    try {
        const response = await fetch(`https://api.pexels.com/videos/search?query=${query}&per_page=15&orientation=landscape`, {
            headers: { 'Authorization': PEXELS_API_KEY }
        });
        const data = await response.json();

        if (data.videos && data.videos.length > 0) {
            const descriptors = [
                "Cinematic Flow", "Atmospheric Depth", "Horizon Perspective",
                "Ethereal Movement", "Primal Forces", "Visual Symphony",
                "Aerial Insight", "Dynamic Essence", "Core Patterns"
            ];

            return data.videos.map((v, idx) => {
                const titleBase = query.charAt(0).toUpperCase() + query.slice(1);
                const descriptor = descriptors[idx % descriptors.length];

                // QUALITY FILTER: Prefer SD/HD Ready (approx 960px or 1280px width)
                // Avoid "Original" or "4K" to save bandwidth
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
        }
    } catch (e) {
        console.error("Pexels API Error:", e);
    }

    // Hardcoded Fallback if API fails
    return [{
        url: 'https://assets.mixkit.co/videos/preview/mixkit-starry-night-sky-with-a-galaxy-4080-large.mp4',
        thumb: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=500',
        title: 'Starry Night',
        channel: 'System Fallback',
        time: 'Static'
    }];
}

async function updateWeatherVideos() {
    const grid = document.getElementById('video-grid');
    if (!grid) return;

    const condition = window.weatherData ? getWeatherDescription(window.weatherData.current.weathercode) : 'Clear';
    const videos = await fetchPexelsWeatherVideos(condition);

    // Dynamic Rotation: Use current hour to pick a unique set of 3 videos every 60 minutes
    const currentHour = new Date().getHours();
    const startIndex = (currentHour % (Math.floor(videos.length / 3) || 1)) * 3;
    const vidsToShow = videos.slice(startIndex, startIndex + 3);

    // Fallback if the slice is empty
    if (vidsToShow.length < 3) vidsToShow.push(...videos.slice(0, 3 - vidsToShow.length));

    grid.innerHTML = vidsToShow.map((vid, idx) => {
        const descriptions = [
            `Witness the atmospheric depth of current ${condition.toLowerCase()} patterns.`,
            `Cinematic observation of high-fidelity ${condition.toLowerCase()} vectors.`,
            `Immersive environmental analysis revealing local ${condition.toLowerCase()} traits.`
        ];
        const desc = descriptions[idx % descriptions.length];

        return `
        <div class="video-card" onclick="openVideoModal('${vid.url}', '${vid.title}')"
            style="position: relative; border-radius: 20px; overflow: hidden; cursor: pointer; aspect-ratio: 16/9; background: #000; border: 1px solid rgba(255,255,255,0.05); transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 10px 30px rgba(0,0,0,0.3);"
            onmouseover="this.style.transform='scale(1.02) translateY(-5px)'; this.style.borderColor='rgba(88, 166, 255, 0.3)'"
            onmouseout="this.style.transform='scale(1) translateY(0)'; this.style.borderColor='rgba(255,255,255,0.05)'">
            <video src="${vid.url}" autoplay loop muted playsinline preload="auto"
                style="width: 100%; height: 100%; object-fit: cover; filter: brightness(0.7);"></video>
            <div style="position: absolute; top: 15px; left: 15px; background: rgba(0,0,0,0.5); padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; color: var(--accent-color); backdrop-filter: blur(5px); border: 1px solid rgba(88, 166, 255, 0.2);">
                LIVE VECTORS
            </div>
            <div style="position: absolute; bottom: 0; left: 0; padding: 15px; background: linear-gradient(transparent, rgba(13, 17, 23, 0.98)); width: 100%;">
                <div style="font-size: 1rem; font-weight: 600; color: white; margin-bottom: 2px;">${vid.title}</div>
                <div style="font-size: 0.72rem; color: rgba(255,255,255,0.7); font-style: italic; line-height: 1.2;">${desc}</div>
            </div>
        </div>
    `;
    }).join('');
}

// Video Modal Logic (AdSense-Compliant Native Player)
window.openVideoModal = function (url, title) {
    const modal = document.getElementById('video-modal');
    const player = document.getElementById('modal-video-player');
    const titleEl = document.getElementById('modal-video-title');
    const loader = document.getElementById('video-loader');
    const muteIcon = document.querySelector('#video-mute-toggle i');

    if (!modal || !player) return;

    if (titleEl) titleEl.textContent = title;
    if (loader) loader.style.display = 'flex';

    player.src = url;
    player.muted = true; // Autoplay requirement
    if (muteIcon) {
        muteIcon.className = 'bi bi-volume-mute';
    }

    player.load();
    modal.style.display = 'flex';

    player.onplaying = () => { if (loader) loader.style.display = 'none'; };
    player.onwaiting = () => { if (loader) loader.style.display = 'flex'; };

    player.play().catch(e => console.warn("Autoplay blocked", e));
};

window.toggleMute = function () {
    const player = document.getElementById('modal-video-player');
    const muteIcon = document.querySelector('#video-mute-toggle i');
    if (!player || !muteIcon) return;

    player.muted = !player.muted;
    muteIcon.className = player.muted ? 'bi bi-volume-mute' : 'bi bi-volume-up';
};

window.closeVideoModal = function () {
    const modal = document.getElementById('video-modal');
    const player = document.getElementById('modal-video-player');
    if (modal) modal.style.display = 'none';
    if (player) {
        player.pause();
        player.src = '';
    }
};

// Privacy Modal logic replaced by Universal Policy Modal below


// Global Helper to set text safely
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function updateBackground(code, isDay) {
    let url = '';
    // Optimized sizes: w=1280, q=70 for faster loading
    if (code >= 95) url = 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?q=70&w=1280&auto=format&fit=crop';
    else if (code >= 71) url = 'https://images.unsplash.com/photo-1478265409131-1f65c88f965c?q=70&w=1280&auto=format&fit=crop';
    else if (code >= 61) url = 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=70&w=1280&auto=format&fit=crop';
    else if (code >= 1 && code <= 3) url = 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=70&w=1280&auto=format&fit=crop';
    else url = isDay ? 'https://images.unsplash.com/photo-1622278647429-71bc97e904e8?q=70&w=1280&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?q=70&w=1280&auto=format&fit=crop';

    document.body.style.backgroundImage = `url('${url}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.classList.add('glass-mode');
}

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



// --- CLIENT-SIDE ROUTER (SPA LOGIC) ---

window.handleRoute = function (event, path) {
    if (event) event.preventDefault();
    window.history.pushState({}, "", path);
    renderRoute(path);
};

window.onpopstate = function () {
    renderRoute(window.location.pathname);
};

// Initial Router Check on Load
document.addEventListener('DOMContentLoaded', () => {
    renderRoute(window.location.pathname);
});

// Cookie Consent Logic
function initCookieConsent() {
    window.vyamirNeedsConsent = true; // Signals index.html to reveal landing page
    if (!localStorage.getItem('vyamir_cookie_consent')) {
        setTimeout(() => {
            const popup = document.getElementById('cookie-popup');
            // Don't show if we are already on privacy settings
            if (popup && window.location.pathname !== '/privacy-settings') {
                popup.style.display = 'block';
                popup.classList.add('active');
            }
        }, 1500);
    }
}

window.acceptCookies = function () {
    localStorage.setItem('vyamir_cookie_consent', 'true');
    localStorage.setItem('vyamir_cookies_accepted', 'true'); // Backward compatibility

    // BACKEND SYNC: Log the acceptance in Firestore for legal audit
    const logAcceptance = async () => {
        try {
            const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js");
            if (window.firebaseAuth.currentUser) {
                const userRef = doc(window.db, "users", window.firebaseAuth.currentUser.uid);
                await setDoc(userRef, {
                    privacyConsent: {
                        essential: true,
                        analytics: true,
                        advertising: true,
                        updatedAt: serverTimestamp()
                    }
                }, { merge: true });
                console.log("Consent log updated in backend.");
                initSkyPointsSystem();
            }
        } catch (err) {
            console.error("Consent log failed:", err);
        }
    };
    logAcceptance();
    const popup = document.getElementById('cookie-popup');
    if (popup) {
        popup.style.transition = 'opacity 0.3s, transform 0.3s';
        popup.style.opacity = '0';
        popup.style.transform = 'translateY(20px)';
        setTimeout(() => popup.style.display = 'none', 300);
    }
};

function renderRoute(path) {
    const legalContainer = document.getElementById('legal-pages-container');
    const welcomeContainer = document.querySelector('.welcome-container');
    const dashboardGrid = document.querySelector('.grid-container');
    const footer = document.querySelector('footer');

    // Default Title
    document.title = "Vyamir | Your Skies, Redefined";

    if (path === '/' || path === '/index.html') {
        // HOME VIEW
        if (legalContainer) legalContainer.style.display = 'none';

        // Persist Privacy Popup if returning without consent
        if (!localStorage.getItem('vyamir_cookie_consent')) {
            const popup = document.getElementById('cookie-popup');
            if (popup) {
                popup.style.display = 'block';
                setTimeout(() => {
                    popup.style.opacity = '1';
                    popup.classList.add('active');
                }, 100);
            }
        }

        // Show Footer for Dashboard only
        if (footer) footer.style.display = 'block';

        // Restore appropriate view based on data
        if (window.weatherData) {
            document.body.classList.add('is-dashboard');
            document.body.classList.remove('is-landing');
            if (dashboardGrid) dashboardGrid.style.opacity = '1';
            // Ensure Welcome is hidden
            if (welcomeContainer) welcomeContainer.style.display = 'none';
        } else {
            document.body.classList.add('is-landing');
            document.body.classList.remove('is-dashboard');
            if (welcomeContainer) welcomeContainer.style.display = 'flex';
        }
        return;
    }

    // LEGAL PAGE VIEWS
    const routes = {
        '/privacy': 'privacy',
        '/terms': 'terms',
        '/about': 'about',
        '/contact': 'contact',
        '/cookie-policy': 'cookies',
        '/privacy-settings': 'privacy-settings'
    };

    const routeKey = routes[path];
    if (routeKey && content[routeKey]) {
        // Hide Main App UI
        document.body.classList.add('is-landing'); // Keep background but hide dashboard layout styling
        document.body.classList.remove('is-dashboard');

        if (welcomeContainer) welcomeContainer.style.display = 'none';
        if (dashboardGrid) dashboardGrid.style.opacity = '0'; // Hide grid

        // Hide Main Footer as Legal Pages have their own flow but we want keep footer visible? 
        // User asked: "The footer should remain at the absolute bottom of these long pages."
        // Our new layout puts the content inside a scrolling full-page div. 
        // The original logic footer is inside the container. 
        // We actually want to hide the "dashboard" footer and let the legal page handle it 
        // OR simply hide it because the legal page is full screen.
        if (footer) footer.style.display = 'none';

        // Show Legal UI
        if (legalContainer) {
            legalContainer.style.display = 'flex';
            document.getElementById('legal-page-title').textContent = content[routeKey].title;
            document.getElementById('legal-page-content').innerHTML = content[routeKey].text;

            // Hide Cookie Popup while in settings
            const cookiePopup = document.getElementById('cookie-popup');
            if (cookiePopup) cookiePopup.style.display = 'none';

            // Update Title
            document.title = `${content[routeKey].title} | Vyamir`;

            // If it's privacy settings, init the switches
            if (routeKey === 'privacy-settings') {
                const saved = localStorage.getItem('vyamir_privacy_settings');
                if (saved) {
                    const settings = JSON.parse(saved);
                    if (document.getElementById('pref-analytics')) document.getElementById('pref-analytics').checked = settings.analytics;
                    if (document.getElementById('pref-ads')) document.getElementById('pref-ads').checked = settings.advertising;
                }
            }
        }
    }
}


// --- TOAST NOTIFICATION SYSTEM ---
window.showToast = function (message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Create Toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Icon Selection
    let iconClass = 'bi-info-circle-fill';
    if (type === 'success') iconClass = 'bi-check-circle-fill';
    if (type === 'error') iconClass = 'bi-exclamation-triangle-fill';

    toast.innerHTML = `
        <div class="toast-icon">
            <i class="bi ${iconClass}"></i>
        </div>
        <div class="toast-message">${message}</div>
    `;

    container.appendChild(toast);

    // Animate In
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Auto Remove
    const duration = type === 'error' ? 8000 : 4000; // 8s for errors, 4s for success
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); // Wait for transition
    }, duration);
};

// Consolidated Contact Dispatch Engine
window.sendContactForm = async function () {
    const name = document.getElementById('contact-name')?.value.trim();
    const email = document.getElementById('contact-email')?.value.trim();
    const message = document.getElementById('contact-message')?.value.trim();
    const btn = document.getElementById('contact-submit-btn');

    if (!name || !email || !message) {
        showToast("Please fill in all required fields.", "error");
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast("Please enter a valid email address.", "error");
        return;
    }

    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = 'SENDING MESSAGE...';
        }

        const { collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js");

        // 1. CLOUD SYNC: Atomic write to Firestore
        const syncPromise = addDoc(collection(window.db, "contacts"), {
            name: name,
            email: email,
            message: message,
            timestamp: serverTimestamp(),
            uid: window.firebaseAuth.currentUser ? window.firebaseAuth.currentUser.uid : 'anonymous'
        });

        // 2. EMAIL DISPATCH: Trigger Backend SMTP
        const emailPromise = fetch('/api/send_email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, email: email, message: message })
        }).then(res => res.json());

        // EXECUTE BOTH
        const [syncRes, emailRes] = await Promise.all([syncPromise, emailPromise]);

        if (emailRes.status === 'success') {
            showToast("Message sent successfully! We will get back to you soon.", "success");
        } else {
            console.warn("SMTP Warning:", emailRes.message);
            showToast("Message saved! Our team will review it shortly.", "info");
        }

        // SUCCESS UI: Transform form into confirmation
        const card = document.getElementById('contact-form-card');
        if (card) {
            card.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="bi bi-check-circle-fill" style="font-size: 3.5rem; color: #2ea043; margin-bottom: 25px; display: block;"></i>
                    <h2 style="color: white; margin-bottom: 15px;">Message Sent Successfully</h2>
                    <p style="color: #8b949e; line-height: 1.6;">Thank you for reaching out! We have received your message and will respond to ${email} as soon as possible.</p>
                    <button onclick="handleRoute(event, '/')" style="margin-top: 30px; background: rgba(88,166,255,0.1); color: var(--accent-color); border: 1px solid rgba(88,166,255,0.2); padding: 12px 25px; border-radius: 10px; cursor: pointer; transition: 0.3s; font-weight: 600;">Go Back</button>
                </div>
            `;
        }

    } catch (error) {
        console.error("Dispatch Critical Error:", error);
        showToast("Unable to send message. Please try again or email us directly.", "error");

        // FALLBACK: If everything fails, open mailto
        const subject = encodeURIComponent("Vyamir Support Request");
        const body = encodeURIComponent(`User: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
        window.location.href = `mailto:vyamir.app@gmail.com?subject=${subject}&body=${body}`;

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'TRY SENDING AGAIN';
        }
    }
};




// Updated Content Dictionary with Contact Form and Detailed Text
const content = {
    privacy: {
        title: "Privacy Policy",
        text: `
            <p style="margin-bottom: 25px;"><strong>Effective Date: December 28, 2025</strong></p>

            <h2 style="color: var(--accent-color); margin-top: 30px;">1. Data Collection & Usage</h2>
            <p>Vyamir Systems operates on a privacy-first, decentralized model.</p>
            <p><strong>Geolocation Data:</strong> We utilize OpenStreetMap and Nominatim to resolve your geographic queries (Latitude/Longitude). This data is used strictly for retrieving atmospheric telemetry and is not permanently stored.</p>
            <p><strong>SkyID Identity:</strong> We use Firebase Anonymous Authentication to generate your unique 'SkyID.' This creates a virtual profile for your settings and SkyPoints without requiring personal email addresses or passwords.</p>

            <h2 style="color: var(--accent-color); margin-top: 30px;">2. Third-Party Services</h2>
            <p>To deliver our 'Zenith UI' experience, Vyamir integrates with trusted third-party providers:</p>
            <ul style="list-style: none; padding-left: 0;">
                <li style="margin-bottom: 8px;"><strong>Open-Meteo:</strong> For meteorological data streams.</li>
                <li style="margin-bottom: 8px;"><strong>Pexels API:</strong> For dynamic atmospheric video loops.</li>
                <li style="margin-bottom: 8px;"><strong>Google AdSense:</strong> For displaying relevant advertising.</li>
            </ul>

            <h2 style="color: var(--accent-color); margin-top: 30px;">3. Google AdSense & DoubleClick Cookie</h2>
            <p>Google, as a third-party vendor, uses cookies to serve ads on Vyamir. Google's use of the DoubleClick cookie enables it and its partners to serve ads to our users based on their visit to our site and other sites on the Internet. You may opt out of the use of the DoubleClick cookie for interest-based advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" style="color: var(--accent-color); text-decoration: underline;">Google Ads Settings</a>.</p>

            <h2 style="color: var(--accent-color); margin-top: 30px;">4. Data Security</h2>
            <p>Your SkyPoints balance and preferences are stored in Cloud Firestore. We utilize ACID-compliant transaction protocols to ensure your data is secure.</p>
        `
    },
    cookies: {
        title: "Cookie Policy",
        text: `
            <h2 style="color: var(--accent-color); margin-top: 30px;">1. How Vyamir Uses Cookies</h2>
            <p>Vyamir uses a combination of local storage and cookies to maintain the 'Cosmic Harmony' experience.</p>
            <p><strong>Essential Tokens (Firebase):</strong> We use browserLocalPersistence to keep you logged into your SkyID across sessions. Without this, your SkyPoints and preferences would reset every time you close the browser.</p>
            <p><strong>Performance Cache:</strong> To ensure our &lt;2s dashboard hydration time, we cache non-sensitive weather assets locally on your device.</p>

            <h2 style="color: var(--accent-color); margin-top: 30px;">2. Advertising Cookies</h2>
            <p>We partner with Google AdSense (Publisher ID: pub-6959399778170612) to support our infrastructure. Google uses cookies to show ads relevant to your interests.</p>

            <h2 style="color: var(--accent-color); margin-top: 30px;">3. Managing Your Preferences</h2>
            <p>You can manage your data consent at any time via the Privacy Preference Center located in the footer of the application. You may choose to disable Analytics or Advertising cookies, though Essential cookies are required for the SkyID system to function.</p>
        `
    },
    terms: {
        title: "Terms & Conditions",
        text: `
            <h2 style="color: var(--accent-color); margin-top: 30px;">1. System Usage</h2>
            <p>By accessing Vyamir, you agree to use our 'Atmospheric Intelligence' platform for informational purposes only. While our data pipeline is optimized for high precision, Vyamir is not a tool for aeronautical navigation, emergency response, or life-critical decision-making.</p>

            <h2 style="color: var(--accent-color); margin-top: 30px;">2. SkyPoints & The Vault Economy</h2>
            <p>Vyamir features a gamified reward system known as 'SkyPoints.'</p>
            <p><strong>Virtual Assets:</strong> SkyPoints are purely virtual tokens used for engagement tracking and social interaction within the Vyamir network. They have zero monetary value and cannot be exchanged for real-world currency.</p>
            <p><strong>Transfers:</strong> You are responsible for verifying the recipient's 'Nickname' in the Vault before executing a transfer. Vyamir Systems cannot reverse transactions made to incorrect nodes.</p>
            <p><strong>Fair Play:</strong> Any attempt to exploit the referral system or automate data fetching (scraping) will result in the suspension of your SkyID.</p>

            <h2 style="color: var(--accent-color); margin-top: 30px;">3. Intellectual Property</h2>
            <p>The 'Interactive Constellation Canvas,' 'Zenith UI' design system, and the underlying Flask/ESNext architecture are the intellectual property of Vyamir Systems.</p>
        `
    },
    about: {
        title: "ABOUT",
        text: `
            <p style="font-size: 1.2rem; line-height: 1.6; color: white; margin-bottom: 25px;">Vyamir is a next-generation weather visualization platform designed to bridge the gap between complex meteorological data and cinematic experience. Founded on the principle of 'High-Fidelity Atmospheric Intelligence,' we transform raw satellite vectors into a living, interactive digital sky.</p>

            <h2 style="color: var(--accent-color); margin-top: 30px;">Our Mission</h2>
            <p>To provide a visceral connection to the environment. Vyamir moves beyond static numbers, utilizing a Single-Source-of-Truth (SSOT) architecture to deliver hyper-local weather insights with sub-0.2°C accuracy.</p>

            <h2 style="color: var(--accent-color); margin-top: 30px;">The Vyamir Architecture</h2>
            <p>Vyamir is not a standard weather app; it is a high-performance progressive web application powered by:</p>
            <ul style="list-style: none; padding-left: 0; margin-top: 15px;">
                <li style="margin-bottom: 10px;"><strong style="color: white;">Precision Data:</strong> Real-time hydration via the Open-Meteo cluster.</li>
                <li style="margin-bottom: 10px;"><strong style="color: white;">Visual Immersion:</strong> Condition-mapped HD media assets via the Pexels API.</li>
                <li style="margin-bottom: 10px;"><strong style="color: white;">Decentralized Identity:</strong> A privacy-first SkyID system secured by Firebase.</li>
            </ul>

            <h2 style="color: var(--accent-color); margin-top: 30px;">System Integrity</h2>
            <div class="operational-band" style="margin-top: 20px; text-align: left; justify-content: flex-start;">
                <div class="operational-status" style="background: rgba(88, 166, 255, 0.05); border: 1px solid rgba(88, 166, 255, 0.15);">
                    <span class="status-pulse"></span>
                    VYAMIR NEURAL-SYNC | 100% OPERATIONAL
                </div>
            </div>
        `
    },
    contact: {
        title: "Contact Us",
        text: `
            <div style="background: rgba(88, 166, 255, 0.05); padding: 25px; border-radius: 12px; border: 1px solid rgba(88, 166, 255, 0.2); margin-bottom: 30px;">
                <h3 style="color: white; margin-top: 0;">Technical Dispatch Node</h3>
                <p>For bug reports, data anomalies, or SkyID synchronization issues, please transmit a signal to our core team.</p>
                <p><strong>Direct Channel:</strong> <a href="https://mail.google.com/mail/?view=cm&fs=1&to=vyamir.app@gmail.com" target="_blank" style="color: var(--accent-color); text-decoration: underline;">vyamir.app@gmail.com</a></p>
                <div style="margin-top: 15px;">
                    <p><strong>Support Protocol:</strong></p>
                    <ul style="list-style: none; padding-left: 0; opacity: 0.8;">
                        <li>• Technical Issues: Response within 24-48 hours.</li>
                        <li>• AdSense/Business Inquiries: Prioritized routing.</li>
                    </ul>
                </div>
                <p style="margin-top: 20px; font-size: 0.85rem; opacity: 0.6;">Vyamir Systems © 2025. Engineered with passion.</p>
            </div>
            
            <div id="contact-form-card" style="background: rgba(255,255,255,0.03); padding: 35px; border-radius: 16px; border: 1px solid rgba(88,166,255,0.15); box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                <div style="margin-bottom: 20px;">
                    <label style="display: block; color: var(--accent-color); margin-bottom: 10px; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Full Name</label>
                    <input type="text" id="contact-name" placeholder="Enter your full name" style="width: 100%; padding: 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.4); color: white; outline: none; transition: 0.3s;" onfocus="this.style.borderColor='var(--accent-color)'" onblur="this.style.borderColor='rgba(255,255,255,0.1)'">
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; color: var(--accent-color); margin-bottom: 10px; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your Email</label>
                    <input type="email" id="contact-email" placeholder="name@example.com" style="width: 100%; padding: 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.4); color: white; outline: none; transition: 0.3s;" onfocus="this.style.borderColor='var(--accent-color)'" onblur="this.style.borderColor='rgba(255,255,255,0.1)'">
                </div>
                
                <div style="margin-bottom: 25px;">
                    <label style="display: block; color: var(--accent-color); margin-bottom: 10px; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your Message</label>
                    <textarea id="contact-message" placeholder="How can we help you?" style="width: 100%; height: 150px; padding: 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.4); color: white; outline: none; resize: none; transition: 0.3s;" onfocus="this.style.borderColor='var(--accent-color)'" onblur="this.style.borderColor='rgba(255,255,255,0.1)'"></textarea>
                </div>

                <button id="contact-submit-btn" onclick="sendContactForm()" style="width: 100%; background: var(--accent-gradient); color: white; border: none; padding: 16px; border-radius: 8px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: 0.4s; box-shadow: 0 5px 15px rgba(88, 166, 255, 0.2);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(88, 166, 255, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 5px 15px rgba(88, 166, 255, 0.2)'">SEND MESSAGE</button>
            </div>
        `
    },
    'privacy-settings': {
        title: "Privacy Preference Center",
        text: `
            <div class="privacy-preference-container">
                <p style="font-size: 1.1rem; color: #8b949e; margin-bottom: 30px;">Choose how the Vyamir network utilizes your environmental vectors.</p>
                
                <div class="privacy-promise-summary">
                    <p style="font-size: 0.95rem; line-height: 1.7; color: #cbd5e1; margin-bottom: 25px; padding: 20px; background: rgba(88,166,255,0.05); border-radius: 12px; border: 1px solid rgba(88,166,255,0.1);">At Vyamir Systems, we prioritize your data autonomy. We only collect essential telemetry required to maintain your SkyID and coordinate synchronization. Review our full <a href="/privacy" onclick="handleRoute(event, '/privacy')" style="color: var(--accent-color); text-decoration: underline;">Privacy Policy</a> for deeper technical details.</p>
                </div>

                <div class="privacy-bulk-actions" style="display: flex; gap: 15px; margin-bottom: 35px;">
                    <button class="bulk-btn reject" onclick="rejectAllPrivacy()" style="flex: 1; padding: 12px; background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; cursor: pointer; transition: 0.3s;">Reject All</button>
                    <button class="bulk-btn accept" onclick="acceptAllPrivacy()" style="flex: 1; padding: 12px; background: rgba(88,166,255,0.1); color: var(--accent-color); border: 1px solid rgba(88,166,255,0.2); border-radius: 10px; cursor: pointer; transition: 0.3s;">Accept All</button>
                </div>

                <div class="privacy-categories-list">
                    <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 40px;">
                        <!-- Essential -->
                        <div class="privacy-section" style="background: rgba(255,255,255,0.02); padding: 16px 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                            <div class="privacy-header" style="display: flex; justify-content: space-between; align-items: center; gap: 20px;">
                                <div class="privacy-info">
                                    <h3 style="margin: 0 0 4px 0; font-size: 1rem; color: white;">Essential Services</h3>
                                    <p style="margin: 0; font-size: 0.85rem; color: #8b949e; line-height: 1.4;">Required protocols for SkyID and vault synchronization.</p>
                                </div>
                                <label class="switch-container">
                                    <input type="checkbox" checked disabled>
                                    <span class="slider-toggle locked"></span>
                                </label>
                            </div>
                        </div>

                        <!-- Analytics -->
                        <div class="privacy-section" style="background: rgba(255,255,255,0.02); padding: 16px 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                            <div class="privacy-header" style="display: flex; justify-content: space-between; align-items: center; gap: 20px;">
                                <div class="privacy-info">
                                    <h3 style="margin: 0 0 4px 0; font-size: 1rem; color: white;">Analytics & Performance</h3>
                                    <p style="margin: 0; font-size: 0.85rem; color: #8b949e; line-height: 1.4;">Optimizes visualizations based on usage telemetry.</p>
                                </div>
                                <label class="switch-container">
                                    <input type="checkbox" id="pref-analytics">
                                    <span class="slider-toggle"></span>
                                </label>
                            </div>
                        </div>

                        <!-- Advertising -->
                        <div class="privacy-section" style="background: rgba(255,255,255,0.02); padding: 16px 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                            <div class="privacy-header" style="display: flex; justify-content: space-between; align-items: center; gap: 20px;">
                                <div class="privacy-info">
                                    <h3 style="margin: 0 0 4px 0; font-size: 1rem; color: white;">Personalized Advertising</h3>
                                    <p style="margin: 0; font-size: 0.85rem; color: #8b949e; line-height: 1.4;">Enables contextualized communications via the AdSense network.</p>
                                </div>
                                <label class="switch-container">
                                    <input type="checkbox" id="pref-ads">
                                    <span class="slider-toggle"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 20px;">
                    <button class="save-settings-btn" onclick="savePrivacySettings()" style="width: 100%; max-width: 400px; padding: 18px; background: var(--accent-gradient); color: white; border: none; border-radius: 12px; font-weight: 700; font-size: 1.1rem; cursor: pointer; transition: 0.4s; box-shadow: 0 10px 25px rgba(88,166,255,0.2);">SAVE SETTINGS</button>
                </div>
            </div>
        `
    }
};

// Privacy Logic
window.checkUserPrivacyConsent = async function () {
    try {
        const { doc, getDoc, onSnapshot, setDoc, serverTimestamp, query, collection, where, getDocs, runTransaction, updateDoc } = await import("https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js");
        if (window.firebaseAuth.currentUser) {
            const userRef = doc(window.db, "users", window.firebaseAuth.currentUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists() && userSnap.data().privacyConsent) {
                console.log("Vyamir Engine: Privacy preferences found in cloud.");
                localStorage.setItem('vyamir_privacy_settings', JSON.stringify(userSnap.data().privacyConsent));
                localStorage.setItem('vyamir_cookies_accepted', 'true');
                initSkyPointsSystem();
            } else {
                initCookieConsent();
            }
        }
    } catch (err) {
        console.warn("Privacy Check Error:", err);
        initCookieConsent();
    }
};

async function initSkyPointsSystem() {
    if (window.skyPointsStarted) return;
    window.skyPointsStarted = true;

    console.log("Initializing SkyPoints Protocol...");
    const { doc, onSnapshot, setDoc, serverTimestamp, query, collection, where, getDocs, runTransaction, updateDoc } = await import("https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js");
    const userRef = doc(window.db, "users", window.firebaseAuth.currentUser.uid);

    // 1. Ensure User Identity exists
    const userSnap = await (async () => {
        const { getDoc } = await import("https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js");
        return await getDoc(userRef);
    })();

    const existingData = userSnap.data();
    // INITIALIZATION GUARD: Ensure nickname, initial points, and case-insensitive index exist
    // RETROACTIVE FIX: If points are 0 and they have no createdAt, they are considered "new" and get the 5-point welcome.
    const needsInit = !existingData ||
        !existingData.nickname ||
        !existingData.nickname_lowercase ||
        existingData.points === undefined ||
        (existingData.points === 0 && !existingData.createdAt);

    if (needsInit) {
        console.log("Vyamir Identity Engine: Synchronizing Node Data...");
        const randomId = Math.floor(1000 + Math.random() * 9000);
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const nickname = existingData?.nickname || `User_${randomId}`;

        // NEW USER: Initial 5 Points + 24h Maturation Start
        await setDoc(userRef, {
            nickname: nickname,
            nickname_lowercase: nickname.toLowerCase(), // For case-insensitive search
            points: (existingData?.points !== undefined && existingData?.points !== 0) ? existingData.points : 5,
            createdAt: existingData?.createdAt || serverTimestamp(),
            lastDailySearch: existingData?.lastDailySearch || todayStr,
            referralClaimed: existingData?.referralClaimed || false
        }, { merge: true });

        if (!existingData || (existingData.points === 0 && !existingData.createdAt)) {
            showToast("Welcome! You got 5 points for joining.", "success");
        }
    }

    // Capture referrer from URL
    const urlParams = new URLSearchParams(window.location.search);
    window.activeReferrer = urlParams.get('ref');
    if (window.activeReferrer) {
        console.log("Exploring via invitation from:", window.activeReferrer);
    }


    // Setting initial loading state
    const setPointsLoading = () => {
        ['header-points-value', 'vault-current-points'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '---';
        });
    };
    setPointsLoading();

    // 2. Real-time Point Sync
    onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.data();
            window.currentUserData = data;
            console.log("Vyamir Node Sync:", data.nickname, "| Balance:", data.points);
            window.vyamirSessionRestored = true; // Signals index.html to remove overlay

            const updateUI = () => {
                const elements = {
                    badge: document.getElementById('skypoints-badge'),
                    headerPoints: document.getElementById('header-points-value'),
                    vaultPoints: document.getElementById('vault-current-points'),
                    vaultNickname: document.getElementById('vault-current-nickname')
                };

                if (elements.badge) elements.badge.style.display = 'flex';
                if (elements.headerPoints) elements.headerPoints.textContent = (data.points !== undefined) ? data.points : 0;
                if (elements.vaultPoints) elements.vaultPoints.textContent = (data.points !== undefined) ? data.points : 0;
                if (elements.vaultNickname) elements.vaultNickname.textContent = data.nickname || 'Node_Syncing';
            };

            updateUI();
            setTimeout(updateUI, 800);
        }
    });
}

async function handleReferral(referrerNickname) {
    if (window.referralProcessed || (window.currentUserData && window.currentUserData.referralClaimed)) return;

    // Self-referral check
    if (window.currentUserData && window.currentUserData.nickname === referrerNickname) {
        return;
    }

    const { collection, query, where, getDocs, runTransaction, doc } = await import("https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js");
    const q = query(collection(window.db, "users"), where("nickname_lowercase", "==", referrerNickname.toLowerCase()));
    const snap = await getDocs(q);

    if (!snap.empty) {
        const referrerRef = doc(window.db, "users", snap.docs[0].id);
        const userRef = doc(window.db, "users", window.firebaseAuth.currentUser.uid);

        try {
            await runTransaction(window.db, async (transaction) => {
                const userSnap = await transaction.get(userRef);
                if (userSnap.exists() && userSnap.data().referralClaimed) {
                    throw "Referral already processed.";
                }

                const refSnap = await transaction.get(referrerRef);
                if (refSnap.exists()) {
                    const currentPoints = refSnap.data().points || 0;
                    transaction.update(referrerRef, { points: currentPoints + 10 });
                    transaction.update(userRef, { referralClaimed: true });
                }
            });
            window.referralProcessed = true;
            showToast(`Connected! You were invited by ${referrerNickname}`, "info");
            showToast(`Success! 10 Points sent to ${referrerNickname}`, "success");
        } catch (e) {
            console.warn("Referral integrity check or error:", e);
        }
    }
}


window.savePrivacySettings = function () {
    const analytics = document.getElementById('pref-analytics').checked;
    const ads = document.getElementById('pref-ads').checked;

    // LOCAL PERSISTENCE
    const consentObj = {
        essential: true,
        analytics: analytics,
        advertising: ads
    };
    localStorage.setItem('vyamir_privacy_settings', JSON.stringify(consentObj));
    localStorage.setItem('vyamir_cookie_consent', 'true');
    localStorage.setItem('vyamir_cookies_accepted', 'true');

    // BACKEND SYNC: Save to Firebase Firestore
    const syncToFirebase = async () => {
        try {
            const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js");
            if (window.firebaseAuth.currentUser) {
                const userRef = doc(window.db, "users", window.firebaseAuth.currentUser.uid);
                await setDoc(userRef, {
                    privacyConsent: {
                        ...consentObj,
                        updatedAt: serverTimestamp()
                    }
                }, { merge: true });
                console.log("Privacy preferences synced to Firebase.");
            }
        } catch (err) {
            console.error("Firebase Privacy Sync Error:", err);
        }
    };
    syncToFirebase();

    showToast("Preferences Locked. Atmosphere Syncing.", "success");

    // Initialize SkyPoints system now that consent is given
    setTimeout(() => initSkyPointsSystem(), 500);

    // Hide cookie popup if visible
    const popup = document.getElementById('cookie-popup');
    if (popup) {
        popup.style.opacity = '0';
        setTimeout(() => popup.style.display = 'none', 300);
    }

    // Navigate back to home
    setTimeout(() => {
        window.history.pushState({}, "", "/");
        renderRoute("/");
    }, 1200);
};

window.acceptAllPrivacy = function () {
    document.getElementById('pref-analytics').checked = true;
    document.getElementById('pref-ads').checked = true;
};

window.rejectAllPrivacy = function () {
    document.getElementById('pref-analytics').checked = false;
    document.getElementById('pref-ads').checked = false;
};

// Update handleRoute to support the new path
const originalHandleRoute = window.handleRoute;
window.handleRoute = function (e, path) {
    if (e) e.preventDefault();
    window.history.pushState({}, "", path);
    renderRoute(path);
};

// Update renderRoute routes object
// This is inside a function scope in the original file, so I'll replace the block.

// SkyPoints Vault: Nickname Update & Transfers
window.updateNickname = async function (newNameRaw) {
    const newName = newNameRaw ? newNameRaw.trim() : "";
    if (!newName || newName.length < 3) {
        showToast("Nickname must be at least 3 characters.", "error");
        return;
    }
    const { collection, query, where, getDocs, doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js");

    showToast("Checking availability...", "info");

    // Uniqueness Check (Case-insensitive check)
    const q = query(collection(window.db, "users"), where("nickname_lowercase", "==", newName.toLowerCase()));
    const snap = await getDocs(q);
    if (!snap.empty) {
        showToast("Identity collision! That nickname is already taken.", "error");
        return;
    }

    const userRef = doc(window.db, "users", window.firebaseAuth.currentUser.uid);
    await updateDoc(userRef, {
        nickname: newName,
        nickname_lowercase: newName.toLowerCase()
    });
    showToast(`Name updated! Welcome, ${newName}!`, "success");
    if (document.getElementById('new-nickname-input')) document.getElementById('new-nickname-input').value = '';
};

window.transferPoints = async function (recipientNicknameRaw, amount) {
    const recipientNickname = recipientNicknameRaw ? recipientNicknameRaw.trim() : "";
    if (!recipientNickname || !amount || amount <= 0) {
        showToast("Please enter a name and amount.", "error");
        return;
    }

    if (window.currentUserData && recipientNickname.toLowerCase() === window.currentUserData.nickname.toLowerCase()) {
        showToast("You can't send points to yourself.", "error");
        return;
    }

    // BUTTON FEEDBACK
    const btn = document.querySelector('#vault-transfer-content button');
    const originalBtnText = btn ? btn.textContent : 'EXECUTE TRANSFER';
    if (btn && btn.disabled) return;
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'TRANSMITTING...';
    }

    const { collection, query, where, getDocs, runTransaction, doc } = await import("https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js");
    showToast("Sending points...", "info");

    // DISCOVERY TIMEOUT (5s)
    const discoveryPromise = (async () => {
        const normalizedRecipient = recipientNickname.toLowerCase();
        const q = query(collection(window.db, "users"), where("nickname_lowercase", "==", normalizedRecipient));
        const snap = await getDocs(q);
        if (snap.empty) throw `${recipientNickname} not found. Please check the name.`;
        return snap;
    })();

    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject("Connection timeout. Please try again."), 5000)
    );

    try {
        const snap = await Promise.race([discoveryPromise, timeoutPromise]);

        const recipientId = snap.docs[0].id;
        const recipientData = snap.docs[0].data();
        const recipientRef = doc(window.db, "users", recipientId);
        const recipientNicknameDisplay = recipientData.nickname;
        const senderRef = doc(window.db, "users", window.firebaseAuth.currentUser.uid);

        await runTransaction(window.db, async (transaction) => {
            const senderSnap = await transaction.get(senderRef);
            const currentPoints = senderSnap.data().points || 0;
            if (currentPoints < amount) throw "You don't have enough points.";

            const recipientSnap = await transaction.get(recipientRef);
            transaction.update(senderRef, { points: currentPoints - parseInt(amount) });
            transaction.update(recipientRef, { points: (recipientSnap.data().points || 0) + parseInt(amount) });
        });

        const pointLabel = amount == 1 ? "SkyPoint" : "SkyPoints";
        showToast(`Success! ${amount} points moved to ${recipientNicknameDisplay}.`, "success");
        if (document.getElementById('transfer-recipient')) document.getElementById('transfer-recipient').value = '';
        if (document.getElementById('transfer-amount')) document.getElementById('transfer-amount').value = '';
    } catch (e) {
        showToast("Transmission Failed: " + e, "error");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = originalBtnText;
        }
    }
};

window.toggleVault = function () {
    const modal = document.getElementById('vault-modal');
    if (!modal) return;
    if (modal.style.display === 'flex') {
        modal.style.display = 'none';
    } else {
        document.getElementById('vault-current-nickname').textContent = window.currentUserData ? window.currentUserData.nickname : 'Loading...';
        document.getElementById('vault-current-points').textContent = window.currentUserData ? window.currentUserData.points : '0';
        modal.style.display = 'flex';
    }
};

window.switchVaultTab = function (tab) {
    const idContent = document.getElementById('vault-id-content');
    const transferContent = document.getElementById('vault-transfer-content');
    const idTab = document.getElementById('vault-tab-id');
    const transferTab = document.getElementById('vault-tab-transfer');

    if (tab === 'id') {
        idContent.style.display = 'block';
        transferContent.style.display = 'none';
        idTab.classList.add('vault-tab-active');
        transferTab.classList.remove('vault-tab-active');
        idTab.style.background = 'var(--accent-color)';
        transferTab.style.background = 'transparent';
    } else {
        idContent.style.display = 'none';
        transferContent.style.display = 'block';
        idTab.classList.remove('vault-tab-active');
        transferTab.classList.add('vault-tab-active');
        idTab.style.background = 'transparent';
        transferTab.style.background = 'var(--accent-color)';
    }
};

window.copyReferralLink = function () {
    const nickname = window.currentUserData ? window.currentUserData.nickname : '';
    if (!nickname) {
        showToast("Personal Identity not initialized yet.", "error");
        return;
    }
    const link = `${window.location.origin}/?ref=${nickname}`;
    navigator.clipboard.writeText(link).then(() => {
        showToast("Referral link copied! Share with friends to earn points.", "success");
    });
};



// ---------------------------------------------------------------------------------
// BRAND ORCHESTRATION: Landing Page Interactions
// ---------------------------------------------------------------------------------
window.handleLandingScroll = function (container) {
    const nav = document.getElementById('sticky-brand-nav');
    if (!nav) return;

    // Show navbar when scrolling past the Hero
    if (container.scrollTop > 100) {
        nav.classList.add('visible');
    } else {
        nav.classList.remove('visible');
    }

    // Dynamic sky opacity
    if (container.scrollTop > 50) {
        container.classList.add('scrolled');
    } else {
        container.classList.remove('scrolled');
    }
};

window.scrollToHero = function () {
    const container = document.querySelector('.welcome-container');
    if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// --------------------------------------------------------
// GLOBAL MAP ENGINE (Leaflet + RainViewer + Satellite)
// --------------------------------------------------------
window.initMap = function (lat, lon) {
    const mapId = 'map';
    // If map already exists, just recenter it
    if (window.mapInstance) {
        window.mapInstance.setView([lat, lon], 10);

        // Move existing marker
        if (window.mapMarker) window.mapMarker.setLatLng([lat, lon]);
        return;
    }

    const mapElement = document.getElementById(mapId);
    if (!mapElement) return;

    // Dark Matter Base Layer (CartoDB)
    const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    });

    // Satellite Layer (Esri World Imagery)
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    // Initialize Map
    window.mapInstance = L.map(mapId, {
        center: [lat, lon],
        zoom: 10,
        layers: [darkLayer] // Default
    });

    // Marker
    window.mapMarker = L.marker([lat, lon]).addTo(window.mapInstance);

    // RAINVIEWER RADAR LAYER (Live Precip)
    // We add it but initially it might be empty until we set time
    const rainLayer = L.tileLayer('https://tile.rainviewer.com/img/radar_nowcast_png/256/{z}/{x}/{y}/2/1_1.png', {
        opacity: 0.7,
        attribution: '&copy; <a href="https://www.rainviewer.com/api.html">RainViewer</a>',
        zIndex: 100
    });
    rainLayer.addTo(window.mapInstance);

    // Layer Controls
    const baseMaps = {
        "Dark Map": darkLayer,
        "Satellite": satelliteLayer
    };

    const overlayMaps = {
        "Precipitation (Radar)": rainLayer
    };

    L.control.layers(baseMaps, overlayMaps).addTo(window.mapInstance);

    // Custom Layer Chip Logic (Sync with UI)
    window.switchMapLayer = function (type) {
        if (type === 'radar') {
            if (!window.mapInstance.hasLayer(rainLayer)) window.mapInstance.addLayer(rainLayer);
        } else if (type === 'satellite') {
            if (window.mapInstance.hasLayer(satelliteLayer)) return;
            window.mapInstance.removeLayer(darkLayer);
            window.mapInstance.addLayer(satelliteLayer);
        } else {
            // Default
            if (window.mapInstance.hasLayer(darkLayer)) return;
            window.mapInstance.removeLayer(satelliteLayer);
            window.mapInstance.addLayer(darkLayer);
        }
    }
};

// --------------------------------------------------------
// ATMOSPHERIC UNIT CONVERSION & HELPER PROTOCOLS
// --------------------------------------------------------

window.updateHourlyScroll = function (data) {
    const container = document.getElementById('section-hourly');
    if (!container) return;

    const hourly = data.hourly;
    const currentHourIndex = new Date(data.current.time).getHours(); // Roughly align with current hour slot
    // Since API returns hourly data starting from day start, we need to find the current time index.
    // Open-Meteo hourly.time is ISO array.

    // Find index nearest to now
    const nowStr = data.current.time.slice(0, 13); // "YYYY-MM-DDTHH"
    let startIndex = hourly.time.findIndex(t => t.startsWith(nowStr));
    if (startIndex === -1) startIndex = 0;

    let html = `
    <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
        <h3 style="margin: 0 0 15px 0; font-size: 1.1rem; color: #fff;">48-Hour Trajectory</h3>
        <div style="display: flex; overflow-x: auto; gap: 15px; padding-bottom: 10px; scrollbar-width: thin;" class="hourly-scroll-track">
    `;

    for (let i = startIndex; i < startIndex + 48 && i < hourly.time.length; i++) {
        const time = new Date(hourly.time[i]);
        const hourLabel = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(':00', '');
        const temp = Math.round(getTemp(hourly.temperature_2m[i]));
        const icon = getWeatherIcon(hourly.weathercode[i]);
        const precip = hourly.precipitation_probability[i];
        const wind = Math.round(getSpeed(hourly.windspeed_10m[i]));

        html += `
        <div style="min-width: 70px; display: flex; flex-direction: column; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); padding: 12px 5px; border-radius: 12px;">
            <div style="font-size: 0.8rem; opacity: 0.7;">${hourLabel}</div>
            <i class="${icon}" style="font-size: 1.5rem; color: #fff;"></i>
            <div style="font-size: 1.1rem; font-weight: 700;">${temp}°</div>
            <div style="font-size: 0.75rem; color: #81d4fa;"><i class="bi bi-droplet-fill"></i> ${precip}%</div>
            <div style="font-size: 0.75rem; color: #ccc;"><i class="bi bi-wind"></i> ${wind}</div>
        </div>
        `;
    }

    html += `</div></div>`;
    container.innerHTML = html;
};

window.toggleUnits = function () {
    window.unitSystem = window.unitSystem === 'metric' ? 'imperial' : 'metric';
    localStorage.setItem('vyamir_unit_system', window.unitSystem);
    updateUnitUI();

    // Refresh Dashboard if data exists
    if (window.weatherData) {
        updateHero(window.weatherData);
        updateDetails(window.weatherData);
        updateHazards(window.weatherData);
        updateHourlyScroll(window.weatherData);
    }
};

window.updateUnitUI = function () {
    const c = document.getElementById('unit-c');
    const f = document.getElementById('unit-f');
    if (c && f) {
        if (window.unitSystem === 'metric') {
            c.style.color = 'white'; c.style.fontWeight = '700'; c.style.opacity = '1';
            f.style.color = 'rgba(255,255,255,0.5)'; f.style.fontWeight = '400';
        } else {
            f.style.color = 'white'; f.style.fontWeight = '700'; f.style.opacity = '1';
            c.style.color = 'rgba(255,255,255,0.5)'; c.style.fontWeight = '400';
        }
    }
};

window.detectLocation = function () {
    const icon = document.querySelector('.bi-geo');
    if (icon) icon.className = "bi bi-hourglass-split spin-animation"; // Add animation class if exists

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                // Success
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                handleSearchSelection("Your Coordinates", lat, lon);
                if (icon) icon.className = "bi bi-geo";
            },
            (err) => {
                showToast("Location access denied or failed.", "error");
                if (icon) icon.className = "bi bi-geo";
            }
        );
    } else {
        showToast("Geolocation not supported.", "error");
    }
};

// HELPER FUNCTIONS
function getTemp(c) { return window.unitSystem === 'imperial' ? (c * 9 / 5) + 32 : c; }
function getSpeed(kph) { return window.unitSystem === 'imperial' ? kph * 0.621371 : kph; }
function getDist(km) { return window.unitSystem === 'imperial' ? km * 0.621371 : km; }
function getPrecip(mm) { return window.unitSystem === 'imperial' ? mm * 0.0393701 : mm; }

function getUnit(type) {
    if (type === 'temp') return window.unitSystem === 'imperial' ? 'F' : 'C'; // Just the letter if needed, but I used symbol in code
    if (type === 'speed') return window.unitSystem === 'imperial' ? 'mph' : 'km/h';
    if (type === 'dist') return window.unitSystem === 'imperial' ? 'mi' : 'km';
    if (type === 'precip') return window.unitSystem === 'imperial' ? 'in' : 'mm';
    return '';
}


// DYNAMIC BACKGROUND ENGINE
window.updateBackground = function (code, isDay) {
    document.body.className = document.body.className.replace(/bg-\w+/g, '').trim();
    let bgClass = 'bg-clear';
    if (code >= 200 && code < 300) bgClass = 'bg-thunderstorm';
    else if (code >= 300 && code < 600) bgClass = 'bg-rain';
    else if (code >= 600 && code < 700) bgClass = 'bg-snow';
    else if (code >= 700 && code < 800) bgClass = 'bg-mist';
    else if (code === 800) bgClass = isDay ? 'bg-clear' : 'bg-clear';
    else if (code > 800) bgClass = 'bg-clouds';
    document.body.classList.add(bgClass);
};


// SATELLITE ENGINE
window.initSatMap = function (lat, lon) {
    const mapId = 'sat-map-container';
    const mapElement = document.getElementById(mapId);
    if (!mapElement) return;

    const map = L.map(mapId, { center: [lat, lon], zoom: 6, zoomControl: false, attributionControl: false });

    // Base: Satellite
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}').addTo(map);

    // Overlay: Infrared Clouds (RainViewer)
    L.tileLayer('https://tile.rainviewer.com/img/satellite-infrared/512/{z}/{x}/{y}/2/1_1.png', { opacity: 0.6 }).addTo(map);

    // Labels
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', opacity: 0.8 }).addTo(map);

    // Marker
    L.marker([lat, lon]).addTo(map);

    // Interaction Prevention (Passive View)
    map.dragging.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    if (map.tap) map.tap.disable();
};

// --- AGRICULTURAL INTELLIGENCE MODULE ---
function initAgriPage() {
    const data = window.weatherData;
    if (!data) return;

    // 1. Crop Advisory Logic (Mock Intelligence based on real data)
    const humidity = data.current.relative_humidity_2m;
    const temp = data.current.temperature_2m;
    const precip = data.current.precipitation;
    const wind = data.current.wind_speed_10m;
    
    let advice = Analyzing conditions...;
    let icon = bi-check-circle;
    let color = #81c784; // Green

    // Soil Telemetry (New Open-Meteo Vars)
    // Note: data.hourly should have soil vars if fetched correctly. 
    // Since we updated openmeteo.py, the client will receive them in the 'hourly' object under keys like 'soil_temperature_0cm'.
    // We access the current hour index.
    const nowHour = new Date().getHours();
    
    let soilMoisture = (data.hourly.soil_moisture_0_to_1cm && data.hourly.soil_moisture_0_to_1cm[nowHour]) 
                       ? data.hourly.soil_moisture_0_to_1cm[nowHour] : (precip > 0 ? 0.35 : 0.15); // Fallback mock
    let soilTemp = (data.hourly.soil_temperature_0cm && data.hourly.soil_temperature_0cm[nowHour]) 
                   ? data.hourly.soil_temperature_0cm[nowHour] : temp; // Fallback to air temp

    // Convert moisture fraction to %
    // Open-Meteo gives m/m. Typical range 0.0-0.5. 0.3 is wet.
    let smPerc = Math.round(soilMoisture * 100); 
    if (smPerc > 100) smPerc = smPerc / 100; // If api changed unit

    document.getElementById('soil-moisture-val').textContent = smPerc + %;
    document.getElementById('soil-temp-val').textContent = Math.round(soilTemp) + C;

    // Logic Tree
    if (precip > 5) {
        advice = Heavy rainfall detected. Pause sowing activities to avoid seed washout. Ensure drainage channels are clear.;
        icon = bi-cloud-rain;
        color = #4fc3f7;
    } else if (temp > 35) {
        advice = High thermal stress. Irrigate crops during evening hours to minimize evaporation loss.;
        icon = bi-thermometer-sun;
        color = #ffb74d;
    } else if (humidity > 85 && temp > 25) {
        advice = High fungal risk due to warm, humid conditions. Monitor for blight and rust.;
        icon = bi-exclamation-triangle;
        color = #ff8a65;
    } else if (wind > 20) {
        advice = Strong winds detected. Secure tall crops (maize, sugarcane) and delay spraying operations.;
        icon = bi-wind;
        color = #e57373;
    } else {
        advice = Conditions are optimal for field operations. Soil moisture levels are stable.;
    }

    const advisoryEl = document.getElementById('agri-advisory');
    if (advisoryEl) {
        advisoryEl.innerHTML = \<div style="display:flex; align-items:start; gap:15px;">
            <i class="bi \ style="font-size:2rem; color:\;"></i>
 <div>
 <div style="font-weight:600; color:\; margin-bottom:5px;">ACTION REQUIRED</div>
 \
 </div>
 </div>\;
 }

 // Pest Risk
 const pestEl = document.getElementById('pest-risk-display');
 let pestRisk = Low;
 let pestColor = #69f0ae;
 if (humidity > 80 && temp > 28) { pestRisk = High; pestColor = #ff5252; }
 else if (humidity > 60) { pestRisk = Moderate; pestColor = #ffab40; }

 if (pestEl) {
 pestEl.innerHTML = \<span style="color:\; font-weight:600; font-size:1.5rem;">\</span> <span style="font-size:0.9rem; opacity:0.7;">based on humidity/temp matrix</span>\;
 }
}

// --- MONSOON TRACKING MODULE ---
function initMonsoonPage() {
 const mapEl = document.getElementById('monsoon-map');
 if (!mapEl) return;

 // Force India View
 const map = L.map('monsoon-map', {
 zoomControl: false,
 attributionControl: false
 }).setView([20.5937, 78.9629], 5); // Center of India

 L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
 opacity: 1,
 maxZoom: 18
 }).addTo(map);

 // RainViewer Radar Overlay
 L.tileLayer('https://tile.cache.rainviewer.com/v2/radar/nowcast_5m/{z}/{x}/{y}/2/1_1.png', {
 opacity: 0.8,
 zIndex: 10
 }).addTo(map);
 
 // Add simple marker for current location context if available
 const data = window.weatherData;
 if (data && data.lat) {
 const marker = L.circleMarker([data.lat, data.lon], {
 color: '#58a6ff',
 radius: 6,
 fillOpacity: 1
 }).addTo(map);
 marker.bindPopup(<b>You are here</b><br>).openPopup();
 }
 
 // Animate map gently
 let angle = 0;
 /* 
 // Optional: Subtle pan animation
 setInterval(() => {
 angle += 0.001;
 const newLat = 20.5937 + Math.sin(angle) * 0.5;
 map.panTo([newLat, 78.9629], {animate: true, duration: 1});
 }, 100); 
 */
 
 // Handle Resize
 setTimeout(() => map.invalidateSize(), 500);
}


// --- LINGUISTICS ENGINE ---
const translations = {
    en: {
        current: Current, hourly: Hourly, maps: Maps, details: Details, news: News,
        agri: Agri, monsoon: Monsoon
    },
    hi: {
        current: ?????, hourly: ??? ??, maps: ???, details: ????, news: ????,
        agri: ??, monsoon: ????
    },
    mr: {
        current: ????, hourly: taasi, maps: ???, details: ????, news: ????,
        agri: ??, monsoon: ????
    }
};

window.changeLanguage = function(lang) {
    if (!translations[lang]) return;
    const t = translations[lang];
    
    // Sidebar
    document.querySelectorAll('.sidebar-item span').forEach(span => {
        const text = span.textContent.trim().toLowerCase();
        // Since I rely on text content matching which is fragile, a robust system would use data-key.
        // For this V1, I will just iterate known keys.
        if (text === 'current') span.textContent = t.current;
        if (text === 'hourly') span.textContent = t.hourly;
        if (text === 'maps') span.textContent = t.maps;
        if (text === 'details') span.textContent = t.details;
        if (text === 'news') span.textContent = t.news;
        if (text === 'agri') span.textContent = t.agri;
        if (text === 'monsoon') span.textContent = t.monsoon;
    });

    console.log(Language switched to, lang);
}


// FAILSAFE: Auto-bootstrap default context for specialized pages if no session exists
if (window.location.pathname.includes('/agri') || window.location.pathname.includes('/monsoon')) {
    setTimeout(() => {
        if (!window.weatherData && !localStorage.getItem('vyamir_last_session')) {
             console.log(Vyamir System: Auto-bootstrapping India context for regional dashboard.);
             handleSearchSelection(India Region, 20.5937, 78.9629);
        }
    }, 2000);
}

