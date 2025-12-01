const crypto = require('crypto');
const AuditLogger = require('../utils/audit-logger');

/**
 * Request signing middleware to prevent replay attacks
 * Client must sign requests with a timestamp and nonce
 */

// Store used nonces (In production, use Redis with TTL)
const usedNonces = new Map();

// Cleanup old nonces every 5 minutes
setInterval(() => {
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  
  for (const [nonce, timestamp] of usedNonces.entries()) {
    if (timestamp < fiveMinutesAgo) {
      usedNonces.delete(nonce);
    }
  }
}, 5 * 60 * 1000);

/**
 * Verify request signature
 * Expected headers:
 * - X-Request-Timestamp: Unix timestamp in milliseconds
 * - X-Request-Nonce: Unique random string
 * - X-Request-Signature: HMAC-SHA256 signature
 */
const verifyRequestSignature = (req, res, next) => {
  // Skip signature verification in development if not enabled
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_REQUEST_SIGNING !== 'true') {
    return next();
  }

  try {
    const timestamp = req.headers['x-request-timestamp'];
    const nonce = req.headers['x-request-nonce'];
    const signature = req.headers['x-request-signature'];

    if (!timestamp || !nonce || !signature) {
      throw new Error('Missing required signature headers');
    }

    // Verify timestamp is within 5 minutes
    const requestTime = parseInt(timestamp, 10);
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    if (Math.abs(now - requestTime) > maxAge) {
      throw new Error('Request timestamp too old or in the future');
    }

    // Verify nonce hasn't been used
    if (usedNonces.has(nonce)) {
      throw new Error('Nonce already used (possible replay attack)');
    }

    // Verify signature
    const secret = process.env.API_SIGNATURE_SECRET || 'change-this-secret';
    const method = req.method;
    const path = req.path;
    const body = req.body ? JSON.stringify(req.body) : '';
    
    const message = `${method}:${path}:${timestamp}:${nonce}:${body}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }

    // Mark nonce as used
    usedNonces.set(nonce, requestTime);

    next();
  } catch (error) {
    // Log potential security issue
    AuditLogger.logSecurity(
      req.user?.userId || 'anonymous',
      'invalid_request_signature',
      req.ip,
      req.get('user-agent'),
      { 
        path: req.path,
        error: error.message 
      }
    );

    res.status(401).json({
      success: false,
      error: { 
        message: 'Request signature inválida',
        code: 'INVALID_SIGNATURE'
      }
    });
  }
};

/**
 * Helper function to generate request signature (for documentation/client use)
 */
function generateSignature(method, path, timestamp, nonce, body, secret) {
  const bodyStr = body ? JSON.stringify(body) : '';
  const message = `${method}:${path}:${timestamp}:${nonce}:${bodyStr}`;
  
  return crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');
}

module.exports = {
  verifyRequestSignature,
  generateSignature
};

