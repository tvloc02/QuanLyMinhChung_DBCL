const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Import models
const Evidence = require('../models/Evidence/Evidence');
const AcademicYear = require('../models/system/AcademicYear');

async function updateEvidenceYear() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Kết nối MongoDB thành công\n');

        // Lấy tất cả năm học hợp lệ
        const validYears = await AcademicYear.find().select('_id');
        const validYearIds = validYears.map(y => y._id.toString());
        
        console.log(`✓ Có ${validYears.length} năm học hợp lệ trong hệ thống\n`);

        // Tìm năm học active hoặc mới nhất
        let targetYear = await AcademicYear.findOne({ isActive: true });
        if (!targetYear) {
            targetYear = await AcademicYear.findOne().sort({ createdAt: -1 });
        }

        if (!targetYear) {
            console.log('❌ Không có năm học nào trong hệ thống');
            return;
        }

        console.log(`📌 Năm học mục tiêu: ${targetYear.name} (${targetYear._id})\n`);

        // Tìm tất cả evidences
        const allEvidences = await Evidence.find();
        console.log(`✓ Tìm thấy ${allEvidences.length} minh chứng\n`);

        let invalidCount = 0;
        let updatedCount = 0;

        for (const evidence of allEvidences) {
            const yearIdStr = evidence.academicYearId ? evidence.academicYearId.toString() : null;
            
            // Kiểm tra nếu academicYearId null hoặc không hợp lệ
            if (!yearIdStr || !validYearIds.includes(yearIdStr)) {
                invalidCount++;
                console.log(`❌ [${evidence.code}] Năm học không hợp lệ: ${yearIdStr || 'null'}`);
                
                // Update sang năm học mục tiêu
                evidence.academicYearId = targetYear._id;
                await evidence.save();
                updatedCount++;
                
                console.log(`   ✓ Đã update sang: ${targetYear.name}\n`);
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log(`📊 KẾT QUẢ:`);
        console.log(`   - Tổng số minh chứng: ${allEvidences.length}`);
        console.log(`   - Số minh chứng có năm học không hợp lệ: ${invalidCount}`);
        console.log(`   - Số minh chứng đã update: ${updatedCount}`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('✗ Lỗi:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Đã đóng kết nối MongoDB');
    }
}

updateEvidenceYear();
