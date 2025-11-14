const XLSX = require('xlsx');
const mongoose = require('mongoose');
const Evidence = require('../models/Evidence/Evidence');
const Program = require('../models/Evidence/Program');
const Organization = require('../models/Evidence/Organization');
const Standard = require('../models/Evidence/Standard');
const Criteria = require('../models/Evidence/Criteria');

const exportEvidences = async (filters, format = 'xlsx') => {
    try {
        let query = {};

        if (!filters.academicYearId) {
            throw new Error('Academic Year ID is required for export');
        }
        // FIX: Thêm 'new'
        query.academicYearId = new mongoose.Types.ObjectId(filters.academicYearId);

        // FIX: Thêm 'new'
        if (filters.programId) query.programId = new mongoose.Types.ObjectId(filters.programId);
        if (filters.organizationId) query.organizationId = new mongoose.Types.ObjectId(filters.organizationId);
        if (filters.standardId) query.standardId = new mongoose.Types.ObjectId(filters.standardId);
        if (filters.criteriaId) query.criteriaId = new mongoose.Types.ObjectId(filters.criteriaId);

        if (filters.status) query.status = filters.status;
        if (filters.documentType) query.documentType = filters.documentType;

        if (filters.dateFrom || filters.dateTo) {
            query.createdAt = {};
            if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
            if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
        }

        const evidences = await Evidence.find(query)
            .populate('academicYearId', 'name code')
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .populate('createdBy', 'fullName email')
            .populate('files', 'originalName size')
            .sort({ createdAt: -1 });

        const exportData = evidences.map(evidence => ({
            'Năm học': evidence.academicYearId?.name || '',
            'Mã minh chứng': evidence.code,
            'Tên minh chứng': evidence.name,
            'Mô tả': evidence.description || '',
            'Chương trình': evidence.programId?.name || '',
            'Tổ chức': evidence.organizationId?.name || '',
            'Tiêu chuẩn': `${evidence.standardId?.code} - ${evidence.standardId?.name}` || '',
            'Tiêu chí': `${evidence.criteriaId?.code} - ${evidence.criteriaId?.name}` || '',
            'Số hiệu văn bản': evidence.documentNumber || '',
            'Loại văn bản': evidence.documentType || '',
            'Ngày ban hành': evidence.issueDate ? formatDate(evidence.issueDate) : '',
            'Ngày hiệu lực': evidence.effectiveDate ? formatDate(evidence.effectiveDate) : '',
            'Cơ quan ban hành': evidence.issuingAgency || '',
            'Số lượng file': evidence.files?.length || 0,
            'Trạng thái': getStatusText(evidence.status),
            'Người tạo': evidence.createdBy?.fullName || '',
            'Ngày tạo': formatDate(evidence.createdAt),
            'Ghi chú': evidence.notes || ''
        }));

        if (format === 'csv') {
            return exportToCSV(exportData);
        } else {
            return exportToExcel(exportData, 'Danh sách minh chứng');
        }

    } catch (error) {
        console.error('Export evidences error:', error);
        throw error;
    }
};

const exportStatistics = async (filters) => {
    try {
        if (!filters.academicYearId) {
            throw new Error('Academic Year ID is required for export');
        }

        const totalStats = await Evidence.aggregate([
            { $match: buildMatchQuery(filters) },
            {
                $group: {
                    _id: null,
                    totalEvidences: { $sum: 1 },
                    activeEvidences: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
                    inactiveEvidences: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } }
                }
            }
        ]);

        const standardStats = await Evidence.aggregate([
            { $match: buildMatchQuery(filters) },
            {
                $lookup: {
                    from: 'standards',
                    localField: 'standardId',
                    foreignField: '_id',
                    as: 'standard'
                }
            },
            { $unwind: '$standard' },
            {
                $group: {
                    _id: '$standardId',
                    standardName: { $first: '$standard.name' },
                    standardCode: { $first: '$standard.code' },
                    count: { $sum: 1 },
                    activeCount: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
                }
            },
            { $sort: { standardCode: 1 } }
        ]);

        const criteriaStats = await Evidence.aggregate([
            { $match: buildMatchQuery(filters) },
            {
                $lookup: {
                    from: 'criterias',
                    localField: 'criteriaId',
                    foreignField: '_id',
                    as: 'criteria'
                }
            },
            { $unwind: '$criteria' },
            {
                $group: {
                    _id: '$criteriaId',
                    criteriaName: { $first: '$criteria.name' },
                    criteriaCode: { $first: '$criteria.code' },
                    count: { $sum: 1 },
                    activeCount: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
                }
            },
            { $sort: { criteriaCode: 1 } }
        ]);

        const workbook = XLSX.utils.book_new();

        const overviewData = totalStats.length > 0 ? [
            ['Chỉ số', 'Giá trị'],
            ['Tổng số minh chứng', totalStats[0].totalEvidences],
            ['Minh chứng đang hoạt động', totalStats[0].activeEvidences],
            ['Minh chứng ngừng hoạt động', totalStats[0].inactiveEvidences]
        ] : [['Không có dữ liệu']];

        const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
        XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Tổng quan');

        const standardData = [
            ['Mã tiêu chuẩn', 'Tên tiêu chuẩn', 'Tổng minh chứng', 'Đang hoạt động'],
            ...standardStats.map(item => [
                item.standardCode,
                item.standardName,
                item.count,
                item.activeCount
            ])
        ];

        const standardSheet = XLSX.utils.aoa_to_sheet(standardData);
        XLSX.utils.book_append_sheet(workbook, standardSheet, 'Thống kê theo tiêu chuẩn');

        const criteriaData = [
            ['Mã tiêu chí', 'Tên tiêu chí', 'Tổng minh chứng', 'Đang hoạt động'],
            ...criteriaStats.map(item => [
                item.criteriaCode,
                item.criteriaName,
                item.count,
                item.activeCount
            ])
        ];

        const criteriaSheet = XLSX.utils.aoa_to_sheet(criteriaData);
        XLSX.utils.book_append_sheet(workbook, criteriaSheet, 'Thống kê theo tiêu chí');

        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    } catch (error) {
        console.error('Export statistics error:', error);
        throw error;
    }
};

const exportImportTemplate = async (programId, organizationId, academicYearId) => {
    try {
        if (!academicYearId) {
            throw new Error('Academic Year ID is required for template generation');
        }

        const standards = await Standard.find({
            // FIX: Thêm 'new'
            academicYearId: new mongoose.Types.ObjectId(academicYearId),
            programId: new mongoose.Types.ObjectId(programId),
            organizationId: new mongoose.Types.ObjectId(organizationId),
            status: 'active'
        }).sort({ code: 1 });

        const criteria = await Criteria.find({
            // FIX: Thêm 'new'
            academicYearId: new mongoose.Types.ObjectId(academicYearId),
            programId: new mongoose.Types.ObjectId(programId),
            organizationId: new mongoose.Types.ObjectId(organizationId),
            status: 'active'
        }).populate('standardId', 'name code').sort({ 'standardId.code': 1, code: 1 });

        const workbook = XLSX.utils.book_new();

        const templateData = [
            [
                'Tên minh chứng (*)',
                'Mã tiêu chuẩn (*)',
                'Mã tiêu chí (*)',
                'Mô tả',
                'Số hiệu văn bản',
                'Loại văn bản',
                'Ngày ban hành (dd/mm/yyyy)',
                'Ngày hiệu lực (dd/mm/yyyy)',
                'Cơ quan ban hành',
                'Ghi chú'
            ],
            [
                'Ví dụ: Quyết định thành lập trường',
                '01',
                '01',
                'Ví dụ: Quyết định thành lập trường...',
                '123/QĐ-BGDĐT',
                'Quyết định',
                '01/01/2024',
                '01/01/2024',
                'Bộ Giáo dục và Đào tạo',
                'Ghi chú nếu có'
            ]
        ];

        const templateSheet = XLSX.utils.aoa_to_sheet(templateData);

        templateSheet['!cols'] = [
            { width: 30 }, { width: 15 }, { width: 15 }, { width: 40 },
            { width: 20 }, { width: 15 }, { width: 18 }, { width: 18 },
            { width: 25 }, { width: 30 }
        ];

        XLSX.utils.book_append_sheet(workbook, templateSheet, 'Template');

        const standardsData = [
            ['Mã tiêu chuẩn', 'Tên tiêu chuẩn'],
            ...standards.map(std => [std.code, std.name])
        ];

        const standardsSheet = XLSX.utils.aoa_to_sheet(standardsData);
        XLSX.utils.book_append_sheet(workbook, standardsSheet, 'Danh sách tiêu chuẩn');

        const criteriaData = [
            ['Mã tiêu chuẩn', 'Tên tiêu chuẩn', 'Mã tiêu chí', 'Tên tiêu chí'],
            ...criteria.map(crit => [
                crit.standardId.code,
                crit.standardId.name,
                crit.code,
                crit.name
            ])
        ];

        const criteriaSheet = XLSX.utils.aoa_to_sheet(criteriaData);
        XLSX.utils.book_append_sheet(workbook, criteriaSheet, 'Danh sách tiêu chí');

        const instructionsData = [
            ['HƯỚNG DẪN SỬ DỤNG TEMPLATE IMPORT MINH CHỨNG'],
            [''],
            ['1. Các trường có dấu (*) là bắt buộc'],
            ['2. Mã tiêu chuẩn và mã tiêu chí phải tồn tại trong hệ thống'],
            ['3. Ngày tháng phải có định dạng dd/mm/yyyy'],
            ['4. Loại văn bản: Quyết định, Thông tư, Nghị định, Luật, Báo cáo, Kế hoạch, Khác'],
            ['5. Không được để trống tên minh chứng, mã tiêu chuẩn và mã tiêu chí'],
            ['6. Tham khảo danh sách tiêu chuẩn và tiêu chí trong các sheet tương ứng'],
            ['7. File import phải là định dạng .xlsx hoặc .csv'],
            ['8. Tối đa 1000 bản ghi trong 1 lần import'],
            [''],
            ['Lưu ý: Hệ thống sẽ tự động tạo mã minh chứng dựa trên tiêu chuẩn và tiêu chí']
        ];

        const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
        XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Hướng dẫn');

        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    } catch (error) {
        console.error('Export import template error:', error);
        throw error;
    }
};

const exportEvidenceTree = async (programId, organizationId, academicYearId) => {
    try {
        if (!programId || !organizationId || !academicYearId) {
            throw new Error('programId, organizationId, academicYearId là bắt buộc');
        }

        const [program, organization] = await Promise.all([
            Program.findById(programId).lean(),
            Organization.findById(organizationId).lean()
        ]);

        const evidences = await Evidence.find({
            // FIX: Thêm 'new' vào tất cả các ObjectId
            academicYearId: new mongoose.Types.ObjectId(academicYearId),
            programId: new mongoose.Types.ObjectId(programId),
            organizationId: new mongoose.Types.ObjectId(organizationId)
        })
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .sort({ 'standardId.code': 1, 'criteriaId.code': 1, code: 1 })
            .lean();

        const standards = await Standard.find({
            // FIX: Thêm 'new'
            academicYearId: new mongoose.Types.ObjectId(academicYearId),
            programId: new mongoose.Types.ObjectId(programId)
        }).lean();

        const criteria = await Criteria.find({
            // FIX: Thêm 'new'
            academicYearId: new mongoose.Types.ObjectId(academicYearId),
            programId: new mongoose.Types.ObjectId(programId)
        }).lean();

        const treeStructure = {};
        standards.forEach(std => {
            treeStructure[std._id.toString()] = {
                standard: std,
                criteria: {}
            };
        });

        criteria.forEach(crit => {
            const stdId = crit.standardId.toString();
            if (treeStructure[stdId]) {
                treeStructure[stdId].criteria[crit._id.toString()] = {
                    criteria: crit,
                    evidences: []
                };
            }
        });

        evidences.forEach(ev => {
            const stdId = ev.standardId._id.toString();
            const critId = ev.criteriaId._id.toString();
            if (treeStructure[stdId] && treeStructure[stdId].criteria[critId]) {
                treeStructure[stdId].criteria[critId].evidences.push(ev);
            }
        });

        const wb = XLSX.utils.book_new();
        const data = [
            [
                `Chương trình: ${program?.name || ''}`,
                `Tổ chức: ${organization?.name || ''}`
            ],
            [],
            ['STT', 'Tiêu chuẩn', 'Tiêu chí', 'Mã Minh chứng', 'Tên Minh chứng', 'Số File', 'Trạng thái']
        ];

        let stt = 1;
        const statusMap = {
            'new': 'Mới',
            'in_progress': 'Đang thực hiện',
            'completed': 'Hoàn thành',
            'approved': 'Đã duyệt',
            'rejected': 'Từ chối'
        };

        Object.values(treeStructure).forEach(stdNode => {
            const stdName = `${stdNode.standard.code} - ${stdNode.standard.name}`;
            const criteriaList = Object.values(stdNode.criteria);

            criteriaList.forEach((critNode, critIdx) => {
                const critName = `${critNode.criteria.code} - ${critNode.criteria.name}`;
                const evidenceList = critNode.evidences;

                if (evidenceList.length === 0) {
                    data.push([
                        stt,
                        critIdx === 0 ? stdName : '',
                        critName,
                        '',
                        '',
                        0,
                        ''
                    ]);
                    stt++;
                } else {
                    evidenceList.forEach((ev, evIdx) => {
                        data.push([
                            stt,
                            (critIdx === 0 && evIdx === 0) ? stdName : '',
                            evIdx === 0 ? critName : '',
                            ev.code || '',
                            ev.name || '',
                            ev.files?.length || 0,
                            statusMap[ev.status] || 'Mới'
                        ]);
                        stt++;
                    });
                }
            });
        });

        const ws = XLSX.utils.aoa_to_sheet(data);
        ws['!cols'] = [
            { wch: 5 },
            { wch: 35 },
            { wch: 35 },
            { wch: 18 },
            { wch: 40 },
            { wch: 10 },
            { wch: 12 }
        ];

        ws['!rows'] = [
            { hpx: 20 },
            undefined,
            { hpx: 25 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Cây Minh chứng');
        return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    } catch (error) {
        console.error('Export tree error:', error);
        throw error;
    }
};

const exportToExcel = (data, sheetName = 'Data') => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    const colWidths = [];
    if (data.length > 0) {
        Object.keys(data[0]).forEach(key => {
            const maxLength = Math.max(
                key.length,
                ...data.map(row => (row[key] ? row[key].toString().length : 0))
            );
            colWidths.push({ width: Math.min(maxLength + 2, 50) });
        });
        worksheet['!cols'] = colWidths;
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

const exportToCSV = (data) => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        )
    ].join('\n');

    return Buffer.from('\ufeff' + csvContent, 'utf8');
};

const buildMatchQuery = (filters) => {
    let query = {};

    if (filters.academicYearId) {
        // FIX: Thêm 'new'
        query.academicYearId = new mongoose.Types.ObjectId(filters.academicYearId);
    }

    // FIX: Thêm 'new'
    if (filters.programId) query.programId = new mongoose.Types.ObjectId(filters.programId);
    if (filters.organizationId) query.organizationId = new mongoose.Types.ObjectId(filters.organizationId);
    if (filters.standardId) query.standardId = new mongoose.Types.ObjectId(filters.standardId);
    if (filters.criteriaId) query.criteriaId = new mongoose.Types.ObjectId(filters.criteriaId);

    if (filters.status) query.status = filters.status;
    if (filters.documentType) query.documentType = filters.documentType;

    return query;
};

const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN');
};

const getStatusText = (status) => {
    const statusMap = {
        'active': 'Đang hoạt động',
        'inactive': 'Ngừng hoạt động',
        'pending': 'Chờ duyệt',
        'archived': 'Lưu trữ'
    };
    return statusMap[status] || status;
};

module.exports = {
    exportEvidences,
    exportStatistics,
    exportImportTemplate,
    exportEvidenceTree
};