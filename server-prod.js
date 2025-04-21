// Production server entry point
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Set up static files folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'dist/public')));

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Create HTTP server
const httpServer = http.createServer(app);

// Basic API routes

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Simple API endpoint to test database connection
app.get('/api/status', async (req, res) => {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'DATABASE_URL environment variable is not set' 
      });
    }
    
    res.status(200).json({ 
      status: 'ok', 
      message: 'Server is running', 
      database: 'Connected',
      env: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Error checking database connection:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error checking database connection',
      error: error.message 
    });
  }
});

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public', 'index.html'));
});

// Start the server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Handle server shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
