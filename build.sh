#!/bin/bash
set -e

# This tells Render to use Python 3.12 instead of 3.14
# Install Python 3.12
curl https://repo.render.com/render-build-cache/python-3.12.0.tar.gz | tar xz

# Update PATH to use our Python
export PATH="/opt/render/python-3.12.0/bin:$PATH"

# Verify Python version
python --version

# Install dependencies
cd Backend
pip install -r requirements.txt
