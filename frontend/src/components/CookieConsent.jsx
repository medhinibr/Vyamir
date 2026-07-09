import React from 'react';

export default function CookieConsent({ onAccept, onCustomize }) {
  return (
    <div className="privacy-promise-card active" id="cookie-popup">
      <div className="privacy-card-header">
        <div className="privacy-card-icon">
          <i className="bi bi-shield-lock"></i>
        </div>
        <div className="privacy-card-title">Privacy Promise</div>
      </div>
      <div className="privacy-card-body">
        Vyamir uses cookies to improve your weather intelligence experience and provide relevant advertisements. By continuing, you agree to our use of cookies.
      </div>
      <div className="privacy-card-footer">
        <button className="privacy-accept-all" onClick={onAccept}>Accept</button>
        <button
          onClick={onCustomize}
          className="privacy-customize-link"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Cookie Settings
        </button>
      </div>
    </div>
  );
}
