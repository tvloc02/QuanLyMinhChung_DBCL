const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function checkValidations() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Kết nối MongoDB thành công\n');

        const db = mongoose.connection.db;
        
        // Lấy tất cả collections
        const collections = await db.listCollections().toArray();
        
        console.log('=== KIỂM TRA VALIDATION CỦA TẤT CẢ COLLECTIONS ===\n');
        
        for (const collection of collections) {
            const collectionName = collection.name;
            
            // Lấy thông tin chi tiết
            const info = await db.command({
                listCollections: 1,
                filter: { name: collectionName }
            });
            
            const collectionInfo = info.cursor.firstBatch[0];
            const hasValidator = collectionInfo.options?.validator && 
                                Object.keys(collectionInfo.options.validator).length > 0;
            const validationLevel = collectionInfo.options?.validationLevel || 'off';
            
            const status = hasValidator || validationLevel !== 'off' ? '⚠ CÓ VALIDATION' : '✓ Không có validation';
            
            console.log(`${status} - ${collectionName}`);
            if (hasValidator || validationLevel !== 'off') {
                console.log(`  Validation Level: ${validationLevel}`);
                if (hasValidator) {
                    console.log(`  Có validator rules`);
                }
            }
            console.log('');
        }

        console.log('=== HOÀN TẤT ===');

    } catch (error) {
        console.error('✗ Lỗi:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Đã đóng kết nối MongoDB');
    }
}

checkValidations();
