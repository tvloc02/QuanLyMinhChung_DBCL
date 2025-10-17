const mongoose = require('mongoose');
const Organization = require('../../models/Evidence/Organization');

const getOrganizations = async (req, res) => {
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
                { code: { $regex: search, $options: 'i' } }
            ];
        }

        if (status) query.status = status;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [organizations, total] = await Promise.all([
            Organization.find(query)
                .populate('academicYearId', 'name code')
                .populate('createdBy', 'fullName email')
                .populate('updatedBy', 'fullName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            Organization.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                organizations,
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
        console.error('Get organizations error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách tổ chức'
        });
    }
};

const getAllOrganizations = async (req, res) => {
    try {
        const academicYearId = req.academicYearId;

        const organizations = await Organization.find({
            academicYearId,
            status: 'active'
        })
            .select('name code departments')
            .sort({ name: 1 });

        res.json({
            success: true,
            data: organizations
        });

    } catch (error) {
        console.error('Get all organizations error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách tổ chức'
        });
    }
};

const getOrganizationById = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const organization = await Organization.findOne({ _id: id, academicYearId })
            .populate('academicYearId', 'name code')
            .populate('createdBy', 'fullName email')
            .populate('updatedBy', 'fullName email');

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tổ chức trong năm học này'
            });
        }

        res.json({
            success: true,
            data: organization
        });

    } catch (error) {
        console.error('Get organization by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin tổ chức'
        });
    }
};

const createOrganization = async (req, res) => {
    try {
        const {
            name,
            code,
            website,
            contactEmail,
            contactPhone,
            address,
            country,
            departments
        } = req.body;

        const academicYearId = req.academicYearId;

        const existingOrganization = await Organization.findOne({
            academicYearId,
            code: code.toUpperCase()
        });

        if (existingOrganization) {
            return res.status(400).json({
                success: false,
                message: `Mã tổ chức ${code} đã tồn tại trong năm học này`
            });
        }

        // Xử lý departments
        const processedDepts = [];
        if (departments && Array.isArray(departments)) {
            processedDepts.push(...departments.map(dept => ({
                _id: new mongoose.Types.ObjectId(),
                name: dept.name?.trim() || '',
                email: dept.email?.trim() || undefined,
                phone: dept.phone?.trim() || undefined,
                createdAt: new Date()
            })));
        }

        const organization = new Organization({
            academicYearId,
            name: name.trim(),
            code: code.toUpperCase().trim(),
            contactEmail: contactEmail?.trim(),
            contactPhone: contactPhone?.trim(),
            website: website?.trim(),
            address: address?.trim(),
            country: country?.trim(),
            departments: processedDepts,
            createdBy: req.user.id,
            updatedBy: req.user.id
        });

        await organization.save();

        await organization.populate([
            { path: 'academicYearId', select: 'name code' },
            { path: 'createdBy', select: 'fullName email' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Tạo tổ chức thành công',
            data: organization
        });

    } catch (error) {
        console.error('Create organization error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo tổ chức'
        });
    }
};

const updateOrganization = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const academicYearId = req.academicYearId;

        const organization = await Organization.findOne({ _id: id, academicYearId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tổ chức trong năm học này'
            });
        }

        if (updateData.code && updateData.code.toUpperCase() !== organization.code) {
            const existingOrganization = await Organization.findOne({
                academicYearId,
                code: updateData.code.toUpperCase(),
                _id: { $ne: id }
            });
            if (existingOrganization) {
                return res.status(400).json({
                    success: false,
                    message: `Mã tổ chức ${updateData.code} đã tồn tại`
                });
            }
        }

        const isInUse = await organization.isInUse();
        if (isInUse && updateData.code) {
            return res.status(400).json({
                success: false,
                message: 'Không thể thay đổi mã tổ chức đang được sử dụng'
            });
        }

        const allowedFields = [
            'name',
            'contactEmail', 'contactPhone', 'status', 'website', 'address', 'country'
        ];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                organization[field] = updateData[field];
            }
        });

        if (updateData.code) {
            organization.code = updateData.code.toUpperCase();
        }

        // Update departments nếu được gửi kèm
        if (updateData.departments && Array.isArray(updateData.departments)) {
            const newDepts = [];

            for (const dept of updateData.departments) {
                // Nếu có _id và không phải temp_* thì giữ lại, không thì tạo ID mới
                if (dept._id && !String(dept._id).startsWith('temp_')) {
                    // Tìm department cũ để giữ lại createdAt
                    const existingDept = organization.departments.find(d => String(d._id) === String(dept._id));
                    newDepts.push({
                        _id: dept._id,
                        name: dept.name?.trim() || '',
                        email: dept.email?.trim() || undefined,
                        phone: dept.phone?.trim() || undefined,
                        createdAt: existingDept?.createdAt || new Date()
                    });
                } else {
                    // Tạo department mới
                    newDepts.push({
                        _id: new mongoose.Types.ObjectId(),
                        name: dept.name?.trim() || '',
                        email: dept.email?.trim() || undefined,
                        phone: dept.phone?.trim() || undefined,
                        createdAt: new Date()
                    });
                }
            }
            organization.departments = newDepts;
        }

        organization.updatedBy = req.user.id;
        await organization.save();

        await organization.populate([
            { path: 'academicYearId', select: 'name code' },
            { path: 'updatedBy', select: 'fullName email' }
        ]);

        res.json({
            success: true,
            message: 'Cập nhật tổ chức thành công',
            data: organization
        });

    } catch (error) {
        console.error('Update organization error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật tổ chức'
        });
    }
};

const addDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone } = req.body;
        const academicYearId = req.academicYearId;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Tên phòng ban là bắt buộc'
            });
        }

        const organization = await Organization.findOne({ _id: id, academicYearId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tổ chức'
            });
        }

        const newDept = {
            _id: new mongoose.Types.ObjectId(),
            name: name.trim(),
            email: email?.trim(),
            phone: phone?.trim(),
            createdAt: new Date()
        };

        organization.departments.push(newDept);
        organization.updatedBy = req.user.id;
        await organization.save();

        res.status(201).json({
            success: true,
            message: 'Thêm phòng ban thành công',
            data: newDept
        });

    } catch (error) {
        console.error('Add department error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi thêm phòng ban'
        });
    }
};

const updateDepartment = async (req, res) => {
    try {
        const { id, deptId } = req.params;
        const { name, email, phone } = req.body;
        const academicYearId = req.academicYearId;

        const organization = await Organization.findOne({ _id: id, academicYearId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tổ chức'
            });
        }

        const dept = organization.departments.id(deptId);
        if (!dept) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng ban'
            });
        }

        if (name) dept.name = name.trim();
        if (email !== undefined) dept.email = email ? email.trim() : undefined;
        if (phone !== undefined) dept.phone = phone ? phone.trim() : undefined;

        organization.updatedBy = req.user.id;
        await organization.save();

        res.json({
            success: true,
            message: 'Cập nhật phòng ban thành công',
            data: dept
        });

    } catch (error) {
        console.error('Update department error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật phòng ban'
        });
    }
};

const deleteDepartment = async (req, res) => {
    try {
        const { id, deptId } = req.params;
        const academicYearId = req.academicYearId;

        const organization = await Organization.findOne({ _id: id, academicYearId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tổ chức'
            });
        }

        organization.departments.id(deptId).deleteOne();
        organization.updatedBy = req.user.id;
        await organization.save();

        res.json({
            success: true,
            message: 'Xóa phòng ban thành công'
        });

    } catch (error) {
        console.error('Delete department error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa phòng ban'
        });
    }
};

const deleteOrganization = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const organization = await Organization.findOne({ _id: id, academicYearId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tổ chức trong năm học này'
            });
        }

        const isInUse = await organization.isInUse();
        if (isInUse) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa tổ chức đang được sử dụng'
            });
        }

        await Organization.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Xóa tổ chức thành công'
        });

    } catch (error) {
        console.error('Delete organization error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa tổ chức'
        });
    }
};

const getOrganizationStatistics = async (req, res) => {
    try {
        const academicYearId = req.academicYearId;

        const stats = await Organization.aggregate([
            { $match: { academicYearId: mongoose.Types.ObjectId(academicYearId) } },
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
        console.error('Get organization statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê tổ chức'
        });
    }
};

module.exports = {
    getOrganizations,
    getAllOrganizations,
    getOrganizationById,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    getOrganizationStatistics,
    addDepartment,
    updateDepartment,
    deleteDepartment
};