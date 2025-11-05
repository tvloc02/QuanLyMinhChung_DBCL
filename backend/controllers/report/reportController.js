const mongoose = require('mongoose');
const Report = require('../../models/report/Report');
const Task = require("../../models/Task/Task");

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

        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            const userAccessQuery = {
                $or: [
                    { createdBy: req.user.id },
                    { status: 'public' },
                    { status: 'published' },
                    { assignedReporters: req.user.id }
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
                .populate('assignedReporters', 'fullName email')
                .populate({
                    path: 'evaluations',
                    select: 'averageScore rating status',
                    populate: { path: 'evaluatorId', select: 'fullName email' }
                })
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
            .populate('assignedReporters', 'fullName email')
            .populate({
                path: 'evaluations',
                select: 'averageScore rating status evaluatorId',
                populate: {
                    path: 'evaluatorId',
                    select: 'fullName email'
                }
            });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo trong năm học này'
            });
        }

        await report.incrementView(req.user.id);

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
            keywords,
            linkedCriteriaReports // Thêm trường mới
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
            status: 'draft',
            createdBy: req.user.id,
            updatedBy: req.user.id,
            assignedReporters: [req.user.id],
            // Lưu thông tin báo cáo tiêu chí gắn kèm
            linkedCriteriaReports: linkedCriteriaReports || []
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
            reportData.content = processEvidenceLinksInContent(content);
        } else {
            reportData.content = '';
        }

        const report = new Report(reportData);
        await report.save();

        await report.populate([
            { path: 'academicYearId', select: 'name code' },
            { path: 'programId', select: 'name code' },
            { path: 'organizationId', select: 'name code' },
            { path: 'standardId', select: 'name code' },
            { path: 'criteriaId', select: 'name code' },
            { path: 'createdBy', select: 'fullName email' },
            { path: 'assignedReporters', select: 'fullName email' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Tạo báo cáo thành công',
            data: report
        });

    } catch (error) {
        console.error('Create report error:', error);

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
        const { content, linkedCriteriaReports, ...updateData } = req.body; // Lấy linkedCriteriaReports
        const academicYearId = req.academicYearId;
        const userId = req.user.id;

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
                message: 'Không có quyền chỉnh sửa báo cáo này'
            });
        }

        // ⭐️ LOGIC GHI LẠI PHIÊN BẢN CHỈNH SỬA
        // 1. Lấy nội dung cũ trước khi thay đổi
        const oldContent = report.content;
        const oldTitle = report.title;

        const allowedFields = ['title', 'summary', 'keywords', 'contentMethod'];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                report[field] = updateData[field];
            }
        });

        if (linkedCriteriaReports !== undefined) {
            report.linkedCriteriaReports = linkedCriteriaReports;
        }

        if (content !== undefined) {
            report.content = processEvidenceLinksInContent(content);
        }

        // 2. So sánh và thêm phiên bản (giả định bạn có phương thức addVersion trên model)
        if (report.content !== oldContent || report.title !== oldTitle) {
            const changeNote = `Cập nhật nội dung/tiêu đề từ phiên bản trước.`;
            // Cần lưu nội dung cũ vào versions/history
            if (report.addVersion && typeof report.addVersion === 'function') {
                // Lưu snapshot của nội dung cũ
                await report.addVersion({
                    content: oldContent,
                    title: oldTitle,
                    changeNote: changeNote,
                    changedBy: userId
                });
            } else {
                console.warn("Report model does not have addVersion method. History tracking skipped.");
            }
        }


        report.updatedBy = req.user.id;
        await report.save();

        await report.populate([
            { path: 'academicYearId', select: 'name code' },
            { path: 'programId', select: 'name code' },
            { path: 'organizationId', select: 'name code' },
            { path: 'standardId', select: 'name code' },
            { path: 'criteriaId', select: 'name code' },
            { path: 'updatedBy', select: 'fullName email' },
            { path: 'assignedReporters', select: 'fullName email' }
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

const getReportsByStandardCriteria = async (req, res) => {
    try {
        const { reportType, standardId, criteriaId, programId, organizationId } = req.query;
        const academicYearId = req.academicYearId;
        const userId = req.user.id;

        if (!standardId || !reportType) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin Tiêu chuẩn và Loại báo cáo'
            });
        }

        let query = {
            academicYearId,
            type: reportType,
            standardId,
            status: { $in: ['draft', 'public', 'published'] }
        };

        if (criteriaId && reportType === 'criteria') {
            query.criteriaId = criteriaId;
        }

        // Dùng permissionService để xác định quyền tạo mới
        const permissionService = require('../../services/permissionService');
        const canWriteReport = await permissionService.canWriteReport(userId, reportType, academicYearId);

        const reports = await Report.find(query)
            .populate('createdBy', 'fullName email')
            .populate('assignedReporters', 'fullName email')
            .sort({ createdAt: -1 });

        const reportsWithCanEdit = reports.map(r => {
            const isCreatedByMe = r.createdBy?._id?.toString() === userId.toString();
            const isAssigned = r.assignedReporters.map(r => r._id.toString()).includes(userId.toString());
            return {
                ...r.toObject(),
                createdBy: r.createdBy ? { ...r.createdBy.toObject(), fullName: isCreatedByMe ? 'Bạn' : r.createdBy.fullName } : null,
                assignedReporters: r.assignedReporters.map(r => r._id.toString() === userId.toString() ? { ...r.toObject(), fullName: 'Bạn' } : r.toObject()),
            };
        });

        res.json({
            success: true,
            data: {
                reports: reportsWithCanEdit,
                canCreateNew: canWriteReport, // Người dùng có quyền viết báo cáo thì có quyền tạo mới
                canWriteReport: canWriteReport,
                task: null
            }
        });

    } catch (error) {
        console.error('Get reports by standard/criteria error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách báo cáo'
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

        if (['public', 'approved', 'published'].includes(report.status)) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa báo cáo đã công khai hoặc được phê duyệt'
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

const unpublishReport = async (req, res) => {
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
                message: 'Không có quyền thu hồi báo cáo này'
            });
        }

        if (report.status !== 'published') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể thu hồi báo cáo đã xuất bản'
            });
        }

        await report.unpublish(req.user.id);

        res.json({
            success: true,
            message: 'Thu hồi xuất bản báo cáo thành công',
            data: report
        });

    } catch (error) {
        console.error('Unpublish report error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi thu hồi báo cáo'
        });
    }
};

const approveReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { feedback } = req.body;
        const academicYearId = req.academicYearId;

        const report = await Report.findOne({ _id: id, academicYearId })
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo'
            });
        }

        if (req.user.role !== 'manager' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ Manager hoặc Admin có quyền phê duyệt báo cáo'
            });
        }

        report.status = 'approved';
        report.approvedBy = req.user.id;
        report.approvedAt = new Date();
        if (feedback) {
            report.approvalFeedback = feedback;
        }
        report.updatedBy = req.user.id;

        await report.save();

        // Update evidence status if reject to approved transition
        if (report.criteriaId) {
            try {
                const Evidence = require('../../models/Evidence/Evidence');
                await Evidence.updateMany(
                    { criteriaId: report.criteriaId, academicYearId },
                    { status: 'approved' }
                );
            } catch (err) {
                console.error('Failed to update evidence status:', err);
            }
        }

        res.json({
            success: true,
            message: 'Phê duyệt báo cáo thành công',
            data: report
        });

    } catch (error) {
        console.error('Approve report error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi phê duyệt báo cáo'
        });
    }
};

const rejectReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { feedback } = req.body;
        const academicYearId = req.academicYearId;

        const report = await Report.findOne({ _id: id, academicYearId })
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo'
            });
        }

        if (req.user.role !== 'manager' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ Manager hoặc Admin có quyền từ chối báo cáo'
            });
        }

        await report.recordRejection(req.user.id, feedback);

        // Update evidence status to rejected
        if (report.criteriaId) {
            try {
                const Evidence = require('../../models/Evidence/Evidence');
                await Evidence.updateMany(
                    { criteriaId: report.criteriaId, academicYearId },
                    { status: 'rejected', rejectionReason: feedback }
                );
            } catch (err) {
                console.error('Failed to update evidence status:', err);
            }
        }

        res.json({
            success: true,
            message: 'Từ chối báo cáo thành công',
            data: report
        });

    } catch (error) {
        console.error('Reject report error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi từ chối báo cáo'
        });
    }
};

const assignReporter = async (req, res) => {
    try {
        const { id } = req.params;
        const { reporterIds } = req.body;
        const academicYearId = req.academicYearId;

        const report = await Report.findOne({ _id: id, academicYearId });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo'
            });
        }

        if (req.user.role !== 'manager' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ Manager hoặc Admin có quyền phân công reporter'
            });
        }

        if (!Array.isArray(reporterIds) || reporterIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách reporter không hợp lệ'
            });
        }

        report.assignedReporters = reporterIds;
        report.updatedBy = req.user.id;

        await report.save();

        await report.populate('assignedReporters', 'fullName email');

        res.json({
            success: true,
            message: 'Phân công reporter thành công',
            data: report
        });

    } catch (error) {
        console.error('Assign reporter error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi phân công reporter'
        });
    }
};

const makePublic = async (req, res) => {
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
                message: 'Không có quyền công khai báo cáo này'
            });
        }

        report.status = 'public';
        report.updatedBy = req.user.id;

        await report.save();

        res.json({
            success: true,
            message: 'Công khai báo cáo thành công',
            data: report
        });

    } catch (error) {
        console.error('Make public report error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi công khai báo cáo'
        });
    }
};

const downloadReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { format = 'html' } = req.query;
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

        let linkedEvidencesHtml = '';
        if (report.linkedEvidences && report.linkedEvidences.length > 0) {
            linkedEvidencesHtml = '<h2 style="margin-top: 30px; border-top: 1px solid #ccc; padding-top: 20px;">Minh chứng liên quan</h2><ul>';

            const baseUrl = process.env.CLIENT_URL;

            report.linkedEvidences.forEach(linkItem => {
                if (linkItem.evidenceId) {
                    const evidence = linkItem.evidenceId;
                    const evidenceUrl = `${baseUrl}/public/evidences/${evidence.code}`;
                    linkedEvidencesHtml += `<li><strong>${evidence.code}</strong>: <a href="${evidenceUrl}" target="_blank">${evidence.name}</a>`;

                    if (linkItem.contextText) {
                        linkedEvidencesHtml += ` (Ngữ cảnh: ${linkItem.contextText})`;
                    }

                    linkedEvidencesHtml += '</li>';
                }
            });

            linkedEvidencesHtml += '</ul>';
        }

        let finalContent = report.content || '';
        finalContent = finalContent + linkedEvidencesHtml;

        const filename = `${report.code}-${report.title}.${format}`;
        const safeEncodedFilename = encodeURIComponent(filename).replace(/[!'()*]/g, (c) => {
            return '%' + c.charCodeAt(0).toString(16).toUpperCase();
        });

        if (format === 'html') {
            const htmlResponse = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>${escapeHtml(report.title)}</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 40px;
                            line-height: 1.6;
                            color: #333;
                        }
                        h1, h2, h3, h4, h5, h6 {
                            color: #1a202c;
                            margin-top: 1.5em;
                            margin-bottom: 0.5em;
                        }
                        a {
                            color: #2563eb;
                            text-decoration: none;
                            border-bottom: 1px solid #2563eb;
                        }
                        a:hover {
                            text-decoration: underline;
                        }
                        a.evidence-link {
                            display: inline-flex;
                            align-items: center;
                            padding: 0.25rem 0.75rem;
                            background-color: #dbeafe;
                            color: #1e40af;
                            border-radius: 0.375rem;
                            font-family: monospace;
                            font-weight: 600;
                            font-size: 0.9em;
                            border: 1px solid #7dd3fc;
                            text-decoration: none;
                            margin: 0 2px;
                        }
                        a.evidence-link:hover {
                            background-color: #93c5fd;
                        }
                        ul, ol {
                            margin: 1em 0;
                            padding-left: 2em;
                        }
                        li {
                            margin: 0.5em 0;
                        }
                        blockquote {
                            border-left: 4px solid #e5e7eb;
                            padding-left: 1em;
                            margin: 1em 0;
                            color: #6b7280;
                            font-style: italic;
                        }
                        pre {
                            background-color: #f3f4f6;
                            padding: 1em;
                            border-radius: 0.375rem;
                            overflow-x: auto;
                            font-family: monospace;
                        }
                        table {
                            border-collapse: collapse;
                            width: 100%;
                            margin: 1em 0;
                        }
                        th, td {
                            border: 1px solid #e5e7eb;
                            padding: 0.75em;
                            text-align: left;
                        }
                        th {
                            background-color: #f3f4f6;
                            font-weight: bold;
                        }
                    </style>
                </head>
                <body>
                    ${finalContent}
                </body>
                </html>
            `;

            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${safeEncodedFilename}`);
            res.send(htmlResponse);

            report.incrementDownload().catch(err => {
                console.error('Increment download count failed:', err);
            });

        } else if (format === 'pdf') {
            return res.status(400).json({
                success: false,
                message: 'Định dạng PDF chưa được hỗ trợ'
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Định dạng không được hỗ trợ'
            });
        }

    } catch (error) {
        console.error('Download report error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: error.message || 'Lỗi hệ thống khi tải báo cáo'
            });
        }
    }
};

const getReportStats = async (req, res) => {
    try {
        const { type, status, programId, organizationId } = req.query;
        const academicYearId = req.academicYearId;

        let matchStage = { academicYearId: new mongoose.Types.ObjectId(academicYearId) };
        if (type) matchStage.type = type;
        if (status) matchStage.status = status;
        if (programId) matchStage.programId = new mongoose.Types.ObjectId(programId);
        if (organizationId) matchStage.organizationId = new mongoose.Types.ObjectId(organizationId);

        const stats = await Report.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalReports: { $sum: 1 },
                    draftReports: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
                    publicReports: { $sum: { $cond: [{ $eq: ['$status', 'public'] }, 1, 0] } },
                    approvedReports: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
                    rejectedReports: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
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
            publicReports: 0,
            approvedReports: 0,
            rejectedReports: 0,
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

        report.content = processEvidenceLinksInContent(htmlContent);
        report.contentMethod = 'online_editor';
        report.updatedBy = req.user.id;

        await report.save();

        res.json({
            success: true,
            message: 'Chuyển đổi file sang nội dung thành công',
            data: {
                content: report.content
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

const getReportEvidences = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const report = await Report.findOne({ _id: id, academicYearId })
            .select('linkedEvidences')
            .populate({
                path: 'linkedEvidences.evidenceId',
                select: 'code name'
            });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Báo cáo không tồn tại'
            });
        }

        return res.json({
            success: true,
            data: report.linkedEvidences || []
        });
    } catch (error) {
        console.error('Get report evidences error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy minh chứng báo cáo'
        });
    }
};

const getReportVersions = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const report = await Report.findOne({ _id: id, academicYearId })
            .select('versions')
            .populate({
                path: 'versions.changedBy',
                select: 'fullName email'
            });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Báo cáo không tồn tại'
            });
        }

        return res.json({
            success: true,
            data: report.versions || []
        });
    } catch (error) {
        console.error('Get report versions error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy phiên bản báo cáo'
        });
    }
};

const addReportVersion = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, changeNote } = req.body;
        const academicYearId = req.academicYearId;

        const report = await Report.findOne({ _id: id, academicYearId });
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Báo cáo không tồn tại'
            });
        }

        if (!report.canEdit(req.user.id, req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền thêm phiên bản cho báo cáo này'
            });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nội dung phiên bản không được để trống'
            });
        }

        if (report.addVersion && typeof report.addVersion === 'function') {
            await report.addVersion({
                content: content.trim(),
                changeNote: changeNote?.trim() || '',
                changedBy: req.user.id
            });

            await report.populate({
                path: 'versions.changedBy',
                select: 'fullName email'
            });

            return res.json({
                success: true,
                message: 'Thêm phiên bản thành công',
                data: report.versions
            });
        } else {
            return res.status(501).json({
                success: false,
                message: 'Tính năng thêm phiên bản chưa được triển khai đầy đủ'
            });
        }
    } catch (error) {
        console.error('Add report version error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi thêm phiên bản'
        });
    }
};

const getReportComments = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const report = await Report.findOne({ _id: id, academicYearId })
            .select('reviewerComments')
            .populate({
                path: 'reviewerComments.reviewerId',
                select: 'fullName email'
            });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Báo cáo không tồn tại'
            });
        }

        return res.json({
            success: true,
            data: report.reviewerComments || []
        });
    } catch (error) {
        console.error('Get report comments error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy nhận xét báo cáo'
        });
    }
};

const addReportComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { comment, section } = req.body;
        const academicYearId = req.academicYearId;

        if (!comment || comment.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nội dung nhận xét không được để trống'
            });
        }

        const report = await Report.findOne({ _id: id, academicYearId });
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Báo cáo không tồn tại'
            });
        }

        if (report.addComment && typeof report.addComment === 'function') {
            await report.addComment({
                comment: comment.trim(),
                section: section || '',
                reviewerId: req.user.id,
                reviewerType: req.user.role || 'reviewer'
            });

            await report.populate({
                path: 'reviewerComments.reviewerId',
                select: 'fullName email'
            });

            return res.json({
                success: true,
                message: 'Thêm nhận xét thành công',
                data: report.reviewerComments
            });
        } else {
            return res.status(501).json({
                success: false,
                message: 'Tính năng thêm nhận xét chưa được triển khai đầy đủ'
            });
        }
    } catch (error) {
        console.error('Add report comment error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi thêm nhận xét'
        });
    }
};

const resolveReportComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const academicYearId = req.academicYearId;

        const report = await Report.findOne({ _id: id, academicYearId });
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Báo cáo không tồn tại'
            });
        }

        if (!report.canEdit(req.user.id, req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền giải quyết nhận xét'
            });
        }

        if (report.resolveComment && typeof report.resolveComment === 'function') {
            await report.resolveComment(commentId);

            await report.populate({
                path: 'reviewerComments.reviewerId',
                select: 'fullName email'
            });

            return res.json({
                success: true,
                message: 'Đánh dấu nhận xét đã xử lý',
                data: report.reviewerComments
            });
        } else {
            return res.status(501).json({
                success: false,
                message: 'Tính năng giải quyết nhận xét chưa được triển khai đầy đủ'
            });
        }
    } catch (error) {
        console.error('Resolve report comment error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi giải quyết nhận xét'
        });
    }
};

function processEvidenceLinksInContent(content) {
    if (!content) return ''

    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000'

    content = normalizeExistingLinks(content, baseUrl)

    return content
}

function normalizeExistingLinks(content, baseUrl) {
    const pattern = /<a[^>]*class="evidence-link"[^>]*data-code="([A-Z]{1,3}\d+\.\d{2}\.\d{2}\.\d{2})"[^>]*>.*?<\/a>/gi

    content = content.replace(pattern, (match, code) => {
        const url = `${baseUrl}/public/evidences/${code}`
        return `<a href="${url}" class="evidence-link" data-code="${code}" target="_blank" rel="noopener noreferrer">${code}</a>`
    })

    return content
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

const getReportsByTask = async (req, res) => {
    try {
        const { taskId } = req.query;
        const { reportType, standardId, criteriaId } = req.query;
        const academicYearId = req.academicYearId;
        const userId = req.user.id;

        if (!taskId) {
            // Chuyển sang luồng tìm kiếm theo Tiêu chuẩn/Tiêu chí nếu không có TaskId
            return getReportsByStandardCriteria(req, res);
        }

        const Task = require('../../models/Task/Task');
        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhiệm vụ'
            });
        }

        let query = {
            academicYearId,
            taskId,
            type: reportType
        };

        if (standardId) query.standardId = standardId;
        if (criteriaId) query.criteriaId = criteriaId;

        const reports = await Report.find(query)
            .populate('createdBy', 'fullName email')
            .populate('assignedReporters', 'fullName email')
            .sort({ createdAt: -1 });

        const canCreateNew = task.assignedTo.map(id => id.toString()).includes(userId.toString());

        const reportsWithCanEdit = reports.map(r => {
            const isCreatedByMe = r.createdBy?._id?.toString() === userId.toString();
            const isAssigned = r.assignedReporters.map(r => r._id.toString()).includes(userId.toString());
            return {
                ...r.toObject(),
                createdBy: r.createdBy ? { ...r.createdBy.toObject(), fullName: isCreatedByMe ? 'Bạn' : r.createdBy.fullName } : null,
                assignedReporters: r.assignedReporters.map(r => r._id.toString() === userId.toString() ? { ...r.toObject(), fullName: 'Bạn' } : r.toObject()),
            };
        });

        res.json({
            success: true,
            data: {
                reports: reportsWithCanEdit,
                canCreateNew,
                task
            }
        });

    } catch (error) {
        console.error('Get reports by task error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách báo cáo'
        });
    }
};

const requestEditPermission = async (req, res) => {
    try {
        const { reportId } = req.params;
        const academicYearId = req.academicYearId;
        const userId = req.user.id;

        const report = await Report.findOne({ _id: reportId, academicYearId });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Báo cáo không tồn tại'
            });
        }

        if (report.assignedReporters.map(r => r.toString()).includes(userId.toString())) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã có quyền chỉnh sửa báo cáo này'
            });
        }

        if (!report.assignedReporters.includes(report.createdBy)) {
            report.assignedReporters.push(report.createdBy);
        }

        if (!report.assignedReporters.map(r => r.toString()).includes(userId.toString())) {
            report.assignedReporters.push(userId);
        }

        report.updatedBy = userId;
        await report.save();

        await report.populate('assignedReporters', 'fullName email');

        res.json({
            success: true,
            message: 'Yêu cầu cấp quyền đã được gửi',
            data: report
        });

    } catch (error) {
        console.error('Request edit permission error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi yêu cầu quyền'
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
    unpublishReport,
    approveReport,
    rejectReport,
    assignReporter,
    makePublic,
    downloadReport,
    getReportStats,
    uploadReportFile,
    downloadReportFile,
    convertFileToContent,
    getReportEvidences,
    getReportVersions,
    addReportVersion,
    getReportComments,
    addReportComment,
    resolveReportComment,
    getReportsByTask,
    requestEditPermission,
    getReportsByStandardCriteria,
};