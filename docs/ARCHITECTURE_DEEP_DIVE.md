# Vyamir | Technical Architecture Deep Dive

**Platform:** Python-Flask / Firebase / ESNext Engine  
**Runtime:** Gunicorn (Production WSGI)

---

## 1. High-Precision Data Flow & Temporal Sync
The Vyamir architecture is built on a **Single-Source-of-Truth (SSOT)** model for meteorological data.

### Request Lifecycle:
1.  **Ingestion:** User submits a geographic query.
2.  **Resolution:** OpenStreetMap/Nominatim resolves the query into a Latitude/Longitude vector.
3.  **Hydration:** The Python backend initiates a `ThreadPoolExecutor` to fetch:
    *   **Open-Meteo:** Current, Hourly, and Daily metrics.
    *   **Pexels:** Condition-mapped HD media assets.
    *   **Fox Weather:** RSS-syndicated news feeds.
4.  **Serialization:** Flask serializes the aggregate data into a unified JSON object.
5.  **Rendering:** The ESNext frontend receives the object and initiates sectional DOM updates.

### The "Time-Slip" Resolution Logic:
*   **Temporal Indexing:** Synchronizes all hourly meteorological metrics (UV, Pollen, Humidity) with the target city's local time (`data.current.time`), eliminating timezone-indexing artifacts.

## 2. Production Deployment & Static Asset Serving
Vyamir is engineered for high-availability deployment on **Render**.

### Root-Level Compliance Routing:
To ensure 100% AdSense and SEO compatibility, the Flask engine is configured to serve administrative manifests directly from the root URL.
*   **Endpoints:** `/ads.txt`, `/robots.txt`, `/sitemap.xml`.
*   **Architecture:** These files are physically located in the `/static` high-fidelity node and served via `send_from_directory` commands in `app.py`.

### WSGI Configuration:
*   **Process Manager:** Utilizing **Gunicorn** (`web: gunicorn app:app`) to handle concurrent client connections in the production environment.
*   **Procfile:** Standard process manifest deployed for Render container orchestration.

## 3. Front-End Performance Protocols
*   **Non-Blocking Hydration:** Tiered rendering model (Instant -> Deferred -> Interactive).
*   **Vertex Throttling:** `pauseSkyAnimation` during heavy data loads to prevent thread contention.
*   **Zero-Drift Mobile UI:** Re-engineered global CSS to resolve horizontal drift on flagship handheld units.

## 4. API Endpoints Catalog

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/search` | GET | Resolve city queries to coordinates. |
| `/api/get_weather` | GET | Comprehensive atmospheric telemetry fetch. |
| `/api/send_email` | POST | MIME-SMTP support dispatch. |
| `/ads.txt` | GET | Served from static/ads.txt. |
| `/robots.txt` | GET | Served from static/robots.txt. |
| `/sitemap.xml` | GET | Served from static/sitemap.xml. |

---
*Technical Architecture Document | Vyamir Systems | SECURE TRANSMISSION*
