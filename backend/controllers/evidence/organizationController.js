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

        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID tổ chức không hợp lệ'
            });
        }

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
            departments = []
        } = req.body;

        const academicYearId = req.academicYearId;

        // Validate required fields
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Tên tổ chức là bắt buộc'
            });
        }

        if (!code || !code.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Mã tổ chức là bắt buộc'
            });
        }

        // Check duplicate code
        const existingOrganization = await Organization.findOne({
            academicYearId,
            code: code.toUpperCase().trim()
        });

        if (existingOrganization) {
            return res.status(400).json({
                success: false,
                message: `Mã tổ chức ${code} đã tồn tại trong năm học này`
            });
        }

        // Process departments - filter out temp IDs
        const processedDepts = [];
        if (departments && Array.isArray(departments)) {
            for (const dept of departments) {
                // Skip temp departments
                if (dept._id && String(dept._id).startsWith('temp_')) {
                    continue;
                }

                if (!dept.name || !dept.name.trim()) {
                    continue;
                }

                processedDepts.push({
                    _id: new mongoose.Types.ObjectId(),
                    name: dept.name.trim(),
                    email: dept.email ? dept.email.trim() : undefined,
                    phone: dept.phone ? dept.phone.trim() : undefined,
                    createdAt: new Date()
                });
            }
        }

        const organization = new Organization({
            academicYearId,
            name: name.trim(),
            code: code.toUpperCase().trim(),
            contactEmail: contactEmail ? contactEmail.trim() : undefined,
            contactPhone: contactPhone ? contactPhone.trim() : undefined,
            website: website ? website.trim() : undefined,
            address: address ? address.trim() : undefined,
            country: country ? country.trim() : undefined,
            departments: processedDepts,
            status: 'active',
            createdBy: req.user.id,
            updatedBy: req.user.id
        });

        await organization.save();

        await organization.populate([
            { path: 'academicYearId', select: 'name code' },
            { path: 'createdBy', select: 'fullName email' },
            { path: 'updatedBy', select: 'fullName email' }
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
            message: 'Lỗi hệ thống khi tạo tổ chức',
            details: error.message
        });
    }
};

const updateOrganization = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const academicYearId = req.academicYearId;

        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID tổ chức không hợp lệ'
            });
        }

        const organization = await Organization.findOne({ _id: id, academicYearId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tổ chức trong năm học này'
            });
        }

        // Check if code is changing and if it's already in use
        if (updateData.code && updateData.code.toUpperCase().trim() !== organization.code) {
            const existingOrganization = await Organization.findOne({
                academicYearId,
                code: updateData.code.toUpperCase().trim(),
                _id: { $ne: id }
            });
            if (existingOrganization) {
                return res.status(400).json({
                    success: false,
                    message: `Mã tổ chức ${updateData.code} đã tồn tại`
                });
            }

            // Check if organization is in use
            const isInUse = await organization.isInUse();
            if (isInUse) {
                return res.status(400).json({
                    success: false,
                    message: 'Không thể thay đổi mã tổ chức đang được sử dụng'
                });
            }
        }

        // Update allowed fields
        const allowedFields = [
            'name',
            'contactEmail',
            'contactPhone',
            'status',
            'website',
            'address',
            'country'
        ];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined && updateData[field] !== null) {
                organization[field] = String(updateData[field]).trim();
            }
        });

        if (updateData.code) {
            organization.code = updateData.code.toUpperCase().trim();
        }

        // Handle departments update - IMPORTANT: REPLACE not merge
        if (updateData.departments !== undefined && Array.isArray(updateData.departments)) {
            const newDepts = [];

            for (const dept of updateData.departments) {
                // Skip temp departments (những cái mới thêm trong frontend chưa lưu)
                if (dept._id && String(dept._id).startsWith('temp_')) {
                    continue;
                }

                if (!dept.name || !dept.name.trim()) {
                    continue;
                }

                // Validate email
                if (dept.email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(dept.email.trim())) {
                    return res.status(400).json({
                        success: false,
                        message: `Email phòng ban "${dept.name}" không hợp lệ: ${dept.email}`
                    });
                }

                // Validate phone
                if (dept.phone && !/^[\d\s\-\+\(\)]+$/.test(dept.phone.trim())) {
                    return res.status(400).json({
                        success: false,
                        message: `Số điện thoại phòng ban "${dept.name}" không hợp lệ: ${dept.phone}`
                    });
                }

                // If it has an _id, check if it's valid ObjectId
                if (dept._id) {
                    if (mongoose.Types.ObjectId.isValid(dept._id)) {
                        // Existing department
                        newDepts.push({
                            _id: new mongoose.Types.ObjectId(dept._id),
                            name: dept.name.trim(),
                            email: dept.email ? dept.email.trim() : undefined,
                            phone: dept.phone ? dept.phone.trim() : undefined,
                            createdAt: new Date()
                        });
                    } else {
                        // Invalid ID format, treat as new
                        newDepts.push({
                            _id: new mongoose.Types.ObjectId(),
                            name: dept.name.trim(),
                            email: dept.email ? dept.email.trim() : undefined,
                            phone: dept.phone ? dept.phone.trim() : undefined,
                            createdAt: new Date()
                        });
                    }
                } else {
                    // New department (no _id)
                    newDepts.push({
                        _id: new mongoose.Types.ObjectId(),
                        name: dept.name.trim(),
                        email: dept.email ? dept.email.trim() : undefined,
                        phone: dept.phone ? dept.phone.trim() : undefined,
                        createdAt: new Date()
                    });
                }
            }

            console.log(`📝 Updating departments: ${organization.departments.length} → ${newDepts.length}`);
            organization.departments = newDepts;
        }

        organization.updatedBy = req.user.id;
        organization.updatedAt = new Date();
        await organization.save();

        await organization.populate([
            { path: 'academicYearId', select: 'name code' },
            { path: 'updatedBy', select: 'fullName email' },
            { path: 'createdBy', select: 'fullName email' }
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
            message: 'Lỗi hệ thống khi cập nhật tổ chức',
            details: error.message
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

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID tổ chức không hợp lệ'
            });
        }

        const organization = await Organization.findOne({ _id: id, academicYearId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tổ chức'
            });
        }

        if (email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: 'Email phòng ban không hợp lệ'
            });
        }

        if (phone && !/^[\d\s\-\+\(\)]+$/.test(phone.trim())) {
            return res.status(400).json({
                success: false,
                message: 'Số điện thoại phòng ban không hợp lệ'
            });
        }

        const newDept = {
            _id: new mongoose.Types.ObjectId(),
            name: name.trim(),
            email: email ? email.trim() : undefined,
            phone: phone ? phone.trim() : undefined,
            createdAt: new Date()
        };

        organization.departments.push(newDept);
        organization.updatedBy = req.user.id;
        organization.updatedAt = new Date();

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
            message: 'Lỗi hệ thống khi thêm phòng ban',
            details: error.message
        });
    }
};

const updateDepartment = async (req, res) => {
    try {
        const { id, deptId } = req.params;
        const { name, email, phone } = req.body;
        const academicYearId = req.academicYearId;

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID tổ chức không hợp lệ'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(deptId)) {
            return res.status(400).json({
                success: false,
                message: 'ID phòng ban không hợp lệ'
            });
        }

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

        // Validate and update
        if (name && name.trim()) {
            dept.name = name.trim();
        }

        if (email !== undefined) {
            if (email && email.trim()) {
                if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email.trim())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email phòng ban không hợp lệ'
                    });
                }
                dept.email = email.trim();
            } else {
                dept.email = undefined;
            }
        }

        if (phone !== undefined) {
            if (phone && phone.trim()) {
                if (!/^[\d\s\-\+\(\)]+$/.test(phone.trim())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Số điện thoại phòng ban không hợp lệ'
                    });
                }
                dept.phone = phone.trim();
            } else {
                dept.phone = undefined;
            }
        }

        organization.updatedBy = req.user.id;
        organization.updatedAt = new Date();
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
            message: 'Lỗi hệ thống khi cập nhật phòng ban',
            details: error.message
        });
    }
};

const deleteDepartment = async (req, res) => {
    try {
        const { id, deptId } = req.params;
        const academicYearId = req.academicYearId;

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID tổ chức không hợp lệ'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(deptId)) {
            return res.status(400).json({
                success: false,
                message: 'ID phòng ban không hợp lệ'
            });
        }

        const organization = await Organization.findOne({ _id: id, academicYearId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tổ chức'
            });
        }

        organization.departments.id(deptId).deleteOne();
        organization.updatedBy = req.user.id;
        organization.updatedAt = new Date();
        await organization.save();

        res.json({
            success: true,
            message: 'Xóa phòng ban thành công'
        });

    } catch (error) {
        console.error('Delete department error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa phòng ban',
            details: error.message
        });
    }
};

const deleteOrganization = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID tổ chức không hợp lệ'
            });
        }

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
            message: 'Lỗi hệ thống khi xóa tổ chức',
            details: error.message
        });
    }
};

const getOrganizationStatistics = async (req, res) => {
    try {
        const academicYearId = req.academicYearId;

        // Validate academicYearId
        if (!mongoose.Types.ObjectId.isValid(academicYearId)) {
            return res.status(400).json({
                success: false,
                message: 'Năm học không hợp lệ'
            });
        }

        const stats = await Organization.aggregate([
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
        console.error('Get organization statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê tổ chức',
            details: error.message
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