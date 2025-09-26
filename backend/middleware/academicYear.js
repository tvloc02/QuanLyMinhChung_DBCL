const AcademicYear = require('../models/AcademicYear');

// Middleware to get and attach current academic year to request
const attachCurrentAcademicYear = async (req, res, next) => {
    try {
        // Check if user explicitly set academic year in query/body
        const explicitYearId = req.query.academicYearId || req.body.academicYearId;

        if (explicitYearId) {
            const academicYear = await AcademicYear.findById(explicitYearId);
            if (academicYear) {
                req.currentAcademicYear = academicYear;
                req.academicYearId = academicYear._id;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Năm học được chỉ định không tồn tại'
                });
            }
        } else {
            // Get current academic year
            const currentYear = await AcademicYear.getCurrentYear();
            if (!currentYear) {
                return res.status(400).json({
                    success: false,
                    message: 'Chưa có năm học hiện tại được thiết lập. Vui lòng liên hệ quản trị viên.'
                });
            }

            req.currentAcademicYear = currentYear;
            req.academicYearId = currentYear._id;
        }

        next();
    } catch (error) {
        console.error('Attach academic year error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xác định năm học'
        });
    }
};

// Middleware to ensure academic year context for data operations
const requireAcademicYearContext = (req, res, next) => {
    if (!req.academicYearId) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin năm học'
        });
    }
    next();
};

// Middleware to add academic year filter to query parameters
const addAcademicYearFilter = (req, res, next) => {
    // Add academicYearId to query for GET requests
    if (req.method === 'GET' && req.academicYearId) {
        req.query.academicYearId = req.academicYearId.toString();
    }

    // Add academicYearId to body for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.academicYearId) {
        if (!req.body.academicYearId) {
            req.body.academicYearId = req.academicYearId;
        }
    }

    next();
};

// Middleware to validate academic year access
const validateAcademicYearAccess = async (req, res, next) => {
    try {
        const { academicYearId } = req.params;

        if (academicYearId) {
            const academicYear = await AcademicYear.findById(academicYearId);

            if (!academicYear) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy năm học'
                });
            }

            // Check if user has permission to access this academic year
            // Admin and Manager can access all years
            // Staff can only access current year (can be extended based on requirements)
            if (req.user.role === 'staff' && !academicYear.isCurrent) {
                return res.status(403).json({
                    success: false,
                    message: 'Chỉ được truy cập năm học hiện tại'
                });
            }

            req.targetAcademicYear = academicYear;
        }

        next();
    } catch (error) {
        console.error('Validate academic year access error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi kiểm tra quyền truy cập năm học'
        });
    }
};

// Helper function to ensure academic year consistency
const ensureAcademicYearConsistency = (models) => {
    return async (req, res, next) => {
        try {
            // For operations that involve multiple related models
            // Ensure they all belong to the same academic year

            const { programId, organizationId, standardId, criteriaId } = req.body || req.query;
            const academicYearId = req.academicYearId;

            const checks = [];

            if (programId && models.includes('program')) {
                const { Program } = require('../models/Program');
                checks.push(
                    Program.findOne({ _id: programId, academicYearId })
                        .then(doc => ({ type: 'program', exists: !!doc }))
                );
            }

            if (organizationId && models.includes('organization')) {
                const { Organization } = require('../models/Program');
                checks.push(
                    Organization.findOne({ _id: organizationId, academicYearId })
                        .then(doc => ({ type: 'organization', exists: !!doc }))
                );
            }

            if (standardId && models.includes('standard')) {
                const { Standard } = require('../models/Program');
                checks.push(
                    Standard.findOne({ _id: standardId, academicYearId })
                        .then(doc => ({ type: 'standard', exists: !!doc }))
                );
            }

            if (criteriaId && models.includes('criteria')) {
                const { Criteria } = require('../models/Program');
                checks.push(
                    Criteria.findOne({ _id: criteriaId, academicYearId })
                        .then(doc => ({ type: 'criteria', exists: !!doc }))
                );
            }

            const results = await Promise.all(checks);
            const missingModels = results.filter(result => !result.exists);

            if (missingModels.length > 0) {
                const missingTypes = missingModels.map(m => m.type).join(', ');
                return res.status(400).json({
                    success: false,
                    message: `Các thực thể sau không tồn tại trong năm học hiện tại: ${missingTypes}`
                });
            }

            next();
        } catch (error) {
            console.error('Ensure academic year consistency error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống khi kiểm tra tính nhất quán năm học'
            });
        }
    };
};

// Middleware to switch academic year context (for admin/manager)
const switchAcademicYear = async (req, res, next) => {
    try {
        const { switchToYearId } = req.headers;

        if (switchToYearId && ['admin', 'manager'].includes(req.user.role)) {
            const academicYear = await AcademicYear.findById(switchToYearId);

            if (academicYear) {
                req.currentAcademicYear = academicYear;
                req.academicYearId = academicYear._id;
                req.isAcademicYearSwitched = true;
            }
        }

        next();
    } catch (error) {
        console.error('Switch academic year error:', error);
        next(); // Don't block request if switch fails
    }
};

// Middleware to log academic year context
const logAcademicYearContext = (req, res, next) => {
    if (req.currentAcademicYear && process.env.NODE_ENV !== 'production') {
        console.log(`Academic Year Context: ${req.currentAcademicYear.name} (${req.currentAcademicYear.code})`);
    }
    next();
};

module.exports = {
    attachCurrentAcademicYear,
    requireAcademicYearContext,
    addAcademicYearFilter,
    validateAcademicYearAccess,
    ensureAcademicYearConsistency,
    switchAcademicYear,
    logAcademicYearContext
};