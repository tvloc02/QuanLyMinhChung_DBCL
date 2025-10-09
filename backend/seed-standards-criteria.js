// backend/seed-standards-criteria.js
const mongoose = require('mongoose');
require('dotenv').config();

require('./models/Evidence/Standard');
require('./models/Evidence/Criteria');

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected\n');

        const Standard = mongoose.model('Standard');
        const Criteria = mongoose.model('Criteria');

        const academicYearId = '67479b24dd26de3b1c5acfb3';
        const programId = '674e0ac63d1c11c1c5c37c3d';
        const organizationId = '674e0b043d1c11c1c5c37c4a';
        const userId = '67479b24dd26de3b1c5acfb0';

        // Tạo Standards
        const standardsData = [
            { code: '01', name: 'Tiêu chuẩn 1: Mục tiêu và chuẩn đầu ra' },
            { code: '02', name: 'Tiêu chuẩn 2: Chương trình đào tạo' },
            { code: '03', name: 'Tiêu chuẩn 3: Đội ngũ giảng viên' },
        ];

        const createdStandards = {};

        for (const stdData of standardsData) {
            const standard = await Standard.create({
                ...stdData,
                academicYearId,
                programId,
                organizationId,
                status: 'active',
                createdBy: userId,
                updatedBy: userId
            });
            createdStandards[stdData.code] = standard._id;
            console.log(`✅ Standard ${standard.code}: ${standard._id}`);
        }

        // Tạo Criteria với standardId
        const criteriaData = [
            { standardCode: '01', code: '01', name: 'Tiêu chí 1.1: Mục tiêu CTĐT' },
            { standardCode: '01', code: '02', name: 'Tiêu chí 1.2: CĐR được xác định' },
            { standardCode: '02', code: '01', name: 'Tiêu chí 2.1: Cấu trúc CT' },
            { standardCode: '03', code: '01', name: 'Tiêu chí 3.1: Đội ngũ GV' },
        ];

        for (const critData of criteriaData) {
            const criteria = await Criteria.create({
                code: critData.code,
                name: critData.name,
                standardId: createdStandards[critData.standardCode],
                academicYearId,
                programId,
                organizationId,
                status: 'active',
                createdBy: userId,
                updatedBy: userId
            });
            console.log(`✅ Criteria ${critData.standardCode}.${criteria.code}: ${criteria._id}`);
        }

        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('❌', error);
        process.exit(1);
    }
}

seed();