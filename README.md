# Vyamir - High-Fidelity Atmospheric Intelligence Platform

Vyamir is a professional-grade weather intelligence platform designed for high situational awareness. The application bridges the gap between raw meteorological telemetry and a premium user experience, translating complex environmental vectors into a seamless, glassmorphic dashboard.

Live Application: https://vyamir.onrender.com/
Repository URL: https://github.com/medhinibr/Vyamir

## Core Architecture

Vyamir has been migrated from a legacy server-rendered structure to a decoupled Single Page Application (SPA) architecture supported by a secure Flask utility proxy.

### Frontend
* React 19 SPA compiled with Vite.
* State-driven Zenith Glass HUD styling with fluid transitions.
* Progressive page loads using responsive Skeleton Shimmer screens.
* Interactive geographical canvas utilizing Leaflet and the RainViewer API for real-time regional Doppler radar overlays.

### Backend Proxy
* Flask WSGI application managing security-sensitive API handshakes.
* Multi-threaded asynchronous queries using ThreadPoolExecutor to aggregate coordinates, forecast charts, historical records, and weather news feeds.
* Adaptive caching engine supporting Redis with an automated, in-memory local cache fallback (15-minute expiration window) to avoid Open-Meteo and Pexels rate limits.

### Database & Identity
* Firebase Authentication (Anonymous tokens resolved dynamically at runtime).
* Cloud Firestore database syncing gamified points economies (SkyPoints) and user nickname profiles.

## Technical Stack

* Backend: Python / Flask
* Frontend: React / ESNext JavaScript / CSS3 Variables
* Database: Firebase Auth / Cloud Firestore
* Deployment: Render Cloud Infrastructure

## Security Architecture

* Secret Protection: All third-party media credentials (e.g. Pexels API tokens) are strictly maintained on the server side. Requests are requested through secure backend proxy paths (/api/pexels/videos), ensuring secrets are never compiled into client-side JS bundles.
* Runtime Initialization: Firebase credentials are dynamically requested from the backend API during mounting, rather than hardcoded in source repositories.

## Quick Setup

### Prerequisites
* Python 3.10+
* Node.js 18+

### Setup Environment
Create a `.env` file in the root folder with the following variables:
```env
FIREBASE_API_KEY=your_firebase_api_key
PEXELS_API_KEY=your_pexels_api_key
GMAIL_APP_PASSWORD=your_gmail_app_password
```

### Installation
1. Install backend dependencies and initialize the server:
   ```bash
   pip install -r requirements.txt
   python app.py
   ```
2. In a separate shell, build the frontend SPA:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

Vyamir Systems. Atmospheric Intelligence, Redefined.
