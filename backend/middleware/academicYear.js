const AcademicYear = require('../models/AcademicYear');

/**
 * Middleware để set academic year context
 * Sẽ attach academicYearId và currentAcademicYear vào req object
 */
const setAcademicYearContext = async (req, res, next) => {
    try {
        // Kiểm tra nếu có academicYearId trong query params hoặc body
        let academicYearId = req.query.academicYearId || req.body.academicYearId;

        // Nếu không có, lấy academic year hiện tại
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
            // Validate academic year exists
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

/**
 * Middleware chỉ dành cho admin - có thể thao tác với bất kỳ academic year nào
 */
const setAcademicYearContextForAdmin = async (req, res, next) => {
    try {
        // Admin có thể chỉ định academicYearId cụ thể
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
            // Nếu không chỉ định, dùng năm học hiện tại
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

/**
 * Middleware để validate quyền truy cập academic year
 */
const validateAcademicYearAccess = (req, res, next) => {
    // Admin có quyền truy cập tất cả
    if (req.user.role === 'admin') {
        return next();
    }

    // Các role khác chỉ được truy cập năm học hiện tại
    const currentYear = req.currentAcademicYear;
    if (!currentYear || !currentYear.isCurrent) {
        return res.status(403).json({
            success: false,
            message: 'Chỉ được phép thao tác với năm học hiện tại'
        });
    }

    next();
};

module.exports = {
    setAcademicYearContext,
    setAcademicYearContextForAdmin,
    validateAcademicYearAccess
};