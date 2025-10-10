// scripts/migrateUserRoles.js
const mongoose = require('mongoose');
const User = require('../../backend/models/User/User');

async function migrateUserRoles() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Tìm tất cả users không có roles hoặc roles rỗng
        const usersToUpdate = await User.find({
            $or: [
                { roles: { $exists: false } },
                { roles: { $size: 0 } }
            ]
        });

        console.log(`Tìm thấy ${usersToUpdate.length} users cần cập nhật`);

        for (const user of usersToUpdate) {
            // Copy role sang roles
            if (user.role && (!user.roles || user.roles.length === 0)) {
                user.roles = [user.role];
                await user.save();
                console.log(`✓ Đã cập nhật user: ${user.email}`);
            }
        }

        console.log('Migration hoàn tất!');
        process.exit(0);
    } catch (error) {
        console.error('Lỗi migration:', error);
        process.exit(1);
    }
}

migrateUserRoles();