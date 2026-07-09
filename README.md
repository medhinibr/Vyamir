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

### Backend Proxy & APIs
* Flask WSGI application managing security-sensitive API handshakes.
* Multi-threaded asynchronous queries using ThreadPoolExecutor to aggregate coordinates, forecast charts, historical records, and weather news feeds.
* Adaptive caching engine supporting Redis with an automated, in-memory local cache fallback (15-minute expiration window) to avoid Open-Meteo and Pexels rate limits.
* OpenAPI Swagger UI: Interactive, dark-mode Swagger interface mapping all endpoints, accessible directly under the `/apidocs` endpoint.

### Database & Identity
* Firebase Authentication (Anonymous tokens resolved dynamically at runtime).
* Cloud Firestore database syncing gamified points economies (SkyPoints) and user nickname profiles.

## Technical Stack

* Backend: Python / Flask
* Frontend: React / ESNext JavaScript / CSS3 Variables
* Database: Firebase Auth / Cloud Firestore
* Deployment: Render Cloud Infrastructure

## Security & Secrets Architecture

* Secret Proxy Pattern: All third-party media credentials (e.g. Pexels API tokens) are strictly maintained on the server side. Requests are routed through secure backend proxy paths (/api/pexels/videos), ensuring secrets are never compiled into client-side JS bundles or exposed via browser network traces.
* Dynamic Config Initialization: Firebase credentials are dynamically requested from the backend API during mounting, rather than hardcoded in public source repositories.
* Safe Git Protocols: Environment configuration files (.env) and service keys are protected under Git ignore patterns.

## DevOps CI/CD Pipeline

The project implements a modern DevOps continuous integration and deployment pipeline via GitHub Actions to guarantee high code quality and zero-downtime deployment:

* Python Code Quality Gate: Code changes undergo syntax validation and quality check processes using Flake8 linting engine.
* Automated Unit Tests: Every push to main triggers automated test execution using PyTest, testing routing safety and responses.
* Automated Deployment: Upon passing the quality gate, pushes to the main branch automatically trigger Render's webhook deploy endpoint to pull and compile the latest build artifacts.

## Load Testing

The repository contains an out-of-the-box load testing setup using Locust to benchmark the Flask endpoints under simulated concurrent traffic.

To run load tests locally:
1. Initialize the locust environment:
   ```bash
   locust -f locustfile.py
   ```
2. Navigate to `http://localhost:8089` in your browser to configure client spawn rate and observe throughput and response latency.

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
