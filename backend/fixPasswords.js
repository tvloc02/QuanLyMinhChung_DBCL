// fix-database-passwords.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Thay đổi connection string theo database của bạn
const MONGO_URI = 'mongodb://localhost:27017/evidence_management';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Schema đơn giản cho User
const userSchema = new mongoose.Schema({
    email: String,
    fullName: String,
    password: String,
    role: String,
    status: String
}, { collection: 'users' }); // Đảm bảo collection name đúng

const User = mongoose.model('User', userSchema);

const fixPasswords = async () => {
    await connectDB();

    try {
        console.log('🔍 Checking current users...');
        const users = await User.find({});
        console.log(`Found ${users.length} users`);

        for (const user of users) {
            console.log(`\n👤 User: ${user.email} (${user.fullName})`);
            console.log(`Current password: ${user.password}`);

            // Đặt password mới dựa trên email
            let newPassword;
            if (user.email === 'admin') {
                newPassword = 'admin123';
            } else if (user.email === 'manager1') {
                newPassword = 'manager123';
            } else {
                newPassword = '123456'; // Default password
            }

            // Tạo hash mới ĐÚNG CÁCH
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // Cập nhật database
            await User.updateOne(
                { _id: user._id },
                { password: hashedPassword }
            );

            console.log(`✅ Updated ${user.email} - New password: ${newPassword}`);
            console.log(`✅ New hash: ${hashedPassword.substring(0, 20)}...`);

            // Verify hash hoạt động đúng
            const isValid = await bcrypt.compare(newPassword, hashedPassword);
            console.log(`✅ Verification: ${isValid ? 'PASS' : 'FAIL'}`);
        }

        console.log('\n🎉 Password reset completed!');
        console.log('\n📋 New login credentials:');
        console.log('👨‍💼 Admin: email="admin", password="admin123"');
        console.log('👨‍💼 Manager: email="manager1", password="manager123"');

    } catch (error) {
        console.error('❌ Error fixing passwords:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
};

// Chạy script
fixPasswords();