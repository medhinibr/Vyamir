import React from 'react';

export default function SkeletonLoader() {
  return (
    <div className="skeleton-grid-container" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', width: '100%', minHeight: '80vh', fontFamily: "'Inter', sans-serif" }}>
      {/* Left Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Hero Card Skeleton */}
        <div className="glass-panel skeleton-shimmer" style={{ height: '300px', borderRadius: '30px', padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div className="skeleton-line" style={{ width: '120px', height: '24px', marginBottom: '10px' }}></div>
              <div className="skeleton-line" style={{ width: '80px', height: '16px' }}></div>
            </div>
            <div className="skeleton-line" style={{ width: '60px', height: '60px', borderRadius: '50%' }}></div>
          </div>
          <div>
            <div className="skeleton-line" style={{ width: '150px', height: '64px', marginBottom: '10px' }}></div>
            <div className="skeleton-line" style={{ width: '200px', height: '20px' }}></div>
          </div>
        </div>

        {/* Chart Card Skeleton */}
        <div className="glass-panel skeleton-shimmer" style={{ height: '320px', borderRadius: '30px', padding: '25px' }}>
          <div className="skeleton-line" style={{ width: '180px', height: '22px', marginBottom: '20px' }}></div>
          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '15px', padding: '10px 0' }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="skeleton-line" style={{ flex: 1, height: `${Math.random() * 60 + 20}%`, borderRadius: '6px' }}></div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Details List Skeleton */}
        <div className="glass-panel skeleton-shimmer" style={{ height: '640px', borderRadius: '30px', padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="skeleton-line" style={{ width: '140px', height: '22px', marginBottom: '10px' }}></div>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="skeleton-line" style={{ width: '40px', height: '40px', borderRadius: '12px' }}></div>
              <div style={{ flex: 1 }}>
                <div className="skeleton-line" style={{ width: '40%', height: '16px', marginBottom: '8px' }}></div>
                <div className="skeleton-line" style={{ width: '20%', height: '12px' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .skeleton-shimmer {
          position: relative;
          overflow: hidden;
        }
        .skeleton-shimmer::after {
          content: '';
          position: absolute;
          top: 0; right: 0; bottom: 0; left: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.05) 20%,
            rgba(255, 255, 255, 0.1) 60%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: shimmer 1.5s infinite;
        }
        .skeleton-line {
          background: rgba(255, 255, 255, 0.07);
          border-radius: 4px;
        }
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
