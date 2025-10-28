const Department = require('../../models/User/Department');
const User = require('../../models/User/User');
const ActivityLog = require('../../models/system/ActivityLog');

const getDepartments = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
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
                { code: { $regex: search, $options: 'i' } }
            ];
        }

        if (status) query.status = status;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [departments, total] = await Promise.all([
            Department.find(query)
                .populate('manager', 'fullName email')
                .populate('members.user', 'fullName email departmentRole')
                .populate('createdBy', 'fullName')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            Department.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                departments,
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
        console.error('Get departments error:', error);
        await ActivityLog.logError(req.user?.id, 'department_list', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách phòng ban'
        });
    }
};

const getDepartmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const department = await Department.findById(id)
            .populate('manager', 'fullName email')
            .populate('members.user', 'fullName email departmentRole')
            .populate('createdBy', 'fullName')
            .populate('updatedBy', 'fullName');

        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng ban'
            });
        }

        await ActivityLog.logUserAction(req.user?.id, 'department_view',
            `Xem thông tin phòng ban: ${department.name}`, {
                targetType: 'Department',
                targetId: id,
                targetName: department.name
            });

        res.json({
            success: true,
            data: department
        });

    } catch (error) {
        console.error('Get department by ID error:', error);
        await ActivityLog.logError(req.user?.id, 'department_view', error, {
            targetId: req.params.id
        });
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin phòng ban'
        });
    }
};

const createDepartment = async (req, res) => {
    try {
        const { name, code, description, manager } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Tên phòng ban là bắt buộc'
            });
        }

        if (!code || !code.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Mã phòng ban là bắt buộc'
            });
        }

        const existingCode = await Department.findOne({
            code: code.toUpperCase()
        });

        if (existingCode) {
            return res.status(400).json({
                success: false,
                message: 'Mã phòng ban đã tồn tại'
            });
        }

        const existingName = await Department.findOne({
            name: name.trim()
        });

        if (existingName) {
            return res.status(400).json({
                success: false,
                message: 'Tên phòng ban đã tồn tại'
            });
        }

        let managerId = null;
        if (manager) {
            const managerUser = await User.findById(manager);
            if (!managerUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Quản lý không tồn tại'
                });
            }
            managerId = manager;
        }

        const department = new Department({
            name: name.trim(),
            code: code.toUpperCase(),
            description: description?.trim(),
            manager: managerId,
            createdBy: req.user.id,
            updatedBy: req.user.id
        });

        await department.save();

        // Thêm manager vào members nếu có
        if (managerId) {
            department.members.push({
                user: managerId,
                role: 'manager'
            });
            await department.save();
        }

        await ActivityLog.logCriticalAction(req.user.id, 'department_create',
            `Tạo phòng ban mới: ${department.name} (${department.code})`, {
                targetType: 'Department',
                targetId: department._id,
                targetName: department.name
            });

        res.status(201).json({
            success: true,
            message: 'Tạo phòng ban thành công',
            data: department
        });

    } catch (error) {
        console.error('Create department error:', error);
        await ActivityLog.logError(req.user?.id, 'department_create', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo phòng ban'
        });
    }
};

const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, manager } = req.body;

        const department = await Department.findById(id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng ban'
            });
        }

        if (name && name.trim() && name.trim() !== department.name) {
            const existingName = await Department.findOne({
                name: name.trim(),
                _id: { $ne: id }
            });

            if (existingName) {
                return res.status(400).json({
                    success: false,
                    message: 'Tên phòng ban đã tồn tại'
                });
            }
        }

        let managerId = null;
        if (manager) {
            const managerUser = await User.findById(manager);
            if (!managerUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Quản lý không tồn tại'
                });
            }
            managerId = manager;
        }

        const oldData = {
            name: department.name,
            description: department.description,
            manager: department.manager
        };

        if (name && name.trim()) {
            department.name = name.trim();
        }

        if (description !== undefined) {
            department.description = description?.trim();
        }

        if (manager !== undefined) {
            department.manager = managerId;
        }

        department.updatedBy = req.user.id;
        await department.save();

        await ActivityLog.logUserAction(req.user.id, 'department_update',
            `Cập nhật phòng ban: ${department.name}`, {
                targetType: 'Department',
                targetId: id,
                targetName: department.name,
                oldData,
                newData: {
                    name: department.name,
                    description: department.description,
                    manager: department.manager
                }
            });

        res.json({
            success: true,
            message: 'Cập nhật phòng ban thành công',
            data: department
        });

    } catch (error) {
        console.error('Update department error:', error);
        await ActivityLog.logError(req.user?.id, 'department_update', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật phòng ban'
        });
    }
};

const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        const department = await Department.findById(id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng ban'
            });
        }

        // Kiểm tra xem có user nào trong phòng ban không
        if (department.members.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa phòng ban có thành viên'
            });
        }

        // Xóa phòng ban khỏi tất cả user
        await User.updateMany(
            { department: id },
            { $unset: { department: 1 } }
        );

        await Department.findByIdAndDelete(id);

        await ActivityLog.logCriticalAction(req.user.id, 'department_delete',
            `Xóa phòng ban: ${department.name}`, {
                targetType: 'Department',
                targetId: id,
                targetName: department.name
            });

        res.json({
            success: true,
            message: 'Xóa phòng ban thành công'
        });

    } catch (error) {
        console.error('Delete department error:', error);
        await ActivityLog.logError(req.user?.id, 'department_delete', error, {
            targetId: req.params.id
        });
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa phòng ban'
        });
    }
};

const addMemberToDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, role } = req.body;

        const validRoles = ['manager', 'tdg', 'expert'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: `Vai trò không hợp lệ. Chỉ chấp nhận: ${validRoles.join(', ')}`
            });
        }

        const department = await Department.findById(id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng ban'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        const memberExists = department.members.find(
            m => m.user.toString() === userId.toString()
        );

        if (memberExists) {
            return res.status(400).json({
                success: false,
                message: 'Người dùng đã là thành viên của phòng ban này'
            });
        }

        // Nếu user đã là thành viên của phòng ban khác, xóa khỏi đó
        if (user.department && user.department.toString() !== id.toString()) {
            await Department.findByIdAndUpdate(
                user.department,
                { $pull: { members: { user: userId } } }
            );
        }

        department.members.push({
            user: userId,
            role
        });

        user.department = id;
        user.departmentRole = role;

        await Promise.all([
            department.save(),
            user.save()
        ]);

        await ActivityLog.logUserAction(req.user.id, 'department_member_add',
            `Thêm ${user.fullName} vào phòng ban ${department.name} với vai trò ${role}`, {
                targetType: 'Department',
                targetId: id,
                targetName: department.name,
                metadata: { userId, userFullName: user.fullName, role }
            });

        res.json({
            success: true,
            message: 'Thêm thành viên thành công',
            data: {
                departmentId: id,
                userId,
                role
            }
        });

    } catch (error) {
        console.error('Add member error:', error);
        await ActivityLog.logError(req.user?.id, 'department_member_add', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm thành viên'
        });
    }
};

const removeMemberFromDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const department = await Department.findById(id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng ban'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        department.members = department.members.filter(
            m => m.user.toString() !== userId.toString()
        );

        user.department = null;
        user.departmentRole = 'expert';

        await Promise.all([
            department.save(),
            user.save()
        ]);

        await ActivityLog.logUserAction(req.user.id, 'department_member_remove',
            `Xóa ${user.fullName} khỏi phòng ban ${department.name}`, {
                targetType: 'Department',
                targetId: id,
                targetName: department.name,
                metadata: { userId, userFullName: user.fullName }
            });

        res.json({
            success: true,
            message: 'Xóa thành viên thành công'
        });

    } catch (error) {
        console.error('Remove member error:', error);
        await ActivityLog.logError(req.user?.id, 'department_member_remove', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa thành viên'
        });
    }
};

const updateMemberRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, role } = req.body;

        const validRoles = ['manager', 'tdg', 'expert'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: `Vai trò không hợp lệ. Chỉ chấp nhận: ${validRoles.join(', ')}`
            });
        }

        const department = await Department.findById(id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng ban'
            });
        }

        const member = department.members.find(
            m => m.user.toString() === userId.toString()
        );

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Thành viên không tồn tại trong phòng ban'
            });
        }

        member.role = role;
        await department.save();

        // Cập nhật departmentRole trong User
        await User.findByIdAndUpdate(
            userId,
            { departmentRole: role }
        );

        await ActivityLog.logUserAction(req.user.id, 'department_member_role_update',
            `Cập nhật vai trò thành viên trong phòng ban ${department.name}`, {
                targetType: 'Department',
                targetId: id,
                targetName: department.name,
                metadata: { userId, newRole: role }
            });

        res.json({
            success: true,
            message: 'Cập nhật vai trò thành công',
            data: {
                departmentId: id,
                userId,
                role
            }
        });

    } catch (error) {
        console.error('Update member role error:', error);
        await ActivityLog.logError(req.user?.id, 'department_member_role_update', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật vai trò'
        });
    }
};

const updateDepartmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['active', 'inactive'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(', ')}`
            });
        }

        const department = await Department.findById(id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng ban'
            });
        }

        const oldStatus = department.status;
        department.status = status;
        department.updatedBy = req.user.id;
        await department.save();

        await ActivityLog.logUserAction(req.user.id, 'department_status_change',
            `Thay đổi trạng thái phòng ban ${department.name}: ${oldStatus} → ${status}`, {
                targetType: 'Department',
                targetId: id,
                targetName: department.name,
                oldData: { status: oldStatus },
                newData: { status }
            });

        res.json({
            success: true,
            message: 'Cập nhật trạng thái thành công',
            data: { status }
        });

    } catch (error) {
        console.error('Update department status error:', error);
        await ActivityLog.logError(req.user?.id, 'department_status_change', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật trạng thái'
        });
    }
};

module.exports = {
    getDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    addMemberToDepartment,
    removeMemberFromDepartment,
    updateMemberRole,
    updateDepartmentStatus
};