const mongoose = require('mongoose');
const Report = require('../../models/report/Report');

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

        let standardCode = '';
        let criteriaCode = '';

        if (standardId) {
            try {
                const StandardModel = mongoose.model('Standard');
                const standard = await StandardModel.findById(standardId).select('code');
                standardCode = standard?.code || '';
            } catch (error) {
                console.error('Error fetching standard code:', error);
            }
        }

        if (criteriaId) {
            try {
                const CriteriaModel = mongoose.model('Criteria');
                const criteria = await CriteriaModel.findById(criteriaId).select('code');
                criteriaCode = criteria?.code || '';
            } catch (error) {
                console.error('Error fetching criteria code:', error);
            }
        }

        const code = await Report.generateCode(
            type,
            academicYearId,
            standardCode,
            criteriaCode
        );

        const reportData = {
            academicYearId,
            title: title.trim(),
            code,
            type,
            programId,
            organizationId,
            contentMethod: contentMethod || 'online_editor',
            summary: summary?.trim() || '',
            keywords: keywords || [],
            createdBy: req.user.id,
            updatedBy: req.user.id
        };

        if (standardId) {
            reportData.standardId = standardId;
        }

        if (criteriaId) {
            reportData.criteriaId = criteriaId;
        }

        if (contentMethod === 'online_editor') {
            if (!content || content.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Nội dung báo cáo là bắt buộc khi dùng trình soạn thảo trực tuyến'
                });
            }
            reportData.content = content.trim();
        } else {
            reportData.content = '';
        }

        const report = new Report(reportData);
        await report.save();

        if (reportData.content && reportData.content.length > 0) {
            try {
                await report.linkEvidences();
                await report.save();
            } catch (error) {
                console.error('Error linking evidences:', error);
            }
        }

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
        console.error('Error stack:', error.stack);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Mã báo cáo đã tồn tại'
            });
        }

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi hệ thống khi tạo báo cáo'
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

        // Bỏ kiểm tra quyền: Ai cũng có thể update báo cáo
        /*
        if (!report.canEdit(req.user.id, req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền cập nhật báo cáo này'
            });
        }
        */

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

        const Assignment = require('../../models/report/Assignment');
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

        const report = await Report.findOne({ _id: id, academicYearId })
            .populate('attachedFile');

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

        if (report.contentMethod === 'online_editor') {
            if (!report.content || report.content.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Báo cáo phải có nội dung trước khi xuất bản'
                });
            }
        } else if (report.contentMethod === 'file_upload') {
            if (!report.attachedFile) {
                return res.status(400).json({
                    success: false,
                    message: 'Báo cáo phải có file đính kèm trước khi xuất bản'
                });
            }
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

        const report = await Report.findOne({ _id: id, academicYearId });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo'
            });
        }

        // Lấy danh sách ID minh chứng đã liên kết
        const evidenceIds = report.referencedEvidences.map(ref => ref.evidenceId);

        const Evidence = mongoose.model('Evidence');

        // Populate chi tiết các minh chứng theo ID
        const evidences = await Evidence.find({ _id: { $in: evidenceIds } })
            .populate('files', 'originalName size approvalStatus')
            .select('code name description files status')
            .lean();

        // Xây dựng lại mảng kết quả với thông tin đầy đủ
        const evidencesMap = new Map(evidences.map(e => [e._id.toString(), e]));

        const evidencesData = report.referencedEvidences
            .map(ref => {
                const evidenceDetails = evidencesMap.get(ref.evidenceId.toString());

                if (!evidenceDetails) return null;

                return {
                    evidenceId: evidenceDetails._id,
                    linkedText: ref.linkedText,
                    contextText: ref.contextText,

                    // Thêm chi tiết minh chứng đã được populate
                    evidenceDetails: {
                        code: evidenceDetails.code,
                        name: evidenceDetails.name,
                        description: evidenceDetails.description,
                        status: evidenceDetails.status,
                        files: evidenceDetails.files,
                        fileCount: evidenceDetails.files.length
                    }
                };
            })
            .filter(item => item !== null); // Loại bỏ các minh chứng không tìm thấy


        res.json({
            success: true,
            data: evidencesData
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

const addReviewer = async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewerId, reviewerType } = req.body;
        const academicYearId = req.academicYearId;

        const report = await Report.findOne({ _id: id, academicYearId });
        if (!report) return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo' });

        if (!report.canEdit(req.user.id, req.user.role)) {
            return res.status(403).json({ success: false, message: 'Không có quyền phân quyền' });
        }

        await report.addReviewer(reviewerId, reviewerType, req.user.id);
        res.json({ success: true, message: 'Thêm reviewer thành công', data: report.accessControl });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi thêm reviewer' });
    }
};

const removeReviewer = async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewerId, reviewerType } = req.body;
        const academicYearId = req.academicYearId;

        const report = await Report.findOne({ _id: id, academicYearId });
        if (!report) return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo' });

        await report.removeReviewer(reviewerId, reviewerType);
        res.json({ success: true, message: 'Xóa reviewer thành công', data: report.accessControl });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi xóa reviewer' });
    }
};

const addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { comment, section } = req.body;
        const academicYearId = req.academicYearId;

        const report = await Report.findOne({ _id: id, academicYearId });
        if (!report) return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo' });

        const access = report.canAccess(req.user.id, req.user.role);
        if (!access.canComment) {
            return res.status(403).json({ success: false, message: 'Không có quyền bình luận' });
        }

        await report.addComment(req.user.id, access.role || 'expert', comment, section);
        res.json({ success: true, message: 'Thêm nhận xét thành công', data: report.reviewerComments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi thêm nhận xét' });
    }
};

const resolveComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const academicYearId = req.academicYearId;

        const report = await Report.findOne({ _id: id, academicYearId });
        if (!report) return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo' });

        if (!report.canEdit(req.user.id, req.user.role)) {
            return res.status(403).json({ success: false, message: 'Không có quyền xử lý nhận xét' });
        }

        await report.resolveComment(commentId, req.user.id);
        res.json({ success: true, message: 'Đã xử lý nhận xét', data: report.reviewerComments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi xử lý nhận xét' });
    }
};

const validateEvidenceLinks = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const report = await Report.findOne({ _id: id, academicYearId });
        if (!report) return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo' });

        const result = await report.validateEvidenceLinks();
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi kiểm tra liên kết minh chứng' });
    }
};

const uploadReportFile = async (req, res) => {
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
                message: 'Không có quyền upload file cho báo cáo này'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy file'
            });
        }

        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!allowedMimeTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: 'Chỉ chấp nhận file PDF hoặc Word'
            });
        }

        const File = require('../../models/evidence/file');

        const fileRecord = new File({
            originalName: req.file.originalname,
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            uploadedBy: req.user.id,
            academicYearId
        });

        await fileRecord.save();

        report.attachedFile = fileRecord._id;
        report.contentMethod = 'file_upload';
        report.updatedBy = req.user.id;

        await report.save();

        await report.populate('attachedFile');

        res.json({
            success: true,
            message: 'Upload file thành công',
            data: {
                file: fileRecord,
                report: report
            }
        });

    } catch (error) {
        console.error('Upload report file error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi upload file'
        });
    }
};

const downloadReportFile = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const report = await Report.findOne({ _id: id, academicYearId })
            .populate('attachedFile');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo'
            });
        }

        if (!report.canView(req.user.id, req.user.role, req.user.standardAccess, req.user.criteriaAccess)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền tải file báo cáo này'
            });
        }

        if (!report.attachedFile) {
            return res.status(404).json({
                success: false,
                message: 'Báo cáo không có file đính kèm'
            });
        }

        const fs = require('fs');
        const path = require('path');

        const filePath = path.resolve(report.attachedFile.path);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File không tồn tại'
            });
        }

        await report.incrementDownload();

        res.download(filePath, report.attachedFile.originalName);

    } catch (error) {
        console.error('Download report file error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tải file'
        });
    }
};

const convertFileToContent = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const report = await Report.findOne({ _id: id, academicYearId })
            .populate('attachedFile');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo'
            });
        }

        if (!report.canEdit(req.user.id, req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền chuyển đổi nội dung báo cáo này'
            });
        }

        if (!report.attachedFile) {
            return res.status(404).json({
                success: false,
                message: 'Báo cáo không có file đính kèm để chuyển đổi'
            });
        }

        const mammoth = require('mammoth');
        const pdfParse = require('pdf-parse');
        const fs = require('fs');
        const path = require('path');

        const filePath = path.resolve(report.attachedFile.path);
        const fileBuffer = fs.readFileSync(filePath);

        let htmlContent = '';

        if (report.attachedFile.mimetype === 'application/pdf') {
            const data = await pdfParse(fileBuffer);
            htmlContent = data.text
                .split('\n\n')
                .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
                .join('\n');
        } else if (
            report.attachedFile.mimetype === 'application/msword' ||
            report.attachedFile.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
            const result = await mammoth.convertToHtml({ buffer: fileBuffer });
            htmlContent = result.value;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Định dạng file không được hỗ trợ'
            });
        }

        report.content = htmlContent;
        report.contentMethod = 'online_editor';
        report.updatedBy = req.user.id;

        await report.linkEvidences();
        await report.save();

        res.json({
            success: true,
            message: 'Chuyển đổi file sang nội dung thành công',
            data: {
                content: htmlContent
            }
        });

    } catch (error) {
        console.error('Convert file to content error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi chuyển đổi file'
        });
    }
};

const bulkAddReviewers = async (req, res) => {
    try {
        const { reportIds, reviewers } = req.body;
        const academicYearId = req.academicYearId;

        if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách báo cáo không hợp lệ'
            });
        }

        if (!reviewers || !Array.isArray(reviewers) || reviewers.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách người đánh giá không hợp lệ'
            });
        }

        const reports = await Report.find({
            _id: { $in: reportIds },
            academicYearId
        });

        if (reports.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo trong năm học này'
            });
        }

        // Kiểm tra quyền
        const unauthorizedReports = reports.filter(report =>
            !report.canEdit(req.user.id, req.user.role)
        );

        if (unauthorizedReports.length > 0) {
            return res.status(403).json({
                success: false,
                message: `Không có quyền phân quyền cho ${unauthorizedReports.length} báo cáo`
            });
        }

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        // Thêm reviewer cho từng báo cáo
        for (const report of reports) {
            try {
                for (const reviewer of reviewers) {
                    await report.addReviewer(
                        reviewer.reviewerId,
                        reviewer.reviewerType,
                        req.user.id
                    );
                }
                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    reportId: report._id,
                    reportCode: report.code,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: `Đã phân quyền thành công cho ${results.success}/${reports.length} báo cáo`,
            data: results
        });

    } catch (error) {
        console.error('Bulk add reviewers error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi phân quyền hàng loạt'
        });
    }
};

const bulkRemoveReviewers = async (req, res) => {
    try {
        const { reportIds, reviewerId, reviewerType } = req.body;
        const academicYearId = req.academicYearId;

        if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách báo cáo không hợp lệ'
            });
        }

        const reports = await Report.find({
            _id: { $in: reportIds },
            academicYearId
        });

        const results = {
            success: 0,
            failed: 0
        };

        for (const report of reports) {
            try {
                await report.removeReviewer(reviewerId, reviewerType);
                results.success++;
            } catch (error) {
                results.failed++;
            }
        }

        res.json({
            success: true,
            message: `Đã xóa quyền thành công cho ${results.success}/${reports.length} báo cáo`,
            data: results
        });

    } catch (error) {
        console.error('Bulk remove reviewers error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa quyền hàng loạt'
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
    getReportStats,
    addReviewer,
    removeReviewer,
    addComment,
    resolveComment,
    validateEvidenceLinks,
    uploadReportFile,
    downloadReportFile,
    convertFileToContent,
    bulkAddReviewers,
    bulkRemoveReviewers
};