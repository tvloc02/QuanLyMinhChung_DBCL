const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Import models
const Evidence = require('../models/Evidence/Evidence');
const File = require('../models/Evidence/File');

async function checkEvidenceFiles() {
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
        console.log('  Files field:', evidence.files);
        console.log('  Files count:', evidence.files?.length || 0);
        
        if (evidence.files && evidence.files.length > 0) {
            console.log('\n📁 Danh sách files:');
            for (const fileId of evidence.files) {
                const file = await File.findById(fileId);
                if (file) {
                    console.log(`  ✓ ${file.originalName} (${file.size} bytes)`);
                } else {
                    console.log(`  ❌ File ID ${fileId} không tồn tại`);
                }
            }
        } else {
            console.log('\n❌ Evidence này chưa có files');
            console.log('\n💡 Bạn cần upload files cho minh chứng này trong admin panel');
        }

        // Kiểm tra xem có files nào trong DB không
        const totalFiles = await File.countDocuments();
        console.log(`\n📊 Tổng số files trong hệ thống: ${totalFiles}`);
        
        if (totalFiles > 0) {
            console.log('\n📋 Một số files mẫu:');
            const sampleFiles = await File.find().limit(5).select('originalName size');
            sampleFiles.forEach(f => {
                console.log(`  - ${f.originalName} (${f.size} bytes)`);
            });
        }

    } catch (error) {
        console.error('✗ Lỗi:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Đã đóng kết nối MongoDB');
    }
}

checkEvidenceFiles();
