#!/bin/bash

# Install tsconfig-paths if not already installed
npm install --save-dev tsconfig-paths

# Start the server using the production server file
NODE_ENV=production node -r tsconfig-paths/register server-prod.js
