#!/usr/bin/env node

/**
 * MIGRATION SCRIPT - CẬP NHẬT DATABASE
 * Chạy: node migrate.js
 *
 * Lưu ý: Cập nhật MONGO_URI trước khi chạy!
 */

const mongoose = require('mongoose');

// ⚙️ CẤU HÌNH - THAY ĐỔI MONGO_URI CỦA BẠN
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/evidence_management';

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
        log.section('🗄️ MIGRATION DATABASE - 5 VAI TRÒ → 4 VAI TRÒ');

        // Kết nối database
        log.info(`Kết nối MongoDB: ${MONGO_URI}`);
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        log.success('Kết nối database thành công');

        const db = mongoose.connection.db;

        // ════════════════════════════════════════════════════════
        // BƯỚC 1: XÓA FIELD isExternalExpert
        // ════════════════════════════════════════════════════════
        log.section('BƯỚC 1: Xóa field isExternalExpert');
        let result = await db.collection('users').updateMany(
            { isExternalExpert: { $exists: true } },
            { $unset: { isExternalExpert: 1 } }
        );
        log.success(`Xóa isExternalExpert: ${result.modifiedCount} users`);

        // ════════════════════════════════════════════════════════
        // BƯỚC 2: CHUYỂN expert_external → expert
        // ════════════════════════════════════════════════════════
        log.section('BƯỚC 2: Chuyển expert_external → expert');
        result = await db.collection('users').updateMany(
            { role: "expert_external" },
            [{ $set: { role: "expert", roles: ["expert"] } }]
        );
        log.success(`Chuyển expert_external → expert: ${result.modifiedCount} users`);

        // ════════════════════════════════════════════════════════
        // BƯỚC 3: XÓA expert_external từ roles array
        // ════════════════════════════════════════════════════════
        log.section('BƯỚC 3: Xóa expert_external từ roles array');
        result = await db.collection('users').updateMany(
            { roles: { $in: ["expert_external"] } },
            { $pull: { roles: "expert_external" } }
        );
        log.success(`Xóa expert_external từ roles: ${result.modifiedCount} users`);

        // ════════════════════════════════════════════════════════
        // BƯỚC 4: VALIDATE ROLES - Chỉ giữ lại roles hợp lệ
        // ════════════════════════════════════════════════════════
        log.section('BƯỚC 4: Validate roles - chỉ giữ lại roles hợp lệ');
        const validRoles = ["admin", "manager", "tdg", "expert"];
        result = await db.collection('users').updateMany(
            {},
            [
                {
                    $set: {
                        roles: {
                            $filter: {
                                input: "$roles",
                                as: "role",
                                cond: { $in: ["$$role", validRoles] }
                            }
                        }
                    }
                }
            ]
        );
        log.success(`Validate roles: ${result.modifiedCount} users`);

        // ════════════════════════════════════════════════════════
        // BƯỚC 5: ĐẢM BẢO roles array không rỗng
        // ════════════════════════════════════════════════════════
        log.section('BƯỚC 5: Đảm bảo roles array không rỗng');
        result = await db.collection('users').updateMany(
            { $or: [{ roles: { $exists: false } }, { roles: { $size: 0 } }] },
            [{ $set: { roles: ["expert"], role: "expert" } }]
        );
        log.success(`Đảm bảo roles array: ${result.modifiedCount} users`);

        // ════════════════════════════════════════════════════════
        // BƯỚC 6: KIỂM TRA KẾT QUẢ
        // ════════════════════════════════════════════════════════
        log.section('📊 KIỂM TRA KẾT QUẢ');

        // Tổng users
        const totalUsers = await db.collection('users').countDocuments({});
        log.info(`Tổng users: ${totalUsers}`);

        // Kiểm tra isExternalExpert
        const withIsExternal = await db.collection('users').countDocuments({
            isExternalExpert: { $exists: true }
        });
        if (withIsExternal === 0) {
            log.success('Không có field isExternalExpert');
        } else {
            log.error(`Còn ${withIsExternal} users có field isExternalExpert`);
        }

        // Kiểm tra expert_external
        const expertExternal = await db.collection('users').countDocuments({
            role: "expert_external"
        });
        if (expertExternal === 0) {
            log.success('Không có role expert_external');
        } else {
            log.error(`Còn ${expertExternal} users có role expert_external`);
        }

        // Phân bố vai trò
        const rolesDistribution = await db.collection('users').aggregate([
            { $group: { _id: "$role", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]).toArray();

        log.info('Phân bố vai trò:');
        rolesDistribution.forEach(r => {
            console.log(`  ${colors.cyan}${r._id}${colors.reset}: ${r.count} users`);
        });

        // Kiểm tra roles array hợp lệ
        const invalidRoles = await db.collection('users').aggregate([
            { $unwind: "$roles" },
            { $match: { roles: { $nin: validRoles } } },
            { $group: { _id: "$roles", count: { $sum: 1 } } }
        ]).toArray();

        if (invalidRoles.length === 0) {
            log.success('Tất cả roles đều hợp lệ');
        } else {
            log.warning('Còn roles không hợp lệ:');
            invalidRoles.forEach(r => {
                console.log(`  ${colors.yellow}${r._id}${colors.reset}: ${r.count}`);
            });
        }

        // Kiểm tra users không có department
        const usersNoDept = await db.collection('users').countDocuments({
            department: null
        });
        if (usersNoDept > 0) {
            log.warning(`${usersNoDept} users không có department (nên cập nhật)`);
        } else {
            log.success('Tất cả users có department');
        }

        // ════════════════════════════════════════════════════════
        // KẾT LUẬN
        // ════════════════════════════════════════════════════════
        log.section('✅ MIGRATION HOÀN TẤT!');

        console.log(`${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
        console.log(`${colors.green}Hệ thống đã được cập nhật thành công!${colors.reset}`);
        console.log(`${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

        console.log(`${colors.blue}📝 CÔNG VIỆC TIẾP THEO:${colors.reset}`);
        console.log(`  1. Cập nhật backend code (User Model, Controller, Routes)`);
        console.log(`  2. Cập nhật frontend code (CreateUserForm)`);
        console.log(`  3. Restart server backend`);
        console.log(`  4. Test form tạo user mới\n`);

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