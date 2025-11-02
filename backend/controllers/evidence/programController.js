const mongoose = require('mongoose');
const Program = require('../../models/Evidence/Program');

const getPrograms = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const academicYearId = req.academicYearId;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = { academicYearId };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
            ];
        }

        if (status) query.status = status;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [programs, total] = await Promise.all([
            Program.find(query)
                .populate('academicYearId', 'name code')
                .populate('createdBy', 'fullName email')
                .populate('updatedBy', 'fullName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            Program.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                programs,
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
        console.error('Get programs error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách chương trình'
        });
    }
};

const getAllPrograms = async (req, res) => {
    try {
        const academicYearId = req.academicYearId;

        const programs = await Program.find({
            academicYearId,
            status: 'active'
        })
            .select('name code')
            .sort({ name: 1 });

        res.json({
            success: true,
            data: programs
        });

    } catch (error) {
        console.error('Get all programs error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách chương trình'
        });
    }
};

const getProgramById = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const program = await Program.findOne({ _id: id, academicYearId })
            .populate('academicYearId', 'name code')
            .populate('createdBy', 'fullName email')
            .populate('updatedBy', 'fullName email');

        if (!program) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chương trình trong năm học này'
            });
        }

        res.json({
            success: true,
            data: program
        });

    } catch (error) {
        console.error('Get program by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin chương trình'
        });
    }
};

const createProgram = async (req, res) => {
    try {
        const {
            name,
            code,
            applicableYear,
            effectiveDate,
            expiryDate,
            objectives,
            guidelines
        } = req.body;

        const academicYearId = req.academicYearId;

        const existingProgram = await Program.findOne({
            code: code.toUpperCase(),
            academicYearId
        });

        if (existingProgram) {
            return res.status(400).json({
                success: false,
                message: `Mã chương trình ${code} đã tồn tại trong năm học này`
            });
        }

        const program = new Program({
            academicYearId,
            name: name.trim(),
            code: code.toUpperCase().trim(),
            applicableYear: applicableYear || new Date().getFullYear(),
            effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
            expiryDate: expiryDate ? new Date(expiryDate) : undefined,
            objectives: objectives?.trim(),
            guidelines: guidelines?.trim(),
            createdBy: req.user.id,
            updatedBy: req.user.id
        });

        await program.save();

        await program.populate([
            { path: 'academicYearId', select: 'name code' },
            { path: 'createdBy', select: 'fullName email' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Tạo chương trình thành công',
            data: program
        });

    } catch (error) {
        console.error('Create program error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo chương trình'
        });
    }
};

const updateProgram = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const academicYearId = req.academicYearId;

        const program = await Program.findOne({ _id: id, academicYearId });
        if (!program) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chương trình trong năm học này'
            });
        }

        if (updateData.code && updateData.code.toUpperCase() !== program.code) {
            const existingProgram = await Program.findOne({
                code: updateData.code.toUpperCase(),
                academicYearId,
                _id: { $ne: id }
            });
            if (existingProgram) {
                return res.status(400).json({
                    success: false,
                    message: `Mã chương trình ${updateData.code} đã tồn tại trong năm học này`
                });
            }
        }

        const isInUse = await program.isInUse();
        if (isInUse && updateData.code) {
            return res.status(400).json({
                success: false,
                message: 'Không thể thay đổi mã chương trình đang được sử dụng'
            });
        }

        Object.assign(program, updateData);
        program.updatedBy = req.user.id;

        if (updateData.code) {
            program.code = updateData.code.toUpperCase();
        }

        await program.save();

        await program.populate([
            { path: 'academicYearId', select: 'name code' },
            { path: 'createdBy', select: 'fullName email' },
            { path: 'updatedBy', select: 'fullName email' }
        ]);

        res.json({
            success: true,
            message: 'Cập nhật chương trình thành công',
            data: program
        });

    } catch (error) {
        console.error('Update program error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật chương trình'
        });
    }
};

const deleteProgram = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const program = await Program.findOne({ _id: id, academicYearId });
        if (!program) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chương trình trong năm học này'
            });
        }

        const isInUse = await program.isInUse();
        if (isInUse) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa chương trình đang được sử dụng'
            });
        }

        await Program.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Xóa chương trình thành công'
        });

    } catch (error) {
        console.error('Delete program error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa chương trình'
        });
    }
};

const copyProgramToAnotherYear = async (req, res) => {
    try {
        const { id } = req.params;
        const { targetAcademicYearId, newCode } = req.body;

        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin và manager mới có quyền sao chép chương trình giữa các năm học'
            });
        }

        const program = await Program.findOne({
            _id: id,
            academicYearId: req.academicYearId
        });

        if (!program) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chương trình'
            });
        }

        const existingProgram = await Program.findOne({
            code: newCode.toUpperCase(),
            academicYearId: targetAcademicYearId
        });

        if (existingProgram) {
            return res.status(400).json({
                success: false,
                message: `Mã chương trình ${newCode} đã tồn tại trong năm học đích`
            });
        }

        const copiedProgram = new Program({
            ...program.toObject(),
            _id: undefined,
            academicYearId: targetAcademicYearId,
            code: newCode.toUpperCase(),
            status: 'draft',
            createdBy: req.user.id,
            updatedBy: req.user.id,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await copiedProgram.save();

        res.status(201).json({
            success: true,
            message: 'Sao chép chương trình sang năm học khác thành công',
            data: copiedProgram
        });

    } catch (error) {
        console.error('Copy program to another year error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi sao chép chương trình'
        });
    }
};

const getProgramStatistics = async (req, res) => {
    try {
        const academicYearId = req.academicYearId;

        const stats = await Program.aggregate([
            { $match: { academicYearId: new mongoose.Types.ObjectId(academicYearId) } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const statusStats = stats.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                statusStats,
                academicYear: req.currentAcademicYear
            }
        });

    } catch (error) {
        console.error('Get program statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê chương trình'
        });
    }
};

module.exports = {
    getPrograms,
    getAllPrograms,
    getProgramById,
    createProgram,
    updateProgram,
    deleteProgram,
    copyProgramToAnotherYear,
    getProgramStatistics
};