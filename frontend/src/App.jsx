import React, { useState, useEffect } from 'react';
import { initFirebase } from './firebase';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, query, collection, where, getDocs, runTransaction, updateDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import WelcomeScreen from './components/WelcomeScreen';
import SkeletonLoader from './components/SkeletonLoader';
import FallbackScreen from './components/FallbackScreen';
import PolicyModal from './components/PolicyModal';
import VaultModal from './components/VaultModal';
import CookieConsent from './components/CookieConsent';
import Dashboard from './components/Dashboard';
import AgriModule from './components/AgriModule';
import MonsoonModule from './components/MonsoonModule';

export default function App() {
  const [db, setDb] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [skyPoints, setSkyPoints] = useState(null);

  // Layout & Routing States
  const [activeSection, setActiveSection] = useState(() => {
    const path = window.location.pathname;
    if (path.includes('/monsoon')) return 'monsoon';
    if (path.includes('/agri')) return 'agri';
    return 'dashboard';
  }); // 'dashboard', 'agri', 'monsoon'
  const [weatherData, setWeatherData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationSource, setLocationSource] = useState('offline'); // 'gps', 'manual', 'offline'
  const [tempUnit, setTempUnit] = useState(() => localStorage.getItem('vyamir_unit_system')?.toUpperCase() || 'C');
  const [language, setLanguage] = useState('en');

  // Interactive states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Modals / Overlays
  const [cookieConsentOpen, setCookieConsentOpen] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [policyTab, setPolicyTab] = useState('privacy');
  const [vaultOpen, setVaultOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);
  const [isMuted, setIsMuted] = useState(true);

  // Show beautiful micro-toasts
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Initialize Firebase & Authentication
  useEffect(() => {
    let authListener = null;
    let docListener = null;

    const bootstrapFirebase = async () => {
      try {
        const { auth, db: firestoreDb } = await initFirebase();
        setDb(firestoreDb);

        // Sign in anonymously
        await signInAnonymously(auth);

        authListener = onAuthStateChanged(auth, async (user) => {
          if (user) {
            setCurrentUser(user);
            const userRef = doc(firestoreDb, "users", user.uid);

            // Establish real-time Firestore synchronization
            docListener = onSnapshot(userRef, async (snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.data();
                setCurrentUserData(data);
                setSkyPoints(data.points || 0);

                // Check for pending referral link in URL params
                const params = new URLSearchParams(window.location.search);
                const referrer = params.get('ref');
                if (referrer && !data.referralClaimed && data.nickname !== referrer) {
                  try {
                    const q = query(collection(firestoreDb, "users"), where("nickname_lowercase", "==", referrer.toLowerCase()));
                    const refSnap = await getDocs(q);
                    if (!refSnap.empty) {
                      const referrerRef = doc(firestoreDb, "users", refSnap.docs[0].id);
                      await runTransaction(firestoreDb, async (transaction) => {
                        const refDoc = await transaction.get(referrerRef);
                        const currentRefPoints = refDoc.data().points || 0;
                        transaction.update(referrerRef, { points: currentRefPoints + 10 });
                        transaction.update(userRef, { referralClaimed: true });
                      });
                      showToast(`Referred by ${referrer}. +10 points sent to invitee.`, "success");
                    }
                  } catch (refErr) {
                    console.warn("Referral transaction deferred:", refErr);
                  }
                }
              } else {
                // Initialize user profile
                const randomId = Math.floor(1000 + Math.random() * 9000);
                const todayStr = new Date().toISOString().split('T')[0];
                const nickname = `User_${randomId}`;

                await setDoc(userRef, {
                  nickname: nickname,
                  nickname_lowercase: nickname.toLowerCase(),
                  points: 5,
                  createdAt: serverTimestamp(),
                  lastDailySearch: todayStr,
                  referralClaimed: false
                });
                showToast("Welcome! 5 SkyPoints credited to your vault.", "success");
              }
            });
          }
        });
      } catch (err) {
        console.error("Firebase auth initialization failed:", err);
      }
    };

    bootstrapFirebase();

    return () => {
      if (authListener) authListener();
      if (docListener) docListener();
    };
  }, []);

  // 2. Cookie consent verification
  useEffect(() => {
    const consent = localStorage.getItem('vyamir_cookie_consent');
    if (!consent) {
      setTimeout(() => setCookieConsentOpen(true), 1500);
    }
  }, []);

  // 3. Dynamic background layout updates based on weather condition codes
  useEffect(() => {
    if (!weatherData) {
      document.body.style.backgroundImage = 'none';
      document.body.style.backgroundColor = '#070b13';
      document.body.classList.remove('glass-mode');
      return;
    }

    const current = weatherData.current || {};
    const code = current.weathercode !== undefined ? current.weathercode : (current.weather_code || 0);
    const isDay = current.is_day !== undefined ? current.is_day : 1;

    let url = '';
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
  }, [weatherData]);

  // 4. Restore last session on start
  useEffect(() => {
    const lastSession = localStorage.getItem('vyamir_last_session');
    if (lastSession) {
      try {
        const session = JSON.parse(lastSession);
        handleSearchSelection(session.city, session.lat, session.lon, true);
      } catch (e) {
        console.warn("Could not restore session:", e);
      }
    }
  }, []);

  // Fetch full normalized meteorological block
  const handleSearchSelection = async (cityName, lat, lon, isInitial = false) => {
    setLoading(true);
    setError(null);
    try {
      const displayCity = cityName.replace(/g$/, '');
      localStorage.setItem('vyamir_last_session', JSON.stringify({ city: displayCity, lat, lon }));
      if (!isInitial) setLocationSource('manual');

      // Fetch telemetry directly from the cached backend proxy
      const res = await fetch(`/api/get_weather?lat=${lat}&lon=${lon}&city=${encodeURIComponent(displayCity)}`);
      if (!res.ok) {
        throw new Error("Weather gods are taking a break, try again in a few minutes.");
      }
      const data = await res.json();
      
      // Validate structure and map lat/lon
      if (!data || data.error) {
        throw new Error(data?.error || "Weather gods are taking a break, try again in a few minutes.");
      }

      const normalizedData = {
        ...data,
        lat,
        lon
      };

      setWeatherData(normalizedData);

      // Trigger daily search checking reward
      if (currentUser && db) {
        const userRef = doc(db, "users", currentUser.uid);
        const todayStr = new Date().toISOString().split('T')[0];
        if (currentUserData && currentUserData.lastDailySearch !== todayStr) {
          await updateDoc(userRef, {
            points: (currentUserData.points || 0) + 2,
            lastDailySearch: todayStr
          });
          showToast("Daily search logged! +2 SkyPoints added.", "success");
        }
      }
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Run city geocoding search
  const handleSearchExecute = async (queryTerm = searchQuery) => {
    let queryVal = queryTerm.trim();
    if (!queryVal) return;

    setLoading(true);
    setError(null);

    // Apply geographic bias for ambiguous local towns
    if (queryVal.toLowerCase().endsWith('g') && queryVal.length > 5 && queryVal.toLowerCase().includes('ujire')) {
      queryVal = queryVal.substring(0, queryVal.length - 1);
    }
    const localTowns = ['koppa', 'sringeri', 'ujire', 'belthangady', 'mudigere'];
    if (localTowns.some(town => queryVal.toLowerCase().includes(town)) && !queryVal.toLowerCase().includes('india')) {
      queryVal += ", Karnataka India";
    }

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(queryVal)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        await handleSearchSelection(data[0].name, data[0].latitude, data[0].longitude);
      } else {
        showToast("City not found.", "error");
      }
    } catch (err) {
      showToast("Geocoding service disconnected.", "error");
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Geolocation trigger
  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      showToast("Syncing with GPS coordinates...", "info");
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setLocationSource('gps');
          await handleSearchSelection("Your Location", lat, lon);
        },
        (err) => {
          showToast("Location denied. Defaulting to major hub.", "error");
          setLocationSource('offline');
          handleSearchSelection("London", 51.5074, -0.1278);
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      showToast("GPS tracking not supported by browser.", "error");
    }
  };

  const handleCookieAccept = () => {
    localStorage.setItem('vyamir_cookie_consent', 'true');
    setCookieConsentOpen(false);

    // Sync preferences to user profile in Firebase Firestore
    if (currentUser && db) {
      const userRef = doc(db, "users", currentUser.uid);
      setDoc(userRef, {
        privacyConsent: {
          essential: true,
          analytics: true,
          advertising: true,
          updatedAt: serverTimestamp()
        }
      }, { merge: true }).catch((err) => console.warn(err));
    }
    showToast("Cookie authorization confirmed.", "success");
  };

  const openPolicyModal = (tabKey) => {
    setPolicyTab(tabKey);
    setPolicyModalOpen(true);
  };

  // Scroll logic for sections inside the Dashboard view
  const handleSectionChange = (sectionId) => {
    if (sectionId === 'maps' || sectionId === 'news') {
      window.location.href = `/${sectionId}`;
      return;
    }
    setActiveSection(sectionId);
    if (sectionId === 'agri' || sectionId === 'monsoon') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Scroll to dashboard sections
    setTimeout(() => {
      let el = null;
      if (sectionId === 'dashboard') el = document.getElementById('section-current');
      else if (sectionId === 'hourly') el = document.getElementById('section-hourly');
      else if (sectionId === '7day') el = document.getElementById('section-7day');
      else if (sectionId === 'maps') el = document.getElementById('section-maps');
      else if (sectionId === 'details') el = document.getElementById('section-details');
      else if (sectionId === 'news') el = document.getElementById('section-news');

      if (el) {
        const offset = window.innerWidth <= 768 ? 10 : 0;
        const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }, 100);
  };

  // Render components dynamically
  const renderContent = () => {
    if (loading) return <SkeletonLoader />;
    if (error) return <FallbackScreen error={error} onRetry={() => setError(null)} />;

    if (!weatherData) {
      return (
        <WelcomeScreen
          onSearch={handleSearchExecute}
          onQuickSearch={(city, lat, lon) => handleSearchSelection(city, lat, lon)}
        />
      );
    }

    if (activeSection === 'agri') {
      return <AgriModule weatherData={weatherData} tempUnit={tempUnit} />;
    }

    if (activeSection === 'monsoon') {
      return <MonsoonModule weatherData={weatherData} />;
    }

    // Default dashboard layout containing all main weather sub-widgets
    return (
      <Dashboard
        weatherData={weatherData}
        tempUnit={tempUnit}
        locationSource={locationSource}
        onOpenVideo={(url, title) => setActiveVideo({ url, title })}
        onShowToast={showToast}
      />
    );
  };

  const isLanding = !weatherData && !loading && !error;

  return (
    <>
      <div className={`app-container ${isLanding ? 'is-landing' : 'is-dashboard'}`}>
        {!isLanding && (
          <>
            <Header
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSearch={() => handleSearchExecute()}
              onDetectLocation={handleDetectLocation}
              tempUnit={tempUnit}
              onToggleUnits={() => setTempUnit(prev => {
                const next = prev === 'C' ? 'F' : 'C';
                localStorage.setItem('vyamir_unit_system', next === 'C' ? 'metric' : 'imperial');
                return next;
              })}
              skyPoints={skyPoints}
              onOpenVault={() => setVaultOpen(true)}
              language={language}
              onChangeLanguage={setLanguage}
              logoClickAction={() => {
                setWeatherData(null);
                setActiveSection('dashboard');
              }}
            />
            <Sidebar
              activeSection={activeSection}
              handleSectionChange={handleSectionChange}
              onOpenVault={() => setVaultOpen(true)}
            />
          </>
        )}

        <div className="main-content-wrapper container">
          {renderContent()}

          {/* Core Footer */}
          <footer className="footer-panel" style={{ marginTop: '40px', padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
            <div>© {new Date().getFullYear()} Vyamir Systems. High-Fidelity Atmospheric Intelligence.</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '10px', flexWrap: 'wrap' }}>
              <span onClick={() => openPolicyModal('privacy')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Privacy Policy</span>
              <span onClick={() => openPolicyModal('cookies')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Cookie Policy</span>
              <span onClick={() => openPolicyModal('terms')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Terms & Conditions</span>
              <span onClick={() => openPolicyModal('about')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>About Us</span>
              <span onClick={() => openPolicyModal('contact')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Contact</span>
              <a href="https://forms.gle/vyamirFeedback" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' }}>Report a Bug</a>
              <a href="https://forms.gle/vyamirFeedback" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' }}>Suggest a Feature</a>
            </div>
          </footer>
        </div>
      </div>

      {/* Cookie Consent overlay */}
      {cookieConsentOpen && (
        <CookieConsent
          onAccept={handleCookieAccept}
          onCustomize={() => {
            setCookieConsentOpen(false);
            openPolicyModal('cookies');
          }}
        />
      )}

      {/* Policy modals */}
      <PolicyModal
        isOpen={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        activeKey={policyTab}
        onShowToast={showToast}
      />

      {/* Vault point transfer modal */}
      {db && currentUser && (
        <VaultModal
          isOpen={vaultOpen}
          onClose={() => setVaultOpen(false)}
          db={db}
          currentUser={currentUser}
          currentUserData={currentUserData}
          onShowToast={showToast}
        />
      )}

      {/* HD Video player Modal */}
      {activeVideo && (
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
            zIndex: 1000000,
            justifyContent: 'center',
            alignItems: 'center',
            backdropFilter: 'blur(30px)',
            padding: '20px'
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '850px',
              padding: '30px 20px',
              position: 'relative',
              background: 'rgba(10, 15, 25, 0.9) !important',
              boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
              borderRadius: '24px',
              border: '1px solid rgba(88, 166, 255, 0.3)',
              textAlign: 'left'
            }}
          >
            <div
              onClick={() => setActiveVideo(null)}
              style={{
                position: 'absolute',
                right: '25px',
                top: '25px',
                cursor: 'pointer',
                fontSize: '1.8rem',
                color: 'rgba(255,255,255,0.4)',
                transition: '0.3s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = 'white'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
            >
              &times;
            </div>
            <h3 style={{ margin: '0 0 20px 0', fontWeight: '600', color: '#fff', fontSize: '1.3rem' }}>
              {activeVideo.title}
            </h3>
            <div style={{ position: 'relative', width: '100%', borderRadius: '14px', overflow: 'hidden', aspectRatio: '16/9', background: '#000', border: '1px solid rgba(255,255,255,0.05)' }}>
              <video
                src={activeVideo.url}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
              <button
                onClick={() => setIsMuted(prev => !prev)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '12px 24px',
                  color: '#fff',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: '0.3s'
                }}
              >
                <i className={isMuted ? 'bi bi-volume-mute-fill' : 'bi bi-volume-up-fill'}></i>
                {isMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO'}
              </button>
              <button
                onClick={() => setActiveVideo(null)}
                style={{
                  background: 'var(--accent-gradient)',
                  border: 'none',
                  padding: '12px 30px',
                  color: '#fff',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  boxShadow: '0 8px 20px rgba(88, 166, 255, 0.2)',
                  transition: '0.3s'
                }}
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast message notifications */}
      {toast && (
        <div
          className={`toast-message toast-${toast.type}`}
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            zIndex: 9999999,
            background: 'rgba(10, 15, 25, 0.95)',
            padding: '16px 28px',
            borderRadius: '14px',
            border: toast.type === 'success' ? '1px solid rgba(105, 240, 174, 0.4)' : toast.type === 'error' ? '1px solid rgba(255, 82, 82, 0.4)' : '1px solid rgba(88, 166, 255, 0.4)',
            color: 'white',
            backdropFilter: 'blur(25px)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.95rem',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <i
            className={toast.type === 'success' ? 'bi bi-check-circle-fill' : toast.type === 'error' ? 'bi bi-exclamation-triangle-fill' : 'bi bi-info-circle-fill'}
            style={{ color: toast.type === 'success' ? '#69f0ae' : toast.type === 'error' ? '#ff5252' : '#58a6ff', fontSize: '1.2rem' }}
          ></i>
          <span>{toast.message}</span>
        </div>
      )}
    </>
  );
}
