let mapInstance = null;
let currentMarker = null;

window.initMap = async function (lat, lon) {
    if (!document.getElementById('map')) return;

    if (mapInstance) {
        mapInstance.setView([lat, lon], 10);
        if (currentMarker) {
            currentMarker.setLatLng([lat, lon]);
        } else {
            currentMarker = L.marker([lat, lon]).addTo(mapInstance);
        }
        return;
    }

    // Initialize Map
    mapInstance = L.map('map').setView([lat, lon], 10);
    window.mapInstance = mapInstance;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(mapInstance);

    // FETCH LATEST RADAR TIMESTAMP
    try {
        const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await response.json();
        const latestTs = data.radar.past[data.radar.past.length - 1].time;

        // RainViewer Radar Layer with correct dynamic timestamp
        L.tileLayer(`https://tilecache.rainviewer.com/v2/radar/${latestTs}/256/{z}/{x}/{y}/2/1_1.png`, {
            opacity: 0.6,
            attribution: '© RainViewer Radar'
        }).addTo(mapInstance);
    } catch (e) {
        console.error("Vyamir Engine: Radar Handshake Failed. Layer Suspended Safely.", e);
    }

    // Initial Marker
    currentMarker = L.marker([lat, lon]).addTo(mapInstance);
}
