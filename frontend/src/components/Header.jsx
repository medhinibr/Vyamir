import React from 'react';

export default function Header({
  searchQuery,
  setSearchQuery,
  onSearch,
  onDetectLocation,
  tempUnit,
  onToggleUnits,
  skyPoints,
  onOpenVault,
  language,
  onChangeLanguage,
  logoClickAction
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="header-bar">
      <div className="logo-area" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={logoClickAction}>
        <img src="/logo.png" alt="Vyamir" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
        <div style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.5px', color: '#fff' }}>Vyamir</div>
      </div>

      <div className="search-section" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div className="header-search-container">
          <i
            className="bi bi-geo"
            style={{ cursor: 'pointer', color: 'var(--accent-color)', marginRight: '8px' }}
            onClick={onDetectLocation}
            title="Detect My Location"
          ></i>
          <input
            type="text"
            className="search-input"
            placeholder="Search city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="search-btn" onClick={onSearch}>Search</button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {/* Language Select */}
        <select
          value={language}
          onChange={(e) => onChangeLanguage(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '8px',
            outline: 'none',
            cursor: 'pointer',
            WebkitAppearance: 'none',
            appearance: 'none',
            textAlign: 'center',
          }}
        >
          <option value="en" style={{ background: '#0b0e14' }}>Global (EN)</option>
          <option value="hi" style={{ background: '#0b0e14' }}>Hindi (HI)</option>
          <option value="mr" style={{ background: '#0b0e14' }}>Marathi (MR)</option>
          <option value="es" style={{ background: '#0b0e14' }}>Spanish (ES)</option>
          <option value="fr" style={{ background: '#0b0e14' }}>French (FR)</option>
          <option value="de" style={{ background: '#0b0e14' }}>German (DE)</option>
          <option value="cn" style={{ background: '#0b0e14' }}>Chinese (CN)</option>
          <option value="jp" style={{ background: '#0b0e14' }}>Japanese (JP)</option>
          <option value="ru" style={{ background: '#0b0e14' }}>Russian (RU)</option>
          <option value="pt" style={{ background: '#0b0e14' }}>Portuguese (PT)</option>
          <option value="ar" style={{ background: '#0b0e14' }}>Arabic (AR)</option>
        </select>

        {/* Unit Toggle */}
        <div
          className="unit-toggle"
          onClick={onToggleUnits}
          style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '5px 10px',
            borderRadius: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ color: tempUnit === 'C' ? 'white' : 'rgba(255,255,255,0.5)', fontWeight: tempUnit === 'C' ? '700' : '400' }}>°C</div>
          <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.3)' }}></div>
          <div style={{ color: tempUnit === 'F' ? 'white' : 'rgba(255,255,255,0.5)', fontWeight: tempUnit === 'F' ? '700' : '400' }}>°F</div>
        </div>

        {skyPoints !== null && skyPoints > 0 && (
          <div className="skypoints-badge" onClick={onOpenVault} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <i className="bi bi-coin" style={{ color: '#ffd700' }}></i>
            <span>{skyPoints}</span>
          </div>
        )}
      </div>
    </div>
  );
}
