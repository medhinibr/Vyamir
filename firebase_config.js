// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: " api_key",
    authDomain: "vyamir-156.firebaseapp.com",
    projectId: "vyamir-156",
    storageBucket: "vyamir-156.firebasestorage.app",
    messagingSenderId: "949036291784",
    appId: "1:949036291784:web:e8e71d5ab5df557d97b7fd",
    measurementId: "G-4F5C0N26V0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);