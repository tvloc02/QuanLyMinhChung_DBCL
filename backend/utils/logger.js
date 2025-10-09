const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let logMessage = `${timestamp} [${level}]: ${message}`;

        // Add stack trace if available
        if (stack) {
            logMessage += `\n${stack}`;
        }

        // Add metadata if available
        if (Object.keys(meta).length > 0) {
            logMessage += `\n${JSON.stringify(meta, null, 2)}`;
        }

        return logMessage;
    })
);

// Custom format for file output
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: {
        service: 'evidence-management-api',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        // Console transport for development
        new winston.transports.Console({
            format: consoleFormat,
            silent: process.env.NODE_ENV === 'test'
        }),

        // File transport for all logs
        new winston.transports.File({
            filename: path.join(logsDir, 'app.log'),
            format: fileFormat,
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5
        }),

        // Separate file for errors
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            format: fileFormat,
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5
        }),

        // Separate file for audit logs
        new winston.transports.File({
            filename: path.join(logsDir, 'audit.log'),
            level: 'info',
            format: fileFormat,
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 10
        })
    ],

    // Handle uncaught exceptions
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
            format: fileFormat
        })
    ],

    // Handle unhandled rejections
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log'),
            format: fileFormat
        })
    ]
});

// Add HTTP request logging transport if in production
if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({
        filename: path.join(logsDir, 'access.log'),
        level: 'http',
        format: fileFormat,
        maxsize: 50 * 1024 * 1024, // 50MB
        maxFiles: 10
    }));
}

// Helper functions for structured logging
const createLogObject = (message, meta = {}) => {
    return {
        message,
        timestamp: new Date().toISOString(),
        ...meta
    };
};

// Request logging middleware
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;

    // Override res.send to capture response
    res.send = function(data) {
        res.send = originalSend;

        const duration = Date.now() - startTime;
        const logData = {
            method: req.method,
            url: req.originalUrl || req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.get('User-Agent'),
            ip: req.ip || req.connection.remoteAddress,
            userId: req.user?.id || 'anonymous',
            requestId: req.id
        };

        // Log different levels based on status code
        if (res.statusCode >= 500) {
            logger.error('HTTP Request', logData);
        } else if (res.statusCode >= 400) {
            logger.warn('HTTP Request', logData);
        } else {
            logger.http('HTTP Request', logData);
        }

        return originalSend.call(this, data);
    };

    next();
};

// Security event logging
const logSecurityEvent = (event, details = {}) => {
    logger.warn('Security Event', {
        event,
        ...details,
        category: 'security'
    });
};

// Audit logging for important actions
const logAudit = (action, userId, resource, details = {}) => {
    logger.info('Audit Log', {
        action,
        userId,
        resource,
        ...details,
        category: 'audit'
    });
};

// Database operation logging
const logDatabaseOperation = (operation, collection, query = {}, result = {}) => {
    logger.debug('Database Operation', {
        operation,
        collection,
        query: JSON.stringify(query),
        result: {
            count: result.count || result.length || 0,
            duration: result.duration
        },
        category: 'database'
    });
};

// File operation logging
const logFileOperation = (operation, filename, userId, details = {}) => {
    logger.info('File Operation', {
        operation,
        filename,
        userId,
        ...details,
        category: 'file'
    });
};

// Email logging
const logEmailSent = (to, subject, status, details = {}) => {
    logger.info('Email Sent', {
        to,
        subject,
        status,
        ...details,
        category: 'email'
    });
};

// Performance logging
const logPerformance = (operation, duration, details = {}) => {
    const level = duration > 5000 ? 'warn' : duration > 1000 ? 'info' : 'debug';

    logger.log(level, 'Performance', {
        operation,
        duration: `${duration}ms`,
        ...details,
        category: 'performance'
    });
};

// Error logging with context
const logError = (error, context = {}) => {
    logger.error('Application Error', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        ...context,
        category: 'error'
    });
};

// Business logic logging
const logBusinessEvent = (event, details = {}) => {
    logger.info('Business Event', {
        event,
        ...details,
        category: 'business'
    });
};

// System health logging
const logSystemHealth = (metric, value, threshold = null) => {
    const level = threshold && value > threshold ? 'warn' : 'info';

    logger.log(level, 'System Health', {
        metric,
        value,
        threshold,
        category: 'system'
    });
};

// Import/Export logging
const logDataOperation = (operation, type, userId, stats = {}) => {
    logger.info('Data Operation', {
        operation, // 'import' or 'export'
        type,      // 'evidences', 'users', etc.
        userId,
        ...stats,
        category: 'data'
    });
};

// Search logging for analytics
const logSearchQuery = (query, userId, resultCount, duration) => {
    logger.info('Search Query', {
        query,
        userId,
        resultCount,
        duration: `${duration}ms`,
        category: 'search'
    });
};

// Cleanup old log files
const cleanupLogs = (maxAge = 30 * 24 * 60 * 60 * 1000) => { // 30 days default
    try {
        const files = fs.readdirSync(logsDir);
        const now = Date.now();

        files.forEach(file => {
            const filePath = path.join(logsDir, file);
            const stats = fs.statSync(filePath);

            if (now - stats.mtime.getTime() > maxAge) {
                fs.unlinkSync(filePath);
                logger.info('Log file cleaned up', { file });
            }
        });
    } catch (error) {
        logger.error('Log cleanup error', { error: error.message });
    }
};

// Compress old log files (if needed)
const compressLogs = () => {
    try {
        const zlib = require('zlib');
        const files = fs.readdirSync(logsDir);

        files.forEach(file => {
            if (file.endsWith('.log') && !file.endsWith('.gz')) {
                const filePath = path.join(logsDir, file);
                const stats = fs.statSync(filePath);

                // Compress files older than 7 days
                if (Date.now() - stats.mtime.getTime() > 7 * 24 * 60 * 60 * 1000) {
                    const gzip = zlib.createGzip();
                    const source = fs.createReadStream(filePath);
                    const destination = fs.createWriteStream(filePath + '.gz');

                    source.pipe(gzip).pipe(destination);

                    destination.on('close', () => {
                        fs.unlinkSync(filePath);
                        logger.info('Log file compressed', { file });
                    });
                }
            }
        });
    } catch (error) {
        logger.error('Log compression error', { error: error.message });
    }
};

// Get log stats
const getLogStats = () => {
    try {
        const files = fs.readdirSync(logsDir);
        const stats = {
            totalFiles: files.length,
            totalSize: 0,
            oldestFile: null,
            newestFile: null
        };

        let oldestTime = Date.now();
        let newestTime = 0;

        files.forEach(file => {
            const filePath = path.join(logsDir, file);
            const fileStats = fs.statSync(filePath);

            stats.totalSize += fileStats.size;

            if (fileStats.mtime.getTime() < oldestTime) {
                oldestTime = fileStats.mtime.getTime();
                stats.oldestFile = file;
            }

            if (fileStats.mtime.getTime() > newestTime) {
                newestTime = fileStats.mtime.getTime();
                stats.newestFile = file;
            }
        });

        stats.totalSizeMB = (stats.totalSize / (1024 * 1024)).toFixed(2);

        return stats;
    } catch (error) {
        logger.error('Get log stats error', { error: error.message });
        return null;
    }
};

// Export logger and helper functions
module.exports = {
    logger,
    requestLogger,
    logSecurityEvent,
    logAudit,
    logDatabaseOperation,
    logFileOperation,
    logEmailSent,
    logPerformance,
    logError,
    logBusinessEvent,
    logSystemHealth,
    logDataOperation,
    logSearchQuery,
    cleanupLogs,
    compressLogs,
    getLogStats
};