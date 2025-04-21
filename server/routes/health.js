// Simple health check endpoint for Render
import express from 'express';

export const healthRouter = express.Router();

healthRouter.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
