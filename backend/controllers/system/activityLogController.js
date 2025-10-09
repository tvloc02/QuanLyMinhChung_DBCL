const mongoose = require('mongoose');
const ActivityLog = require('../../models/system/ActivityLog');

const getActivityLogs = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            userId,
            action,
            targetType,
            severity,
            result,
            startDate,
            endDate,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const academicYearId = req.academicYearId;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = {};
        if (academicYearId) query.academicYearId = academicYearId;

        if (userId) query.userId = userId;
        if (action) query.action = action;
        if (targetType) query.targetType = targetType;
        if (severity) query.severity = severity;
        if (result) query.result = result;

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [logs, total] = await Promise.all([
            ActivityLog.find(query)
                .populate('userId', 'fullName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            ActivityLog.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    current: pageNum,
                    pages: Math.ceil(total / limitNum),
                    total,
                    hasNext: pageNum * limitNum < total,
                    hasPrev: pageNum > 1
                }
            }
        });

    } catch (error) {
        console.error('Get activity logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách nhật ký hoạt động'
        });
    }
};

const getActivityLogById = async (req, res) => {
    try {
        const { id } = req.params;

        const log = await ActivityLog.findById(id)
            .populate('userId', 'fullName email');

        if (!log) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhật ký hoạt động'
            });
        }

        res.json({
            success: true,
            data: log
        });

    } catch (error) {
        console.error('Get activity log by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin nhật ký hoạt động'
        });
    }
};

const getUserActivity = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 50, action, startDate, endDate } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            action,
            startDate,
            endDate
        };

        const result = await ActivityLog.getUserActivity(userId, options);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Get user activity error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy hoạt động của người dùng'
        });
    }
};

const getActivityStats = async (req, res) => {
    try {
        const { userId, action, startDate, endDate } = req.query;
        const academicYearId = req.academicYearId;

        const filters = {
            userId,
            academicYearId,
            action,
            startDate,
            endDate
        };

        const stats = await ActivityLog.getActivityStats(filters);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Get activity stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê hoạt động'
        });
    }
};

const getAuditTrail = async (req, res) => {
    try {
        const { targetType, targetId } = req.params;

        const auditLogs = await ActivityLog.getAuditTrail(targetType, targetId);

        res.json({
            success: true,
            data: auditLogs
        });

    } catch (error) {
        console.error('Get audit trail error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy audit trail'
        });
    }
};

const cleanupOldLogs = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin mới có quyền dọn dẹp logs'
            });
        }

        const { daysToKeep = 730 } = req.body;

        const result = await ActivityLog.cleanupOldLogs(daysToKeep);

        res.json({
            success: true,
            message: `Đã xóa ${result.deletedCount} logs cũ`,
            data: { deletedCount: result.deletedCount }
        });

    } catch (error) {
        console.error('Cleanup old logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi dọn dẹp logs cũ'
        });
    }
};

const exportActivityLogs = async (req, res) => {
    try {
        const { format = 'csv', ...filters } = req.query;
        filters.academicYearId = req.academicYearId;

        const logs = await ActivityLog.find(filters)
            .populate('userId', 'fullName email')
            .sort({ createdAt: -1 });

        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename="activity_logs.json"');
            res.json(logs);
        } else {
            const csv = logs.map(log => ({
                'Thời gian': log.createdAt.toISOString(),
                'Người dùng': log.userId?.fullName || 'N/A',
                'Hoạt động': log.actionText,
                'Mô tả': log.description,
                'Mức độ': log.severityText,
                'Kết quả': log.resultText,
                'IP': log.requestInfo?.ipAddress || 'N/A'
            }));

            const csvContent = [
                Object.keys(csv[0]).join(','),
                ...csv.map(row => Object.values(row).map(val => `"${val}"`).join(','))
            ].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="activity_logs.csv"');
            res.send(csvContent);
        }

    } catch (error) {
        console.error('Export activity logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi export logs'
        });
    }
};

module.exports = {
    getActivityLogs,
    getActivityLogById,
    getUserActivity,
    getActivityStats,
    getAuditTrail,
    cleanupOldLogs,
    exportActivityLogs
};