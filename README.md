# Vyamir | Next-Generation Atmospheric Intelligence

Vyamir is a high-fidelity, professional-grade weather intelligence platform built for high situational awareness. It bridges the gap between raw meteorological telemetry and cinematic user experience, transforming complex environmental vectors into a seamless, interactive dashboard.

**Deployment Node:** [vyamir.onrender.com](https://vyamir.onrender.com/)

---

## High-Fidelity Features

- **Zenith Glass HUD**: A premium, state-of-the-art interface utilizing advanced glassmorphism and motion dynamics for maximum clarity.
- **Hybrid Telemetry Engine**: Optimized client-side ingestion of Open-Meteo data to bypass server-side rate limits and ensure sub-second orbital synchronization.
- **Cinematic Atmosphere**: Dynamic, condition-aware HD video loops powered by the Pexels engine, providing immediate visual context.
- **SkyID Ecosystem**: Secure, privacy-first identity management utilizing Firebase and Cloud Firestore for persistent user state.
- **Meteorological Dispatch**: Integrated SMTP engine for direct weather reporting and secure communication.

---

##  Technical Architecture

### Core Stack
- **Backend**: Python / Flask (WSGI Architecture)
- **Frontend**: ESNext JavaScript (Vanilla Architecture) & CSS3 Design System
- **Database**: Firebase Auth & Cloud Firestore (NoSQL)
- **Deployment**: Render Cloud Infrastructure

### Data Vectors & APIs
- **Open-Meteo**: Primary meteorological and air quality telemetry.
- **RainViewer API**: Real-time Doppler radar and satellite mapping.
- **Nominatim (OSM)**: Global geographic coordinate and reverse resolution.
- **Pexels API**: Atmospheric media asset ingestion.



##  Quick Setup & Initialization

Vyamir requires a secured environment for full deployment.

1. **Environment Variables**: Populate a `.env` file with the following vectors:
   ```env
   FIREBASE_API_KEY=your_key
   PEXELS_API_KEY=your_key
   GMAIL_APP_PASSWORD=your_password
   ```

2. **Backend Sync**:
   ```bash
   pip install -r requirements.txt
   python app.py
   ```

For detailed contribution protocols and local development calibration, please refer to the **[Development Guide](./DEV_GUIDE.md)**.

---
*Vyamir Systems © 2025. Atmospheric Intelligence, Redefined.*
