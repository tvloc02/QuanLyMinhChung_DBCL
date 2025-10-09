// File: scripts/quickFix.js
// Quick fix để bypass vấn đề comparePassword

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function connectDB() {
    try {
        const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/evidence_management';
        await mongoose.connect(dbUri);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

// Fix admin user với cách đơn giản nhất
async function quickFixAdmin() {
    console.log('🔧 Quick fix admin user...');

    const password = 'admin123';
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);

    console.log('Password:', password);
    console.log('Hash:', hash);

    // Verify hash works
    const testResult = await bcrypt.compare(password, hash);
    console.log('Hash verification:', testResult);

    if (!testResult) {
        console.log('❌ Hash verification failed!');
        return;
    }

    // Update admin user directly
    const result = await mongoose.connection.db.collection('users').updateOne(
        { email: 'admin' },
        {
            $set: {
                password: hash,
                failedLoginAttempts: 0,
                status: 'active'
            },
            $unset: { lockUntil: 1 }
        }
    );

    console.log('Update result:', result);

    // Verify update
    const adminUser = await mongoose.connection.db.collection('users').findOne({ email: 'admin' });
    console.log('Admin user after update:');
    console.log('- Email:', adminUser.email);
    console.log('- Password hash:', adminUser.password);
    console.log('- Status:', adminUser.status);

    // Test hash directly
    const finalTest = await bcrypt.compare(password, adminUser.password);
    console.log('Final verification:', finalTest);

    if (finalTest) {
        console.log('✅ Admin user fixed successfully!');
        console.log('🔑 Login with: admin / admin123');
    } else {
        console.log('❌ Still having issues');
    }
}

// Fix manager user
async function quickFixManager() {
    console.log('🔧 Quick fix manager user...');

    const password = 'manager123';
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);

    console.log('Password:', password);
    console.log('Hash:', hash);

    const testResult = await bcrypt.compare(password, hash);
    console.log('Hash verification:', testResult);

    if (!testResult) {
        console.log('❌ Hash verification failed!');
        return;
    }

    // Update manager user directly
    const result = await mongoose.connection.db.collection('users').updateOne(
        { email: 'manager' },
        {
            $set: {
                password: hash,
                failedLoginAttempts: 0,
                status: 'active'
            },
            $unset: { lockUntil: 1 }
        }
    );

    console.log('Update result:', result);

    if (result.matchedCount === 0) {
        // Create manager user if not exists
        console.log('Manager user not found, creating...');

        const insertResult = await mongoose.connection.db.collection('users').insertOne({
            email: 'manager',
            fullName: 'Cán bộ quản lý báo cáo TĐG',
            password: hash,
            role: 'manager',
            status: 'active',
            failedLoginAttempts: 0,
            department: 'IT Department',
            position: 'Manager',
            notificationSettings: {
                email: true,
                inApp: true,
                assignment: true,
                evaluation: true,
                deadline: true
            },
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log('Insert result:', insertResult);
    }

    // Verify
    const managerUser = await mongoose.connection.db.collection('users').findOne({ email: 'manager' });
    const finalTest = await bcrypt.compare(password, managerUser.password);
    console.log('Final verification:', finalTest);

    if (finalTest) {
        console.log('✅ Manager user fixed successfully!');
        console.log('🔑 Login with: manager / manager123');
    } else {
        console.log('❌ Still having issues');
    }
}

// Test login với hash thật
async function testRealLogin() {
    console.log('\n🧪 Testing real login simulation...');

    // Simulate login process
    const testCredentials = [
        { email: 'admin', password: 'admin123' },
        { email: 'manager', password: 'manager123' }
    ];

    for (const cred of testCredentials) {
        console.log(`\n--- Testing ${cred.email} ---`);

        // Get user from database
        const user = await mongoose.connection.db.collection('users').findOne({ email: cred.email });

        if (!user) {
            console.log('❌ User not found');
            continue;
        }

        console.log('User found:', user.email);
        console.log('Password hash:', user.password?.substring(0, 30) + '...');
        console.log('Status:', user.status);
        console.log('Failed attempts:', user.failedLoginAttempts);

        // Test password
        try {
            const isMatch = await bcrypt.compare(cred.password, user.password);
            console.log(`Password "${cred.password}" result:`, isMatch);

            if (isMatch) {
                console.log('✅ LOGIN SUCCESS for', cred.email);
            } else {
                console.log('❌ LOGIN FAILED for', cred.email);
            }
        } catch (error) {
            console.log('❌ Error testing password:', error.message);
        }
    }
}

// List all users in database
async function listUsers() {
    console.log('\n👥 All users in database:');

    const users = await mongoose.connection.db.collection('users').find({}).toArray();

    users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.fullName || 'Unknown'}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Password: ${user.password ? user.password.substring(0, 30) + '...' : 'No password'}`);
        console.log(`   Failed attempts: ${user.failedLoginAttempts || 0}`);
    });
}

async function main() {
    console.log('⚡ Quick Fix Script');
    console.log('==================');

    await connectDB();

    const action = process.argv[2] || 'all';

    switch (action) {
        case 'admin':
            await quickFixAdmin();
            break;
        case 'manager':
            await quickFixManager();
            break;
        case 'test':
            await testRealLogin();
            break;
        case 'list':
            await listUsers();
            break;
        case 'all':
        default:
            await listUsers();
            await quickFixAdmin();
            await quickFixManager();
            await testRealLogin();
            break;
    }

    console.log('\n✅ Quick fix completed!');
    console.log('\n🔑 Try these credentials:');
    console.log('   Admin: admin / admin123');
    console.log('   Manager: manager / manager123');

    mongoose.connection.close();
}

process.on('unhandledRejection', (err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});

main().catch(console.error);