const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function testCreateAssignment() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Kết nối MongoDB thành công\n');

        const Assignment = require('../models/report/Assignment');
        const Report = require('../models/report/Report');
        const User = require('../models/User/User');
        const AcademicYear = require('../models/system/AcademicYear');

        // Lấy academic year hiện tại
        const academicYear = await AcademicYear.findOne({ status: 'active' });
        if (!academicYear) {
            console.error('✗ Không tìm thấy năm học active');
            return;
        }
        console.log(`✓ Năm học: ${academicYear.name} (${academicYear._id})`);

        // Lấy một report (bất kỳ status nào)
        let report = await Report.findOne({ academicYearId: academicYear._id });
        if (!report) {
            console.error('✗ Không tìm thấy report');
            console.log('Đang tạo report test...');
            
            // Tạo report test
            report = new Report({
                academicYearId: academicYear._id,
                title: 'Test Report for Assignment',
                code: 'TEST-' + Date.now(),
                type: 'standard',
                status: 'published',
                content: 'Test content'
            });
            await report.save();
            console.log(`✓ Đã tạo report test: ${report._id}`);
        } else {
            console.log(`✓ Report: ${report.title} (${report._id})`);
        }

        // Lấy một evaluator
        const evaluator = await User.findOne({ role: 'evaluator', status: 'active' });
        if (!evaluator) {
            console.error('✗ Không tìm thấy evaluator');
            return;
        }
        console.log(`✓ Evaluator: ${evaluator.fullName} (${evaluator._id})`);

        // Lấy một admin/manager
        const admin = await User.findOne({ role: { $in: ['admin', 'manager'] }, status: 'active' });
        if (!admin) {
            console.error('✗ Không tìm thấy admin/manager');
            return;
        }
        console.log(`✓ Admin: ${admin.fullName} (${admin._id})\n`);

        // Tạo assignment data
        const assignmentData = {
            academicYearId: academicYear._id,
            reportId: report._id,
            evaluatorId: evaluator._id,
            assignedBy: admin._id,
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày sau
            priority: 'normal',
            status: 'accepted',
            respondedAt: new Date()
        };

        console.log('=== ĐANG TẠO ASSIGNMENT ===');
        console.log('Data:', JSON.stringify(assignmentData, null, 2));

        const assignment = new Assignment(assignmentData);
        await assignment.save();

        console.log('\n✓ TẠO ASSIGNMENT THÀNH CÔNG!');
        console.log('Assignment ID:', assignment._id);

        // Xóa assignment test
        await Assignment.findByIdAndDelete(assignment._id);
        console.log('✓ Đã xóa assignment test');

    } catch (error) {
        console.error('\n✗ LỖI KHI TẠO ASSIGNMENT:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        if (error.errInfo) {
            console.error('Error info:', JSON.stringify(error.errInfo, null, 2));
        }
        console.error('\nFull error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Đã đóng kết nối MongoDB');
    }
}

testCreateAssignment();
