import React from 'react';

export default function FallbackScreen({ error, onRetry }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        padding: '20px',
        textAlign: 'center',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: '500px',
          padding: '40px 30px',
          border: '1px solid rgba(255, 88, 88, 0.25)',
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.5)',
          background: 'rgba(15, 10, 10, 0.8) !important',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(255, 82, 82, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 25px auto',
            border: '1px solid rgba(255, 82, 82, 0.3)',
            animation: 'pulse 2s infinite',
          }}
        >
          <i className="bi bi-cloud-slash" style={{ fontSize: '2.5rem', color: '#ff5252' }}></i>
        </div>

        <h2 style={{ color: '#ff5252', fontSize: '1.8rem', fontWeight: '700', marginBottom: '15px', letterSpacing: '-0.5px' }}>
          Meteorological Link Offline
        </h2>

        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '30px' }}>
          {error && typeof error === 'object' && error.message ? error.message : (typeof error === 'string' ? error : 'Atmospheric telemetry streams could not be synchronized. Please verify your connection.')}
        </p>

        <button
          onClick={onRetry}
          style={{
            background: 'linear-gradient(135deg, #ff5252 0%, #ff7b7b 100%)',
            border: 'none',
            color: 'white',
            padding: '15px 30px',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: '0.3s',
            boxShadow: '0 10px 20px rgba(255, 82, 82, 0.2)',
            width: '100%',
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          RETRY CONNECTION
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(255, 82, 82, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 82, 82, 0); }
        }
      `}</style>
    </div>
  );
}
