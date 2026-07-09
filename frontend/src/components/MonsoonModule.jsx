import React, { useEffect, useRef } from 'react';

export default function MonsoonModule({ weatherData }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    // Cleanup previous map instance if any exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      // Force India View centering
      const map = window.L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([20.5937, 78.9629], 5);

      mapInstanceRef.current = map;

      // Dark theme map base layer
      window.L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
        maxZoom: 18,
        opacity: 1
      }).addTo(map);

      // RainViewer live radar precipitation layer
      window.L.tileLayer('https://tilecache.rainviewer.com/v2/radar/nowcast_5m/{z}/{x}/{y}/2/1_1.png', {
        opacity: 0.8,
        maxNativeZoom: 7,
        maxZoom: 18,
        zIndex: 10
      }).addTo(map);

      // Add circle marker for current search focus context
      // Search local storage for last session coordinates
      const lastSessionStr = localStorage.getItem('vyamir_last_session');
      if (lastSessionStr) {
        try {
          const session = JSON.parse(lastSessionStr);
          if (session.lat && session.lon) {
            const marker = window.L.circleMarker([session.lat, session.lon], {
              color: '#58a6ff',
              radius: 6,
              fillColor: '#58a6ff',
              fillOpacity: 1
            }).addTo(map);
            marker.bindPopup(`<b>Focus Region</b><br>${session.city || 'Coordinates'}`).openPopup();
          }
        } catch (e) {
          console.warn("Monsoon session read failed", e);
        }
      }

      // Refresh size layout
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 300);

    } catch (err) {
      console.error("Monsoon Map Init Error:", err);
    }

    // Cleanup Leaflet on component unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [weatherData]);

  return (
    <div className="glass-panel" style={{ padding: '30px', margin: '20px 0', color: 'white', textAlign: 'left' }}>
      <h2 style={{ color: 'var(--accent-color)', marginBottom: '25px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <i className="bi bi-radar"></i> Monsoon Tracking Module
      </h2>
      <p style={{ opacity: 0.8, fontSize: '0.95rem', marginBottom: '25px', lineHeight: 1.6 }}>
        Interactive meteorological radar tracking macro monsoon movements and precipitation vectors across the Indian subcontinent.
      </p>

      {/* Map Container */}
      <div
        ref={mapRef}
        style={{
          height: '450px',
          width: '100%',
          borderRadius: '16px',
          border: '1px solid rgba(88, 166, 255, 0.25)',
          overflow: 'hidden',
          background: '#0d1117',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          zIndex: 1
        }}
      ></div>

      <div style={{ marginTop: '20px', background: 'rgba(88, 166, 255, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(88, 166, 255, 0.15)', display: 'flex', gap: '15px', alignItems: 'start' }}>
        <i className="bi bi-info-circle" style={{ color: 'var(--accent-color)', fontSize: '1.2rem' }}></i>
        <div style={{ fontSize: '0.85rem', opacity: 0.8, lineHeight: 1.5 }}>
          <strong>Subcontinent Forecast Sync:</strong> The radar overlay matches real-time nowcasts from the RainViewer system, updating in 5-minute increments. Ensure your browser is online to stream live radar layers.
        </div>
      </div>
    </div>
  );
}
