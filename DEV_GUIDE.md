# Vyamir Developer Guide

This document provides technical instructions for local development, synchronization, testing, and contribution to the Vyamir core repository.

## 1. Local Environment Initialization

### Python Virtual Environment Setup
It is recommended to use a virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
```

### Install Dependencies
Install all required package dependencies locally:
```bash
pip install -r requirements.txt
```

### Environment Variables Config
Create a `.env` file in the root directory and configure the following variables:
```env
FIREBASE_API_KEY=your_firebase_api_key
PEXELS_API_KEY=your_pexels_api_key
GMAIL_APP_PASSWORD=your_gmail_app_password
```

### Running the Application Locally
To start the Flask development server:
```bash
python app.py
```
To run the server using the production-grade Gunicorn WSGI server:
```bash
gunicorn --bind 0.0.0.0:8080 app:app
```
Access the cockpit dashboard at `http://localhost:8080`.

## 2. Docker & Container Orchestration

### Build and Run with Docker Compose
To build and launch both the web application container and the local Redis cache service:
```bash
docker-compose up --build
```
This automatically maps port `8080` to the host and configures the environment variables.

### Build the Image Manually
To check for Dockerfile compilation issues:
```bash
docker build -t vyamir-app .
```

## 3. Testing Procedures

### Run PyTest Unit Tests
Verify all Flask routes, static page resolvers, and proxy configurations:
```bash
python -m pytest
```

### Run Locust Load Tests
Benchmark application performance and latency under high concurrency:
```bash
locust -f locustfile.py
```
Access the load testing interface at `http://localhost:8089`.

## 4. API Documentation

To review or modify the API definitions:
1. Open the OpenAPI 3.0 specification file under `static/swagger/openapi.json`.
2. Inspect the custom rendered dark-themed UI by launching the application and navigating to the `/apidocs` endpoint.

## 5. Contribution Guidelines

1. **Branching**: Create a separate feature branch for your updates.
2. **Commit Standard**: Write clear, emoji-free, two-word technical commit messages.
3. **Validation**: Ensure that all linting passes via flake8 and all pytest unit tests pass before submitting a pull request.

Vyamir Systems. Engineered for high-fidelity situational awareness.
