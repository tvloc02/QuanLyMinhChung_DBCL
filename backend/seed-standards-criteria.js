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
        const organizationId = 'YOUR_ORG_ID'; // Thay org ID thật
        const userId = '67479b24dd26de3b1c5acfb0';

        const standards = [
            {
                code: '01',
                name: 'Tiêu chuẩn 1: Mục tiêu và chuẩn đầu ra',
                academicYearId,
                programId,
                organizationId,
                description: '',
                status: 'active',
                createdBy: userId,
                updatedBy: userId
            },
            {
                code: '02',
                name: 'Tiêu chuẩn 2: Chương trình đào tạo',
                academicYearId,
                programId,
                organizationId,
                description: '',
                status: 'active',
                createdBy: userId,
                updatedBy: userId
            },
            {
                code: '03',
                name: 'Tiêu chuẩn 3: Đội ngũ giảng viên',
                academicYearId,
                programId,
                organizationId,
                description: '',
                status: 'active',
                createdBy: userId,
                updatedBy: userId
            },
        ];

        for (const std of standards) {
            const created = await Standard.create(std);
            console.log(`✅ Standard ${created.code}`);
        }

        const criteria = [
            {
                code: '01',
                standardCode: '01',
                name: 'Tiêu chí 1.1: Mục tiêu CTĐT',
                academicYearId,
                programId,
                organizationId,
                description: '',
                status: 'active',
                createdBy: userId,
                updatedBy: userId
            },
            {
                code: '02',
                standardCode: '01',
                name: 'Tiêu chí 1.2: CĐR được xác định',
                academicYearId,
                programId,
                organizationId,
                description: '',
                status: 'active',
                createdBy: userId,
                updatedBy: userId
            },
            {
                code: '01',
                standardCode: '02',
                name: 'Tiêu chí 2.1: Cấu trúc CT',
                academicYearId,
                programId,
                organizationId,
                description: '',
                status: 'active',
                createdBy: userId,
                updatedBy: userId
            },
            {
                code: '01',
                standardCode: '03',
                name: 'Tiêu chí 3.1: Đội ngũ GV',
                academicYearId,
                programId,
                organizationId,
                description: '',
                status: 'active',
                createdBy: userId,
                updatedBy: userId
            },
        ];

        for (const crit of criteria) {
            const created = await Criteria.create(crit);
            console.log(`✅ Criteria ${created.standardCode}.${created.code}`);
        }

        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('❌', error);
        process.exit(1);
    }
}

seed();