// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: window.VYAMIR_CONFIG ? window.VYAMIR_CONFIG.FIREBASE_API_KEY : "",
    authDomain: "vyamir-0156.firebaseapp.com",
    projectId: "vyamir-0156",
    storageBucket: "vyamir-0156.firebasestorage.app",
    messagingSenderId: "587528291042",
    appId: "1:587528291042:web:7ef286fc28ae3863b1d4bb",
    measurementId: "G-ML1DF6JGM8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);