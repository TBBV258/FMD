require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const https = require('https');
const { securityMiddleware } = require('./middleware/securityHeaders');
const { 
  authLimiter, 
  apiLimiter, 
  uploadLimiter,
  documentCreationLimiter,
  searchLimiter 
} = require('./middleware/rateLimiters');
const AuditLogger = require('./utils/audit-logger');
const { refreshTokenMiddleware } = require('./middleware/jwtRefresh');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Validate critical environment variables in production
const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0 && process.env.NODE_ENV === 'production') {
  console.error('⚠️  CRITICAL: Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please set these variables in your .env file');
  process.exit(1);
}

// Apply security middleware
app.use(securityMiddleware);

// Enable CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token'],
  credentials: true
}));

// Apply general rate limiting to all API routes
app.use('/api', apiLimiter);

// Audit logging middleware
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    if (req.user && req.method !== 'GET') {
      AuditLogger.logDataAccess(
        req.user.userId || req.user.id,
        req.path,
        req.ip,
        req.get('user-agent'),
        true,
        { statusCode: res.statusCode }
      );
    }
    originalSend.call(this, data);
  };
  next();
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Parse JSON bodies with size limit
app.use(express.json({ limit: '10kb' }));

// Parse URL-encoded bodies with extended syntax
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// JWT Refresh Token endpoint
app.post('/api/v1/auth/refresh', authLimiter, refreshTokenMiddleware);

// API Routes with specific rate limiters
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/documents', documentRoutes);

// Geocoding proxy to avoid CORS issues with public Nominatim
app.get('/api/v1/geocode/reverse', async (req, res) => {
  const lat = req.query.lat || req.query.latitude;
  const lon = req.query.lon || req.query.lng || req.query.longitude;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'Missing lat or lon query parameters' });
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&accept-language=pt`;

  const options = {
    headers: {
      'User-Agent': process.env.GEOCODE_USER_AGENT || 'FindMyDocs/1.0 (your-email@example.com)',
      'Accept-Language': 'pt'
    }
  };

  https.get(url, options, (nRes) => {
    let data = '';
    nRes.on('data', chunk => data += chunk);
    nRes.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        return res.json(parsed);
      } catch (e) {
        return res.status(502).json({ error: 'Invalid response from geocoding provider' });
      }
    });
  }).on('error', (err) => {
    console.error('Geocode proxy error:', err);
    return res.status(502).json({ error: 'Failed to reach geocoding provider' });
  });
});

// API Documentation
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FMD Windsurf API',
      version: '1.0.0',
      description: 'API documentation for the Find My Document (FMD) Windsurf application',
      contact: {
        name: 'FMD Support',
        email: 'support@findmydoc.co.mz'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api/v1`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'FMD Windsurf API Documentation',
}));

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler with audit logging
app.use((err, req, res, next) => {
  // Log error
  if (err) {
    AuditLogger.logSecurity(
      req.user?.userId || req.user?.id || 'anonymous',
      'error',
      req.ip,
      req.get('user-agent'),
      { 
        error: err.message,
        stack: err.stack,
        path: req.path
      }
    );
  }
  
  // Call original error handler
  errorHandler(err, req, res, next);
});

// Start the server (with HTTPS support if enabled)
let server;

if (process.env.ENABLE_HTTPS === 'true') {
  try {
    const privateKey = fs.readFileSync(process.env.SSL_KEY_PATH || './ssl/key.pem', 'utf8');
    const certificate = fs.readFileSync(process.env.SSL_CERT_PATH || './ssl/cert.pem', 'utf8');
    const credentials = { key: privateKey, cert: certificate };

    server = https.createServer(credentials, app);
    server.listen(PORT, () => {
      console.log(`🔒 HTTPS Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`📚 API Documentation: https://localhost:${PORT}/api-docs`);
      AuditLogger.log({
        action: 'server.start',
        resource: 'server',
        success: true,
        metadata: { port: PORT, protocol: 'https' }
      });
    });
  } catch (error) {
    console.error('Failed to start HTTPS server:', error.message);
    console.log('Falling back to HTTP...');
    server = app.listen(PORT, () => {
      console.log(`⚠️  HTTP Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    });
  }
} else {
  server = app.listen(PORT, () => {
    console.log(`🚀 Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    AuditLogger.log({
      action: 'server.start',
      resource: 'server',
      success: true,
      metadata: { port: PORT, protocol: 'http' }
    });
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  
  AuditLogger.log({
    action: 'server.unhandled_rejection',
    resource: 'server',
    success: false,
    severity: 'critical',
    metadata: { error: err.message, stack: err.stack }
  });
  
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  
  AuditLogger.log({
    action: 'server.uncaught_exception',
    resource: 'server',
    success: false,
    severity: 'critical',
    metadata: { error: err.message, stack: err.stack }
  });
  
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  
  AuditLogger.log({
    action: 'server.shutdown',
    resource: 'server',
    success: true,
    metadata: { signal: 'SIGTERM' }
  });
  
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

module.exports = app;
