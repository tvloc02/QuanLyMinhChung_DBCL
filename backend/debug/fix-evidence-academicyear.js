const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Import models
const Evidence = require('../models/Evidence/Evidence');
const AcademicYear = require('../models/system/AcademicYear');

async function fixEvidenceAcademicYear() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Kết nối MongoDB thành công\n');

        // Tìm năm học active
        const activeYear = await AcademicYear.findOne({ isActive: true });
        
        if (!activeYear) {
            console.log('❌ Không tìm thấy năm học active');
            console.log('Đang lấy năm học mới nhất...');
            const latestYear = await AcademicYear.findOne().sort({ createdAt: -1 });
            
            if (!latestYear) {
                console.log('❌ Không có năm học nào trong hệ thống');
                return;
            }
            
            console.log(`✓ Sử dụng năm học: ${latestYear.name} (${latestYear._id})`);
            
            // Update tất cả evidences không có academicYearId
            const result = await Evidence.updateMany(
                { academicYearId: null },
                { $set: { academicYearId: latestYear._id } }
            );
            
            console.log(`\n✓ Đã cập nhật ${result.modifiedCount} minh chứng`);
        } else {
            console.log(`✓ Năm học active: ${activeYear.name} (${activeYear._id})`);
            
            // Update tất cả evidences không có academicYearId
            const result = await Evidence.updateMany(
                { academicYearId: null },
                { $set: { academicYearId: activeYear._id } }
            );
            
            console.log(`\n✓ Đã cập nhật ${result.modifiedCount} minh chứng`);
        }

        // Kiểm tra lại
        const nullCount = await Evidence.countDocuments({ academicYearId: null });
        console.log(`\nSố minh chứng còn null academicYearId: ${nullCount}`);

    } catch (error) {
        console.error('✗ Lỗi:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Đã đóng kết nối MongoDB');
    }
}

fixEvidenceAcademicYear();
