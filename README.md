# Vyamir

Vyamir is a high-performance, containerized atmospheric intelligence dashboard. The project emphasizes automated deployment, infrastructure-as-code (IaC), and system reliability.

## 1. Project Overview

Vyamir provides real-time weather intelligence with a focus on cinematic UI and data accuracy. The backend is designed for scalability, utilizing Redis for caching and Gunicorn for production-grade request handling. 

To ensure complete credential isolation, Vyamir implements a secure proxy API pattern. The React 19 client resolves dynamic configurations on initialization and proxies all external requests (including weather telemetry and video backgrounds) through Flask backend services, shielding third-party credentials from client-side network exposure.

## 2. Technical Stack

* Core: Python, Flask, Gunicorn
* Containerization: Docker (Multi-stage builds)
* Infrastructure: Terraform, Render Blueprints
* CI/CD: GitHub Actions
* Database/Cache: Redis, Cloud Firestore, Firebase Auth

## 3. DevOps & Cloud Architecture

The project follows a rigorous DevOps lifecycle:

* **Continuous Integration (CI)**:
  * Static analysis: Lint checks are managed automatically via flake8 on every commit to flag syntax errors and code styling anomalies.
  * Unit Testing: Integration tests are executed using pytest to verify that Flask routes and proxies resolve with correct response structures.
  * Image Validation: GitHub Actions builds the Docker image locally to check for compile-time errors prior to deployment.
* **Continuous Deployment (CD)**:
  * Automated orchestration: A webhook deploy step triggers Render builds upon successful CI checks, supporting zero-downtime continuous deployment.
* **Infrastructure as Code (IaC)**:
  * Terraform configuration: Provider and resource declarations are stored in the `/infra` directory to provision the Render web service, Git repository triggers, and production environment variables.
  * Render Blueprints: The environment configuration is declared in `render.yaml` to automate container parameters and deployment rules.
* **Observability & Reliability**:
  * Healthcheck integrations: The web service container uses automated health monitoring. A native Python request probe queries `/api/config` inside the container every 30 seconds to confirm availability without relying on heavy external dependencies.
  * Restart Policies: Services are defined with restart-on-failure policies to minimize downtime in the event of system exceptions.
  * Log Documentation: Swagger UI is integrated at the `/apidocs` endpoint to map the structural OpenAPI routes.

## 4. Repository Structure

```text
.
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD lint, test, build, and deploy pipeline
├── backend/
│   ├── cache.py               # Redis and local memory caching fallback layer
│   ├── openmeteo.py           # Meteorological telemetry integration logic
│   └── __init__.py
├── frontend/                  # React 19 Vite application client
├── infra/
│   ├── main.tf                # Terraform Render provider and resource definition
│   └── terraform.tfvars       # Local secrets variables (Git-ignored)
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
└── app.py                     # WSGI application configuration
```

## 5. Deployment Setup

### Prerequisites
* Docker Desktop & Docker Compose
* Terraform v1.0+

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

### Infrastructure Provisioning (Terraform)
1. Navigate to the infra directory:
   ```bash
   cd infra
   ```
2. Configure credentials in your local `terraform.tfvars` file:
   ```hcl
   render_api_key   = "rnd_your_render_api_key_here"
   render_owner_id  = "usr-your_owner_id_here"
   pexels_api_key   = "your_pexels_api_key"
   firebase_api_key = "your_firebase_api_key"
   gmail_password   = "your_gmail_password"
   ```
3. Run the provisioning workflow:
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

## 6. Status

* Build: [![Deploy Vyamir to Render](https://github.com/medhinibr/Vyamir/actions/workflows/deploy.yml/badge.svg)](https://github.com/medhinibr/Vyamir/actions/workflows/deploy.yml)
* Deployment: Active
* Environment: Production (Render Cloud)

---
LinkedIn Profile: https://linkedin.com/in/medhinibr
