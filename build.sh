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

# Done!
echo "Build completed successfully!"
