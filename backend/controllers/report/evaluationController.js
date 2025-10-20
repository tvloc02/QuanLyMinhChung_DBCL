const mongoose = require('mongoose');
const Evaluation = require('../../models/report/Evaluation');
const Assignment = require('../../models/report/Assignment');
const Report = require('../../models/report/Report');

// Giả định mô hình User và Notification đã được import/khai báo
const User = mongoose.model('User');
const Notification = require('../../models/system/Notification');

// =========================================================================
// HÀM CONTROLLER
// =========================================================================

const getEvaluations = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            evaluatorId,
            reportId,
            rating,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            forSupervisionView
        } = req.query;

        const academicYearId = req.academicYearId;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = { academicYearId };

        if (req.user.role === 'expert' && !forSupervisionView) {
            query.evaluatorId = req.user.id;
        }

        if (forSupervisionView) {
            query.status = { $ne: 'draft' };
        }

        if (status) query.status = status;
        if (evaluatorId) query.evaluatorId = evaluatorId;
        if (reportId) query.reportId = reportId;
        if (rating) query.rating = rating;


        if (search) {
            const reportIds = await Report.find({
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { code: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');

            const expertIds = await User.find({
                fullName: { $regex: search, $options: 'i' }
            }).select('_id');

            query.$or = [
                { overallComment: { $regex: search, $options: 'i' } },
                { reportId: { $in: reportIds } },
                { evaluatorId: { $in: expertIds } }
            ];
        }


        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [evaluations, total] = await Promise.all([
            Evaluation.find(query)
                .populate('reportId', 'title type code')
                .populate('evaluatorId', 'fullName email')
                .populate('assignmentId', 'deadline priority')
                .populate('supervisorGuidance.guidedBy', 'fullName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            Evaluation.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                evaluations,
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
        console.error('Get evaluations error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách đánh giá'
        });
    }
};

const getEvaluationById = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;
        const currentUserId = req.user._id;
        const currentUserRole = req.user.role;

        // 🔍 DEBUG: In ra thông tin chi tiết
        console.log('🔍 [GET EVALUATION BY ID] Debug Info:');
        console.log('   - Current User ID:', currentUserId?.toString());
        console.log('   - Current User Role:', currentUserRole);
        console.log('   - User Full Info:', {
            _id: req.user._id,
            email: req.user.email,
            fullName: req.user.fullName,
            role: req.user.role
        });
        console.log('   - Requested Evaluation ID:', id);
        console.log('   - Academic Year ID:', academicYearId);

        const evaluation = await Evaluation.findOne({ _id: id, academicYearId })
            .populate({
                path: 'reportId',
                select: 'title type code'
            })
            .populate({
                path: 'evaluatorId',
                select: 'fullName email _id'
            })
            .populate({
                path: 'assignmentId',
                select: 'deadline priority'
            })
            .populate({
                path: 'supervisorGuidance.guidedBy',
                select: 'fullName email _id'
            });

        if (!evaluation) {
            console.log('   ❌ Evaluation not found');
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        // 🔍 DEBUG: In thêm thông tin đánh giá
        console.log('   - Evaluation Evaluator ID:', evaluation.evaluatorId._id?.toString());
        console.log('   - Evaluation Status:', evaluation.status);
        console.log('   - Are IDs the same?:',
            evaluation.evaluatorId._id?.toString() === currentUserId?.toString());

        // Kiểm tra quyền trước khi trả về (Đã sửa lỗi so sánh ID trong model)
        const canView = evaluation.canView(currentUserId, currentUserRole);
        console.log('   - Can View Result:', canView);

        if (!canView) {
            console.warn(`❌ 403: User ${currentUserId} (${currentUserRole}) denied access to evaluation ${id}.`);
            console.warn('   - Reason: Failed canView check');
            console.warn('   - Evaluator:', evaluation.evaluatorId._id);
            console.warn('   - Status:', evaluation.status);

            return res.status(403).json({
                success: false,
                message: 'Không có quyền xem đánh giá này',
                debug: {
                    reason: 'canView returned false',
                    currentUserRole,
                    evaluationStatus: evaluation.status
                }
            });
        }

        console.log('   ✅ Access granted - returning evaluation');

        res.json({
            success: true,
            data: evaluation
        });

    } catch (error) {
        console.error('❌ Get evaluation by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin đánh giá'
        });
    }
};

const createEvaluation = async (req, res) => {
    try {
        const { assignmentId } = req.body;
        const academicYearId = req.academicYearId;

        console.log('📥 Creating evaluation for assignmentId:', assignmentId);

        if (!assignmentId) {
            return res.status(400).json({
                success: false,
                message: 'assignmentId là bắt buộc'
            });
        }

        const assignment = await Assignment.findOne({
            _id: assignmentId,
            academicYearId
        }).populate('reportId');

        if (!assignment) {
            console.error('❌ Assignment not found:', assignmentId);
            return res.status(400).json({
                success: false,
                message: 'Phân quyền không tồn tại'
            });
        }

        console.log('✅ Assignment found:', assignment.status);

        if (assignment.expertId.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền tạo đánh giá cho phân quyền này'
            });
        }

        if (!['pending', 'accepted', 'in_progress'].includes(assignment.status)) {
            return res.status(400).json({
                success: false,
                message: `Phân quyền không thể được đánh giá. Trạng thái hiện tại: ${assignment.status}`
            });
        }

        const existingEvaluation = await Evaluation.findOne({
            assignmentId,
            academicYearId
        });

        if (existingEvaluation) {
            console.log('⚠️ Evaluation already exists:', existingEvaluation._id);
            return res.status(409).json({
                success: false,
                message: 'Đánh giá cho phân quyền này đã tồn tại',
                data: {
                    existingEvaluationId: existingEvaluation._id,
                    status: existingEvaluation.status
                }
            });
        }

        const evaluation = new Evaluation({
            academicYearId,
            assignmentId,
            reportId: assignment.reportId._id,
            evaluatorId: req.user.id,
            rating: '',
            overallComment: '',
            evidenceAssessment: {
                adequacy: '',
                relevance: '',
                quality: ''
            },
            status: 'draft'
        });

        await evaluation.save();

        if (assignment.status === 'pending') {
            assignment.status = 'accepted';
        } else if (assignment.status === 'accepted') {
            assignment.status = 'in_progress';
        }
        assignment.evaluationId = evaluation._id;
        await assignment.save();

        await evaluation.populate([
            { path: 'reportId', select: 'title type code' },
            { path: 'evaluatorId', select: 'fullName email' },
            { path: 'assignmentId', select: 'deadline priority' }
        ]);

        console.log('✅ Evaluation created:', evaluation._id);

        res.status(201).json({
            success: true,
            message: 'Tạo đánh giá thành công',
            data: evaluation
        });

    } catch (error) {
        console.error('❌ Create evaluation error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi tạo đánh giá'
        });
    }
};

const updateEvaluation = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, ...updateData } = req.body;
        const academicYearId = req.academicYearId;
        const currentUserId = req.user.id.toString(); // Chuyển đổi thành chuỗi
        const currentUserRole = req.user.role;


        console.log('📥 Update evaluation:', { id, updateData });

        const evaluation = await Evaluation.findOne({ _id: id, academicYearId });
        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        // --- Logic Kiểm tra Quyền (FIX cho Expert) ---
        // Sử dụng phương thức canEdit của Model (đã được sửa)
        if (!evaluation.canEdit(currentUserId, currentUserRole)) {
            let errorMessage = 'Không có quyền cập nhật đánh giá này.';

            if (currentUserRole === 'expert' && evaluation.evaluatorId.toString() === currentUserId) {
                if (evaluation.status !== 'draft') {
                    // Lỗi 403 phổ biến nhất: Expert cố gắng sửa bài đã nộp
                    errorMessage = `Bạn chỉ có quyền sửa bản nháp. Đánh giá đang ở trạng thái: ${evaluation.status}.`;
                }
            }

            return res.status(403).json({
                success: false,
                message: errorMessage
            });
        }
        // --- End Logic Kiểm tra Quyền ---

        if (updateData.overallComment !== undefined) {
            evaluation.overallComment = updateData.overallComment;
        }

        if (updateData.rating !== undefined) {
            evaluation.rating = updateData.rating;
        }

        if (updateData.evidenceAssessment !== undefined) {
            evaluation.evidenceAssessment = updateData.evidenceAssessment;
        }

        if (updateData.strengths !== undefined) {
            evaluation.strengths = updateData.strengths;
        }

        if (updateData.improvementAreas !== undefined) {
            evaluation.improvementAreas = updateData.improvementAreas;
        }

        if (updateData.recommendations !== undefined) {
            evaluation.recommendations = updateData.recommendations;
        }

        evaluation.addHistory('updated', req.user.id);
        await evaluation.save();

        console.log('✅ Evaluation updated');

        res.json({
            success: true,
            message: 'Cập nhật đánh giá thành công',
            data: evaluation
        });

    } catch (error) {
        console.error('❌ Update evaluation error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật đánh giá'
        });
    }
};

const submitEvaluation = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const evaluation = await Evaluation.findOne({ _id: id, academicYearId });
        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        if (evaluation.evaluatorId.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền nộp đánh giá này'
            });
        }

        if (evaluation.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: 'Đánh giá đã nộp, không thể nộp lại'
            });
        }

        const validationErrors = [];

        if (!evaluation.overallComment || evaluation.overallComment.trim() === '') {
            validationErrors.push('Nhận xét tổng thể là bắt buộc');
        }

        if (!evaluation.rating || !['excellent', 'good', 'satisfactory', 'needs_improvement', 'poor'].includes(evaluation.rating)) {
            validationErrors.push('Xếp loại đánh giá là bắt buộc');
        }

        if (!evaluation.evidenceAssessment?.adequacy || !['insufficient', 'adequate', 'comprehensive'].includes(evaluation.evidenceAssessment.adequacy)) {
            validationErrors.push('Tính đầy đủ minh chứng là bắt buộc');
        }

        if (!evaluation.evidenceAssessment?.relevance || !['poor', 'fair', 'good', 'excellent'].includes(evaluation.evidenceAssessment.relevance)) {
            validationErrors.push('Tính liên quan minh chứng là bắt buộc');
        }

        if (!evaluation.evidenceAssessment?.quality || !['poor', 'fair', 'good', 'excellent'].includes(evaluation.evidenceAssessment.quality)) {
            validationErrors.push('Chất lượng minh chứng là bắt buộc');
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Đánh giá chưa đầy đủ. Vui lòng kiểm tra các lỗi sau:',
                errors: validationErrors,
                data: {
                    overallComment: evaluation.overallComment ? '✅' : '❌',
                    rating: evaluation.rating ? '✅' : '❌',
                    evidenceAssessment: {
                        adequacy: evaluation.evidenceAssessment?.adequacy ? '✅' : '❌',
                        relevance: evaluation.evidenceAssessment?.relevance ? '✅' : '❌',
                        quality: evaluation.evidenceAssessment?.quality ? '✅' : '❌'
                    }
                }
            });
        }

        await evaluation.submit();

        const assignment = await Assignment.findById(evaluation.assignmentId);
        if (assignment) {
            await assignment.complete(evaluation._id);
        }

        const report = await Report.findById(evaluation.reportId);
        if (report) {
            if (!report.evaluations.map(e => e.toString()).includes(evaluation._id.toString())) {
                report.evaluations.push(evaluation._id);
            }
            await report.save();
        }

        // TẠO THÔNG BÁO: Gửi thông báo đến người quản lý/giám sát/advisor
        const advisoryRoles = ['admin', 'supervisor', 'manager', 'advisor'];
        const recipients = await User.find({ role: { $in: advisoryRoles } }).select('_id');

        if (recipients.length > 0) {
            const senderId = evaluation.evaluatorId;

            for (const recipient of recipients) {
                if (recipient._id.toString() !== senderId.toString()) {
                    await Notification.createEvaluationNotification(
                        evaluation._id,
                        'evaluation_submitted',
                        recipient._id,
                        senderId
                    );
                }
            }
        }


        console.log('✅ Evaluation submitted successfully');

        res.json({
            success: true,
            message: 'Nộp đánh giá thành công',
            data: evaluation
        });

    } catch (error) {
        console.error('❌ Submit evaluation error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi nộp đánh giá'
        });
    }
};

const superviseEvaluation = async (req, res) => {
    try {
        const { id } = req.params;
        const { comments } = req.body;
        const academicYearId = req.academicYearId;

        // CHECK: Cho phép 'admin', 'supervisor', 'manager' VÀ 'advisor'
        if (req.user.role !== 'admin' && req.user.role !== 'supervisor' && req.user.role !== 'manager' && req.user.role !== 'advisor') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin/supervisor/manager/advisor có quyền'
            });
        }

        const evaluation = await Evaluation.findOne({ _id: id, academicYearId });
        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        if (evaluation.status !== 'submitted') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể giám sát đánh giá đã nộp'
            });
        }

        // Cập nhật supervisorGuidance trước
        evaluation.supervisorGuidance.comments = comments || 'Đã chấp thuận đánh giá';

        // Chuyển trạng thái sang supervised (Đồng ý)
        await evaluation.supervise(req.user.id, comments);

        // TẠO THÔNG BÁO: Gửi thông báo cho Chuyên gia rằng đánh giá đã được Giám sát/Chấp thuận
        await Notification.createEvaluationNotification(
            evaluation._id,
            'evaluation_supervised',
            evaluation.evaluatorId, // Gửi cho chuyên gia đánh giá
            req.user.id // Người gửi là Giám sát viên/Admin
        );

        res.json({
            success: true,
            message: 'Giám sát đánh giá thành công. Đánh giá đã được chấp thuận.',
            data: evaluation
        });

    } catch (error) {
        console.error('Supervise evaluation error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi giám sát đánh giá'
        });
    }
};

const requestReEvaluation = async (req, res) => {
    try {
        const { id } = req.params;
        const { comments } = req.body;
        const academicYearId = req.academicYearId;

        // CHECK: Cho phép 'admin', 'supervisor', 'manager' VÀ 'advisor'
        if (req.user.role !== 'admin' && req.user.role !== 'supervisor' && req.user.role !== 'manager' && req.user.role !== 'advisor') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin/supervisor/manager/advisor có quyền yêu cầu đánh giá lại'
            });
        }

        const evaluation = await Evaluation.findOne({ _id: id, academicYearId });
        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        if (evaluation.status !== 'submitted') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể yêu cầu đánh giá lại cho đánh giá đã nộp'
            });
        }

        // 1. Cập nhật thông tin giám sát/nhận xét
        evaluation.supervisorGuidance = {
            comments: comments || 'Yêu cầu chuyên gia xem xét và chỉnh sửa lại đánh giá.',
            guidedAt: new Date(),
            guidedBy: req.user.id,
        };

        // 2. Thay đổi trạng thái về draft
        const oldStatus = evaluation.status;
        evaluation.status = 'draft';
        evaluation.submittedAt = undefined; // Đặt lại ngày nộp

        // 3. Ghi lại lịch sử
        evaluation.addHistory('requested_reevaluation', req.user.id, { reason: comments, fromStatus: oldStatus, toStatus: 'draft' }, 'Yêu cầu chuyên gia đánh giá lại');

        // 4. Lưu
        await evaluation.save();

        // 5. Cập nhật Assignment (Chuyển trạng thái Assignment về in_progress nếu cần)
        const assignment = await Assignment.findById(evaluation.assignmentId);
        if (assignment && assignment.status === 'completed') {
            assignment.status = 'in_progress';
            // Cập nhật lại ngày nộp mới (Tùy chọn)
            assignment.submittedAt = undefined;
            await assignment.save();
        }

        // 6. Log Activity
        await evaluation.addActivityLog('evaluation_reevaluate', req.user.id,
            'Yêu cầu đánh giá lại báo cáo', {
                severity: 'medium',
                oldData: { status: oldStatus },
                newData: { status: 'draft' },
                metadata: { comments }
            });

        // TẠO THÔNG BÁO: Gửi thông báo cho Chuyên gia rằng đánh giá bị yêu cầu đánh giá lại
        await Notification.createEvaluationNotification(
            evaluation._id,
            'evaluation_reevaluated',
            evaluation.evaluatorId, // Gửi cho chuyên gia đánh giá
            req.user.id // Người gửi là Giám sát viên/Admin
        );


        res.json({
            success: true,
            message: 'Đã gửi yêu cầu đánh giá lại thành công. Đánh giá đã được chuyển về bản nháp.',
            data: evaluation
        });

    } catch (error) {
        console.error('Request Re-evaluation error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi yêu cầu đánh giá lại'
        });
    }
};

const finalizeEvaluation = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        if (req.user.role !== 'admin' && req.user.role !== 'supervisor' && req.user.role !== 'advisor') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin, supervisor hoặc advisor có quyền hoàn tất đánh giá'
            });
        }

        const evaluation = await Evaluation.findOne({ _id: id, academicYearId });
        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        if (evaluation.status !== 'supervised') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể hoàn tất đánh giá đã được giám sát'
            });
        }

        await evaluation.finalize(req.user.id);

        // TẠO THÔNG BÁO: Gửi thông báo cho Chuyên gia rằng đánh giá đã Hoàn tất
        await Notification.createEvaluationNotification(
            evaluation._id,
            'evaluation_finalized',
            evaluation.evaluatorId, // Gửi cho chuyên gia đánh giá
            req.user.id // Người gửi là Admin/Supervisor/Advisor
        );

        res.json({
            success: true,
            message: 'Hoàn tất đánh giá thành công',
            data: evaluation
        });

    } catch (error) {
        console.error('Finalize evaluation error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi hoàn tất đánh giá'
        });
    }
};

const autoSaveEvaluation = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const academicYearId = req.academicYearId;
        const currentUserId = req.user.id.toString();
        const currentUserRole = req.user.role;


        const evaluation = await Evaluation.findOne({ _id: id, academicYearId });
        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        // --- Logic Kiểm tra Quyền (FIX cho Expert) ---
        // Sử dụng phương thức canEdit của Model (đã được sửa)
        if (!evaluation.canEdit(currentUserId, currentUserRole)) {
            let errorMessage = 'Không có quyền cập nhật đánh giá này.';

            if (currentUserRole === 'expert' && evaluation.evaluatorId.toString() === currentUserId) {
                if (evaluation.status !== 'draft') {
                    // Lỗi 403 phổ biến nhất: Expert cố gắng sửa bài đã nộp
                    errorMessage = `Bạn chỉ có quyền sửa bản nháp. Đánh giá này đang ở trạng thái: ${evaluation.status}.`;
                }
            } else if (currentUserRole === 'expert') {
                errorMessage = 'Bạn chỉ có quyền chỉnh sửa đánh giá do bạn tạo.';
            }

            return res.status(403).json({
                success: false,
                message: errorMessage
            });
        }
        // --- End Logic Kiểm tra Quyền ---

        const allowedAutoSaveFields = [
            'overallComment', 'rating', 'evidenceAssessment',
            'strengths', 'improvementAreas', 'recommendations'
        ];

        allowedAutoSaveFields.forEach(field => {
            if (updateData[field] !== undefined) {
                evaluation[field] = updateData[field];
            }
        });

        await evaluation.autoSave();

        res.json({
            success: true,
            message: 'Lưu tự động thành công',
            data: { lastSaved: evaluation.metadata.lastSaved }
        });

    } catch (error) {
        console.error('Auto save error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi auto save'
        });
    }
};

const getEvaluatorStats = async (req, res) => {
    try {
        const { evaluatorId } = req.params;
        const academicYearId = req.academicYearId;

        const stats = await Evaluation.getEvaluatorStats(evaluatorId, academicYearId);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Get evaluator stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy thống kê'
        });
    }
};

const getSystemStats = async (req, res) => {
    try {
        const academicYearId = req.academicYearId;

        const stats = await Evaluation.getSystemStats(academicYearId);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Get system stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy thống kê hệ thống'
        });
    }
};

const getAverageScoreByReport = async (req, res) => {
    try {
        const { reportId } = req.params;

        // Không còn điểm trung bình nữa
        const averageScore = 0;

        res.json({
            success: true,
            data: { averageScore }
        });

    } catch (error) {
        console.error('Get average score error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy điểm trung bình'
        });
    }
};

const deleteEvaluation = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const evaluation = await Evaluation.findOne({ _id: id, academicYearId });
        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        if (req.user.role !== 'admin' &&
            (evaluation.evaluatorId.toString() !== req.user.id.toString() || evaluation.status !== 'draft')
        ) {
            return res.status(403).json({
                success: false,
                message: 'Bạn chỉ có quyền xóa bản nháp của chính mình'
            });
        }

        const assignment = await Assignment.findById(evaluation.assignmentId);
        if (assignment && assignment.status !== 'cancelled' && assignment.status !== 'pending') {
            assignment.status = 'accepted';
            assignment.evaluationId = undefined;
            await assignment.save();
        }

        await Evaluation.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Đã xóa đánh giá thành công'
        });

    } catch (error) {
        console.error('Delete evaluation error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa đánh giá'
        });
    }
};

module.exports = {
    getEvaluations,
    getEvaluationById,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
    submitEvaluation,
    superviseEvaluation,
    requestReEvaluation,
    finalizeEvaluation,
    autoSaveEvaluation,
    getEvaluatorStats,
    getSystemStats,
    getAverageScoreByReport
};