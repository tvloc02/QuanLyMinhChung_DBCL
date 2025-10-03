const XLSX = require('xlsx');
const mongoose = require('mongoose');
const Evidence = require('../models/Evidence/Evidence');
const { Program, Organization, Standard, Criteria } = require('../models/Evidence/Program');

// Export evidences to Excel
const exportEvidences = async (filters, format = 'xlsx') => {
    try {
        // Build query with academicYearId as required filter
        let query = {};

        // academicYearId is required
        if (!filters.academicYearId) {
            throw new Error('Academic Year ID is required for export');
        }
        query.academicYearId = mongoose.Types.ObjectId(filters.academicYearId);

        if (filters.programId) query.programId = mongoose.Types.ObjectId(filters.programId);
        if (filters.organizationId) query.organizationId = mongoose.Types.ObjectId(filters.organizationId);
        if (filters.standardId) query.standardId = mongoose.Types.ObjectId(filters.standardId);
        if (filters.criteriaId) query.criteriaId = mongoose.Types.ObjectId(filters.criteriaId);
        if (filters.status) query.status = filters.status;
        if (filters.documentType) query.documentType = filters.documentType;

        if (filters.dateFrom || filters.dateTo) {
            query.createdAt = {};
            if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
            if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
        }

        // Get evidences with populated fields
        const evidences = await Evidence.find(query)
            .populate('academicYearId', 'name code')
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .populate('createdBy', 'fullName email')
            .populate('files', 'originalName size')
            .sort({ createdAt: -1 });

        // Prepare data for export
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

// Export evidence statistics
const exportStatistics = async (filters) => {
    try {
        if (!filters.academicYearId) {
            throw new Error('Academic Year ID is required for export');
        }

        // Get overall statistics
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

        // Get statistics by standard
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

        // Get statistics by criteria
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

        // Prepare workbook with multiple sheets
        const workbook = XLSX.utils.book_new();

        // Overview sheet
        const overviewData = totalStats.length > 0 ? [
            ['Chỉ số', 'Giá trị'],
            ['Tổng số minh chứng', totalStats[0].totalEvidences],
            ['Minh chứng đang hoạt động', totalStats[0].activeEvidences],
            ['Minh chứng ngừng hoạt động', totalStats[0].inactiveEvidences]
        ] : [['Không có dữ liệu']];

        const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
        XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Tổng quan');

        // Standards statistics sheet
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

        // Criteria statistics sheet
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

// Export evidence template for import
const exportImportTemplate = async (programId, organizationId, academicYearId) => {
    try {
        if (!academicYearId) {
            throw new Error('Academic Year ID is required for template generation');
        }

        // Get standards and criteria for the program, organization and academic year
        const standards = await Standard.find({
            academicYearId: mongoose.Types.ObjectId(academicYearId),
            programId: mongoose.Types.ObjectId(programId),
            organizationId: mongoose.Types.ObjectId(organizationId),
            status: 'active'
        }).sort({ code: 1 });

        const criteria = await Criteria.find({
            academicYearId: mongoose.Types.ObjectId(academicYearId),
            programId: mongoose.Types.ObjectId(programId),
            organizationId: mongoose.Types.ObjectId(organizationId),
            status: 'active'
        }).populate('standardId', 'name code').sort({ 'standardId.code': 1, code: 1 });

        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Main template sheet
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

        // Set column widths
        templateSheet['!cols'] = [
            { width: 30 }, { width: 15 }, { width: 15 }, { width: 40 },
            { width: 20 }, { width: 15 }, { width: 18 }, { width: 18 },
            { width: 25 }, { width: 30 }
        ];

        XLSX.utils.book_append_sheet(workbook, templateSheet, 'Template');

        // Standards reference sheet
        const standardsData = [
            ['Mã tiêu chuẩn', 'Tên tiêu chuẩn'],
            ...standards.map(std => [std.code, std.name])
        ];

        const standardsSheet = XLSX.utils.aoa_to_sheet(standardsData);
        XLSX.utils.book_append_sheet(workbook, standardsSheet, 'Danh sách tiêu chuẩn');

        // Criteria reference sheet
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

        // Instructions sheet
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

// Helper functions
const exportToExcel = (data, sheetName = 'Data') => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-size columns
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
                // Escape commas and quotes in values
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        )
    ].join('\n');

    return Buffer.from('\ufeff' + csvContent, 'utf8'); // Add BOM for UTF-8
};

const buildMatchQuery = (filters) => {
    let query = {};

    // academicYearId is required
    if (filters.academicYearId) {
        query.academicYearId = mongoose.Types.ObjectId(filters.academicYearId);
    }

    if (filters.programId) query.programId = mongoose.Types.ObjectId(filters.programId);
    if (filters.organizationId) query.organizationId = mongoose.Types.ObjectId(filters.organizationId);
    if (filters.standardId) query.standardId = mongoose.Types.ObjectId(filters.standardId);
    if (filters.criteriaId) query.criteriaId = mongoose.Types.ObjectId(filters.criteriaId);
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
    exportImportTemplate
};