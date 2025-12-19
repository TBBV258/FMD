const rateLimit = require('express-rate-limit');

/**
 * Rate limiters for different routes
 * More restrictive limits for sensitive operations
 */

// General API rate limiter (100 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Muitas requisições desta origem, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/api/health';
  }
});

// Strict rate limiter for authentication (5 attempts per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed requests
});

// Password reset limiter (3 attempts per hour)
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Muitas tentativas de recuperação de senha. Tente novamente em 1 hora.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Document creation limiter (20 documents per hour)
const documentCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Limite de criação de documentos atingido. Tente novamente em 1 hora.',
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload limiter (30 uploads per hour)
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: 'Limite de uploads atingido. Tente novamente em 1 hora.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Search limiter (60 searches per minute)
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: 'Muitas buscas em um curto período. Aguarde um momento.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Chat message limiter (100 messages per 5 minutes)
const chatLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100,
  message: 'Muitas mensagens enviadas. Aguarde alguns minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin operations limiter (stricter)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: 'Limite de operações administrativas atingido.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  documentCreationLimiter,
  uploadLimiter,
  searchLimiter,
  chatLimiter,
  adminLimiter
};
