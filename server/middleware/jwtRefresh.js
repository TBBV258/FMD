const jwt = require('jsonwebtoken');
const AuditLogger = require('../utils/audit-logger');

// Ensure JWT_SECRET and JWT_REFRESH_SECRET are set
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'; // Short-lived access tokens
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'; // Longer-lived refresh tokens

/**
 * In-memory token blacklist (In production, use Redis or database)
 */
const tokenBlacklist = new Set();

/**
 * Generate access token
 */
function generateAccessToken(userId, email) {
  return jwt.sign(
    { 
      userId, 
      email,
      type: 'access',
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Generate refresh token
 */
function generateRefreshToken(userId, email) {
  return jwt.sign(
    { 
      userId, 
      email,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
}

/**
 * Generate both access and refresh tokens
 */
function generateTokenPair(userId, email) {
  return {
    accessToken: generateAccessToken(userId, email),
    refreshToken: generateRefreshToken(userId, email),
    expiresIn: JWT_EXPIRES_IN
  };
}

/**
 * Verify access token
 */
function verifyAccessToken(token) {
  try {
    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      throw new Error('Token has been revoked');
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw error;
  }
}

/**
 * Verify refresh token
 */
function verifyRefreshToken(token) {
  try {
    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      throw new Error('Token has been revoked');
    }

    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    throw error;
  }
}

/**
 * Revoke a token (add to blacklist)
 */
function revokeToken(token) {
  tokenBlacklist.add(token);
  
  // In production, you should also store this in a persistent store
  // and implement cleanup for expired tokens
}

/**
 * Middleware to refresh access token using refresh token
 */
const refreshTokenMiddleware = async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: { message: 'Refresh token não fornecido' }
      });
    }

    const decoded = verifyRefreshToken(refreshToken);

    // Generate new token pair
    const tokens = generateTokenPair(decoded.userId, decoded.email);

    // Optionally revoke old refresh token (token rotation)
    if (process.env.ENABLE_TOKEN_ROTATION === 'true') {
      revokeToken(refreshToken);
    }

    // Log token refresh
    AuditLogger.logAuth(
      decoded.userId,
      'token_refresh',
      req.ip,
      req.get('user-agent'),
      true,
      { email: decoded.email }
    );

    res.json({
      success: true,
      data: tokens
    });
  } catch (error) {
    // Log failed token refresh
    AuditLogger.logSecurity(
      'unknown',
      'token_refresh_failed',
      req.ip,
      req.get('user-agent'),
      { error: error.message }
    );

    res.status(401).json({
      success: false,
      error: { message: 'Refresh token inválido ou expirado' }
    });
    }
};

/**
 * Middleware to verify JWT access token
 */
const verifyToken = (req, res, next) => {
  try {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
        success: false,
        error: { message: 'Token de autenticação não fornecido' }
    });
  }
  
  const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (error) {
    // Log failed token verification
    AuditLogger.logSecurity(
      'unknown',
      'token_verification_failed',
      req.ip,
      req.get('user-agent'),
      { error: error.message }
    );

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: { 
          message: 'Token expirado',
        code: 'TOKEN_EXPIRED'
        }
      });
    }
    
    res.status(401).json({
      success: false,
      error: { message: 'Token inválido' }
    });
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  revokeToken,
  refreshTokenMiddleware,
  verifyToken
};
