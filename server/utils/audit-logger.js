const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const auditLogFile = path.join(logsDir, 'audit.log');

/**
 * Audit logging for security-critical operations
 */
class AuditLogger {
  /**
   * Log an audit event
   * @param {Object} event - The audit event
   * @param {string} event.userId - User ID performing the action
   * @param {string} event.action - Action being performed
   * @param {string} event.resource - Resource being accessed
   * @param {string} event.ip - IP address of the request
   * @param {string} event.userAgent - User agent string
   * @param {Object} event.metadata - Additional metadata
   * @param {boolean} event.success - Whether the action succeeded
   */
  static log(event) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId: event.userId || 'anonymous',
      action: event.action,
      resource: event.resource,
      ip: event.ip,
      userAgent: event.userAgent,
      success: event.success !== false,
      metadata: event.metadata || {},
      severity: event.severity || 'info'
    };

    // Write to file
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFile(auditLogFile, logLine, (err) => {
      if (err) {
        console.error('Failed to write audit log:', err);
      }
    });

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUDIT]', logEntry);
    }

    // In production, you might want to send to a logging service
    // e.g., Sentry, LogRocket, Datadog, etc.
  }

  /**
   * Log authentication events
   */
  static logAuth(userId, action, ip, userAgent, success = true, metadata = {}) {
    this.log({
      userId,
      action: `auth.${action}`,
      resource: 'authentication',
      ip,
      userAgent,
      success,
      metadata,
      severity: success ? 'info' : 'warning'
    });
  }

  /**
   * Log document operations
   */
  static logDocument(userId, action, documentId, ip, userAgent, success = true, metadata = {}) {
    this.log({
      userId,
      action: `document.${action}`,
      resource: `document:${documentId}`,
      ip,
      userAgent,
      success,
      metadata,
      severity: 'info'
    });
  }

  /**
   * Log security events
   */
  static logSecurity(userId, action, ip, userAgent, metadata = {}) {
    this.log({
      userId,
      action: `security.${action}`,
      resource: 'security',
      ip,
      userAgent,
      success: false,
      metadata,
      severity: 'critical'
    });
  }

  /**
   * Log data access
   */
  static logDataAccess(userId, resource, ip, userAgent, success = true, metadata = {}) {
    this.log({
      userId,
      action: 'data.access',
      resource,
      ip,
      userAgent,
      success,
      metadata,
      severity: 'info'
    });
  }
}

module.exports = AuditLogger;
