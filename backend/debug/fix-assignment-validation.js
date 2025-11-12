const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function fixCollectionValidation(collectionName) {
    try {
        const db = mongoose.connection.db;
        const collections = await db.listCollections({ name: collectionName }).toArray();

        if (collections.length === 0) {
            console.log(`  ⚠ Collection "${collectionName}" không tồn tại`);
            return false;
        }

        // Xóa validator
        await db.command({
            collMod: collectionName,
            validator: {},
            validationLevel: 'off'
        });

        console.log(`  ✓ Đã tắt validation cho "${collectionName}"`);
        return true;

    } catch (error) {
        console.error(`  ✗ Lỗi khi fix "${collectionName}":`, error.message);
        return false;
    }
}

async function fixAllValidations() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Kết nối MongoDB thành công\n');

        const collectionsToFix = [
            'assignments',
            'activitylogs',
            'notifications',
            'evaluations',
            'reports'
        ];

        console.log('=== BẮT ĐẦU TẮT VALIDATION CHO CÁC COLLECTIONS ===\n');

        let successCount = 0;
        for (const collectionName of collectionsToFix) {
            console.log(`Đang xử lý: ${collectionName}...`);
            const success = await fixCollectionValidation(collectionName);
            if (success) successCount++;
            console.log('');
        }

        console.log('=== KẾT QUẢ ===');
        console.log(`✓ Đã tắt validation cho ${successCount}/${collectionsToFix.length} collections`);
        console.log('\n✓ Hoàn tất! Bây giờ bạn có thể tạo assignments mà không bị validation error.');

    } catch (error) {
        console.error('✗ Lỗi:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Đã đóng kết nối MongoDB');
    }
}

fixAllValidations();
