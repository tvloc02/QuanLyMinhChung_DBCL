const AcademicYear = require('../models/system/AcademicYear');

const setAcademicYearContext = async (req, res, next) => {
    try {
        let academicYearId = req.query.academicYearId || req.body.academicYearId;

        if (!academicYearId) {
            const currentYear = await AcademicYear.getCurrentYear();
            if (!currentYear) {
                return res.status(400).json({
                    success: false,
                    message: 'Chưa có năm học nào được thiết lập làm năm học hiện tại. Vui lòng liên hệ admin.'
                });
            }
            academicYearId = currentYear._id;
            req.currentAcademicYear = currentYear;
        } else {
            const academicYear = await AcademicYear.findById(academicYearId);
            if (!academicYear) {
                return res.status(400).json({
                    success: false,
                    message: 'Năm học không tồn tại'
                });
            }
            req.currentAcademicYear = academicYear;
        }

        req.academicYearId = academicYearId;
        next();
    } catch (error) {
        console.error('Academic Year Middleware Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xác định năm học'
        });
    }
};

const setAcademicYearContextForAdmin = async (req, res, next) => {
    try {
        let academicYearId = req.query.academicYearId || req.body.academicYearId || req.params.academicYearId;

        if (academicYearId) {
            const academicYear = await AcademicYear.findById(academicYearId);
            if (!academicYear) {
                return res.status(400).json({
                    success: false,
                    message: 'Năm học không tồn tại'
                });
            }
            req.currentAcademicYear = academicYear;
            req.academicYearId = academicYearId;
        } else {
            const currentYear = await AcademicYear.getCurrentYear();
            if (!currentYear) {
                return res.status(400).json({
                    success: false,
                    message: 'Chưa có năm học nào được thiết lập làm năm học hiện tại'
                });
            }
            req.currentAcademicYear = currentYear;
            req.academicYearId = currentYear._id;
        }

        next();
    } catch (error) {
        console.error('Admin Academic Year Middleware Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xác định năm học'
        });
    }
};

const validateAcademicYearAccess = (req, res, next) => {
    if (req.user.role === 'admin') {
        return next();
    }

    const currentYear = req.currentAcademicYear;
    if (!currentYear || !currentYear.isCurrent) {
        return res.status(403).json({
            success: false,
            message: 'Chỉ được phép thao tác với năm học hiện tại'
        });
    }

    next();
};

const attachCurrentAcademicYear = async (req, res, next) => {
    try {
        let academicYearId = req.query.academicYearId || req.body.academicYearId || req.headers['x-academic-year'];

        if (academicYearId) {
            const academicYear = await AcademicYear.findById(academicYearId);
            if (!academicYear) {
                return res.status(400).json({
                    success: false,
                    message: 'Năm học không tồn tại'
                });
            }
            req.currentAcademicYear = academicYear;
            req.academicYearId = academicYearId;
        } else {
            const currentYear = await AcademicYear.getCurrentYear();
            if (!currentYear) {
                return res.status(400).json({
                    success: false,
                    message: 'Chưa có năm học hiện tại'
                });
            }
            req.currentAcademicYear = currentYear;
            req.academicYearId = currentYear._id;
        }

        next();
    } catch (error) {
        console.error('Attach Academic Year Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xác định năm học'
        });
    }
};

const addAcademicYearFilter = (req, res, next) => {
    if (!req.academicYearId && req.currentAcademicYear) {
        req.academicYearId = req.currentAcademicYear._id;
    }

    if (req.academicYearId) {
        if (!req.query.academicYearId) {
            req.query.academicYearId = req.academicYearId;
        }
        if (!req.body.academicYearId) {
            req.body.academicYearId = req.academicYearId;
        }

        req.academicYearFilter = { academicYear: req.academicYearId };
    }

    next();
};

const switchAcademicYear = async (req, res, next) => {
    try {
        const requestedYearId = req.query.academicYearId || req.body.academicYearId || req.headers['x-academic-year'];

        if (requestedYearId && (req.user.role === 'admin' || req.user.role === 'manager')) {
            const academicYear = await AcademicYear.findById(requestedYearId);
            if (!academicYear) {
                return res.status(400).json({
                    success: false,
                    message: 'Năm học không tồn tại'
                });
            }
            req.currentAcademicYear = academicYear;
            req.academicYearId = academicYear._id;
            req.academicYearSwitched = true;
        }

        next();
    } catch (error) {
        console.error('Switch Academic Year Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi chuyển năm học'
        });
    }
};

const ensureAcademicYearConsistency = (relations = []) => {
    return async (req, res, next) => {
        try {
            if (!req.academicYearId) {
                return next();
            }

            const body = req.body;
            const models = {
                program: require('../models/Evidence/Program'),
                organization: require('../models/Evidence/Organization'),
                standard: require('../models/Evidence/Standard'),
                criteria: require('../models/Evidence/Criteria')
            };

            for (const relation of relations) {
                const fieldId = `${relation}Id`;
                const entityId = body[fieldId] || req.params[fieldId] || req.query[fieldId];

                if (entityId && models[relation]) {
                    const Model = models[relation];
                    const entity = await Model.findById(entityId);

                    if (!entity) {
                        return res.status(404).json({
                            success: false,
                            message: `${relation} không tồn tại`
                        });
                    }

                    if (entity.academicYear && entity.academicYear.toString() !== req.academicYearId.toString()) {
                        return res.status(400).json({
                            success: false,
                            message: `${relation} không thuộc năm học hiện tại`
                        });
                    }
                }
            }

            next();
        } catch (error) {
            console.error('Ensure Academic Year Consistency Error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống khi kiểm tra tính nhất quán năm học'
            });
        }
    };
};

module.exports = {
    setAcademicYearContext,
    setAcademicYearContextForAdmin,
    validateAcademicYearAccess,
    attachCurrentAcademicYear,
    addAcademicYearFilter,
    switchAcademicYear,
    ensureAcademicYearConsistency
};