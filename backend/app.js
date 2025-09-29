const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { auth } = require('./middleware/auth');
const {
    attachCurrentAcademicYear,
    addAcademicYearFilter,
    switchAcademicYear,
    ensureAcademicYearConsistency
} = require('./middleware/academicYear');

const app = express();

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const academicYearRoutes = require('./routes/academicYear');
const programRoutes = require('./routes/programs');
const organizationRoutes = require('./routes/organizations');
const standardRoutes = require('./routes/standard');
const criteriaRoutes = require('./routes/criteria');
const evidenceRoutes = require('./routes/evidences');
const fileRoutes = require('./routes/file');

// Routes without academic year context
app.use('/api/auth', authRoutes);

// Academic year management routes (no context needed)
app.use('/api/academic-year', auth, academicYearRoutes);

// User management routes (no academic year context)
app.use('/api/users', auth, userRoutes);

// Apply academic year middleware for data routes
const academicYearMiddleware = [
    auth,
    switchAcademicYear, // Allow switching academic year for admin/manager
    attachCurrentAcademicYear, // Get current or specified academic year
    addAcademicYearFilter // Add academic year to queries
];

// Routes WITH academic year context
app.use('/api/programs',
    ...academicYearMiddleware,
    ensureAcademicYearConsistency(['program']),
    programRoutes
);

app.use('/api/organizations',
    ...academicYearMiddleware,
    organizationRoutes
);

app.use('/api/standards',
    ...academicYearMiddleware,
    ensureAcademicYearConsistency(['program', 'organization']),
    standardRoutes
);

app.use('/api/criteria',
    ...academicYearMiddleware,
    ensureAcademicYearConsistency(['program', 'organization', 'standard']),
    criteriaRoutes
);

app.use('/api/evidences',
    ...academicYearMiddleware,
    ensureAcademicYearConsistency(['program', 'organization', 'standard', 'criteria']),
    evidenceRoutes
);

app.use('/api/files',
    ...academicYearMiddleware,
    fileRoutes
);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

// Academic year context endpoint for frontend
app.get('/api/context', auth, attachCurrentAcademicYear, (req, res) => {
    res.json({
        success: true,
        data: {
            currentAcademicYear: req.currentAcademicYear,
            user: {
                id: req.user.id,
                fullName: req.user.fullName,
                email: req.user.email,
                role: req.user.role,
                standardAccess: req.user.standardAccess,
                criteriaAccess: req.user.criteriaAccess
            }
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Dữ liệu không hợp lệ',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        return res.status(400).json({
            success: false,
            message: `${field} '${value}' đã tồn tại`
        });
    }

    res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint không tồn tại'
    });
});

module.exports = app;