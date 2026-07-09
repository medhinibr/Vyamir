import React from 'react';

export default function Sidebar({ activeSection, handleSectionChange, onOpenVault }) {
  const items = [
    { id: 'dashboard', label: 'Current', icon: 'bi-sun' },
    { id: 'hourly', label: 'Hourly', icon: 'bi-clock' },
    { id: '7day', label: '7-day', icon: 'bi-calendar3' },
    { id: 'maps', label: 'Maps', icon: 'bi-map' },
    { id: 'details', label: 'Details', icon: 'bi-grid-1x2' },
    { id: 'news', label: 'News', icon: 'bi-newspaper' },
    { id: 'monsoon', label: 'Monsoon', icon: 'bi-cloud-rain-heavy' },
    { id: 'agri', label: 'Agri', icon: 'bi-flower1' },
  ];

  return (
    <div className="sidebar glass-panel">
      {items.map((item) => (
        <div
          key={item.id}
          className={`sidebar-item ${activeSection === item.id ? 'active' : ''}`}
          onClick={() => handleSectionChange(item.id)}
        >
          <i className={`bi ${item.icon}`}></i>
          <span>{item.label}</span>
        </div>
      ))}
      <div className="sidebar-item" onClick={onOpenVault}>
        <i className="bi bi-shield-lock"></i>
        <span>Vault</span>
      </div>
    </div>
  );
}
