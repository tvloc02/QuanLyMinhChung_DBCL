const Evidence = require('../../models/Evidence/Evidence');
const AcademicYear = require('../../models/system/AcademicYear');
const mongoose = require('mongoose');

// Hàm tra cứu minh chứng công khai
const searchPublicEvidences = async (req, res) => {
    try {
        const {
            keyword,
            academicYearId, // Cho phép tra cứu theo năm học cụ thể
            code,
            standardCode,
            criteriaCode
        } = req.query;

        // 1. Xác định năm học để tra cứu
        let targetAcademicYearId = academicYearId;
        if (!targetAcademicYearId) {
            // Nếu không có năm học nào được chỉ định, lấy năm học hiện tại
            const currentYear = await AcademicYear.getCurrentYear();
            if (currentYear) {
                targetAcademicYearId = currentYear._id;
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy năm học hiện tại để tra cứu'
                });
            }
        } else if (!mongoose.Types.ObjectId.isValid(targetAcademicYearId)) {
            return res.status(400).json({
                success: false,
                message: 'ID năm học không hợp lệ'
            });
        }

        // 2. Xây dựng query
        let query = {
            academicYearId: targetAcademicYearId,
            status: 'approved' // Chỉ hiển thị các minh chứng đã được duyệt công khai
        };

        if (keyword) {
            query.$or = [
                { name: { $regex: keyword, $options: 'i' } },
                { code: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
            ];
        }

        if (code) {
            query.code = code;
        }

        // Tìm kiếm theo code của Tiêu chuẩn/Tiêu chí (cần tìm ID trước)
        // **LƯU Ý:** Để làm việc này hiệu quả, model Evidence cần có trường standardCode/criteriaCode,
        // hoặc ta phải thực hiện tìm kiếm ID của Standard/Criteria trước.
        // Giả sử có Standard và Criteria models để tra cứu ID.
        let criteriaIds = [];
        let standardIds = [];

        if (standardCode || criteriaCode) {
            const Standard = mongoose.model('Standard'); // Lấy model Standard
            const Criteria = mongoose.model('Criteria'); // Lấy model Criteria

            if (criteriaCode) {
                const criteria = await Criteria.findOne({ academicYearId: targetAcademicYearId, code: criteriaCode.toString().padStart(2, '0') });
                if (criteria) {
                    criteriaIds.push(criteria._id);
                }
            } else if (standardCode) {
                const standards = await Standard.find({ academicYearId: targetAcademicYearId, code: standardCode.toString().padStart(2, '0') });
                if (standards.length > 0) {
                    standardIds.push(...standards.map(s => s._id));
                }
            }

            if (criteriaIds.length > 0) {
                query.criteriaId = { $in: criteriaIds };
            } else if (standardIds.length > 0) {
                query.standardId = { $in: standardIds };
            } else if (standardCode || criteriaCode) {
                // Không tìm thấy tiêu chuẩn/tiêu chí -> trả về kết quả rỗng
                return res.json({
                    success: true,
                    data: {
                        academicYear: (await AcademicYear.findById(targetAcademicYearId))?.toObject(),
                        evidences: [],
                        total: 0
                    }
                });
            }
        }

        // 3. Thực hiện tra cứu
        const evidences = await Evidence.find(query)
            .populate('academicYearId', 'name code')
            .populate('standardId', 'code name')
            .populate('criteriaId', 'code name')
            .select('name code description documentType issueDate issuingAgency status downloadCount')
            .sort({ code: 1 })
            .lean();

        // 4. Lấy thông tin năm học cho response
        const academicYearInfo = (await AcademicYear.findById(targetAcademicYearId))?.toObject();

        res.json({
            success: true,
            data: {
                academicYear: academicYearInfo,
                evidences,
                total: evidences.length
            }
        });

    } catch (error) {
        console.error('Public search error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tra cứu minh chứng công khai'
        });
    }
};

// Hàm lấy danh sách năm học công khai (chỉ active/completed)
const getPublicAcademicYears = async (req, res) => {
    try {
        const academicYears = await AcademicYear.find({
            status: { $in: ['active', 'completed'] }
        })
            .select('name code startYear endYear isCurrent')
            .sort({ startYear: -1 });

        res.json({
            success: true,
            data: academicYears
        });

    } catch (error) {
        console.error('Get public academic years error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách năm học'
        });
    }
};

// Hàm tải file công khai
const downloadPublicFile = async (req, res) => {
    try {
        const { id } = req.params;

        const file = await File.findById(id).populate('evidenceId');
        if (!file || file.type !== 'file') {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy file'
            });
        }

        // **QUAN TRỌNG**: Chỉ cho phép tải file của minh chứng ĐÃ DUYỆT (approved)
        if (!file.evidenceId || file.evidenceId.status !== 'approved') {
            return res.status(403).json({
                success: false,
                message: 'File này không thuộc minh chứng đã được duyệt công khai'
            });
        }

        // Sử dụng logic download từ fileController.js
        const fs = require('fs'); // Giả định fs được require

        if (!fs.existsSync(file.filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File không tồn tại trên hệ thống'
            });
        }

        await file.incrementDownloadCount(); // Giả định method này tồn tại trên File model

        const decodedFileName = file.originalName;
        res.download(file.filePath, decodedFileName);

    } catch (error) {
        console.error('Download public file error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tải file'
        });
    }
};


module.exports = {
    searchPublicEvidences,
    getPublicAcademicYears,
    downloadPublicFile
};