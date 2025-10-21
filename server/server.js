require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { securityMiddleware, limiter } = require('./middleware/securityHeaders');
const { errorHandler, notFoundHandler, asyncHandler } = require('./middleware/errorHandler');
const { authValidators, documentValidators } = require('./middleware/validators');
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Apply security middleware
app.use(securityMiddleware);

// Enable CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Apply rate limiting to all API routes
app.use('/api', limiter);

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

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/documents', documentRoutes);

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

// Global Error Handler
app.use(errorHandler);

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
