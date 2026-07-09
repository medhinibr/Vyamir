import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-analytics.js";
import { getAuth, signInAnonymously, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: window.VYAMIR_CONFIG.FIREBASE_API_KEY,
    authDomain: "vyamir-0156.firebaseapp.com",
    projectId: "vyamir-0156",
    storageBucket: "vyamir-0156.firebasestorage.app",
    messagingSenderId: "587528291042",
    appId: "1:587528291042:web:7ef286fc28ae3863b1d4bb",
    measurementId: "G-ML1DF6JGM8"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

window.firebaseApp = app;
window.firebaseAuth = auth;
window.db = db;

// AUTH PERSISTENCE ENGINE: Ensure identities survive across sessions
(async () => {
    try {
        // Failsafe: If the app is still stuck after 4 seconds, force-remove the overlay.
        setTimeout(() => {
            const overlay = document.getElementById('session-restoration-overlay');
            if (overlay) {
                console.warn("Vyamir Engine: Force-clearing loading screen due to timeout.");
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 500);
            }
        }, 4000);

        await setPersistence(auth, browserLocalPersistence);

        onAuthStateChanged(auth, (user) => {
            const overlay = document.getElementById('session-restoration-overlay');
            if (user) {
                console.log("Vyamir Engine: Auth Stabilized for " + user.uid);
                if (window.checkUserPrivacyConsent) window.checkUserPrivacyConsent();

                // WAIT FOR DATA SYNC: Only remove overlay once points/nickname are loaded or consent is needed
                const syncWait = setInterval(() => {
                    if (window.vyamirSessionRestored || window.vyamirNeedsConsent) {
                        clearInterval(syncWait);
                        console.log("Vyamir Engine: Identity Ready. Revealing UI.");
                        setTimeout(() => {
                            if (overlay) overlay.style.opacity = '0';
                            setTimeout(() => overlay?.remove(), 500);
                        }, 300);
                    }
                }, 50);
            } else {
                console.log("Vyamir Engine: Initializing New anonymous Node...");
                signInAnonymously(auth).catch((err) => {
                    console.error("Auth Error:", err);
                    if (overlay) overlay.innerHTML = '<div style="color: #ff5858;">Connection Interrupted. Please refresh.</div>';
                });
            }
        });
    } catch (error) {
        console.error("Persistence Configuration Failed:", error);
    }
})();
