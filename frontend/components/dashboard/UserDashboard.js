import React from 'react';
import {
    FileText, Calendar, Clock, BookOpen, UserCheck, Zap, ListTodo, CheckSquare
} from 'lucide-react';

const StatCard = ({ icon: Icon, title, value, unit, description, color }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
            <div className={`p-3 rounded-full ${color === 'red' ? 'bg-red-100 text-red-500' : 'bg-indigo-100 text-indigo-500'}`}>
                <Icon className="w-6 h-6" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <h4 className="text-sm font-medium text-gray-500 mt-3">{title}</h4>
        <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
);

const SectionTitle = ({ title, icon: Icon, colorClass }) => (
    <h2 className="text-2xl font-bold text-gray-900 mb-4 pt-4 flex items-center border-t border-gray-200">
        <Icon className={`w-6 h-6 mr-2 ${colorClass}`} />
        {title}
    </h2>
);

const UserDashboard = ({ stats = {}, loading, error }) => {
    const { userRoles = [], managerStats, expertStats, advisorStats } = stats.data || {};

    if (loading) {
        return <div className="p-6">Đang tải Dashboard...</div>;
    }

    if (error || userRoles.length === 0) {
        return <div className="p-6 text-center text-red-500">Không tìm thấy vai trò hoặc dữ liệu.</div>;
    }

    const currentYearName = stats.data?.currentAcademicYear?.name || 'N/A';

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-3xl font-bold text-gray-900">Trang chủ Cá nhân</h1>
            <p className="text-gray-500">
                Thống kê tổng hợp cho năm học **{currentYearName}**. Vai trò hiện tại: **{userRoles.map(r => r.toUpperCase()).join(' / ')}**
            </p>

            <div className="space-y-10">

                {userRoles.includes('manager') && managerStats && (
                    <section>
                        <SectionTitle title="Góc Quản lý Báo cáo" icon={FileText} colorClass="text-blue-600" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <StatCard
                                icon={FileText}
                                title="Báo cáo nháp của tôi"
                                value={managerStats.draftReports || 0}
                                unit="báo cáo"
                                description={`Tổng số chương trình hoạt động: ${managerStats.totalPrograms || 0}`}
                            />
                            <StatCard
                                icon={ListTodo}
                                title="Phân quyền chờ chấp nhận"
                                value={managerStats.pendingAssignments || 0}
                                unit="lượt"
                                description="Các phân quyền bạn đã giao"
                                color="red"
                            />
                        </div>
                    </section>
                )}

                {userRoles.includes('expert') && expertStats && (
                    <section>
                        <SectionTitle title="Công việc Chuyên gia Đánh giá" icon={UserCheck} colorClass="text-green-600" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <StatCard
                                icon={Clock}
                                title="Phân công đang hoạt động"
                                value={expertStats.activeAssignments || 0}
                                unit="lượt"
                                description={`Tổng phân công: ${expertStats.totalAssignments || 0}`}
                            />
                            <StatCard
                                icon={CheckSquare}
                                title="Đánh giá đã hoàn thành"
                                value={expertStats.completedEvaluations || 0}
                                unit="lượt"
                                description="Các bản đánh giá đã nộp/giám sát"
                            />
                        </div>
                    </section>
                )}

                {userRoles.includes('advisor') && advisorStats && (
                    <section>
                        <SectionTitle title="Nhiệm vụ Cố vấn" icon={Zap} colorClass="text-yellow-600" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <StatCard
                                icon={BookOpen}
                                title="Minh chứng đang xử lý"
                                value={advisorStats.evidencesInProgress || 0}
                                unit="minh chứng"
                                description="Minh chứng bạn đang được phân công"
                            />
                            <StatCard
                                icon={CheckSquare}
                                title="File chờ duyệt (Toàn hệ thống)"
                                value={advisorStats.pendingEvidenceApproval || 0}
                                unit="file"
                                description={`Số tiêu chuẩn phụ trách: ${advisorStats.standardsManaged || 0}`}
                                color="red"
                            />
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default UserDashboard;