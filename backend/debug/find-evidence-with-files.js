const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Import models
const Evidence = require('../models/Evidence/Evidence');

async function findEvidenceWithFiles() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Kết nối MongoDB thành công\n');

        // Tìm evidences có files
        const evidencesWithFiles = await Evidence.find({
            files: { $exists: true, $ne: [] }
        })
        .select('code name files')
        .populate({
            path: 'files',
            select: 'originalName size'
        })
        .limit(10);

        if (evidencesWithFiles.length === 0) {
            console.log('❌ Không có minh chứng nào có files');
            console.log('\n💡 Bạn cần upload files cho minh chứng trong admin panel');
            return;
        }

        console.log(`✓ Tìm thấy ${evidencesWithFiles.length} minh chứng có files:\n`);
        
        evidencesWithFiles.forEach((evidence, idx) => {
            console.log(`${idx + 1}. [${evidence.code}] ${evidence.name}`);
            console.log(`   📁 ${evidence.files.length} file(s):`);
            evidence.files.forEach(file => {
                console.log(`      - ${file.originalName} (${file.size} bytes)`);
            });
            console.log(`   🔗 URL: http://localhost:3000/public/evidences/${evidence.code}\n`);
        });

        console.log('💡 Bạn có thể test với các URL trên!');

    } catch (error) {
        console.error('✗ Lỗi:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Đã đóng kết nối MongoDB');
    }
}

findEvidenceWithFiles();
