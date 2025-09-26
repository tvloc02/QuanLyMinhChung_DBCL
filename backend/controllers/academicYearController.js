const AcademicYear = require('../models/AcademicYear');
const { Program, Organization, Standard, Criteria } = require('../models/Program');
const Evidence = require('../models/Evidence');

// Get all academic years
const getAcademicYears = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            status,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (status) query.status = status;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [academicYears, total] = await Promise.all([
            AcademicYear.find(query)
                .populate('createdBy', 'fullName email')
                .populate('updatedBy', 'fullName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            AcademicYear.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                academicYears,
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
        console.error('Get academic years error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách năm học'
        });
    }
};

// Get all academic years for dropdown
const getAllAcademicYears = async (req, res) => {
    try {
        const academicYears = await AcademicYear.find({
            status: { $in: ['active', 'completed'] }
        })
            .select('name code startYear endYear isCurrent status')
            .sort({ startYear: -1 });

        res.json({
            success: true,
            data: academicYears
        });

    } catch (error) {
        console.error('Get all academic years error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách năm học'
        });
    }
};

// Get academic year by ID
const getAcademicYearById = async (req, res) => {
    try {
        const { id } = req.params;

        const academicYear = await AcademicYear.findById(id)
            .populate('createdBy', 'fullName email')
            .populate('updatedBy', 'fullName email');

        if (!academicYear) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy năm học'
            });
        }

        res.json({
            success: true,
            data: academicYear
        });

    } catch (error) {
        console.error('Get academic year by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin năm học'
        });
    }
};

// Get current academic year
const getCurrentAcademicYear = async (req, res) => {
    try {
        const currentYear = await AcademicYear.getCurrentYear();

        if (!currentYear) {
            return res.status(404).json({
                success: false,
                message: 'Chưa có năm học hiện tại được thiết lập'
            });
        }

        res.json({
            success: true,
            data: currentYear
        });

    } catch (error) {
        console.error('Get current academic year error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy năm học hiện tại'
        });
    }
};

// Create academic year
const createAcademicYear = async (req, res) => {
    try {
        const {
            name,
            startYear,
            endYear,
            startDate,
            endDate,
            description,
            isCurrent,
            copySettings
        } = req.body;

        // Check if academic year already exists
        const code = `${startYear}-${endYear}`;
        const existingYear = await AcademicYear.findOne({ code });

        if (existingYear) {
            return res.status(400).json({
                success: false,
                message: `Năm học ${code} đã tồn tại`
            });
        }

        const academicYear = new AcademicYear({
            name: name || `Năm học ${startYear}-${endYear}`,
            code,
            startYear,
            endYear,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            description,
            isCurrent: isCurrent || false,
            copySettings: copySettings || {},
            createdBy: req.user.id,
            updatedBy: req.user.id
        });

        await academicYear.save();

        await academicYear.populate([
            { path: 'createdBy', select: 'fullName email' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Tạo năm học thành công',
            data: academicYear
        });

    } catch (error) {
        console.error('Create academic year error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo năm học'
        });
    }
};

// Update academic year
const updateAcademicYear = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const academicYear = await AcademicYear.findById(id);
        if (!academicYear) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy năm học'
            });
        }

        // Check if code change conflicts with existing year
        if (updateData.code && updateData.code !== academicYear.code) {
            const existingYear = await AcademicYear.findOne({
                code: updateData.code,
                _id: { $ne: id }
            });
            if (existingYear) {
                return res.status(400).json({
                    success: false,
                    message: `Mã năm học ${updateData.code} đã tồn tại`
                });
            }
        }

        // Update fields
        Object.assign(academicYear, updateData);
        academicYear.updatedBy = req.user.id;

        await academicYear.save();

        await academicYear.populate([
            { path: 'createdBy', select: 'fullName email' },
            { path: 'updatedBy', select: 'fullName email' }
        ]);

        res.json({
            success: true,
            message: 'Cập nhật năm học thành công',
            data: academicYear
        });

    } catch (error) {
        console.error('Update academic year error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật năm học'
        });
    }
};

// Delete academic year
const deleteAcademicYear = async (req, res) => {
    try {
        const { id } = req.params;

        const academicYear = await AcademicYear.findById(id);
        if (!academicYear) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy năm học'
            });
        }

        // Check if can delete
        const canDelete = await academicYear.canDelete();
        if (!canDelete) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa năm học đang có dữ liệu'
            });
        }

        if (academicYear.isCurrent) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa năm học hiện tại'
            });
        }

        await AcademicYear.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Xóa năm học thành công'
        });

    } catch (error) {
        console.error('Delete academic year error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa năm học'
        });
    }
};

// Set current academic year
const setCurrentAcademicYear = async (req, res) => {
    try {
        const { id } = req.params;

        const academicYear = await AcademicYear.findById(id);
        if (!academicYear) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy năm học'
            });
        }

        await academicYear.activate();

        res.json({
            success: true,
            message: 'Đặt làm năm học hiện tại thành công',
            data: academicYear
        });

    } catch (error) {
        console.error('Set current academic year error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi đặt năm học hiện tại'
        });
    }
};

// Copy data from another academic year
const copyDataFromYear = async (req, res) => {
    try {
        const { id } = req.params;
        const { sourceYearId, copySettings } = req.body;

        if (!sourceYearId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu năm học nguồn'
            });
        }

        if (sourceYearId === id) {
            return res.status(400).json({
                success: false,
                message: 'Không thể sao chép từ chính năm học này'
            });
        }

        const [targetYear, sourceYear] = await Promise.all([
            AcademicYear.findById(id),
            AcademicYear.findById(sourceYearId)
        ]);

        if (!targetYear || !sourceYear) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy năm học'
            });
        }

        const results = await targetYear.copyDataFrom(sourceYearId, copySettings);

        res.json({
            success: true,
            message: 'Sao chép dữ liệu thành công',
            data: {
                results,
                sourceYear: {
                    name: sourceYear.name,
                    code: sourceYear.code
                },
                targetYear: {
                    name: targetYear.name,
                    code: targetYear.code
                }
            }
        });

    } catch (error) {
        console.error('Copy data from year error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi sao chép dữ liệu'
        });
    }
};

// Get academic year statistics
const getAcademicYearStatistics = async (req, res) => {
    try {
        const { id } = req.params;

        const academicYear = await AcademicYear.findById(id);
        if (!academicYear) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy năm học'
            });
        }

        const [programs, standards, criteria, evidences] = await Promise.all([
            Program.countDocuments({ academicYearId: id }),
            Standard.countDocuments({ academicYearId: id }),
            Criteria.countDocuments({ academicYearId: id }),
            Evidence.countDocuments({ academicYearId: id })
        ]);

        const stats = {
            programs,
            standards,
            criteria,
            evidences,
            programsByStatus: await Program.aggregate([
                { $match: { academicYearId: mongoose.Types.ObjectId(id) } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            evidencesByStatus: await Evidence.aggregate([
                { $match: { academicYearId: mongoose.Types.ObjectId(id) } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ])
        };

        // Update metadata
        academicYear.metadata = {
            ...academicYear.metadata,
            totalPrograms: programs,
            totalStandards: standards,
            totalCriteria: criteria,
            totalEvidences: evidences
        };

        await academicYear.save();

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Get academic year statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê năm học'
        });
    }
};

// Get years available for copying
const getAvailableYearsForCopy = async (req, res) => {
    try {
        const { id } = req.params;

        const availableYears = await AcademicYear.find({
            _id: { $ne: id },
            status: { $in: ['active', 'completed'] }
        })
            .select('name code startYear endYear status')
            .sort({ startYear: -1 });

        res.json({
            success: true,
            data: availableYears
        });

    } catch (error) {
        console.error('Get available years for copy error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách năm học'
        });
    }
};

module.exports = {
    getAcademicYears,
    getAllAcademicYears,
    getAcademicYearById,
    getCurrentAcademicYear,
    createAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
    setCurrentAcademicYear,
    copyDataFromYear,
    getAcademicYearStatistics,
    getAvailableYearsForCopy
};