const mongoose = require('mongoose');
const Report = mongoose.model('Report');
const Task = mongoose.model('Task');

const canReviewReport = async (req, report) => {
    if (req.user.role === 'admin' || req.user.role === 'manager') {
        return true;
    }

    if (report.taskId) {
        const TaskModel = mongoose.model('Task');
        const task = await TaskModel.findById(report.taskId);

        if (task && String(task.createdBy) === String(req.user.id)) {
            return true;
        }
    }

    return false;
};

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
                    { status: 'approved' },
                    { status: 'in_evaluation' },
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

        if (status) {
            const statusArray = status.split(',').map(s => s.trim()).filter(s => s.length > 0);
            if (statusArray.length > 0) {
                query.status = { $in: statusArray };
            }
        }

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
                .populate('taskId', 'taskCode')
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
            })
            .populate({
                path: 'editRequests.requesterId',
                select: 'fullName email avatar'
            })
            .populate({
                path: 'editRequests.respondedBy',
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
            standardId,
            criteriaId,
            content,
            contentMethod,
            summary,
            keywords,
            linkedCriteriaReports,
            taskId
        } = req.body;

        const academicYearId = req.academicYearId;

        let existingTask = null;
        if (taskId) {
            const TaskModel = mongoose.model('Task');
            existingTask = await TaskModel.findOne({ _id: taskId, academicYearId });
            if (!existingTask) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy nhiệm vụ được liên kết'
                });
            }
        }

        let standardCode = '';
        let criteriaCode = '';

        if (type !== 'overall_tdg') {
            if (type !== 'overall_tdg' && !standardId) {
                return res.status(400).json({
                    success: false,
                    message: 'Tiêu chuẩn (standardId) là bắt buộc cho loại báo cáo này'
                });
            }

            if (type === 'criteria' && !criteriaId) {
                return res.status(400).json({
                    success: false,
                    message: 'Tiêu chí (criteriaId) là bắt buộc cho loại báo cáo tiêu chí'
                });
            }

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
            linkedCriteriaReports: linkedCriteriaReports || [],
            taskId: taskId || null
        };

        if (type !== 'overall_tdg') {
            if (standardId) {
                reportData.standardId = standardId;
            }

            if (criteriaId) {
                reportData.criteriaId = criteriaId;
            }
        }

        if (contentMethod === 'online_editor') {
            if (!content || content.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Nội dung báo cáo là bắt buộc khi dùng trình soạn thảo trực tuyến'
                });
            }
            reportData.content = content;
        } else {
            reportData.content = '';
        }

        const report = new Report(reportData);

        await report.save();

        if (taskId && existingTask && existingTask.status === 'pending') {
            const TaskModel = mongoose.model('Task');
            await TaskModel.updateOne(
                { _id: taskId },
                {
                    status: 'in_progress',
                    updatedBy: req.user.id,
                    updatedAt: new Date()
                }
            );
        }

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
        const { content, linkedCriteriaReports, taskId, ...updateData } = req.body;
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
            report.content = content;
        }

        if (taskId !== undefined && String(taskId) !== String(report.taskId)) {
            let existingTask = null;
            if (taskId) {
                const TaskModel = mongoose.model('Task');
                existingTask = await TaskModel.findOne({ _id: taskId, academicYearId });
                if (!existingTask) {
                    return res.status(404).json({
                        success: false,
                        message: 'Không tìm thấy Task mới'
                    });
                }
            }

            const oldTaskId = report.taskId;
            report.taskId = taskId || null;

            if (oldTaskId && String(oldTaskId) !== String(taskId)) {
                const TaskModel = mongoose.model('Task');
                await TaskModel.updateOne(
                    { _id: oldTaskId, reportId: report._id },
                    { reportId: null, status: 'in_progress', updatedBy: userId, updatedAt: new Date() }
                );
            }

            if (taskId && existingTask.status === 'pending') {
                const TaskModel = mongoose.model('Task');
                await TaskModel.updateOne(
                    { _id: taskId },
                    { status: 'in_progress', updatedBy: userId, updatedAt: new Date() }
                );
            }
        }

        if (report.content !== oldContent || report.title !== oldTitle) {
            const changeNote = `Cập nhật nội dung/tiêu đề từ phiên bản trước.`;
            if (report.addVersion && typeof report.addVersion === 'function') {
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
            status: { $in: ['draft', 'public', 'approved', 'in_evaluation', 'published'] }
        };

        if (criteriaId && reportType === 'criteria') {
            query.criteriaId = criteriaId;
        }

        const permissionService = require('../../services/permissionService');
        const canWriteReport = await permissionService.canWriteReport(userId, reportType, academicYearId);

        const reports = await Report.find(query)
            .populate('createdBy', 'fullName email')
            .populate('assignedReporters', 'fullName email')
            .populate({
                path: 'editRequests.requesterId',
                select: 'fullName email avatar'
            })
            .sort({ createdAt: -1 });

        const reportsWithCanEdit = reports.map(r => {
            const isCreatedByMe = String(r.createdBy?._id) === String(userId);
            const isAssigned = r.assignedReporters.some(reporter => String(reporter._id) === String(userId));
            const myEditRequest = r.editRequests?.find(req => String(req.requesterId?._id) === String(userId));

            let canEdit = r.canEdit(userId, req.user.role);
            if (isCreatedByMe) {
                canEdit = true;
            }

            return {
                ...r.toObject(),
                canEdit: canEdit,
                isCreatedByMe: isCreatedByMe,
                isAssignedToMe: isAssigned,
                createdBy: r.createdBy ? { ...r.createdBy.toObject(), fullName: isCreatedByMe ? 'Bạn' : r.createdBy.fullName } : null,
                assignedReporters: r.assignedReporters.map(reporter => String(reporter._id) === String(userId) ? { ...reporter.toObject(), fullName: 'Bạn' } : reporter.toObject()),
                myEditRequestStatus: myEditRequest ? myEditRequest.status : 'none',
                pendingEditRequests: r.editRequests?.filter(req => req.status === 'pending') || []
            };
        });

        res.json({
            success: true,
            data: {
                reports: reportsWithCanEdit,
                canCreateNew: canWriteReport,
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

const getReportsByTask = async (req, res) => {
    try {
        const { taskId } = req.query;
        const academicYearId = req.academicYearId;
        const userId = req.user.id;
        const isTaskCreator = req.query.isTaskCreator === 'true';

        if (!taskId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin nhiệm vụ (taskId)'
            });
        }

        const TaskModel = mongoose.model('Task');
        const ReportModel = mongoose.model('Report');
        const task = await TaskModel.findOne({ _id: taskId, academicYearId });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhiệm vụ'
            });
        }

        let reports = [];
        let primaryReportId = task.reportId ? String(task.reportId) : null;

        let baseReportQuery = {
            academicYearId,
            taskId: taskId
        };

        let statusFilter = ['draft', 'rejected', 'public', 'approved', 'in_evaluation', 'published', 'submitted'];

        if (isTaskCreator) {
            statusFilter = ['rejected', 'public', 'approved', 'in_evaluation', 'published', 'submitted'];
        }

        let mainQuery = {
            ...baseReportQuery,
            _id: { $in: [] },
            status: { $in: statusFilter }
        };

        if (primaryReportId) {
            const primaryReport = await ReportModel.findById(primaryReportId)
                .populate('createdBy', 'fullName email')
                .populate('assignedReporters', 'fullName email')
                .populate({
                    path: 'editRequests.requesterId',
                    select: 'fullName email avatar'
                });

            if (primaryReport && statusFilter.includes(primaryReport.status)) {
                reports.push(primaryReport);
                mainQuery._id.$in.push(primaryReport._id);
            }
        }

        const otherReportsQuery = {
            ...baseReportQuery,
            _id: { $nin: mainQuery._id.$in },
            status: { $in: statusFilter }
        };

        const otherReports = await ReportModel.find(otherReportsQuery)
            .populate('createdBy', 'fullName email')
            .populate('assignedReporters', 'fullName email')
            .populate({
                path: 'editRequests.requesterId',
                select: 'fullName email avatar'
            })
            .sort({ createdAt: -1 });

        reports = [...reports, ...otherReports];

        const permissionService = require('../../services/permissionService');
        const canWriteReport = await permissionService.canWriteReport(
            userId,
            task.reportType,
            academicYearId,
            task.standardId,
            task.criteriaId
        );

        const reportsWithCanEdit = reports.map(r => {
            const isCreatedByMe = String(r.createdBy?._id) === String(userId);
            const isAssigned = r.assignedReporters.some(reporter => String(reporter._id) === String(userId));
            const myEditRequest = r.editRequests?.find(req => String(req.requesterId?._id) === String(userId));

            let canEdit = r.canEdit(userId, req.user.role);
            if (isCreatedByMe) {
                canEdit = true;
            }

            return {
                ...r.toObject(),
                canEdit: canEdit,
                isCreatedByMe: isCreatedByMe,
                isAssignedToMe: isAssigned,
                createdBy: r.createdBy ? { ...r.createdBy.toObject(), fullName: isCreatedByMe ? 'Bạn' : r.createdBy.fullName } : null,
                assignedReporters: r.assignedReporters.map(reporter => String(reporter._id) === String(userId) ? { ...reporter.toObject(), fullName: 'Bạn' } : reporter.toObject()),
                myEditRequestStatus: myEditRequest ? myEditRequest.status : 'none',
                pendingEditRequests: r.editRequests?.filter(req => req.status === 'pending') || []
            };
        });

        res.json({
            success: true,
            data: {
                reports: reportsWithCanEdit,
                canCreateNew: canWriteReport,
                canWriteReport: canWriteReport,
                task: task
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

        if (report.taskId) {
            const TaskModel = mongoose.model('Task');
            await TaskModel.updateOne(
                { _id: report.taskId, reportId: id },
                { reportId: null, status: 'in_progress', updatedBy: req.user.id, updatedAt: new Date() }
            );
        }

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

        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ Manager hoặc Admin có quyền phát hành báo cáo này'
            });
        }

        if (report.status === 'published') {
            return res.status(400).json({
                success: false,
                message: 'Báo cáo đã được phát hành'
            });
        }

        if (report.status !== 'in_evaluation') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể phát hành báo cáo đang trong quá trình đánh giá'
            });
        }

        const Assignment = mongoose.model('Assignment');
        const completedAssignments = await Assignment.countDocuments({
            reportId: report._id,
            status: 'completed'
        });

        if (completedAssignments === 0) {
            return res.status(400).json({
                success: false,
                message: 'Báo cáo phải có ít nhất một đánh giá hoàn thành trước khi phát hành'
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

        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thu hồi báo cáo này'
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

        if (!await canReviewReport(req, report)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền phê duyệt báo cáo này'
            });
        }

        if (report.status !== 'public' && report.status !== 'submitted') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể phê duyệt báo cáo ở trạng thái công khai hoặc đã nộp'
            });
        }

        await report.approve(req.user.id, feedback);

        if (report.taskId) {
            const TaskModel = mongoose.model('Task');
            await TaskModel.updateOne(
                { _id: report.taskId },
                { status: 'completed', reportId: report._id, reviewedBy: req.user.id, reviewedAt: new Date(), updatedAt: new Date() }
            );
        }

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

        if (!await canReviewReport(req, report)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền từ chối báo cáo này'
            });
        }

        if (report.status !== 'public' && report.status !== 'submitted') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể từ chối báo cáo ở trạng thái công khai hoặc đã nộp'
            });
        }

        if (!feedback || feedback.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Lý do từ chối là bắt buộc'
            });
        }

        await report.reject(req.user.id, feedback);

        if (report.taskId) {
            const TaskModel = mongoose.model('Task');
            await TaskModel.updateOne(
                { _id: report.taskId },
                { status: 'rejected', reportId: report._id, reviewedBy: req.user.id, reviewedAt: new Date(), rejectionReason: feedback, updatedAt: new Date() }
            );
        }

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

        if (report.status === 'public') {
            return res.status(400).json({
                success: false,
                message: 'Báo cáo đã ở trạng thái công khai'
            });
        }

        if (report.status !== 'draft' && report.status !== 'rejected') {
            return res.status(400).json({
                success: false,
                message: `Chỉ có thể công khai báo cáo ở trạng thái nháp hoặc bị từ chối. Trạng thái hiện tại: ${report.status}`
            });
        }

        if (report.status === 'rejected') {
            await report.resubmitAfterRejection(req.user.id);
        }

        await report.makePublic(req.user.id);

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

const retractPublic = async (req, res) => {
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
                message: 'Không có quyền thu hồi công khai báo cáo này'
            });
        }

        if (report.status !== 'public') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể thu hồi công khai báo cáo đang ở trạng thái công khai'
            });
        }

        report.status = 'draft';
        report.updatedBy = req.user.id;

        await report.save();

        res.json({
            success: true,
            message: 'Thu hồi công khai báo cáo thành công',
            data: report
        });

    } catch (error) {
        console.error('Retract public report error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi thu hồi công khai báo cáo'
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
                    const Evidence = mongoose.model('Evidence');
                    const evidence = Evidence.findById(linkItem.evidenceId).select('code name');
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

        report.content = htmlContent;
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

const requestEditPermission = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;
        const userId = req.user.id;

        const report = await Report.findOne({ _id: id, academicYearId });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Báo cáo không tồn tại'
            });
        }

        if (report.canEdit(userId, req.user.role)) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã có quyền chỉnh sửa báo cáo này'
            });
        }

        const existingRequest = report.editRequests.find(r =>
            String(r.requesterId) === String(userId) && r.status === 'pending'
        );

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã gửi yêu cầu và đang chờ người tạo phê duyệt'
            });
        }

        report.editRequests.push({
            requesterId: userId,
            requestedAt: new Date(),
            status: 'pending'
        });

        report.updatedBy = userId;
        await report.save();

        res.json({
            success: true,
            message: 'Yêu cầu cấp quyền đã được gửi, đang chờ người tạo báo cáo phê duyệt.',
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

const getEditRequests = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;
        const userId = req.user.id;

        const report = await Report.findOne({ _id: id, academicYearId })
            .select('createdBy editRequests')
            .populate({
                path: 'editRequests.requesterId',
                select: 'fullName email avatar'
            })
            .populate({
                path: 'editRequests.respondedBy',
                select: 'fullName email'
            });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Báo cáo không tồn tại'
            });
        }

        if (String(report.createdBy) !== String(userId) && req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ người viết báo cáo hoặc quản lý mới được xem yêu cầu cấp quyền'
            });
        }

        res.json({
            success: true,
            data: report.editRequests || []
        });

    } catch (error) {
        console.error('Get edit requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách yêu cầu'
        });
    }
};

const approveEditRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { requesterId } = req.body;
        const academicYearId = req.academicYearId;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(requesterId)) {
            return res.status(400).json({
                success: false,
                message: 'ID người yêu cầu không hợp lệ'
            });
        }

        const report = await Report.findOne({ _id: id, academicYearId });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Báo cáo không tồn tại'
            });
        }

        if (String(report.createdBy) !== String(userId) && req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ người viết báo cáo hoặc quản lý mới được phê duyệt yêu cầu'
            });
        }

        const requestIndex = report.editRequests.findIndex(
            r => String(r.requesterId) === String(requesterId) && r.status === 'pending'
        );

        if (requestIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Yêu cầu không tồn tại hoặc đã được xử lý'
            });
        }

        report.editRequests[requestIndex].status = 'approved';
        report.editRequests[requestIndex].respondedAt = new Date();
        report.editRequests[requestIndex].respondedBy = userId;

        if (!report.assignedReporters.some(r => String(r) === String(requesterId))) {
            report.assignedReporters.push(new mongoose.Types.ObjectId(requesterId));
        }

        report.updatedBy = userId;
        await report.save();

        await report.populate([
            { path: 'editRequests.requesterId', select: 'fullName email' },
            { path: 'editRequests.respondedBy', select: 'fullName email' },
            { path: 'assignedReporters', select: 'fullName email' }
        ]);

        res.json({
            success: true,
            message: 'Phê duyệt yêu cầu thành công',
            data: report
        });

    } catch (error) {
        console.error('Approve edit request error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi hệ thống khi phê duyệt yêu cầu'
        });
    }
};

const rejectEditRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { requesterId, reason } = req.body;
        const academicYearId = req.academicYearId;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(requesterId)) {
            return res.status(400).json({
                success: false,
                message: 'ID người yêu cầu không hợp lệ'
            });
        }

        const report = await Report.findOne({ _id: id, academicYearId });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Báo cáo không tồn tại'
            });
        }

        if (String(report.createdBy) !== String(userId) && req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ người viết báo cáo hoặc quản lý mới được từ chối yêu cầu'
            });
        }

        const requestIndex = report.editRequests.findIndex(
            r => String(r.requesterId) === String(requesterId) && r.status === 'pending'
        );

        if (requestIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Yêu cầu không tồn tại hoặc đã được xử lý'
            });
        }

        report.editRequests[requestIndex].status = 'rejected';
        report.editRequests[requestIndex].respondedAt = new Date();
        report.editRequests[requestIndex].respondedBy = userId;
        report.editRequests[requestIndex].rejectReason = reason || 'Không có lý do cụ thể';

        report.assignedReporters = report.assignedReporters.filter(r => String(r) !== String(requesterId));

        report.updatedBy = userId;
        await report.save();

        await report.populate([
            { path: 'editRequests.requesterId', select: 'fullName email' },
            { path: 'editRequests.respondedBy', select: 'fullName email' }
        ]);

        res.json({
            success: true,
            message: 'Từ chối yêu cầu thành công',
            data: report
        });

    } catch (error) {
        console.error('Reject edit request error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi hệ thống khi từ chối yêu cầu'
        });
    }
};

const getInsertableReports = async (req, res) => {
    try {
        const { reportType, standardId, programId, organizationId } = req.query;
        const academicYearId = req.academicYearId;

        if (!reportType) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu loại báo cáo'
            });
        }

        let query = {
            academicYearId,
            status: { $in: ['public', 'approved', 'in_evaluation', 'published'] }
        };

        if (reportType === 'overall_tdg') {
            query.type = { $in: ['standard', 'criteria'] };
            if (programId) {
                query.programId = programId;
            }
            if (organizationId) {
                query.organizationId = organizationId;
            }
        } else if (reportType === 'standard') {
            if (!standardId) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu tiêu chuẩn'
                });
            }
            query.type = 'criteria';
            query.standardId = standardId;

            if (programId) {
                query.programId = programId;
            }
            if (organizationId) {
                query.organizationId = organizationId;
            }

        } else if (reportType === 'criteria') {
            return res.json({
                success: true,
                data: {
                    reports: [],
                    message: 'Báo cáo tiêu chí không thể chèn báo cáo khác'
                }
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Loại báo cáo không hợp lệ'
            });
        }

        const reports = await Report.find(query)
            .select('_id code title content type standardId criteriaId createdBy')
            .populate('createdBy', 'fullName email')
            .populate('standardId', 'code name')
            .populate('criteriaId', 'code name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                reports: reports.map(r => ({
                    _id: r._id,
                    code: r.code,
                    title: r.title,
                    content: r.content,
                    type: r.type,
                    standard: r.standardId ? {
                        _id: r.standardId._id,
                        code: r.standardId.code,
                        name: r.standardId.name
                    } : null,
                    criteria: r.criteriaId ? {
                        _id: r.criteriaId._id,
                        code: r.criteriaId.code,
                        name: r.criteriaId.name
                    } : null,
                    createdBy: r.createdBy ? {
                        _id: r.createdBy._id,
                        fullName: r.createdBy.fullName
                    } : null
                }))
            }
        });

    } catch (error) {
        console.error('Get insertable reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách báo cáo'
        });
    }
};

const submitReportToTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { taskId } = req.body;
        const academicYearId = req.academicYearId;
        const userId = req.user.id;
        const ReportModel = mongoose.model('Report');
        const TaskModel = mongoose.model('Task');

        const report = await ReportModel.findOne({ _id: id, academicYearId });
        if (!report) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo' });
        }

        const task = await TaskModel.findOne({ _id: taskId, academicYearId });
        if (!task) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy nhiệm vụ đích' });
        }

        if (!task.assignedTo.some(id => id.toString() === userId.toString())) {
            return res.status(403).json({ success: false, message: 'Bạn không được giao nhiệm vụ này' });
        }

        if (!['draft', 'rejected', 'in_progress', 'public'].includes(report.status)) {
            return res.status(400).json({ success: false, message: `Báo cáo phải ở trạng thái nháp, bị từ chối, đang thực hiện hoặc công khai để được nộp.` });
        }

        if (task.status === 'completed' || task.status === 'cancelled') {
            return res.status(400).json({ success: false, message: `Không thể nộp báo cáo cho Task ở trạng thái ${task.status}.` });
        }

        if (report.status === 'rejected') {
            await report.resubmitAfterRejection(userId);
        }

        report.taskId = taskId;
        report.status = 'submitted';
        report.updatedBy = userId;
        await report.save();

        task.reportId = id;
        task.status = 'submitted';
        task.submittedAt = new Date();
        task.updatedBy = userId;
        await task.save();

        res.json({
            success: true,
            message: `Báo cáo đã được nộp thành công cho Task ${task.taskCode} và đang chờ duyệt.`,
            data: {
                report: report,
                task: task
            }
        });

    } catch (error) {
        console.error('Submit report to task error:', error);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống khi nộp báo cáo cho Task' });
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
    retractPublic,
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
    getEditRequests,
    approveEditRequest,
    rejectEditRequest,
    getInsertableReports,
    submitReportToTask
};