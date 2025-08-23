/**
 * Production server entry point for Zeabur deployment
 * Serves both frontend static files and backend API
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Import and use the API app
import('./api/dist/app.js')
  .then((apiModule) => {
    const apiApp = apiModule.default;
    
    // Serve static files from dist directory FIRST
    app.use(express.static(path.join(__dirname, 'dist')));
    
    // Use API routes only for /api prefix
    app.use('/api', apiApp);
    
    // Handle SPA routing - return index.html for all non-API routes
    app.get('*', (req, res) => {
      // Don't serve index.html for API routes
      if (req.path.startsWith('/api')) {
        res.status(404).json({ error: 'API endpoint not found' });
        return;
      }
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Full-stack server running on port ${PORT}`);
      console.log(`📱 Frontend: http://localhost:${PORT}`);
      console.log(`🔌 API: http://localhost:${PORT}/api`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });