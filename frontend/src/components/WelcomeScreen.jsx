import React, { useEffect, useRef, useState } from 'react';

export default function WelcomeScreen({ onSearch, onQuickSearch }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [query, setQuery] = useState('');

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch(query);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let particles = [];
    const particleCount = 100;
    const connectionDistance = 120;
    const mouseDistance = 200;
    let animationFrameId = null;

    let mouse = { x: null, y: null };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseOut = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseOut);

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

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        if (mouse.x != null) {
          let dx = mouse.x - this.x;
          let dy = mouse.y - this.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < mouseDistance) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (mouseDistance - distance) / mouseDistance;
            const directionX = forceDirectionX * force * 0.6;
            const directionY = forceDirectionY * force * 0.6;
            this.vx += directionX;
            this.vy += directionY;
          }
        }

        this.vx *= 0.98;
        this.vy *= 0.98;

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

    const init = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        for (let j = i; j < particles.length; j++) {
          let dx = particles[i].x - particles[j].x;
          let dy = particles[i].y - particles[j].y;
          let distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            ctx.beginPath();
            let opacity = 1 - distance / connectionDistance;
            ctx.strokeStyle = 'rgba(88, 166, 255,' + opacity * 0.4 + ')';
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }

        if (mouse.x != null) {
          let dx = particles[i].x - mouse.x;
          let dy = particles[i].y - mouse.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < mouseDistance) {
            ctx.beginPath();
            let opacity = 1 - distance / mouseDistance;
            ctx.strokeStyle = 'rgba(255, 215, 0,' + opacity * 0.5 + ')';
            ctx.lineWidth = 1.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  const handleScroll = (e) => {
    const el = e.target;
    const nav = document.getElementById('sticky-brand-nav');
    if (nav) {
      if (el.scrollTop > 50) {
        el.classList.add('scrolled');
        nav.classList.add('visible');
      } else {
        el.classList.remove('scrolled');
        nav.classList.remove('visible');
      }
    }
  };

  return (
    <div className="welcome-container" onScroll={handleScroll} ref={containerRef}>
      <canvas id="sky-canvas" ref={canvasRef}></canvas>

      {/* STICKY TOP NAVBAR */}
      <nav id="sticky-brand-nav" className="sticky-nav">
        <div className="nav-brand-group">
          <img src="/logo.png" alt="Vyamir" className="nav-logo-small" />
          <span className="nav-brand-name">Vyamir</span>
        </div>
        <div className="nav-actions">
          <button onClick={() => containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })} className="nav-cta-btn">GET STARTED</button>
        </div>
      </nav>

      {/* SECTION 1: HERO SPLASH */}
      <section className="landing-section section-hero">
        <div className="welcome-card glass-panel">
          <div className="hero-branding">
            <div className="hero-logo-container">
              <img src="/logo.png" className="hero-logo" alt="V" />
            </div>
            <h1 className="hero-brand-name">Vyamir</h1>
          </div>

          <h2 className="welcome-title">Atmospheric Weather, Redefined.</h2>
          <p className="welcome-subtitle">Advanced hyper-local forecast exploration with real-time data and immersive visualizations.</p>

          <div className="welcome-search-box">
            <input
              type="text"
              placeholder="Search city (e.g. London, Ujire)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <div id="welcome-search-btn" onClick={() => onSearch(query)}>
              <i className="bi bi-arrow-right" style={{ fontSize: '1.4rem' }}></i>
            </div>
          </div>
          <div className="welcome-tip">Tip: Move your cursor to connect constellations!</div>
        </div>
      </section>

      {/* SECTION 2: ATMOSPHERIC INSIGHTS */}
      <section className="landing-section section-intelligence">
        <div className="intelligence-header">
          <h2>Atmospheric Intelligence</h2>
          <p>Vyamir introduces a paradigm shift in environmental data visualization and decentralized tracking.</p>
        </div>

        <div className="intelligence-3col-grid">
          <div className="intelligence-card glass-panel">
            <div className="card-icon"><i className="bi bi-cpu"></i></div>
            <h3>Precision Dynamics</h3>
            <p>Hyper-local temperature readings accurate to 0.2°C, leveraging high-performance Open-Meteo backend clusters.</p>
          </div>

          <div className="intelligence-card glass-panel">
            <div className="card-icon"><i className="bi bi-hdd-network"></i></div>
            <h3>Global Sync</h3>
            <p>Real-time processing of millions of meteorological vectors across global satellite constellations for high-fidelity reporting.</p>
          </div>

          <div className="intelligence-card glass-panel">
            <div className="card-icon"><i className="bi bi-database-lock"></i></div>
            <h3>SkyID Vault</h3>
            <p>Securely synchronize points, preferences, and environmental connections via anonymous decentralized node logic.</p>
          </div>
        </div>

        <div className="operational-band">
          <div className="operational-status">
            <span className="status-pulse"></span>
            100% Operational | Serving 200,000+ Global Regions
          </div>
        </div>
      </section>

      {/* SECTION 3: FAQ */}
      <section className="landing-section section-faq">
        <div className="faq-container">
          <div className="faq-header">
            <h2>Atmospheric FAQ</h2>
            <div className="header-line"></div>
          </div>

          <div className="faq-grid">
            <div className="faq-item glass-panel">
              <div className="faq-question">
                <i className="bi bi-question-circle"></i>
                <h4>How accurate is Vyamir's data?</h4>
              </div>
              <p>We utilize the Open-Meteo API clusters, aggregating data from leading models like ECMWF and GFS. This ensures precision metrics with a sub-0.2°C margin of error for atmospheric telemetry.</p>
            </div>

            <div className="faq-item glass-panel">
              <div className="faq-question">
                <i className="bi bi-currency-exchange"></i>
                <h4>What are SkyPoints utilized for?</h4>
              </div>
              <p>SkyPoints represent your ecosystem engagement. They are digital assets earned through daily synchronization and can be transferred across the decentralized SkyID network.</p>
            </div>

            <div className="faq-item glass-panel">
              <div className="faq-question">
                <i className="bi bi-shield-check"></i>
                <h4>Is my geolocation data secure?</h4>
              </div>
              <p>Vyamir operates on a local-first privacy model. Precise coordinates are only utilized with explicit authorization and are never persisted beyond active session resolution.</p>
            </div>

            <div className="faq-item glass-panel">
              <div className="faq-question">
                <i className="bi bi-megaphone"></i>
                <h4>Is the platform free of charge?</h4>
              </div>
              <p>Absolutely. Vyamir is an open-access intelligence platform. We sustain operations through high-quality, non-intrusive integrations with the Google AdSense network.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
