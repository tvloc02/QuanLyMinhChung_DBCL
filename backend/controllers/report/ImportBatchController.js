const ImportBatch = require('../../models/report/ImportBatch');

const createBatch = async (req, res) => {
    try {
        const { programId, organizationId } = req.body;
        const academicYearId = req.academicYearId;

        const batch = new ImportBatch({
            academicYearId,
            programId,
            organizationId,
            batchId: ImportBatch.generateBatchId(),
            importedBy: req.user.id,
            status: 'pending'
        });

        await batch.save();

        res.status(201).json({
            success: true,
            message: 'Tạo batch import thành công',
            data: batch
        });
    } catch (error) {
        console.error('Create batch error:', error);
        res.status(500).json({ success: false, message: 'Không thể tạo batch import' });
    }
};

const getBatchById = async (req, res) => {
    try {
        const { id } = req.params;

        const batch = await ImportBatch.findById(id)
            .populate('academicYearId', 'name code')
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .populate('importedBy', 'fullName email')
            .populate('importedEvidences.evidenceId', 'code name');

        if (!batch) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy batch' });
        }

        res.json({ success: true, data: batch });
    } catch (error) {
        console.error('Get batch by ID error:', error);
        res.status(500).json({ success: false, message: 'Không thể lấy thông tin batch' });
    }
};

const getUserBatches = async (req, res) => {
    try {
        const { page, limit, status } = req.query;
        const academicYearId = req.academicYearId;

        const result = await ImportBatch.getUserBatches(req.user.id, {
            page,
            limit,
            status,
            academicYearId
        });

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Get user batches error:', error);
        res.status(500).json({ success: false, message: 'Không thể lấy danh sách batch' });
    }
};

const getBatchStats = async (req, res) => {
    try {
        const academicYearId = req.academicYearId;
        const stats = await ImportBatch.getStats(academicYearId, req.user.id);

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Get batch stats error:', error);
        res.status(500).json({ success: false, message: 'Không thể lấy thống kê batch' });
    }
};

const startBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const batch = await ImportBatch.findById(id);
        if (!batch) return res.status(404).json({ success: false, message: 'Không tìm thấy batch' });

        await batch.markAsProcessing();
        res.json({ success: true, message: 'Batch đã chuyển sang trạng thái processing', data: batch });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Không thể cập nhật batch' });
    }
};

const completeBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const batch = await ImportBatch.findById(id);
        if (!batch) return res.status(404).json({ success: false, message: 'Không tìm thấy batch' });

        await batch.markAsCompleted();
        res.json({ success: true, message: 'Batch đã hoàn thành', data: batch });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Không thể cập nhật batch' });
    }
};

const failBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const batch = await ImportBatch.findById(id);
        if (!batch) return res.status(404).json({ success: false, message: 'Không tìm thấy batch' });

        await batch.markAsFailed(reason || 'Unknown error');
        res.json({ success: true, message: 'Batch đã được đánh dấu thất bại', data: batch });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Không thể cập nhật batch' });
    }
};

const cancelBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const batch = await ImportBatch.findById(id);
        if (!batch) return res.status(404).json({ success: false, message: 'Không tìm thấy batch' });

        await batch.cancel(req.user.id, reason);
        res.json({ success: true, message: 'Batch đã bị hủy', data: batch });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Không thể hủy batch' });
    }
};

const getBatchErrors = async (req, res) => {
    try {
        const { id } = req.params;
        const batch = await ImportBatch.findById(id);

        if (!batch) return res.status(404).json({ success: false, message: 'Không tìm thấy batch' });

        res.json({ success: true, data: batch.errors });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Không thể lấy lỗi batch' });
    }
};

const cleanupBatches = async (req, res) => {
    try {
        const { days } = req.query;
        const result = await ImportBatch.cleanupOldBatches(days || 90);

        res.json({ success: true, message: `Đã xóa ${result.deletedCount} batch cũ` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Không thể dọn batch cũ' });
    }
};

module.exports = {
    createBatch,
    getBatchById,
    getUserBatches,
    getBatchStats,
    startBatch,
    completeBatch,
    failBatch,
    cancelBatch,
    getBatchErrors,
    cleanupBatches
};