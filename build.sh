#!/usr/bin/env bash
# exit on error
set -o errexit

# Install Python requirements
pip install -r requirements.txt

# Compile the React SPA bundle
cd frontend
npm install
npm run build
