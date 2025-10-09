const Report = require('../models/report/Report');
const Evidence = require('../models/Evidence/Evidence');

const generateReportCode = async (type, academicYearId, standardCode = '', criteriaCode = '') => {
    try {
        return await Report.generateCode(type, academicYearId, standardCode, criteriaCode);
    } catch (error) {
        console.error('Generate report code error:', error);
        throw error;
    }
};

const createReport = async (reportData, userId) => {
    try {
        const code = await generateReportCode(
            reportData.type,
            reportData.academicYearId,
            reportData.standardCode,
            reportData.criteriaCode
        );

        const report = new Report({
            ...reportData,
            code,
            createdBy: userId,
            updatedBy: userId
        });

        await report.save();
        await report.linkEvidences();

        return report;
    } catch (error) {
        console.error('Create report error:', error);
        throw error;
    }
};

const updateReportContent = async (reportId, content, userId, changeNote = '') => {
    try {
        const report = await Report.findById(reportId);

        if (!report) {
            throw new Error('Report not found');
        }

        return await report.addVersion(content, userId, changeNote);
    } catch (error) {
        console.error('Update report content error:', error);
        throw error;
    }
};

const publishReport = async (reportId, userId) => {
    try {
        const report = await Report.findById(reportId);

        if (!report) {
            throw new Error('Report not found');
        }

        return await report.publish(userId);
    } catch (error) {
        console.error('Publish report error:', error);
        throw error;
    }
};

const getReportsByType = async (type, academicYearId, filters = {}) => {
    try {
        const query = {
            type,
            academicYearId,
            ...filters
        };

        return await Report.find(query)
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .populate('createdBy', 'fullName')
            .sort({ createdAt: -1 });
    } catch (error) {
        console.error('Get reports by type error:', error);
        throw error;
    }
};

module.exports = {
    generateReportCode,
    createReport,
    updateReportContent,
    publishReport,
    getReportsByType
};