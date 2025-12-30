# Vyamir Development & Setup Guide

This document provides technical instructions for local synchronization and contribution to the Vyamir atmospheric core.

## 🛠️ Local Environment Initialization

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/medhinibr/Vyamir.git
   cd Vyamir
   ```

2. **Python Environment**:
   It is recommended to use a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   MAIL_USERNAME=vyamir.app@gmail.com
   MAIL_PASSWORD=your_app_password
   ```

5. **Execution**:
   ```bash
   python app.py
   ```
   Access the cockpit at `http://localhost:8080`.

## 🛰️ Contribution Protocol

1. **Fork the Node**: Create your own branch for feature synchronization.
2. **Atomic Commits**: Ensure each update is tracked with clear, professional metadata.
3. **Pull Requests**: Submit your vectors for review once the atmospheric calibration is complete.

---
*Vyamir Systems © 2025. Engineered for high-fidelity situational awareness.*
