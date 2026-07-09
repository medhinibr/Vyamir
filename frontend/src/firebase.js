import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

let app = null;
let auth = null;
let db = null;

export async function initFirebase() {
  if (app) return { app, auth, db };
  
  try {
    const response = await fetch('/api/config');
    const config = await response.json();
    
    if (!config.FIREBASE_API_KEY) {
      throw new Error("FIREBASE_API_KEY is not defined in backend configuration.");
    }

    const firebaseConfig = {
      apiKey: config.FIREBASE_API_KEY,
      authDomain: "vyamir-0156.firebaseapp.com",
      projectId: "vyamir-0156",
      storageBucket: "vyamir-0156.firebasestorage.app",
      messagingSenderId: "587528291042",
      appId: "1:587528291042:web:7ef286fc28ae3863b1d4bb",
      measurementId: "G-ML1DF6JGM8"
    };

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Set local persistence
    await setPersistence(auth, browserLocalPersistence);
    
    return { app, auth, db };
  } catch (error) {
    console.error("Vyamir Engine: Firebase Initialization Failed:", error);
    throw error;
  }
}
