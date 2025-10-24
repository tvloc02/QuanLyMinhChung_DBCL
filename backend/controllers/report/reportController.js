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

        if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
            const userAccessQuery = {
                $or: [
                    { createdBy: req.user.id },
                    { status: { $in: ['published', 'submitted'] } }
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
                .populate('requestId', 'title status')
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
            .populate('requestId')
            .populate({
                path: 'linkedEvidences.evidenceId',
                select: 'code name files'
            })
            .populate({
                path: 'linkedEvidences.selectedFileIds',
                select: 'originalName size mimetype'
            })
            .populate({
                path: 'evaluations',
                select: 'averageScore rating status evaluatorId',
                populate: {
                    path: 'evaluatorId',
                    select: 'fullName email'
                }
            })
            .populate({
                path: 'selfEvaluation.evaluatedBy',
                select: 'fullName email'
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
            content,
            contentMethod,
            summary,
            keywords,
            requestId,
            linkedEvidences
        } = req.body;

        const academicYearId = req.academicYearId;

        let reportRequest = null;
        if (requestId) {
            const ReportRequest = mongoose.model('ReportRequest');
            reportRequest = await ReportRequest.findById(requestId);

            if (!reportRequest || reportRequest.academicYearId.toString() !== academicYearId.toString()) {
                return res.status(400).json({
                    success: false,
                    message: 'Yêu cầu không hợp lệ'
                });
            }

            if (reportRequest.assignedTo.toString() !== req.user.id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền viết báo cáo cho yêu cầu này'
                });
            }

            if (reportRequest.status === 'rejected' || reportRequest.status === 'completed') {
                return res.status(400).json({
                    success: false,
                    message: 'Yêu cầu này không thể viết báo cáo'
                });
            }

            // ← THÊM: Kiểm tra loại báo cáo được phép
            if (reportRequest.types && reportRequest.types.length > 0) {
                if (!reportRequest.types.includes(type)) {
                    return res.status(400).json({
                        success: false,
                        message: `Loại báo cáo không được cho phép. Các loại được phép: ${reportRequest.types.join(', ')}`
                    });
                }
            }
        }

        const code = await Report.generateCode(type, academicYearId, '', '');

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

        if (requestId) {
            reportData.requestId = requestId;
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

        if (linkedEvidences && Array.isArray(linkedEvidences)) {
            reportData.linkedEvidences = linkedEvidences.map(item => {
                const evidence = {
                    evidenceId: item.evidenceId,
                    contextText: item.contextText || ''
                };
                if (item.selectedFileIds && item.selectedFileIds.length > 0) {
                    evidence.selectedFileIds = item.selectedFileIds;
                }
                return evidence;
            });
        }

        const report = new Report(reportData);
        await report.save();

        if (reportRequest) {
            await reportRequest.markInProgress();
        }

        await report.populate([
            { path: 'academicYearId', select: 'name code' },
            { path: 'programId', select: 'name code' },
            { path: 'organizationId', select: 'name code' },
            { path: 'createdBy', select: 'fullName email' },
            { path: 'linkedEvidences.evidenceId', select: 'code name' },
            { path: 'linkedEvidences.selectedFileIds', select: 'originalName size' }
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
        const { content, linkedEvidences, ...updateData } = req.body;
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
                message: 'Không có quyền chỉnh sửa báo cáo này'
            });
        }

        const allowedFields = ['title', 'summary', 'keywords', 'contentMethod'];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                report[field] = updateData[field];
            }
        });

        if (content !== undefined) {
            report.content = processEvidenceLinksInContent(content);
        }

        if (linkedEvidences && Array.isArray(linkedEvidences)) {
            report.linkedEvidences = linkedEvidences.map(item => {
                const evidence = {
                    evidenceId: item.evidenceId,
                    contextText: item.contextText || ''
                };
                if (item.selectedFileIds && item.selectedFileIds.length > 0) {
                    evidence.selectedFileIds = item.selectedFileIds;
                }
                return evidence;
            });
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
            { path: 'linkedEvidences.evidenceId', select: 'code name' },
            { path: 'linkedEvidences.selectedFileIds', select: 'originalName size' }
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

        if (report.status === 'published' || report.status === 'submitted') {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa báo cáo đã nộp hoặc đã xuất bản'
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

const submitReport = async (req, res) => {
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
                message: 'Không có quyền nộp báo cáo này'
            });
        }

        if (report.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể nộp báo cáo ở trạng thái bản nháp'
            });
        }

        if (!report.selfEvaluation || !report.selfEvaluation.content || !report.selfEvaluation.score) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng hoàn thành phần tự đánh giá trước khi nộp báo cáo'
            });
        }

        if (report.contentMethod === 'online_editor') {
            if (!report.content || report.content.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Báo cáo phải có nội dung trước khi nộp'
                });
            }
        } else if (report.contentMethod === 'file_upload') {
            if (!report.attachedFile) {
                return res.status(400).json({
                    success: false,
                    message: 'Báo cáo phải có file đính kèm trước khi nộp'
                });
            }
        }

        await report.submit(req.user.id);

        res.json({
            success: true,
            message: 'Nộp báo cáo thành công',
            data: report
        });

    } catch (error) {
        console.error('Submit report error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi hệ thống khi nộp báo cáo'
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

        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xuất bản báo cáo'
            });
        }

        if (report.status === 'published') {
            return res.status(400).json({
                success: false,
                message: 'Báo cáo đã được xuất bản'
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

        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền thu hồi báo cáo'
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

const addSelfEvaluation = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, score } = req.body;
        const academicYearId = req.academicYearId;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nội dung đánh giá là bắt buộc'
            });
        }

        if (!score || score < 1 || score > 7) {
            return res.status(400).json({
                success: false,
                message: 'Điểm đánh giá phải từ 1 đến 7'
            });
        }

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
                message: 'Không có quyền tự đánh giá báo cáo này'
            });
        }

        await report.addSelfEvaluation({ content: content.trim(), score: parseInt(score) }, req.user.id);

        await report.populate({
            path: 'selfEvaluation.evaluatedBy',
            select: 'fullName email'
        });

        res.json({
            success: true,
            message: 'Thêm tự đánh giá thành công',
            data: report.selfEvaluation
        });

    } catch (error) {
        console.error('Add self evaluation error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi thêm tự đánh giá'
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
                    submittedReports: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
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
            submittedReports: 0,
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
                select: 'code name files'
            })
            .populate({
                path: 'linkedEvidences.selectedFileIds',
                select: 'originalName size mimetype'
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

module.exports = {
    getReports,
    getReportById,
    createReport,
    updateReport,
    deleteReport,
    submitReport,
    publishReport,
    unpublishReport,
    addSelfEvaluation,
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
    resolveReportComment
};