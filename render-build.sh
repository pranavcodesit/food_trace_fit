#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install build dependencies first with explicit versions
pip install setuptools==65.5.1 wheel==0.38.0 pyproject-hooks==1.0.0

# Verify setuptools is installed correctly
pip show setuptools

# Install Python dependencies
pip install -r requirements.txt


# Make sure the ANUVAAD_INDB_2024.xlsx file is accessible
echo "Checking for INDB dataset..."
if [ -f "ANUVAAD_INDB_2024.xlsx" ]; then
    echo "INDB dataset found."
else
    echo "Warning: INDB dataset not found. Some functionality may be limited."
fi

echo "Build completed successfully!"