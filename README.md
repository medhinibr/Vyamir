# Vyamir - High-Fidelity Atmospheric Intelligence Platform

[![Deploy Vyamir to Render](https://github.com/medhinibr/Vyamir/actions/workflows/deploy.yml/badge.svg)](https://github.com/medhinibr/Vyamir/actions/workflows/deploy.yml)
[![Python Version](https://img.shields.io/badge/python-3.10-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Vyamir is a production-grade weather intelligence platform designed for high situational awareness. The application bridges the gap between raw meteorological telemetry and a premium user experience, translating complex environmental vectors into a seamless, glassmorphic dashboard.

Live Application: https://vyamir.onrender.com/
Repository URL: https://github.com/medhinibr/Vyamir

## Core Architecture

Vyamir employs a hybrid client architecture, integrating a decoupled React 19 Single Page Application (SPA) with highly interactive legacy templates for specialized mapping and media features.

### Frontend Technologies
* React 19 SPA compiled with Vite for core telemetry and dashboard views.
* Custom CSS3 Zenith Glass HUD styling with glassmorphic layers and fluid transitions.
* Interactive geospatial weather canvases utilizing Leaflet and the RainViewer API for real-time Doppler radar and satellite infrared overlays.

### Backend Proxy Engine
* Flask WSGI application managing security-sensitive API handshakes and data caching.
* Multi-threaded asynchronous queries using ThreadPoolExecutor to aggregate coordinate mappings, forecast arrays, historical records, and weather news feeds.
* Caching Architecture: Multi-tier caching layer supporting Redis with an automated, in-memory local cache fallback (15-minute TTL) to prevent Open-Meteo and Pexels rate limits.

### Database & Identity
* Firebase Authentication: Anonymous tokens resolved dynamically at runtime on the client.
* Cloud Firestore: Real-time synchronization of gamified points economies (SkyPoints) and user profile nickname vectors.

## DevOps & Cloud Architecture

This repository is optimized to showcase professional-grade cloud engineering and continuous delivery patterns:

### 1. Continuous Integration & Quality Gate (CI)
Automated validation is orchestrated via GitHub Actions:
* Linting: flake8 engine parses code changes to block execution on syntax errors, undefined names, and standard code styling issues.
* Automated Unit Testing: A pytest test suite executes on every commit to test routing viability, configuration endpoints, and legacy templates, blocking deployment if errors are detected.

### 2. Continuous Deployment (CD)
* Webhook Triggering: GitHub Actions automatically triggers a Render build deploy hook upon successful CI status checks.
* Zero-Downtime Releases: The container deployment pipeline compiles and serves code updates automatically without service interruption.

### 3. Container Optimization (Multi-Stage Docker)
To optimize performance, security, and hosting costs, the Docker configuration uses a two-stage build:
* Stage 1 (Builder): Pulls python:3.10-slim, installs build utilities (gcc, compiler-tools), and installs dependencies into a sandboxed virtual environment.
* Stage 2 (Runner): Copies only the compiled virtual environment and application code, omitting the heavy build dependencies. This drastically reduces the final image size and minimizes the container attack surface.

### 4. Infrastructure as Code (IaC)
* Render Blueprints: The environment configuration is declared in `render.yaml`. This automates container provisioning, sets required environments (Python, Node), maps target start/build scripts, and configures placeholders for security keys.

### 5. API Documentation & Observability
* Interactive Swagger OpenAPI docs are available at `/apidocs`.
* Designed via a static OpenAPI 3.0 configuration (`static/swagger/openapi.json`) and rendered via CDN-sourced Swagger UI with dark-theme overrides. This avoids compatibility conflicts with Flask 3.0 while maintaining a premium developer portal.

### 6. Performance & Load Testing
* Locust load testing setup is integrated under `locustfile.py`.
* Simulates concurrent users requesting endpoints to analyze latency, throughput, and error rates under stress.

## Technical Stack

* Languages: Python 3.10, ESNext JavaScript, HTML5, CSS3
* Libraries: React 19, Leaflet, Flask 3.0, PyTest, Locust
* Infrastructure: GitHub Actions, Docker, Render, Firebase Auth, Cloud Firestore

## Security & Secrets Architecture

* Secret Proxy Pattern: Media API secrets (such as Pexels tokens) are held strictly on the server. The client requests assets through secure proxy routes (`/api/pexels/videos`), preventing credential leakage.
* Dynamic Config Inject: Firebase configurations are fetched dynamically on mount via a secure `/api/config` call, rather than hardcoded in the SPA bundle.

## Getting Started

### Prerequisites
* Python 3.10+
* Node.js 18+
* Docker Desktop (Optional, for local container checks)

### Environment Setup
Create a `.env` file in the root folder with the following variables:
```env
FIREBASE_API_KEY=your_firebase_api_key
PEXELS_API_KEY=your_pexels_api_key
GMAIL_APP_PASSWORD=your_gmail_app_password
```

### Installation
1. Install python dependencies and run the server locally:
   ```bash
   pip install -r requirements.txt
   python app.py
   ```
2. Build the frontend SPA bundle:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

### Running Load Tests
Run the stress-test suite using:
```bash
locust -f locustfile.py
```
Open your browser at `http://localhost:8089` to specify the concurrent user simulation.

### Running with Docker Compose (Orchestration)
You can launch the entire stack, including the Flask application and Redis caching engine, in containerized mode with a single command:
```bash
docker-compose up --build
```
This spins up the services locally, automatically configures the Redis connection details, and performs continuous automated health check evaluations.

Vyamir Systems. Atmospheric Intelligence, Redefined.
