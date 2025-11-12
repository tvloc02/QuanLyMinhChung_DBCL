const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Import models
const Evidence = require('../models/Evidence/Evidence');
const AcademicYear = require('../models/system/AcademicYear');

async function checkEvidenceYear() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Kết nối MongoDB thành công\n');

        // Tìm evidence P1.01.02.05
        const evidence = await Evidence.findOne({ code: 'P1.01.02.05' });
        
        if (!evidence) {
            console.log('❌ Không tìm thấy minh chứng P1.01.02.05');
            return;
        }

        console.log('✓ Tìm thấy minh chứng:', evidence.code);
        console.log('  Name:', evidence.name);
        console.log('  AcademicYearId (raw):', evidence.academicYearId);
        
        if (evidence.academicYearId) {
            // Kiểm tra năm học có tồn tại không
            const year = await AcademicYear.findById(evidence.academicYearId);
            
            if (year) {
                console.log('\n✓ Năm học TỒN TẠI:');
                console.log('  ID:', year._id);
                console.log('  Name:', year.name);
                console.log('  Code:', year.code);
                console.log('  IsActive:', year.isActive);
            } else {
                console.log('\n❌ Năm học KHÔNG TỒN TẠI trong DB!');
                console.log('  Evidence đang trỏ đến ID:', evidence.academicYearId);
                console.log('\n💡 Cần update evidence này sang năm học hiện tại');
                
                // Lấy năm học mới nhất
                const latestYear = await AcademicYear.findOne().sort({ createdAt: -1 });
                if (latestYear) {
                    console.log('\n📌 Năm học mới nhất:');
                    console.log('  ID:', latestYear._id);
                    console.log('  Name:', latestYear.name);
                    
                    // Hỏi có muốn update không
                    console.log('\n❓ Muốn update evidence này sang năm học mới nhất?');
                    console.log('   Chạy lệnh: node update-evidence-year.js');
                }
            }
        } else {
            console.log('\n❌ Evidence không có academicYearId');
        }

        // Liệt kê tất cả năm học
        console.log('\n📋 Danh sách tất cả năm học:');
        const allYears = await AcademicYear.find().sort({ createdAt: -1 });
        allYears.forEach(y => {
            console.log(`  - ${y.name} (${y._id}) ${y.isActive ? '✓ ACTIVE' : ''}`);
        });

    } catch (error) {
        console.error('✗ Lỗi:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Đã đóng kết nối MongoDB');
    }
}

checkEvidenceYear();
