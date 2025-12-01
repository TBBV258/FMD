const crypto = require('crypto');

/**
 * Simple CSRF protection middleware
 * Generates and validates CSRF tokens for state-changing operations
 */

// Store for CSRF tokens (in production, use Redis or similar)
const tokenStore = new Map();

// Token expiry time (15 minutes)
const TOKEN_EXPIRY = 15 * 60 * 1000;

/**
 * Generate a CSRF token
 */
function generateToken(sessionId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = Date.now() + TOKEN_EXPIRY;
  
  tokenStore.set(sessionId, { token, expiry });
  
  // Clean up expired tokens
  cleanupExpiredTokens();
  
  return token;
}

/**
 * Validate CSRF token
 */
function validateToken(sessionId, token) {
  const stored = tokenStore.get(sessionId);
  
  if (!stored) {
    return false;
  }
  
  if (Date.now() > stored.expiry) {
    tokenStore.delete(sessionId);
    return false;
  }
  
  return stored.token === token;
}

/**
 * Clean up expired tokens
 */
function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [sessionId, data] of tokenStore.entries()) {
    if (now > data.expiry) {
      tokenStore.delete(sessionId);
    }
  }
}

/**
 * Middleware to add CSRF token to response
 */
function csrfTokenMiddleware(req, res, next) {
  // Create session ID from user ID or IP
  const sessionId = req.user?.id || req.ip;
  
  // Generate token
  const token = generateToken(sessionId);
  
  // Add token to response headers
  res.setHeader('X-CSRF-Token', token);
  
  // Make token available in request
  req.csrfToken = () => token;
  
  next();
}

/**
 * Middleware to validate CSRF token
 */
function csrfProtection(req, res, next) {
  // Skip for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  const sessionId = req.user?.id || req.ip;
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  
  if (!token || !validateToken(sessionId, token)) {
    return res.status(403).json({
      status: 'error',
      message: 'Invalid or missing CSRF token'
    });
  }
  
  next();
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredTokens, 5 * 60 * 1000);

module.exports = {
  csrfTokenMiddleware,
  csrfProtection,
  generateToken,
  validateToken
};

