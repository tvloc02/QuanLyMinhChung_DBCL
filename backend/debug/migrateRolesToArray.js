const mongoose = require('mongoose');
require('dotenv').config();

const migrateRoles = async () => {
    try {
        // Kết nối MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/evidence_management', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Đã kết nối MongoDB');

        const User = mongoose.model('user');

        // Lấy tất cả users
        const users = await User.find({});
        console.log(`📊 Tìm thấy ${users.length} người dùng`);

        let updatedCount = 0;
        let skippedCount = 0;

        for (const user of users) {
            // Nếu user chưa có roles array hoặc roles array rỗng
            if (!user.roles || user.roles.length === 0) {
                // Nếu có role (string) thì chuyển sang roles array
                if (user.role) {
                    user.roles = [user.role];
                    await user.save();
                    updatedCount++;
                    console.log(`✅ Đã cập nhật user ${user.email}: role "${user.role}" -> roles [${user.roles.join(', ')}]`);
                } else {
                    // Nếu không có role thì set default là expert
                    user.roles = ['expert'];
                    user.role = 'expert';
                    await user.save();
                    updatedCount++;
                    console.log(`⚠️  User ${user.email} không có role, đã set mặc định là "expert"`);
                }
            } else {
                skippedCount++;
                console.log(`⏭️  Bỏ qua user ${user.email} - đã có roles array`);
            }
        }

        console.log('\n🎉 HOÀN THÀNH MIGRATION!');
        console.log(`✅ Đã cập nhật: ${updatedCount} users`);
        console.log(`⏭️  Bỏ qua: ${skippedCount} users`);

        // Thống kê
        const stats = await User.aggregate([
            {
                $group: {
                    _id: '$roles',
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('\n📊 THỐNG KÊ THEO ROLES:');
        stats.forEach(stat => {
            console.log(`   ${stat._id.join(', ')}: ${stat.count} users`);
        });

    } catch (error) {
        console.error('❌ Lỗi migration:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Đã đóng kết nối MongoDB');
        process.exit(0);
    }
};

// Chạy migration
migrateRoles();