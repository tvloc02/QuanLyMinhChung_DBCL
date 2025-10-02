const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const Permission = require('../models/Permission');
const UserGroup = require('../models/UserGroup');
const User = require('../models/User');
const AcademicYear = require('../models/AcademicYear');
const Program = require('../models/Program');
const Organization = require('../models/Organization');
const Standard = require('../models/Standard');
const Criteria = require('../models/Criteria');
const Evidence = require('../models/Evidence');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/evidence_management_ver' +
    '\n';

async function seedDatabase() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Đã kết nối MongoDB');

        // Xóa dữ liệu cũ
        await Promise.all([
            Permission.deleteMany({}),
            UserGroup.deleteMany({}),
            User.deleteMany({}),
            AcademicYear.deleteMany({}),
            Program.deleteMany({}),
            Organization.deleteMany({}),
            Standard.deleteMany({}),
            Criteria.deleteMany({}),
            Evidence.deleteMany({})
        ]);
        console.log('✅ Đã xóa dữ liệu cũ');

        // ==================== 1. TẠO PERMISSIONS ====================
        const permissions = await Permission.insertMany([
            // Reports
            { module: 'reports', action: 'create', name: 'Tạo báo cáo TĐG', level: 'intermediate', code: 'REPORTS.CREATE', status: 'active' },
            { module: 'reports', action: 'read', name: 'Xem báo cáo TĐG', level: 'basic', code: 'REPORTS.READ', status: 'active' },
            { module: 'reports', action: 'update', name: 'Cập nhật báo cáo TĐG', level: 'intermediate', code: 'REPORTS.UPDATE', status: 'active' },
            { module: 'reports', action: 'delete', name: 'Xóa báo cáo TĐG', level: 'advanced', code: 'REPORTS.DELETE', status: 'active' },
            { module: 'reports', action: 'approve', name: 'Phê duyệt báo cáo', level: 'advanced', code: 'REPORTS.APPROVE', status: 'active' },
            { module: 'reports', action: 'export', name: 'Xuất báo cáo', level: 'basic', code: 'REPORTS.EXPORT', status: 'active' },

            // Evaluations
            { module: 'evaluations', action: 'create', name: 'Tạo đánh giá', level: 'intermediate', code: 'EVALUATIONS.CREATE', status: 'active' },
            { module: 'evaluations', action: 'read', name: 'Xem đánh giá', level: 'basic', code: 'EVALUATIONS.READ', status: 'active' },
            { module: 'evaluations', action: 'update', name: 'Cập nhật đánh giá', level: 'intermediate', code: 'EVALUATIONS.UPDATE', status: 'active' },
            { module: 'evaluations', action: 'delete', name: 'Xóa đánh giá', level: 'advanced', code: 'EVALUATIONS.DELETE', status: 'active' },
            { module: 'evaluations', action: 'approve', name: 'Phê duyệt đánh giá', level: 'advanced', code: 'EVALUATIONS.APPROVE', status: 'active' },

            // Users
            { module: 'users', action: 'create', name: 'Tạo người dùng', level: 'advanced', code: 'USERS.CREATE', status: 'active' },
            { module: 'users', action: 'read', name: 'Xem người dùng', level: 'basic', code: 'USERS.READ', status: 'active' },
            { module: 'users', action: 'update', name: 'Cập nhật người dùng', level: 'advanced', code: 'USERS.UPDATE', status: 'active' },
            { module: 'users', action: 'delete', name: 'Xóa người dùng', level: 'critical', code: 'USERS.DELETE', status: 'active' },
            { module: 'users', action: 'manage', name: 'Quản lý người dùng', level: 'critical', code: 'USERS.MANAGE', status: 'active' },

            // Standards
            { module: 'standards', action: 'create', name: 'Tạo tiêu chuẩn', level: 'advanced', code: 'STANDARDS.CREATE', status: 'active' },
            { module: 'standards', action: 'read', name: 'Xem tiêu chuẩn', level: 'basic', code: 'STANDARDS.READ', status: 'active' },
            { module: 'standards', action: 'update', name: 'Cập nhật tiêu chuẩn', level: 'advanced', code: 'STANDARDS.UPDATE', status: 'active' },
            { module: 'standards', action: 'delete', name: 'Xóa tiêu chuẩn', level: 'critical', code: 'STANDARDS.DELETE', status: 'active' },

            // Criteria
            { module: 'criteria', action: 'create', name: 'Tạo tiêu chí', level: 'advanced', code: 'CRITERIA.CREATE', status: 'active' },
            { module: 'criteria', action: 'read', name: 'Xem tiêu chí', level: 'basic', code: 'CRITERIA.READ', status: 'active' },
            { module: 'criteria', action: 'update', name: 'Cập nhật tiêu chí', level: 'advanced', code: 'CRITERIA.UPDATE', status: 'active' },
            { module: 'criteria', action: 'delete', name: 'Xóa tiêu chí', level: 'critical', code: 'CRITERIA.DELETE', status: 'active' },

            // Programs
            { module: 'programs', action: 'create', name: 'Tạo chương trình', level: 'advanced', code: 'PROGRAMS.CREATE', status: 'active' },
            { module: 'programs', action: 'read', name: 'Xem chương trình', level: 'basic', code: 'PROGRAMS.READ', status: 'active' },
            { module: 'programs', action: 'update', name: 'Cập nhật chương trình', level: 'advanced', code: 'PROGRAMS.UPDATE', status: 'active' },
            { module: 'programs', action: 'delete', name: 'Xóa chương trình', level: 'critical', code: 'PROGRAMS.DELETE', status: 'active' },

            // Organizations
            { module: 'organizations', action: 'create', name: 'Tạo tổ chức', level: 'advanced', code: 'ORGANIZATIONS.CREATE', status: 'active' },
            { module: 'organizations', action: 'read', name: 'Xem tổ chức', level: 'basic', code: 'ORGANIZATIONS.READ', status: 'active' },
            { module: 'organizations', action: 'update', name: 'Cập nhật tổ chức', level: 'advanced', code: 'ORGANIZATIONS.UPDATE', status: 'active' },
            { module: 'organizations', action: 'delete', name: 'Xóa tổ chức', level: 'critical', code: 'ORGANIZATIONS.DELETE', status: 'active' },

            // Academic Years
            { module: 'academic_years', action: 'create', name: 'Tạo năm học', level: 'advanced', code: 'ACADEMIC_YEARS.CREATE', status: 'active' },
            { module: 'academic_years', action: 'read', name: 'Xem năm học', level: 'basic', code: 'ACADEMIC_YEARS.READ', status: 'active' },
            { module: 'academic_years', action: 'update', name: 'Cập nhật năm học', level: 'advanced', code: 'ACADEMIC_YEARS.UPDATE', status: 'active' },
            { module: 'academic_years', action: 'delete', name: 'Xóa năm học', level: 'critical', code: 'ACADEMIC_YEARS.DELETE', status: 'active' },

            // System
            { module: 'system', action: 'manage', name: 'Quản trị hệ thống', level: 'critical', code: 'SYSTEM.MANAGE', status: 'active' },
            { module: 'settings', action: 'update', name: 'Cập nhật cài đặt', level: 'advanced', code: 'SETTINGS.UPDATE', status: 'active' }
        ]);
        console.log(`✅ Đã tạo ${permissions.length} permissions`);

        const allPermIds = permissions.map(p => p._id);
        const readPermIds = permissions.filter(p => p.action === 'read').map(p => p._id);
        const basicPermIds = permissions.filter(p =>
            ['read', 'create', 'update'].includes(p.action) &&
            !['users', 'system', 'settings'].includes(p.module)
        ).map(p => p._id);
        const managerPermIds = permissions.filter(p =>
            p.level !== 'critical' || p.module === 'reports'
        ).map(p => p._id);

        // ==================== 2. TẠO USER GROUPS ====================
        const userGroups = await UserGroup.insertMany([
            {
                code: 'SUPER_ADMIN',
                name: 'Quản trị viên hệ thống',
                description: 'Toàn quyền quản trị hệ thống',
                type: 'system',
                priority: 100,
                permissions: allPermIds,
                members: [],
                status: 'active',
                metadata: { color: '#DC2626', icon: 'shield' }
            },
            {
                code: 'REPORT_MANAGER',
                name: 'Cán bộ quản lý báo cáo TĐG',
                description: 'Quản lý và phê duyệt báo cáo tự đánh giá',
                type: 'system',
                priority: 80,
                permissions: managerPermIds,
                members: [],
                status: 'active',
                metadata: { color: '#2563EB', icon: 'file-text' }
            },
            {
                code: 'EVALUATION_EXPERT',
                name: 'Chuyên gia đánh giá',
                description: 'Thực hiện đánh giá các tiêu chí',
                type: 'system',
                priority: 60,
                permissions: basicPermIds,
                members: [],
                status: 'active',
                metadata: { color: '#10B981', icon: 'clipboard-check' }
            },
            {
                code: 'ADVISOR',
                name: 'Tư vấn/Giám sát',
                description: 'Tư vấn và giám sát quá trình đánh giá',
                type: 'system',
                priority: 40,
                permissions: readPermIds,
                members: [],
                status: 'active',
                metadata: { color: '#8B5CF6', icon: 'eye' }
            },
            {
                code: 'VIEWER',
                name: 'Người xem',
                description: 'Chỉ có quyền xem thông tin',
                type: 'system',
                priority: 20,
                permissions: readPermIds,
                members: [],
                status: 'active',
                metadata: { color: '#6B7280', icon: 'eye' }
            }
        ]);
        console.log(`✅ Đã tạo ${userGroups.length} user groups`);

        // ==================== 3. TẠO USERS ====================
        const salt = await bcrypt.genSalt(12);
        const users = await User.insertMany([
            {
                email: 'admin@ict.vnu.edu.vn',
                fullName: 'Quản trị viên hệ thống',
                password: await bcrypt.hash('Admin@123', salt),
                phoneNumber: '0123456789',
                role: 'admin',
                status: 'active',
                userGroups: [userGroups[0]._id],
                department: 'Phòng CNTT',
                position: 'Trưởng phòng',
                notificationSettings: { email: true, inApp: true, assignment: true, evaluation: true, deadline: true }
            },
            {
                email: 'manager@ict.vnu.edu.vn',
                fullName: 'Nguyễn Văn A',
                password: await bcrypt.hash('Manager@123', salt),
                phoneNumber: '0123456790',
                role: 'manager',
                status: 'active',
                userGroups: [userGroups[1]._id],
                department: 'Phòng Đảm bảo chất lượng',
                position: 'Phó trưởng phòng',
                notificationSettings: { email: true, inApp: true, assignment: true, evaluation: true, deadline: true }
            },
            {
                email: 'expert1@ict.vnu.edu.vn',
                fullName: 'Trần Thị B',
                password: await bcrypt.hash('Expert@123', salt),
                phoneNumber: '0123456791',
                role: 'expert',
                status: 'active',
                userGroups: [userGroups[2]._id],
                department: 'Khoa Công nghệ thông tin',
                position: 'Giảng viên',
                expertise: ['Khoa học máy tính', 'Công nghệ phần mềm'],
                notificationSettings: { email: true, inApp: true, assignment: true, evaluation: true, deadline: true }
            },
            {
                email: 'expert2@ict.vnu.edu.vn',
                fullName: 'Lê Văn C',
                password: await bcrypt.hash('Expert@123', salt),
                phoneNumber: '0123456792',
                role: 'expert',
                status: 'active',
                userGroups: [userGroups[2]._id],
                department: 'Khoa Công nghệ thông tin',
                position: 'Giảng viên',
                expertise: ['Trí tuệ nhân tạo', 'Học máy'],
                notificationSettings: { email: true, inApp: true, assignment: true, evaluation: true, deadline: true }
            },
            {
                email: 'advisor@ict.vnu.edu.vn',
                fullName: 'Phạm Thị D',
                password: await bcrypt.hash('Advisor@123', salt),
                phoneNumber: '0123456793',
                role: 'advisor',
                status: 'active',
                userGroups: [userGroups[3]._id],
                department: 'Phòng Đảm bảo chất lượng',
                position: 'Chuyên viên',
                notificationSettings: { email: true, inApp: true, assignment: false, evaluation: true, deadline: true }
            }
        ]);
        console.log(`✅ Đã tạo ${users.length} users`);

        // Cập nhật members trong groups
        await UserGroup.findByIdAndUpdate(userGroups[0]._id, { $set: { members: [users[0]._id] } });
        await UserGroup.findByIdAndUpdate(userGroups[1]._id, { $set: { members: [users[1]._id] } });
        await UserGroup.findByIdAndUpdate(userGroups[2]._id, { $set: { members: [users[2]._id, users[3]._id] } });
        await UserGroup.findByIdAndUpdate(userGroups[3]._id, { $set: { members: [users[4]._id] } });
        console.log('✅ Đã cập nhật members cho groups');

        // ==================== 4. TẠO ACADEMIC YEARS ====================
        const academicYears = await AcademicYear.insertMany([
            {
                name: 'Năm học 2024-2025',
                code: '2024-2025',
                startYear: 2024,
                endYear: 2025,
                startDate: new Date('2024-09-01'),
                endDate: new Date('2025-08-31'),
                description: 'Năm học 2024-2025',
                status: 'active',
                isCurrent: true,
                createdBy: users[0]._id,
                updatedBy: users[0]._id
            },
            {
                name: 'Năm học 2025-2026',
                code: '2025-2026',
                startYear: 2025,
                endYear: 2026,
                startDate: new Date('2025-09-01'),
                endDate: new Date('2026-08-31'),
                description: 'Năm học 2025-2026',
                status: 'draft',
                isCurrent: false,
                createdBy: users[0]._id,
                updatedBy: users[0]._id
            }
        ]);
        console.log(`✅ Đã tạo ${academicYears.length} academic years`);

        // ==================== 5. TẠO PROGRAMS ====================
        const programs = await Program.insertMany([
            {
                academicYearId: academicYears[0]._id,
                name: 'Kiểm định chất lượng cơ sở giáo dục đại học',
                code: 'KDCLCSGDDH',  // ✅ Đã bỏ dấu Đ
                description: 'Chương trình kiểm định chất lượng cơ sở giáo dục đại học theo Bộ tiêu chuẩn GDĐH',
                applicableYear: 2024,
                status: 'active',
                effectiveDate: new Date('2024-01-01'),
                objectives: 'Đảm bảo chất lượng đào tạo đại học theo chuẩn quốc gia',
                guidelines: 'Thực hiện theo quy trình kiểm định chất lượng',
                createdBy: users[0]._id,
                updatedBy: users[0]._id
            },
            {
                academicYearId: academicYears[0]._id,
                name: 'Kiểm định chương trình đào tạo',
                code: 'KDCTDT',  // ✅ Đã bỏ dấu Đ
                description: 'Chương trình kiểm định chất lượng chương trình đào tạo',
                applicableYear: 2024,
                status: 'active',
                effectiveDate: new Date('2024-01-01'),
                objectives: 'Đảm bảo chất lượng chương trình đào tạo',
                guidelines: 'Thực hiện theo quy trình kiểm định chương trình',
                createdBy: users[0]._id,
                updatedBy: users[0]._id
            }
        ]);
        console.log(`✅ Đã tạo ${programs.length} programs`);

        // ==================== 6. TẠO ORGANIZATIONS ====================
        const organizations = await Organization.insertMany([
            {
                academicYearId: academicYears[0]._id,
                name: 'Trường Đại học Công nghệ - ĐHQGHN',
                code: 'UET-VNU',
                description: 'Trường Đại học Công nghệ thuộc Đại học Quốc gia Hà Nội',
                website: 'https://uet.vnu.edu.vn',
                contactEmail: 'contact@uet.vnu.edu.vn',
                contactPhone: '024-37547460',
                address: '144 Xuân Thủy, Cầu Giấy, Hà Nội',
                country: 'Vietnam',
                status: 'active',
                createdBy: users[0]._id,
                updatedBy: users[0]._id
            }
        ]);
        console.log(`✅ Đã tạo ${organizations.length} organizations`);

        // ==================== 7. TẠO STANDARDS ====================
        const standards = await Standard.insertMany([
            {
                academicYearId: academicYears[0]._id,
                name: 'Sứ mạng và mục tiêu',
                code: '01',
                description: 'Tiêu chuẩn về sứ mạng và mục tiêu của cơ sở giáo dục',
                programId: programs[0]._id,
                organizationId: organizations[0]._id,
                order: 1,
                objectives: 'Đánh giá sứ mạng và mục tiêu của trường',
                guidelines: 'Xem xét tính rõ ràng, phù hợp và công khai của sứ mạng',
                status: 'active',
                createdBy: users[0]._id,
                updatedBy: users[0]._id
            },
            {
                academicYearId: academicYears[0]._id,
                name: 'Tổ chức và quản lý',
                code: '02',
                description: 'Tiêu chuẩn về tổ chức và quản lý',
                programId: programs[0]._id,
                organizationId: organizations[0]._id,
                order: 2,
                objectives: 'Đánh giá hệ thống tổ chức và quản lý',
                guidelines: 'Xem xét cơ cấu tổ chức, quy chế quản lý',
                status: 'active',
                createdBy: users[0]._id,
                updatedBy: users[0]._id
            },
            {
                academicYearId: academicYears[0]._id,
                name: 'Chương trình giáo dục',
                code: '03',
                description: 'Tiêu chuẩn về chương trình giáo dục',
                programId: programs[0]._id,
                organizationId: organizations[0]._id,
                order: 3,
                objectives: 'Đánh giá chương trình đào tạo',
                guidelines: 'Xem xét mục tiêu, nội dung, phương pháp giảng dạy',
                status: 'active',
                createdBy: users[0]._id,
                updatedBy: users[0]._id
            }
        ]);
        console.log(`✅ Đã tạo ${standards.length} standards`);

        // ==================== 8. TẠO CRITERIA ====================
        const criterias = await Criteria.insertMany([
            {
                academicYearId: academicYears[0]._id,
                name: 'Sứ mạng được xây dựng phù hợp',
                code: '01',
                description: 'Sứ mạng của trường được xây dựng rõ ràng, phù hợp với định hướng phát triển',
                standardId: standards[0]._id,
                programId: programs[0]._id,
                organizationId: organizations[0]._id,
                requirements: 'Phải có văn bản sứ mạng chính thức',
                guidelines: 'Xem xét tính rõ ràng và phù hợp của sứ mạng',
                status: 'active',
                createdBy: users[0]._id,
                updatedBy: users[0]._id
            },
            {
                academicYearId: academicYears[0]._id,
                name: 'Mục tiêu được xác định cụ thể',
                code: '02',
                description: 'Mục tiêu của trường được xác định cụ thể, đo lường được',
                standardId: standards[0]._id,
                programId: programs[0]._id,
                organizationId: organizations[0]._id,
                requirements: 'Phải có tài liệu mục tiêu chi tiết',
                guidelines: 'Xem xét tính cụ thể và khả thi của mục tiêu',
                status: 'active',
                createdBy: users[0]._id,
                updatedBy: users[0]._id
            },
            {
                academicYearId: academicYears[0]._id,
                name: 'Cơ cấu tổ chức phù hợp',
                code: '01',
                description: 'Cơ cấu tổ chức của trường được thiết lập phù hợp với quy mô và chức năng',
                standardId: standards[1]._id,
                programId: programs[0]._id,
                organizationId: organizations[0]._id,
                requirements: 'Phải có sơ đồ tổ chức và quy chế hoạt động',
                guidelines: 'Xem xét tính hợp lý của cơ cấu tổ chức',
                status: 'active',
                createdBy: users[0]._id,
                updatedBy: users[0]._id
            }
        ]);
        console.log(`✅ Đã tạo ${criterias.length} criterias`);

        // ==================== 9. TẠO EVIDENCES ====================
        const evidences = await Evidence.insertMany([
            {
                academicYearId: academicYears[0]._id,
                code: 'H1.01.01.01',
                name: 'Văn bản sứ mạng của trường',
                description: 'Quyết định ban hành sứ mạng của trường',
                programId: programs[0]._id,
                organizationId: organizations[0]._id,
                standardId: standards[0]._id,
                criteriaId: criterias[0]._id,
                documentType: 'Quyết định',
                issuingAgency: 'Hiệu trưởng',
                status: 'active',
                files: [],
                createdBy: users[0]._id,
                updatedBy: users[0]._id
            },
            {
                academicYearId: academicYears[0]._id,
                code: 'H1.01.02.01',
                name: 'Kế hoạch chiến lược phát triển',
                description: 'Kế hoạch chiến lược phát triển trường giai đoạn 2024-2030',
                programId: programs[0]._id,
                organizationId: organizations[0]._id,
                standardId: standards[0]._id,
                criteriaId: criterias[1]._id,
                documentType: 'Kế hoạch',
                issuingAgency: 'Ban Giám hiệu',
                status: 'active',
                files: [],
                createdBy: users[0]._id,
                updatedBy: users[0]._id
            },
            {
                academicYearId: academicYears[0]._id,
                code: 'H1.02.01.01',
                name: 'Sơ đồ cơ cấu tổ chức',
                description: 'Sơ đồ cơ cấu tổ chức của trường',
                programId: programs[0]._id,
                organizationId: organizations[0]._id,
                standardId: standards[1]._id,
                criteriaId: criterias[2]._id,
                documentType: 'Báo cáo',
                issuingAgency: 'Phòng Tổ chức - Hành chính',
                status: 'active',
                files: [],
                createdBy: users[0]._id,
                updatedBy: users[0]._id
            }
        ]);
        console.log(`✅ Đã tạo ${evidences.length} evidences`);

        // ==================== THỐNG KÊ ====================
        console.log('\n========================================');
        console.log('✅ HOÀN THÀNH SEED DATABASE');
        console.log('========================================');
        console.log(`Permissions: ${permissions.length}`);
        console.log(`User Groups: ${userGroups.length}`);
        console.log(`Users: ${users.length}`);
        console.log(`Academic Years: ${academicYears.length}`);
        console.log(`Programs: ${programs.length}`);
        console.log(`Organizations: ${organizations.length}`);
        console.log(`Standards: ${standards.length}`);
        console.log(`Criterias: ${criterias.length}`);
        console.log(`Evidences: ${evidences.length}`);
        console.log('========================================\n');

        console.log('📋 THÔNG TIN ĐĂNG NHẬP:');
        console.log('Admin: admin@ict.vnu.edu.vn / Admin@123');
        console.log('Manager: manager@ict.vnu.edu.vn / Manager@123');
        console.log('Expert: expert1@ict.vnu.edu.vn / Expert@123');
        console.log('Expert: expert2@ict.vnu.edu.vn / Expert@123');
        console.log('Advisor: advisor@ict.vnu.edu.vn / Advisor@123');

        await mongoose.disconnect();
        console.log('\n✅ Đã ngắt kết nối MongoDB');
        process.exit(0);

    } catch (error) {
        console.error('❌ Lỗi seed database:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

seedDatabase();