const mongoose = require('mongoose');
const Report = require('../models/report/Report');
const { Standard, Criteria } = require('../models/Evidence/Program');

const getReports = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            type,
            status,
            programId,
            organizationId,
            standardId,
            criteriaId,
            createdBy,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const academicYearId = req.academicYearId;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = { academicYearId };

        if (req.user.role !== 'admin') {
            const userAccessQuery = {
                $or: [
                    { createdBy: req.user.id },
                    { status: 'published' }
                ]
            };

            if (req.user.standardAccess && req.user.standardAccess.length > 0) {
                userAccessQuery.$or.push({ standardId: { $in: req.user.standardAccess } });
            }
            if (req.user.criteriaAccess && req.user.criteriaAccess.length > 0) {
                userAccessQuery.$or.push({ criteriaId: { $in: req.user.criteriaAccess } });
            }

            query = { ...query, ...userAccessQuery };
        }

        if (search) {
            query.$and = query.$and || [];
            query.$and.push({
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { code: { $regex: search, $options: 'i' } },
                    { summary: { $regex: search, $options: 'i' } }
                ]
            });
        }

        if (type) query.type = type;
        if (status) query.status = status;
        if (programId) query.programId = programId;
        if (organizationId) query.organizationId = organizationId;
        if (standardId) query.standardId = standardId;
        if (criteriaId) query.criteriaId = criteriaId;
        if (createdBy) query.createdBy = createdBy;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [reports, total] = await Promise.all([
            Report.find(query)
                .populate('academicYearId', 'name code')
                .populate('programId', 'name code')
                .populate('organizationId', 'name code')
                .populate('standardId', 'name code')
                .populate('criteriaId', 'name code')
                .populate('createdBy', 'fullName email')
                .populate('attachedFile', 'originalName size')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            Report.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                reports,
                pagination: {
                    current: pageNum,
                    pages: Math.ceil(total / limitNum),
                    total,
                    hasNext: pageNum * limitNum < total,
                    hasPrev: pageNum > 1
                },
                academicYear: req.currentAcademicYear
            }
        });

    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách báo cáo'
        });
    }
};

const getReportById = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const report = await Report.findOne({ _id: id, academicYearId })
            .populate('academicYearId', 'name code')
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .populate('createdBy', 'fullName email')
            .populate('updatedBy', 'fullName email')
            .populate('attachedFile')
            .populate({
                path: 'referencedEvidences.evidenceId',
                select: 'code name'
            })
            .populate({
                path: 'versions.changedBy',
                select: 'fullName email'
            });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo trong năm học này'
            });
        }

        if (!report.canView(req.user.id, req.user.role, req.user.standardAccess, req.user.criteriaAccess)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xem báo cáo này'
            });
        }

        await report.incrementView();

        res.json({
            success: true,
            data: report
        });

    } catch (error) {
        console.error('Get report by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin báo cáo'
        });
    }
};

const createReport = async (req, res) => {
    try {
        const {
            title,
            type,
            programId,
            organizationId,
            standardId,
            criteriaId,
            content,
            contentMethod,
            summary,
            keywords
        } = req.body;

        const academicYearId = req.academicYearId;

        const [standard, criteria] = await Promise.all([
            standardId ? Standard.findOne({ _id: standardId, academicYearId }) : null,
            criteriaId ? Criteria.findOne({ _id: criteriaId, academicYearId }) : null
        ]);

        if (standardId && !standard) {
            return res.status(400).json({
                success: false,
                message: 'Tiêu chuẩn không tồn tại trong năm học này'
            });
        }

        if (criteriaId && !criteria) {
            return res.status(400).json({
                success: false,
                message: 'Tiêu chí không tồn tại trong năm học này'
            });
        }

        const code = await Report.generateCode(
            type,
            academicYearId,
            standard?.code,
            criteria?.code
        );

        const report = new Report({
            academicYearId,
            title: title.trim(),
            code,
            type,
            programId,
            organizationId,
            standardId,
            criteriaId,
            content: content?.trim(),
            contentMethod: contentMethod || 'online_editor',
            summary: summary?.trim(),
            keywords: keywords || [],
            createdBy: req.user.id,
            updatedBy: req.user.id
        });

        await report.save();

        await report.linkEvidences();
        await report.save();

        await report.populate([
            { path: 'academicYearId', select: 'name code' },
            { path: 'programId', select: 'name code' },
            { path: 'organizationId', select: 'name code' },
            { path: 'standardId', select: 'name code' },
            { path: 'criteriaId', select: 'name code' },
            { path: 'createdBy', select: 'fullName email' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Tạo báo cáo thành công',
            data: report
        });

    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo báo cáo'
        });
    }
};

const updateReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, changeNote, ...updateData } = req.body;
        const academicYearId = req.academicYearId;

        const report = await Report.findOne({ _id: id, academicYearId });
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo trong năm học này'
            });
        }

        if (!report.canEdit(req.user.id, req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền cập nhật báo cáo này'
            });
        }

        if (content && content !== report.content) {
            await report.addVersion(content, req.user.id, changeNote);
        }

        const allowedFields = [
            'title', 'summary', 'keywords', 'contentMethod'
        ];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                report[field] = updateData[field];
            }
        });

        report.updatedBy = req.user.id;

        await report.linkEvidences();
        await report.save();

        await report.populate([
            { path: 'academicYearId', select: 'name code' },
            { path: 'programId', select: 'name code' },
            { path: 'organizationId', select: 'name code' },
            { path: 'standardId', select: 'name code' },
            { path: 'criteriaId', select: 'name code' },
            { path: 'updatedBy', select: 'fullName email' }
        ]);

        res.json({
            success: true,
            message: 'Cập nhật báo cáo thành công',
            data: report
        });

    } catch (error) {
        console.error('Update report error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật báo cáo'
        });
    }
};

const deleteReport = async (req, res) => {
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

        if (!report.canEdit(req.user.id, req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xóa báo cáo này'
            });
        }

        if (report.status === 'published') {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa báo cáo đã xuất bản'
            });
        }

        const Assignment = require('../models/report/Assignment');
        const assignmentCount = await Assignment.countDocuments({ reportId: id });

        if (assignmentCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa báo cáo đã có phân công đánh giá'
            });
        }

        report.updatedBy = req.user.id;
        await Report.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Xóa báo cáo thành công'
        });

    } catch (error) {
        console.error('Delete report error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa báo cáo'
        });
    }
};

const publishReport = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const report = await Report.findOne({ _id: id, academicYearId });
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo'
            });
        }

        if (!report.canEdit(req.user.id, req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xuất bản báo cáo này'
            });
        }

        if (report.status === 'published') {
            return res.status(400).json({
                success: false,
                message: 'Báo cáo đã được xuất bản'
            });
        }

        if (!report.content || report.content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Báo cáo phải có nội dung trước khi xuất bản'
            });
        }

        await report.publish(req.user.id);

        res.json({
            success: true,
            message: 'Xuất bản báo cáo thành công',
            data: report
        });

    } catch (error) {
        console.error('Publish report error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xuất bản báo cáo'
        });
    }
};

const downloadReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { format = 'pdf' } = req.query;
        const academicYearId = req.academicYearId;

        const report = await Report.findOne({ _id: id, academicYearId })
            .populate('programId', 'name')
            .populate('organizationId', 'name')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .populate('createdBy', 'fullName');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo'
            });
        }

        if (!report.canView(req.user.id, req.user.role, req.user.standardAccess, req.user.criteriaAccess)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền tải báo cáo này'
            });
        }

        await report.incrementDownload();

        if (format === 'html') {
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>${report.title}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                        h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
                        .meta { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
                        .content { margin-top: 30px; }
                    </style>
                </head>
                <body>
                    <h1>${report.title}</h1>
                    <div class="meta">
                        <p><strong>Mã báo cáo:</strong> ${report.code}</p>
                        <p><strong>Loại:</strong> ${report.typeText}</p>
                        <p><strong>Người tạo:</strong> ${report.createdBy.fullName}</p>
                        <p><strong>Ngày tạo:</strong> ${report.createdAt.toLocaleDateString('vi-VN')}</p>
                        ${report.summary ? `<p><strong>Tóm tắt:</strong> ${report.summary}</p>` : ''}
                    </div>
                    <div class="content">
                        ${report.content}
                    </div>
                </body>
                </html>
            `;

            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${report.code}-${report.title}.html"`);
            res.send(htmlContent);
        } else {
            res.status(400).json({
                success: false,
                message: 'Định dạng tải về không được hỗ trợ'
            });
        }

    } catch (error) {
        console.error('Download report error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tải báo cáo'
        });
    }
};

const getReportVersions = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const report = await Report.findOne({ _id: id, academicYearId }, 'versions')
            .populate('versions.changedBy', 'fullName email');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo'
            });
        }

        res.json({
            success: true,
            data: report.versions
        });

    } catch (error) {
        console.error('Get report versions error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy phiên bản báo cáo'
        });
    }
};

const getReportEvidences = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const report = await Report.findOne({ _id: id, academicYearId })
            .populate({
                path: 'referencedEvidences.evidenceId',
                select: 'code name description files',
                populate: {
                    path: 'files',
                    select: 'originalName size'
                }
            });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo'
            });
        }

        res.json({
            success: true,
            data: report.referencedEvidences
        });

    } catch (error) {
        console.error('Get report evidences error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy minh chứng báo cáo'
        });
    }
};

const getReportStats = async (req, res) => {
    try {
        const { type, status, programId, organizationId } = req.query;
        const academicYearId = req.academicYearId;

        let matchStage = { academicYearId: mongoose.Types.ObjectId(academicYearId) };
        if (type) matchStage.type = type;
        if (status) matchStage.status = status;
        if (programId) matchStage.programId = mongoose.Types.ObjectId(programId);
        if (organizationId) matchStage.organizationId = mongoose.Types.ObjectId(organizationId);

        const stats = await Report.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalReports: { $sum: 1 },
                    draftReports: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
                    publishedReports: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
                    totalViews: { $sum: '$metadata.viewCount' },
                    totalDownloads: { $sum: '$metadata.downloadCount' },
                    averageWordCount: { $avg: '$wordCount' }
                }
            }
        ]);

        const typeStats = await Report.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        const result = stats[0] || {
            totalReports: 0,
            draftReports: 0,
            publishedReports: 0,
            totalViews: 0,
            totalDownloads: 0,
            averageWordCount: 0
        };

        res.json({
            success: true,
            data: {
                ...result,
                typeStats,
                academicYear: req.currentAcademicYear
            }
        });

    } catch (error) {
        console.error('Get report stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê báo cáo'
        });
    }
};

module.exports = {
    getReports,
    getReportById,
    createReport,
    updateReport,
    deleteReport,
    publishReport,
    downloadReport,
    getReportVersions,
    getReportEvidences,
    getReportStats
};