#!/bin/bash
# Custom build script for Render deployment

# Exit on error
set -e

echo "Starting build process..."

# Install dependencies if needed
echo "Installing dependencies..."
npm install

# Create dist directory
mkdir -p dist/server

# Build frontend
echo "Building frontend..."
./node_modules/.bin/vite build

# Build backend
echo "Building backend..."
./node_modules/.bin/esbuild server/index.ts server/migrate.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server

echo "Build completed successfully!"
