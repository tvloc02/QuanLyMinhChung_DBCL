const mongoose = require('mongoose');
require('dotenv').config();

async function initializeMongoDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Kết nối MongoDB');

        // Tạo collections và indexes
        const db = mongoose.connection;

        // Tạo index cho Evidence
        await db.collection('evidences').createIndex({ code: 1, academicYearId: 1 }, { unique: true });
        await db.collection('evidences').createIndex({ academicYearId: 1 });
        await db.collection('evidences').createIndex({ criteriaId: 1 });

        console.log('✅ Khởi tạo indexes thành công');
        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
}

initializeMongoDB();
