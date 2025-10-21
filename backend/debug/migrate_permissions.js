#!/usr/bin/env node

/**
 * MIGRATION SCRIPT - CHUYỂN NHÓM→PHÒNG BAN + THÊMSUPPORT NHIỀU QUYỀN
 * Chạy: node migrate_permissions.js
 */

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/evidence_management';
const GROUP_ID_TO_MIGRATE = '68f667302d55e5fb32db0614';
const DEPT_ID_NEW = '68f667302d55e5fb32db0614';

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset}  ${msg}`),
    info: (msg) => console.log(`${colors.blue}ℹ️${colors.reset}  ${msg}`),
    section: (msg) => console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n${colors.cyan}${msg}${colors.reset}\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`)
};

async function migrate() {
    try {
        log.section('🔄 MIGRATION - CHUYỂN NHÓM→PHÒNG BAN + MULTIPLE PERMISSIONS');

        // Kết nối database
        log.info(`Kết nối MongoDB: ${MONGO_URI}`);
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        log.success('Kết nối database thành công');

        const db = mongoose.connection.db;

        // ════════════════════════════════════════════════════════
        // BƯỚC 1: KIỂM TRA USERS CÓ NHÓM CẦN CHUYỂN
        // ════════════════════════════════════════════════════════
        log.section('BƯỚC 1: Kiểm tra users có nhóm 68f667302d55e5fb32db0614');

        const usersWithGroup = await db.collection('users').find({
            'userGroups.userGroupId': mongoose.Types.ObjectId(GROUP_ID_TO_MIGRATE)
        }).toArray();

        log.info(`Tìm thấy ${usersWithGroup.length} users có nhóm này`);
        if (usersWithGroup.length > 0) {
            usersWithGroup.slice(0, 3).forEach(u => {
                console.log(`  - ${u.email || u._id}`);
            });
            if (usersWithGroup.length > 3) {
                console.log(`  ... và ${usersWithGroup.length - 3} users khác`);
            }
        }

        // ════════════════════════════════════════════════════════
        // BƯỚC 2: CHUYỂN USERS SANG DEPARTMENT MỚI
        // ════════════════════════════════════════════════════════
        log.section('BƯỚC 2: Cập nhật department cho users');

        let result = await db.collection('users').updateMany(
            {
                'userGroups.userGroupId': mongoose.Types.ObjectId(GROUP_ID_TO_MIGRATE)
            },
            {
                $set: {
                    department: mongoose.Types.ObjectId(DEPT_ID_NEW)
                }
            }
        );
        log.success(`Cập nhật department: ${result.modifiedCount} users`);

        // ════════════════════════════════════════════════════════
        // BƯỚC 3: XÓA NHÓM TỪ USERGROUPS
        // ════════════════════════════════════════════════════════
        log.section('BƯỚC 3: Xóa nhóm từ userGroups');

        result = await db.collection('users').updateMany(
            {
                'userGroups.userGroupId': mongoose.Types.ObjectId(GROUP_ID_TO_MIGRATE)
            },
            {
                $pull: {
                    userGroups: {
                        userGroupId: mongoose.Types.ObjectId(GROUP_ID_TO_MIGRATE)
                    }
                }
            }
        );
        log.success(`Xóa nhóm: ${result.modifiedCount} users`);

        // ════════════════════════════════════════════════════════
        // BƯỚC 4: THÊMFIELD selectedPermissions NẾU CHƯA CÓ
        // ════════════════════════════════════════════════════════
        log.section('BƯỚC 4: Thêm field selectedPermissions cho users');

        result = await db.collection('users').updateMany(
            {
                selectedPermissions: { $exists: false }
            },
            {
                $set: {
                    selectedPermissions: []
                }
            }
        );
        log.success(`Thêm selectedPermissions: ${result.modifiedCount} users`);

        // ════════════════════════════════════════════════════════
        // BƯỚC 5: CHUYỂN permissions → selectedPermissions (TỰA CHỌN)
        // ════════════════════════════════════════════════════════
        log.section('BƯỚC 5: Migrate permissions → selectedPermissions (Tùy chọn)');

        // Tùy chọn: Nếu muốn copy permissions cũ sang selectedPermissions
        // Bỏ comment dòng dưới để kích hoạt
        /*
        result = await db.collection('users').updateMany(
            {
                permissions: { $exists: true, $ne: null }
            },
            [
                {
                    $set: {
                        selectedPermissions: {
                            $ifNull: ['$selectedPermissions', '$permissions']
                        }
                    }
                }
            ]
        );
        log.success(`Migrate permissions: ${result.modifiedCount} users`);
        */
        log.warning('Bước này bỏ qua (có thể kích hoạt nếu cần)');

        // ════════════════════════════════════════════════════════
        // KIỂM TRA KẾT QUẢ
        // ════════════════════════════════════════════════════════
        log.section('📊 KIỂM TRA KẾT QUẢ');

        // 1. Users đã chuyển department
        const usersInNewDept = await db.collection('users').countDocuments({
            department: mongoose.Types.ObjectId(DEPT_ID_NEW)
        });
        log.info(`Users trong department mới: ${usersInNewDept}`);

        // 2. Users còn có nhóm cũ
        const usersStillInGroup = await db.collection('users').countDocuments({
            'userGroups.userGroupId': mongoose.Types.ObjectId(GROUP_ID_TO_MIGRATE)
        });
        if (usersStillInGroup === 0) {
            log.success('Không còn users có nhóm cũ');
        } else {
            log.error(`Còn ${usersStillInGroup} users có nhóm cũ`);
        }

        // 3. Kiểm tra selectedPermissions field
        const usersWithoutSelectedPerms = await db.collection('users').countDocuments({
            selectedPermissions: { $exists: false }
        });
        if (usersWithoutSelectedPerms === 0) {
            log.success('Tất cả users có field selectedPermissions');
        } else {
            log.warning(`${usersWithoutSelectedPerms} users không có selectedPermissions`);
        }

        // 4. Thống kê department
        const deptStats = await db.collection('users').aggregate([
            {
                $group: {
                    _id: '$department',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]).toArray();

        log.info('Phân bố users theo department:');
        deptStats.slice(0, 5).forEach(s => {
            console.log(`  ${s._id}: ${s.count} users`);
        });

        // ════════════════════════════════════════════════════════
        // KẾT LUẬN
        // ════════════════════════════════════════════════════════
        log.section('✅ MIGRATION HOÀN TẤT!');

        console.log(`${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
        console.log(`${colors.green}Hệ thống đã được cập nhật thành công!${colors.reset}`);
        console.log(`${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

        console.log(`${colors.blue}📝 CÔNG VIỆC TIẾP THEO:${colors.reset}`);
        console.log(`  1. Cập nhật User Model (thêm selectedPermissions)`);
        console.log(`  2. Cập nhật User Controller (get/update/grant/deny permissions)`);
        console.log(`  3. Cập nhật Routes`);
        console.log(`  4. Cập nhật Frontend (PermissionManager component)`);
        console.log(`  5. Restart backend server`);
        console.log(`  6. Test chọn nhiều quyền\n`);

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        log.error('Có lỗi xảy ra!');
        console.error(`${colors.red}${error.message}${colors.reset}`);
        console.error(error);

        try {
            await mongoose.connection.close();
        } catch (e) {
            // Ignore
        }
        process.exit(1);
    }
}

// Chạy migration
migrate();