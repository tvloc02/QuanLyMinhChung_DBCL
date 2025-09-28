// File: scripts/debugPassword.js
// Script để debug và sửa vấn đề mật khẩu

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model từ project
const User = require('./models/User');

// Connect to MongoDB
async function connectDB() {
    try {
        const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/evidence_management';
        await mongoose.connect(dbUri);
        console.log('✅ Connected to MongoDB');
        console.log('📍 Database:', mongoose.connection.name);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

// Test với hash hiện tại trong database
async function testCurrentPasswords() {
    console.log('\n🔍 Testing current passwords in database...');

    const users = await User.find({}).select('email fullName password role status');

    console.log(`\n👥 Found ${users.length} users:`);

    for (const user of users) {
        console.log(`\n👤 User: ${user.fullName}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👑 Role: ${user.role}`);
        console.log(`   📊 Status: ${user.status}`);
        console.log(`   🔐 Password hash: ${user.password?.substring(0, 30)}...`);
        console.log(`   📏 Hash length: ${user.password?.length}`);

        // Test common passwords
        const testPasswords = [
            'admin123',
            'manager123',
            'password',
            '123456',
            'admin',
            'manager',
            'test123',
            user.email + '123', // email + 123
            user.email + '@123', // email + @123
            'cmc123',
            'cmc@123'
        ];

        console.log('   🧪 Testing passwords:');

        for (const testPwd of testPasswords) {
            try {
                const isMatch = await bcrypt.compare(testPwd, user.password);
                if (isMatch) {
                    console.log(`   ✅ FOUND MATCH: "${testPwd}"`);
                    break;
                } else {
                    console.log(`   ❌ "${testPwd}" - no match`);
                }
            } catch (error) {
                console.log(`   ⚠️ Error testing "${testPwd}":`, error.message);
            }
        }

        // Test với comparePassword method của user
        console.log('   🔧 Testing with user.comparePassword method:');
        try {
            const testWithMethod = await user.comparePassword('admin123');
            console.log(`   📝 user.comparePassword('admin123'): ${testWithMethod}`);
        } catch (error) {
            console.log(`   ❌ Error with comparePassword method:`, error.message);
        }
    }
}

// Reset password cho tất cả users
async function resetAllPasswords() {
    console.log('\n🔐 Resetting passwords for all users...');

    const users = await User.find({});

    const defaultPasswords = {
        'admin': 'admin123',
        'manager': 'manager123',
        'expert': 'expert123',
        'advisor': 'advisor123'
    };

    for (const user of users) {
        try {
            // Determine new password based on role or email
            let newPassword;
            if (defaultPasswords[user.role]) {
                newPassword = defaultPasswords[user.role];
            } else if (defaultPasswords[user.email]) {
                newPassword = defaultPasswords[user.email];
            } else {
                newPassword = user.email + '123'; // Fallback
            }

            console.log(`\n👤 Resetting password for: ${user.fullName}`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   🆕 New password: ${newPassword}`);

            // Hash password manually với bcrypt
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            console.log(`   🔐 New hash: ${hashedPassword.substring(0, 30)}...`);

            // Update password directly in database
            await User.updateOne(
                { _id: user._id },
                {
                    password: hashedPassword,
                    failedLoginAttempts: 0,
                    lockUntil: undefined
                }
            );

            console.log(`   ✅ Password updated successfully`);

            // Verify the new password works
            const verifyUser = await User.findById(user._id);
            const isValid = await verifyUser.comparePassword(newPassword);
            console.log(`   ✔️ Verification: ${isValid ? 'PASS' : 'FAIL'}`);

        } catch (error) {
            console.error(`   ❌ Error resetting password for ${user.fullName}:`, error.message);
        }
    }
}

// Test specific hash từ database image
async function testSpecificHash() {
    console.log('\n🔬 Testing specific hash from database...');

    const hashFromDB = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/UnuTaVcDgVUfNu6g0';
    console.log('🔐 Hash to test:', hashFromDB);

    const testPasswords = [
        'admin123',
        'password',
        '123456',
        'admin',
        'manager',
        'test',
        'cmc123',
        'cmc@123',
        'Quản trị viên hệ thống',
        'admin@123',
        'password123',
        'vnua123',
        'cmc.edu.vn',
        '', // empty password
        ' ', // space
        'abc123'
    ];

    console.log('\n🧪 Testing various passwords against this hash:');

    for (const password of testPasswords) {
        try {
            const isMatch = await bcrypt.compare(password, hashFromDB);
            console.log(`   ${isMatch ? '✅' : '❌'} "${password}": ${isMatch ? 'MATCH!' : 'no match'}`);
            if (isMatch) {
                console.log(`\n🎉 FOUND THE CORRECT PASSWORD: "${password}"`);
                return password;
            }
        } catch (error) {
            console.log(`   ⚠️ Error testing "${password}":`, error.message);
        }
    }

    console.log('\n😞 No matching password found for this hash');
    return null;
}

// Create test hash to verify bcrypt is working
async function testBcryptWorking() {
    console.log('\n🧪 Testing if bcrypt is working correctly...');

    const testPassword = 'test123';
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(testPassword, salt);

    console.log(`📝 Test password: ${testPassword}`);
    console.log(`🔐 Generated hash: ${hash}`);

    const isMatch = await bcrypt.compare(testPassword, hash);
    console.log(`✅ Verification: ${isMatch ? 'PASS' : 'FAIL'}`);

    if (!isMatch) {
        console.log('❌ bcrypt is not working correctly!');
        return false;
    }

    console.log('✅ bcrypt is working correctly');
    return true;
}

// Fix database với credentials chuẩn
async function fixDatabase() {
    console.log('\n🔧 Fixing database with standard credentials...');

    // Standard users to create/update
    const standardUsers = [
        {
            email: 'admin',
            fullName: 'Quản trị viên hệ thống',
            role: 'admin',
            password: 'admin123'
        },
        {
            email: 'manager',
            fullName: 'Cán bộ quản lý báo cáo TĐG',
            role: 'manager',
            password: 'manager123'
        }
    ];

    for (const userData of standardUsers) {
        try {
            console.log(`\n👤 Processing user: ${userData.fullName}`);

            // Check if user exists
            let user = await User.findOne({ email: userData.email });

            if (user) {
                console.log(`   📝 User exists, updating...`);
            } else {
                console.log(`   ➕ Creating new user...`);
                user = new User({
                    email: userData.email,
                    fullName: userData.fullName,
                    role: userData.role,
                    status: 'active',
                    department: 'IT Department',
                    position: 'System Administrator'
                });
            }

            // Hash password
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(userData.password, salt);

            // Update user
            user.password = hashedPassword;
            user.fullName = userData.fullName;
            user.role = userData.role;
            user.status = 'active';
            user.failedLoginAttempts = 0;
            user.lockUntil = undefined;

            await user.save();

            console.log(`   ✅ User saved successfully`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   🔑 Password: ${userData.password}`);

            // Verify
            const isValid = await user.comparePassword(userData.password);
            console.log(`   ✔️ Verification: ${isValid ? 'PASS' : 'FAIL'}`);

        } catch (error) {
            console.error(`   ❌ Error processing ${userData.fullName}:`, error.message);
        }
    }
}

// Main function
async function main() {
    console.log('🚀 Password Debug Script');
    console.log('========================');

    await connectDB();

    const action = process.argv[2] || 'all';

    switch (action) {
        case 'test':
            await testCurrentPasswords();
            break;
        case 'test-hash':
            await testSpecificHash();
            break;
        case 'test-bcrypt':
            await testBcryptWorking();
            break;
        case 'reset':
            await resetAllPasswords();
            break;
        case 'fix':
            await fixDatabase();
            break;
        case 'all':
        default:
            await testBcryptWorking();
            await testSpecificHash();
            await testCurrentPasswords();
            await fixDatabase();
            break;
    }

    console.log('\n✅ Script completed!');
    console.log('\n📋 Usage:');
    console.log('   node scripts/debugPassword.js test          # Test current passwords');
    console.log('   node scripts/debugPassword.js test-hash     # Test specific hash');
    console.log('   node scripts/debugPassword.js test-bcrypt   # Test bcrypt working');
    console.log('   node scripts/debugPassword.js reset         # Reset all passwords');
    console.log('   node scripts/debugPassword.js fix           # Fix database with standard users');
    console.log('   node scripts/debugPassword.js all           # Run all tests and fix');

    console.log('\n🔐 After running fix, try these credentials:');
    console.log('   Admin: admin / admin123');
    console.log('   Manager: manager / manager123');

    mongoose.connection.close();
}

// Error handling
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled rejection:', err);
    process.exit(1);
});

// Run the script
main().catch(console.error);