/**
 * HTTPS redirect middleware for production
 * Enforces HTTPS connections
 */
function httpsRedirect(req, res, next) {
  // Skip in development
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  // Check if request is secure
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    return next();
  }

  // Redirect to HTTPS
  return res.redirect(301, `https://${req.headers.host}${req.url}`);
}

/**
 * Strict Transport Security (HSTS) middleware
 */
function hstsMiddleware(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    // Enforce HTTPS for 1 year, include subdomains
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  next();
}

module.exports = {
  httpsRedirect,
  hstsMiddleware
};

