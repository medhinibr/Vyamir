import React, { useState } from 'react';

export default function PolicyModal({ isOpen, onClose, activeKey = 'privacy', onShowToast }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !message) {
      if (onShowToast) onShowToast('All contact fields are required.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/send_email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await response.json();
      if (response.ok && (data.status === 'success' || data.status === 'skipped')) {
        setName('');
        setEmail('');
        setMessage('');
        if (onShowToast) onShowToast('Your atmospheric query has been dispatched.', 'success');
      } else {
        if (onShowToast) onShowToast(`Dispatch failed: ${data.message || 'Server error'}`, 'error');
      }
    } catch (err) {
      if (onShowToast) onShowToast(`Network error: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPolicyContent = () => {
    switch (activeKey) {
      case 'privacy':
        return {
          title: "Privacy Policy",
          html: (
            <div>
              <p style={{ marginBottom: '25px' }}><strong>Effective Date: December 28, 2025</strong></p>
              <h3 style={{ color: 'var(--accent-color)', marginTop: '30px' }}>1. Data Collection & Usage</h3>
              <p>Vyamir Systems operates on a privacy-first, decentralized model.</p>
              <p><strong>Geolocation Data:</strong> We utilize OpenStreetMap and Nominatim to resolve your geographic queries (Latitude/Longitude). This data is used strictly for retrieving atmospheric telemetry and is not permanently stored.</p>
              <p><strong>SkyID Identity:</strong> We use Firebase Anonymous Authentication to generate your unique 'SkyID.' This creates a virtual profile for your settings and SkyPoints without requiring personal email addresses or passwords.</p>
              <h3 style={{ color: 'var(--accent-color)', marginTop: '30px' }}>2. Third-Party Services</h3>
              <p>To deliver our 'Zenith UI' experience, Vyamir integrates with trusted third-party providers:</p>
              <ul>
                <li><strong>Open-Meteo:</strong> For meteorological data streams.</li>
                <li><strong>Pexels API:</strong> For dynamic atmospheric video loops.</li>
                <li><strong>Google AdSense:</strong> For displaying relevant advertising.</li>
              </ul>
              <h3 style={{ color: 'var(--accent-color)', marginTop: '30px' }}>3. Google AdSense & DoubleClick Cookie</h3>
              <p>Google, as a third-party vendor, uses cookies to serve ads on Vyamir. Google's use of the DoubleClick cookie enables it and its partners to serve ads to our users based on their visit to our site and other sites on the Internet. You may opt out of the use of the DoubleClick cookie for interest-based advertising by visiting Google Ads Settings.</p>
              <h3 style={{ color: 'var(--accent-color)', marginTop: '30px' }}>4. Data Security</h3>
              <p>Your SkyPoints balance and preferences are stored in Cloud Firestore. We utilize ACID-compliant transaction protocols to ensure your data is secure.</p>
            </div>
          )
        };
      case 'cookies':
      case 'cookie-policy':
        return {
          title: "Cookie Policy",
          html: (
            <div>
              <h3 style={{ color: 'var(--accent-color)', marginTop: '30px' }}>1. How Vyamir Uses Cookies</h3>
              <p>Vyamir uses a combination of local storage and cookies to maintain the 'Cosmic Harmony' experience.</p>
              <p><strong>Essential Tokens (Firebase):</strong> We use browserLocalPersistence to keep you logged into your SkyID across sessions. Without this, your SkyPoints and preferences would reset every time you close the browser.</p>
              <p><strong>Performance Cache:</strong> To ensure our &lt;2s dashboard hydration time, we cache non-sensitive weather assets locally on your device.</p>
              <h3 style={{ color: 'var(--accent-color)', marginTop: '30px' }}>2. Advertising Cookies</h3>
              <p>We partner with Google AdSense (Publisher ID: pub-6959399778170612) to support our infrastructure. Google uses cookies to show ads relevant to your interests.</p>
              <h3 style={{ color: 'var(--accent-color)', marginTop: '30px' }}>3. Managing Your Preferences</h3>
              <p>You can manage your data consent at any time via the Privacy Preference Center located in the footer of the application. You may choose to disable Analytics or Advertising cookies, though Essential cookies are required for the SkyID system to function.</p>
            </div>
          )
        };
      case 'terms':
        return {
          title: "Terms & Conditions",
          html: (
            <div>
              <h3 style={{ color: 'var(--accent-color)', marginTop: '30px' }}>1. System Usage</h3>
              <p>By accessing Vyamir, you agree to use our 'Atmospheric Intelligence' platform for informational purposes only. While our data pipeline is optimized for high precision, Vyamir is not a tool for aeronautical navigation, emergency response, or life-critical decision-making.</p>
              <h3 style={{ color: 'var(--accent-color)', marginTop: '30px' }}>2. SkyPoints & The Vault Economy</h3>
              <p>Vyamir features a gamified reward system known as 'SkyPoints.'</p>
              <p><strong>Virtual Assets:</strong> SkyPoints are purely virtual tokens used for engagement tracking and social interaction within the Vyamir network. They have zero monetary value and cannot be exchanged for real-world currency.</p>
              <p><strong>Transfers:</strong> You are responsible for verifying the recipient's 'Nickname' in the Vault before executing a transfer. Vyamir Systems cannot reverse transactions made to incorrect nodes.</p>
              <p><strong>Fair Play:</strong> Any attempt to exploit the referral system or automate data fetching (scraping) will result in the suspension of your SkyID.</p>
              <h3 style={{ color: 'var(--accent-color)', marginTop: '30px' }}>3. Intellectual Property</h3>
              <p>The 'Interactive Constellation Canvas,' 'Zenith UI' design system, and the underlying Flask/ESNext architecture are the intellectual property of Vyamir Systems.</p>
            </div>
          )
        };
      case 'about':
        return {
          title: "About Vyamir",
          html: (
            <div>
              <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: 'white', marginBottom: '25px' }}>Vyamir is a next-generation weather visualization platform designed to bridge the gap between complex meteorological data and cinematic experience. Founded on the principle of 'High-Fidelity Atmospheric Intelligence,' we transform raw satellite vectors into a living, interactive digital sky.</p>
              <h3 style={{ color: 'var(--accent-color)', marginTop: '30px' }}>Our Mission</h3>
              <p>To provide a visceral connection to the environment. Vyamir moves beyond static numbers, utilizing a Single-Source-of-Truth (SSOT) architecture to deliver hyper-local weather insights with sub-0.2°C accuracy.</p>
              <h3 style={{ color: 'var(--accent-color)', marginTop: '30px' }}>The Vyamir Architecture</h3>
              <p>Vyamir is not a standard weather app; it is a high-performance progressive web application powered by:</p>
              <ul>
                <li><strong style={{ color: 'white' }}>Precision Data:</strong> Real-time hydration via the Open-Meteo cluster.</li>
                <li><strong style={{ color: 'white' }}>Visual Immersion:</strong> Condition-mapped HD media assets via the Pexels API.</li>
                <li><strong style={{ color: 'white' }}>Decentralized Identity:</strong> A privacy-first SkyID system secured by Firebase.</li>
              </ul>
            </div>
          )
        };
      case 'contact':
        return {
          title: "Contact Us",
          html: (
            <div>
              <div style={{ background: 'rgba(88, 166, 255, 0.05)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(88, 166, 255, 0.2)', marginBottom: '30px' }}>
                <h4 style={{ color: 'white', marginTop: 0 }}>Technical Dispatch Node</h4>
                <p>For bug reports, data anomalies, or SkyID synchronization issues, please transmit a signal to our core team.</p>
                <p><strong>Direct Channel:</strong> <a href="mailto:vyamir.app@gmail.com" style={{ color: 'var(--accent-color)', textDecoration: 'underline' }}>vyamir.app@gmail.com</a></p>
                <div style={{ marginTop: '15px' }}>
                  <p><strong>Support Protocol:</strong></p>
                  <ul style={{ listStyle: 'none', paddingLeft: 0, opacity: 0.8 }}>
                    <li>• Technical Issues: Response within 24-48 hours.</li>
                    <li>• AdSense/Business Inquiries: Prioritized routing.</li>
                  </ul>
                </div>
              </div>
              
              <form onSubmit={handleContactSubmit} style={{ background: 'rgba(255,255,255,0.03)', padding: '35px', borderRadius: '16px', border: '1px solid rgba(88,166,255,0.15)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                <h3 style={{ color: 'white', marginTop: 0, marginBottom: '25px', fontWeight: '500' }}>Transmit Atmospheric Query</h3>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: 'var(--accent-color)', marginBottom: '10px', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', color: 'white', outline: 'none', transition: '0.3s' }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: 'var(--accent-color)', marginBottom: '10px', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Email</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', color: 'white', outline: 'none', transition: '0.3s' }}
                  />
                </div>
                
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', color: 'var(--accent-color)', marginBottom: '10px', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Message</label>
                  <textarea
                    placeholder="Describe your inquiry..."
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', color: 'white', outline: 'none', transition: '0.3s', resize: 'vertical' }}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--accent-gradient)',
                    color: 'white',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: '0.3s',
                    boxShadow: '0 8px 24px rgba(88,166,255,0.25)',
                  }}
                >
                  {isSubmitting ? 'DISPATCHING SIGNAL...' : 'EXECUTE DISPATCH'}
                </button>
              </form>
            </div>
          )
        };
      default:
        return { title: 'Legal Notice', html: <p>Information not found.</p> };
    }
  };

  const currentPolicy = getPolicyContent();

  return (
    <div
      className="modal-overlay"
      style={{
        display: 'flex',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(5, 7, 12, 0.95)',
        zIndex: 100000,
        backdropFilter: 'blur(40px)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '15px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '900px',
          padding: '40px 20px',
          position: 'relative',
          maxHeight: '90%',
          border: '1px solid rgba(88, 166, 255, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(10, 15, 25, 0.9) !important',
          boxShadow: '0 50px 100px rgba(0,0,0,1)',
        }}
      >
        {/* Close Button */}
        <div
          onClick={onClose}
          style={{
            position: 'absolute',
            right: '35px',
            top: '35px',
            cursor: 'pointer',
            fontSize: '2.2rem',
            color: 'rgba(255,255,255,0.4)',
            transition: '0.3s',
            lineHeight: 1,
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = 'white'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
        >
          &times;
        </div>

        <div id="policy-content" style={{ overflowY: 'auto', paddingRight: '25px', textAlign: 'left' }}>
          <h2 id="policy-title" style={{ color: 'var(--accent-color)', marginBottom: '35px', fontWeight: 700, fontSize: '2.2rem', letterSpacing: '-1px' }}>
            {currentPolicy.title}
          </h2>
          <div
            id="policy-text"
            style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.8, fontSize: '1.1rem', fontWeight: 300 }}
          >
            {currentPolicy.html}
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: '40px',
            width: '100%',
            padding: '20px',
            borderRadius: '15px',
            background: 'var(--accent-gradient)',
            border: 'none',
            color: 'white',
            fontWeight: 600,
            fontSize: '1.1rem',
            cursor: 'pointer',
            transition: '0.3s',
            boxShadow: '0 10px 30px rgba(88, 166, 255, 0.2)',
          }}
        >
          CLOSE & CONTINUE
        </button>
      </div>
    </div>
  );
}
