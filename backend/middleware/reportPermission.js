const Report = require('../models/report/Report');

const checkReportViewPermission = async (req, res, next) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const report = await Report.findOne({ _id: id, academicYearId });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo trong năm học này'
            });
        }

        // Kiểm tra quyền xem
        const canView = report.canView(
            req.user.id,
            req.user.role,
            req.user.standardAccess || [],
            req.user.criteriaAccess || []
        );

        if (!canView) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem báo cáo này'
            });
        }

        // Lưu report vào request để sử dụng ở controller
        req.report = report;
        next();

    } catch (error) {
        console.error('Check report view permission error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra quyền truy cập'
        });
    }
};

const checkReportEditPermission = async (req, res, next) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const report = await Report.findOne({ _id: id, academicYearId });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo trong năm học này'
            });
        }

        // Kiểm tra quyền edit
        const canEdit = report.canEdit(req.user.id, req.user.role);

        if (!canEdit) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền chỉnh sửa báo cáo này'
            });
        }

        req.report = report;
        next();

    } catch (error) {
        console.error('Check report edit permission error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra quyền truy cập'
        });
    }
};

const checkReportCommentPermission = async (req, res, next) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const report = await Report.findOne({ _id: id, academicYearId });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo trong năm học này'
            });
        }

        // Kiểm tra quyền comment
        const canComment = report.canComment(req.user.id, req.user.role);

        if (!canComment) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền bình luận báo cáo này'
            });
        }

        req.report = report;
        next();

    } catch (error) {
        console.error('Check report comment permission error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra quyền truy cập'
        });
    }
};

const checkReportEvaluatePermission = async (req, res, next) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const report = await Report.findOne({ _id: id, academicYearId });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo trong năm học này'
            });
        }

        // Kiểm tra quyền evaluate
        const canEvaluate = report.canEvaluate(req.user.id, req.user.role);

        if (!canEvaluate) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền đánh giá báo cáo này'
            });
        }

        req.report = report;
        next();

    } catch (error) {
        console.error('Check report evaluate permission error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra quyền truy cập'
        });
    }
};

module.exports = {
    checkReportViewPermission,
    checkReportEditPermission,
    checkReportCommentPermission,
    checkReportEvaluatePermission
};