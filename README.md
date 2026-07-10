# Vyamir

Vyamir is a high-performance, containerized atmospheric intelligence dashboard. The project emphasizes automated deployment, declarative infrastructure, and system reliability.

## 1. Project Overview

Vyamir provides real-time weather intelligence with a focus on cinematic UI and data accuracy. The backend is designed for scalability, utilizing Redis for caching and Gunicorn for production-grade request handling. 

To ensure complete credential isolation, Vyamir implements a secure proxy API pattern. The React 19 client resolves dynamic configurations on initialization and proxies all external requests (including weather telemetry and video backgrounds) through Flask backend services, shielding third-party credentials from client-side network exposure.

The platform integrates an AI-inspired meteorological insight engine. Upon receiving telemetry requests, the backend parses temperature indices, precipitation probabilities, and air quality indices (AQI) to compile dynamic, personalized environmental advice (e.g. AQI warnings, hydration notices, and precipitation alerts).

## 2. Technical Stack

* Core: Python, Flask, Gunicorn
* Containerization: Docker (Multi-stage builds)
* Infrastructure: Render Blueprints
* CI/CD: GitHub Actions
* Database/Cache: Redis, Cloud Firestore, Firebase Auth

## 3. DevOps & Cloud Architecture

The project follows a rigorous DevOps lifecycle:

* **Continuous Integration (CI)**:
  * Static analysis: Lint checks are managed automatically via flake8 on every commit to flag syntax errors and code styling anomalies.
  * Unit Testing: Integration tests are executed using pytest to verify that Flask routes, dynamic insights, and proxies resolve with correct response structures.
* **Continuous Deployment (CD)**:
  * Declarative Infrastructure: The environment and container structure are defined in `render.yaml` to automate orchestration on Render. Pushing updates to the main branch triggers builds automatically.
* **Performance Optimization & Caching**:
  * Asset Caching Policy: Deployed response header injectors in the Flask layer to enforce Cache-Control rules. Static assets (CSS, JS, images, XML sitemaps) are cached globally for 1 year (`public, max-age=31536000, immutable`), while dynamic APIs have cache-prevention headers.
  * Non-blocking Execution: Bottom script imports are loaded with the `defer` attribute to optimize browser parsing speeds and core web vitals.
* **Observability & Reliability**:
  * Healthcheck integrations: The web service container uses automated health monitoring. A native Python request probe queries `/api/config` inside the container every 30 seconds to confirm availability without relying on heavy external dependencies.
  * Restart Policies: Services are defined with restart-on-failure policies to minimize downtime in the event of system exceptions.
  * Log Documentation: Swagger UI is integrated at the `/apidocs` endpoint to map the structural OpenAPI routes.

## 4. Repository Structure

```text
.
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD lint and test workflow
├── backend/
│   ├── cache.py               # Redis and local memory caching fallback layer
│   ├── openmeteo.py           # Meteorological telemetry integration logic
│   └── __init__.py
├── frontend/                  # React 19 Vite application client
├── public/                    # SEO static resources
├── static/                    # Dashboard UI styles and Leaflet map scripts
├── templates/                 # Core HTML and API Swagger documentation layouts
├── .gitignore                 # Tracked files filter rules
├── docker-compose.yml         # Containerized local execution and redis caching
├── Dockerfile                 # Optimized multi-stage Docker build
├── locustfile.py              # Performance benchmark test suite
├── render.yaml                # Render Blueprint infrastructure configuration
├── requirements.txt           # Python dependency manifests
├── test_app.py                # Route verification tests
├── app.py                     # WSGI application configuration
├── CONTRIBUTING.md            # Guidelines and commit rules
└── DEV_GUIDE.md               # Local development and validation guide
```

## 5. Deployment Setup

### Prerequisites
* Docker Desktop & Docker Compose

### Local Execution
1. Clone the repository:
   ```bash
   git clone https://github.com/medhinibr/Vyamir.git
   cd Vyamir
   ```
2. Create a `.env` file in the root folder with the following variables:
   ```env
   FIREBASE_API_KEY=your_firebase_api_key
   PEXELS_API_KEY=your_pexels_api_key
   GMAIL_APP_PASSWORD=your_gmail_app_password
   ```
3. Run the containerized stack:
   ```bash
   docker-compose up --build
   ```

### Production Setup
1. Log into your Render dashboard.
2. Navigate to **Blueprints** and click **Connect New Blueprint**.
3. Select this repository.
4. Once deployed, navigate to the web service **Environment** settings to configure the secrets:
   * `FIREBASE_API_KEY`
   * `PEXELS_API_KEY`
   * `GMAIL_APP_PASSWORD`

## 6. Status

* Build: [![Deploy Vyamir to Render](https://github.com/medhinibr/Vyamir/actions/workflows/deploy.yml/badge.svg)](https://github.com/medhinibr/Vyamir/actions/workflows/deploy.yml)
* Deployment: Active
* Environment: Production (Render Cloud)

---
LinkedIn Profile: https://linkedin.com/in/medhinibr.
