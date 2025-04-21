#!/bin/bash

# Install dependencies for both client and server
echo "Installing dependencies..."
npm install

# Build the client
echo "Building client..."
cd client
npm install
npm run build
cd ..

# Compile TypeScript files
echo "Compiling TypeScript files..."
npx tsc --project tsconfig.json

# Create necessary directories
echo "Setting up directory structure..."
mkdir -p dist/server/routes
mkdir -p dist/shared

# Ensure server directories exist
mkdir -p server/routes

# Copy non-TypeScript files and ensure all required directories exist
echo "Copying additional files..."
cp -r shared/* dist/shared/ 2>/dev/null || :

# Done!
echo "Build completed successfully!"
