// backend/routes/report/reports.js - FULL FILE

const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireManager, requireAdmin } = require('../../middleware/auth');
const { attachCurrentAcademicYear } = require('../../middleware/academicYear');
const validation = require('../../middleware/validation');
const reportController = require('../../controllers/report/reportController');
const multer = require('multer');
const path = require('path');

router.use(auth, attachCurrentAcademicYear);

const uploadDir = path.join(process.cwd(), 'uploads', 'reports');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and Word files are allowed'));
        }
    },
    limits: {
        fileSize: 50 * 1024 * 1024
    }
});

const createReportValidation = [
    body('title')
        .notEmpty()
        .withMessage('Tiêu đề báo cáo là bắt buộc')
        .trim()
        .isLength({ max: 500 })
        .withMessage('Tiêu đề không được quá 500 ký tự'),
    body('type')
        .notEmpty()
        .withMessage('Loại báo cáo là bắt buộc')
        .isIn(['criteria', 'standard', 'overall_tdg'])
        .withMessage('Loại báo cáo không hợp lệ'),
    body('programId')
        .notEmpty()
        .withMessage('Chương trình là bắt buộc')
        .isMongoId()
        .withMessage('ID chương trình không hợp lệ'),
    body('organizationId')
        .notEmpty()
        .withMessage('Tổ chức là bắt buộc')
        .isMongoId()
        .withMessage('ID tổ chức không hợp lệ'),
    body('standardId')
        .optional({ checkFalsy: true })
        .isMongoId()
        .withMessage('ID tiêu chuẩn không hợp lệ'),
    body('criteriaId')
        .optional({ checkFalsy: true })
        .isMongoId()
        .withMessage('ID tiêu chí không hợp lệ'),
    body('contentMethod')
        .optional()
        .isIn(['online_editor', 'file_upload'])
        .withMessage('Phương thức nhập không hợp lệ'),
    body('content')
        .optional()
        .trim(),
    body('summary')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Tóm tắt không được quá 1000 ký tự'),
    body('keywords')
        .optional()
        .isArray()
        .withMessage('Từ khóa phải là mảng')
];

const updateReportValidation = [
    param('id').isMongoId().withMessage('ID báo cáo không hợp lệ'),
    body('title')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Tiêu đề không được quá 500 ký tự'),
    body('content')
        .optional()
        .trim(),
    body('summary')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Tóm tắt không được quá 1000 ký tự'),
    body('keywords')
        .optional()
        .isArray()
        .withMessage('Từ khóa phải là mảng')
];

const approvalValidation = [
    param('id').isMongoId().withMessage('ID báo cáo không hợp lệ'),
    body('feedback')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Phản hồi không được quá 2000 ký tự')
];

// ============ GET INSERTABLE REPORTS (QUERY REPORTS) ============
// Phải đặt trước GET /:id để tránh conflict
router.get('/insertable',
    [
        query('reportType')
            .notEmpty()
            .withMessage('Loại báo cáo là bắt buộc')
            .isIn(['criteria', 'standard', 'overall_tdg'])
            .withMessage('Loại báo cáo không hợp lệ'),
        query('standardId')
            .optional()
            .isMongoId()
            .withMessage('ID tiêu chuẩn không hợp lệ'),
        query('programId')
            .optional()
            .isMongoId()
            .withMessage('ID chương trình không hợp lệ'),
        query('organizationId')
            .optional()
            .isMongoId()
            .withMessage('ID tổ chức không hợp lệ')
    ],
    validation,
    reportController.getInsertableReports
);

// ============ GET BY-TASK (QUERY REPORTS) ============
router.get('/by-task',
    [
        query('taskId')
            .notEmpty()
            .withMessage('ID nhiệm vụ là bắt buộc')
            .isMongoId()
            .withMessage('ID nhiệm vụ không hợp lệ'),
        query('reportType')
            .notEmpty()
            .withMessage('Loại báo cáo là bắt buộc')
            .isIn(['criteria', 'standard', 'overall_tdg'])
            .withMessage('Loại báo cáo không hợp lệ'),
        query('standardId')
            .optional()
            .isMongoId()
            .withMessage('ID tiêu chuẩn không hợp lệ'),
        query('criteriaId')
            .optional()
            .isMongoId()
            .withMessage('ID tiêu chí không hợp lệ')
    ],
    validation,
    reportController.getReportsByTask
);

// ============ GET BY STANDARD/CRITERIA (QUERY REPORTS) ============
router.get('/by-standard-criteria',
    [
        query('reportType')
            .notEmpty()
            .withMessage('Loại báo cáo là bắt buộc'),
        query('standardId')
            .notEmpty()
            .withMessage('ID tiêu chuẩn là bắt buộc')
            .isMongoId()
            .withMessage('ID tiêu chuẩn không hợp lệ'),
        query('criteriaId')
            .optional()
            .isMongoId()
            .withMessage('ID tiêu chí không hợp lệ')
    ],
    validation,
    reportController.getReportsByStandardCriteria
);

// ============ POST - TẠOYÊU CẦU CẤP QUYỀN CHỈNH SỬA ============
router.post('/:id/request-edit-permission',
    [param('id').isMongoId().withMessage('ID báo cáo không hợp lệ')],
    validation,
    reportController.requestEditPermission
);

// ============ GET - DANH SÁCH YÊU CẦU CẤP QUYỀN ============
router.get('/:id/edit-requests',
    [param('id').isMongoId().withMessage('ID báo cáo không hợp lệ')],
    validation,
    reportController.getEditRequests
);

// ============ POST - PHÊ DUYỆT YÊU CẦU CẤP QUYỀN ============
router.post('/:id/edit-requests/approve',
    [
        param('id').isMongoId().withMessage('ID báo cáo không hợp lệ'),
        body('requesterId').isMongoId().withMessage('ID người yêu cầu không hợp lệ')
    ],
    validation,
    reportController.approveEditRequest
);

// ============ POST - TỪ CHỐI YÊU CẦU CẤP QUYỀN ============
router.post('/:id/edit-requests/reject',
    [
        param('id').isMongoId().withMessage('ID báo cáo không hợp lệ'),
        body('requesterId').isMongoId().withMessage('ID người yêu cầu không hợp lệ'),
        body('reason').optional().isLength({ max: 500 }).withMessage('Lý do từ chối không được quá 500 ký tự')
    ],
    validation,
    reportController.rejectEditRequest
);

// ============ POST - TẠO BÁO CÁO ============
router.post('/',
    createReportValidation,
    validation,
    reportController.createReport
);

// ============ GET - DANH SÁCH BÁO CÁO ============
router.get('/',
    [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Trang phải là số nguyên dương'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit phải từ 1-100'),
        query('search')
            .optional()
            .trim(),
        query('type')
            .optional()
            .isIn(['criteria', 'standard', 'overall_tdg'])
            .withMessage('Loại báo cáo không hợp lệ'),
        query('status')
            .optional()
            .isIn(['draft', 'public', 'approved', 'rejected', 'published'])
            .withMessage('Trạng thái không hợp lệ'),
        query('programId')
            .optional()
            .isMongoId()
            .withMessage('ID chương trình không hợp lệ'),
        query('organizationId')
            .optional()
            .isMongoId()
            .withMessage('ID tổ chức không hợp lệ'),
        query('standardId')
            .optional()
            .isMongoId()
            .withMessage('ID tiêu chuẩn không hợp lệ'),
        query('criteriaId')
            .optional()
            .isMongoId()
            .withMessage('ID tiêu chí không hợp lệ')
    ],
    validation,
    reportController.getReports
);

router.get('/:id',
    [param('id').isMongoId().withMessage('ID báo cáo không hợp lệ')],
    validation,
    reportController.getReportById
);

router.put('/:id',
    updateReportValidation,
    validation,
    reportController.updateReport
);

router.delete('/:id',
    [param('id').isMongoId().withMessage('ID báo cáo không hợp lệ')],
    validation,
    reportController.deleteReport
);

router.post('/:id/publish',
    [param('id').isMongoId().withMessage('ID báo cáo không hợp lệ')],
    validation,
    reportController.publishReport
);

router.post('/:id/unpublish',
    requireManager,
    [param('id').isMongoId().withMessage('ID báo cáo không hợp lệ')],
    validation,
    reportController.unpublishReport
);

router.post('/:id/approve',
    requireManager,
    approvalValidation,
    validation,
    reportController.approveReport
);

router.post('/:id/reject',
    requireManager,
    approvalValidation,
    validation,
    reportController.rejectReport
);

router.post('/:id/make-public',
    [param('id').isMongoId().withMessage('ID báo cáo không hợp lệ')],
    validation,
    reportController.makePublic
);

router.post('/:id/assign-reporter',
    requireManager,
    [
        param('id').isMongoId().withMessage('ID báo cáo không hợp lệ'),
        body('reporterIds')
            .isArray({ min: 1 })
            .withMessage('Danh sách reporter phải là mảng và có ít nhất 1 phần tử')
    ],
    validation,
    reportController.assignReporter
);

router.post('/:id/upload-file',
    upload.single('file'),
    [param('id').isMongoId().withMessage('ID báo cáo không hợp lệ')],
    validation,
    reportController.uploadReportFile
);

router.get('/:id/download-file',
    [param('id').isMongoId().withMessage('ID báo cáo không hợp lệ')],
    validation,
    reportController.downloadReportFile
);

router.post('/:id/convert-file-to-content',
    [param('id').isMongoId().withMessage('ID báo cáo không hợp lệ')],
    validation,
    reportController.convertFileToContent
);

router.get('/:id/download',
    [
        param('id').isMongoId().withMessage('ID báo cáo không hợp lệ'),
        query('format')
            .optional()
            .isIn(['html', 'pdf'])
            .withMessage('Định dạng không hợp lệ')
    ],
    validation,
    reportController.downloadReport
);

router.get('/stats',
    [
        query('type')
            .optional()
            .isIn(['criteria', 'standard', 'overall_tdg'])
            .withMessage('Loại báo cáo không hợp lệ'),
        query('status')
            .optional()
            .isIn(['draft', 'public', 'approved', 'rejected', 'published'])
            .withMessage('Trạng thái không hợp lệ'),
        query('programId')
            .optional()
            .isMongoId()
            .withMessage('ID chương trình không hợp lệ'),
        query('organizationId')
            .optional()
            .isMongoId()
            .withMessage('ID tổ chức không hợp lệ')
    ],
    validation,
    reportController.getReportStats
);

router.get('/:id/evidences',
    [param('id').isMongoId().withMessage('ID báo cáo không hợp lệ')],
    validation,
    reportController.getReportEvidences
);

router.get('/:id/versions',
    [param('id').isMongoId().withMessage('ID báo cáo không hợp lệ')],
    validation,
    reportController.getReportVersions
);

router.post('/:id/versions',
    [
        param('id').isMongoId().withMessage('ID báo cáo không hợp lệ'),
        body('content')
            .notEmpty()
            .withMessage('Nội dung phiên bản là bắt buộc'),
        body('changeNote')
            .optional()
            .trim()
    ],
    validation,
    reportController.addReportVersion
);

router.get('/:id/comments',
    [param('id').isMongoId().withMessage('ID báo cáo không hợp lệ')],
    validation,
    reportController.getReportComments
);

router.post('/:id/comments',
    [
        param('id').isMongoId().withMessage('ID báo cáo không hợp lệ'),
        body('comment')
            .notEmpty()
            .withMessage('Nội dung nhận xét là bắt buộc'),
        body('section')
            .optional()
            .trim()
    ],
    validation,
    reportController.addReportComment
);

router.put('/:id/comments/:commentId/resolve',
    [
        param('id').isMongoId().withMessage('ID báo cáo không hợp lệ'),
        param('commentId').isMongoId().withMessage('ID nhận xét không hợp lệ')
    ],
    validation,
    reportController.resolveReportComment
);

module.exports = router;