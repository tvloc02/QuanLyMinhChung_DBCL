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
    ensureAcademicYearConsistency,
    setAcademicYearContext
} = require('./middleware/academicYear');

const app = express();
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ Import public routes (không cần authentication)
const publicEvidenceRoutes = require('./routes/public/publicEvidenceRoutes');

const authRoutes = require('./routes/user/auth');
const usersRoutes = require('./routes/user/users');
const academicYearRoutes = require('./routes/system/academicYear');
const programRoutes = require('./routes/evidence/programs');
const organizationRoutes = require('./routes/evidence/organizations');
const standardRoutes = require('./routes/evidence/standards');
const taskRoutes = require('./routes/task/task');
const criteriaRoutes = require('./routes/evidence/criteria');
const evidenceRoutes = require('./routes/evidence/evidences');
const fileRoutes = require('./routes/evidence/files');
const assignmentRoutes = require('./routes/report/assignments');
const reportRoutes = require('./routes/report/reports');
const evaluationRoutes = require('./routes/report/evaluations');
const notificationRoutes = require('./routes/system/notifications');
const systemRoutes = require('./routes/system/system');
const permissionRoutes = require('./routes/user/permission');
const aiChatRoutes = require('./routes/aiChat/aiChat');

app.use('/api/public/evidences', publicEvidenceRoutes);

// Protected routes (cần authentication)
app.use('/api', aiChatRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/academic-years', auth, academicYearRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/notifications', auth, notificationRoutes);

const academicYearMiddleware = [
    auth,
    switchAcademicYear,
    attachCurrentAcademicYear,
    addAcademicYearFilter
];

app.use('/api/programs', programRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/standards', standardRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/criteria', criteriaRoutes);
app.use('/api/evidences',
    ...academicYearMiddleware,
    ensureAcademicYearConsistency(['program', 'organization', 'standard', 'criteria']),
    evidenceRoutes
);
app.use('/api/files', ...academicYearMiddleware, fileRoutes);
app.use('/api/assignments', ...academicYearMiddleware, assignmentRoutes);
app.use('/api/reports',
    ...academicYearMiddleware,
    ensureAcademicYearConsistency(['program', 'organization']),
    reportRoutes
);
app.use('/api/evaluations', ...academicYearMiddleware, evaluationRoutes);

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

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

app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `API endpoint không tồn tại: ${req.originalUrl}`
    });
});

module.exports = app;