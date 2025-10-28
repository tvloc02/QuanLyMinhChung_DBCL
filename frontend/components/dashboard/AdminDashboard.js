import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    Users, FileText, Calendar, Clock, Shield, Settings,
    Download, Activity, BarChart3, Database, Loader2, BookOpen, CheckCircle, ListTodo, ClipboardCheck
} from 'lucide-react';
import { StatCard, QuickAction, ActivityItem, LoadingSkeleton, EmptyState } from '../shared/DashboardComponents';

// Giả định cấu trúc dữ liệu trả về từ API tổng hợp /api/dashboard/admin/all-stats
// Đây là giả định để code client side hoạt động, bạn sẽ cần implement endpoint này ở backend
/*
{
    totalUsers: 150,
    totalEvidences: 520,
    activeYears: 3,
    pendingReports: 5,
    roleStats: [
        { role: 'Admin', count: 5, total: 150, color: 'bg-indigo-600' },
        ...
    ],
    recentActivities: [...],
    programStats: { total: 4, active: 3 },
    orgStats: { total: 12, active: 10 },
    standardStats: { active: 45, draft: 5 },
    criteriaStats: { total: 200, active: 180, totalTypes: [{ _id: 'A', count: 100 }, { _id: 'B', count: 100 }] },
    evidenceStats: { totalEvidences: 520, approved: 400, inProgress: 80, rejected: 10, totalFiles: 2500, totalFileSizeGB: 15.5 },
    reportStats: { totalReports: 80, published: 65, totalViews: 12000, totalDownloads: 500 },
    assignmentStats: { total: 30, pending: 5, completed: 20, overdue: 5 },
    evaluationStats: { total: 25, draft: 5, submitted: 15, supervised: 5, averageRating: 'Good' }
}
*/

const AdminDashboard = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [activities, setActivities] = useState([]);
    const [roleStats, setRoleStats] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // =============================================================
            // 1. Fetch TỔNG HỢP Stats
            // GIẢ ĐỊNH: Có một endpoint API tổng hợp tất cả dữ liệu cần thiết
            // Bạn cần implement endpoint này để gọi các Controller khác nhau
            // =============================================================
            const allStatsResponse = await fetch('/api/dashboard/admin/all-stats', { headers });

            if (allStatsResponse.ok) {
                const allStatsResult = await allStatsResponse.json();
                const data = allStatsResult.data;

                setStats(data);

                // Chuẩn bị Role Stats cho biểu đồ
                const totalUsers = data.totalUsers || 1;
                setRoleStats([
                    { role: 'Admin', count: data.roleStats.adminUsers || 0, total: totalUsers, color: 'bg-indigo-600' },
                    { role: 'Manager', count: data.roleStats.managerUsers || 0, total: totalUsers, color: 'bg-blue-600' },
                    { role: 'Expert', count: data.roleStats.expertUsers || 0, total: totalUsers, color: 'bg-green-600' },
                    { role: 'Advisor', count: data.roleStats.advisorUsers || 0, total: totalUsers, color: 'bg-purple-600' }
                ]);
            } else {
                console.error('Failed to fetch all stats');
            }


            // 2. Fetch recent activities
            // Sử dụng endpoint hiện có trong file authController (giả định)
            const activitiesResponse = await fetch('/api/activity-logs?limit=10&sortOrder=desc', { headers });

            if (activitiesResponse.ok) {
                const activitiesResult = await activitiesResponse.json();
                if (activitiesResult.success) {
                    setActivities(activitiesResult.data.logs || []);
                }
            }


        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Không thể tải dữ liệu dashboard. Vui lòng kiểm tra API tổng hợp.');
        } finally {
            setLoading(false);
        }
    };

    const formatTimeAgo = (date) => {
        if (!date) return '';
        const now = new Date();
        const createdAt = new Date(date);
        const diff = Math.floor((now - createdAt) / 1000); // seconds

        if (diff < 60) return `${diff} giây trước`;
        if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
        return `${Math.floor(diff / 86400)} ngày trước`;
    };

    // Hàm giả định để lấy dữ liệu thống kê từ state
    const getStatValue = (path, defaultValue = 0) => {
        const keys = path.split('.');
        let value = stats;
        for (const key of keys) {
            if (value && value.hasOwnProperty(key)) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }
        return value;
    };


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl shadow-lg p-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Chào mừng bạn đến với hệ thống</h1>
                        <p className="text-indigo-100">Tổng quan hệ thống và quản lý</p>
                    </div>
                    <Shield className="w-16 h-16 opacity-20" />
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-red-500 border border-red-500 text-white rounded-xl p-4">
                    <p>{error}</p>
                </div>
            )}

            {/* General System Stats Grid */}
            <h2 className="text-xl font-bold text-gray-900 pt-2 border-b pb-2 mb-4">Tổng quan Hệ thống</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Tổng người dùng"
                    value={getStatValue('totalUsers')}
                    icon={Users}
                    color="bg-blue-500"
                    loading={loading}
                />
                <StatCard
                    title="Năm học hoạt động"
                    value={getStatValue('activeYears')}
                    icon={Calendar}
                    color="bg-purple-500"
                    loading={loading}
                />
                <StatCard
                    title="Báo cáo đã xuất bản"
                    value={getStatValue('reportStats.published')}
                    icon={BookOpen}
                    color="bg-teal-500"
                    loading={loading}
                />
                <StatCard
                    title="Tổng Minh chứng"
                    value={getStatValue('evidenceStats.totalEvidences')}
                    icon={FileText}
                    color="bg-green-500"
                    loading={loading}
                />
            </div>

            {/* Evidence & Report Focus Stats */}
            <h2 className="text-xl font-bold text-gray-900 pt-4 border-b pb-2 mb-4">Trọng tâm Minh chứng & Báo cáo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Minh chứng đã duyệt"
                    value={getStatValue('evidenceStats.approved')}
                    icon={CheckCircle}
                    color="bg-green-600"
                    loading={loading}
                />
                <StatCard
                    title="Tổng dung lượng File"
                    value={`${getStatValue('evidenceStats.totalFileSizeGB', 0).toFixed(2)} GB`}
                    icon={Database}
                    color="bg-gray-600"
                    loading={loading}
                />
                <StatCard
                    title="Phân quyền đang chờ"
                    value={getStatValue('assignmentStats.pending')}
                    icon={ListTodo}
                    color="bg-orange-500"
                    loading={loading}
                />
                <StatCard
                    title="Đánh giá đã nộp"
                    value={getStatValue('evaluationStats.submitted')}
                    icon={ClipboardCheck}
                    color="bg-indigo-500"
                    loading={loading}
                />
            </div>


            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 pt-4">Thao tác nhanh</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <QuickAction
                        title="Quản lý người dùng"
                        description="Thêm, sửa, xóa người dùng"
                        icon={Users}
                        color="bg-blue-500"
                        href="/users/create"
                    />
                    <QuickAction
                        title="Tiêu chuẩn & Tiêu chí"
                        description="Cấu hình hệ thống đánh giá"
                        icon={Shield}
                        color="bg-purple-500"
                        href="/standards"
                    />
                    <QuickAction
                        title="Duyệt File Minh chứng"
                        description="Xem và duyệt các file mới"
                        icon={CheckCircle}
                        color="bg-green-500"
                        href="/evidences/file-approval"
                    />
                    <QuickAction
                        title="Sao lưu dữ liệu"
                        description="Backup và khôi phục"
                        icon={Download}
                        color="bg-gray-600"
                        href="/settings/backups"
                    />
                </div>
            </div>

            {/* Activity & Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Role Statistics - Col 1 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê theo Vai trò</h3>

                    {loading ? (
                        <LoadingSkeleton count={4} />
                    ) : (
                        <div className="space-y-4">
                            {roleStats.map((stat, index) => (
                                <div key={index}>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-600 font-medium">{stat.role}</span>
                                        <span className="font-semibold">{stat.count} người ({((stat.count / stat.total) * 100).toFixed(1)}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`${stat.color} h-2 rounded-full transition-all duration-500`}
                                            style={{ width: `${(stat.count / stat.total) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Activities - Col 2 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Hoạt động gần đây</h3>
                        <button
                            onClick={() => router.push('/activity-logs')}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            Xem tất cả
                        </button>
                    </div>

                    {loading ? (
                        <LoadingSkeleton count={5} />
                    ) : activities.length > 0 ? (
                        <div className="space-y-2">
                            {activities.map((activity) => (
                                <ActivityItem
                                    key={activity._id}
                                    action={activity.description}
                                    user={activity.userId?.fullName || activity.userId?.email || 'Hệ thống'}
                                    time={formatTimeAgo(activity.createdAt)}
                                    type={activity.action}
                                    metadata={activity}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Activity}
                            title="Chưa có hoạt động"
                            description="Các hoạt động gần đây sẽ hiển thị ở đây"
                        />
                    )}
                </div>
            </div>

            {/* Chart Placeholders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                {/* Chart 1: Evidence Status Distribution */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><BarChart3 className="w-5 h-5 mr-2 text-indigo-500"/>Phân bố Trạng thái Minh chứng</h3>
                    {loading ? (
                        <LoadingSkeleton count={3} />
                    ) : (
                        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg p-4">
                            {/* Placeholder for Pie/Donut Chart */}
                            <p className="text-gray-500 text-sm">
                                Biểu đồ tròn: Đã duyệt ({getStatValue('evidenceStats.approved')} | {(getStatValue('evidenceStats.approved') / getStatValue('evidenceStats.totalEvidences') * 100).toFixed(1)}%) vs Đang làm ({getStatValue('evidenceStats.inProgress')}) vs Từ chối ({getStatValue('evidenceStats.rejected')})
                            </p>
                        </div>
                    )}
                </div>

                {/* Chart 2: Report Views vs Downloads */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><Activity className="w-5 h-5 mr-2 text-green-500"/>Lượt xem và Tải báo cáo</h3>
                    {loading ? (
                        <LoadingSkeleton count={3} />
                    ) : (
                        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg p-4">
                            {/* Placeholder for Bar/Line Chart */}
                            <p className="text-gray-500 text-sm">
                                Biểu đồ cột/đường: Tổng lượt xem báo cáo ({getStatValue('reportStats.totalViews')}) và Tổng lượt tải xuống ({getStatValue('reportStats.totalDownloads')})
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Assignment & Evaluation Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                {/* Chart 3: Assignment Status */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><Clock className="w-5 h-5 mr-2 text-red-500"/>Trạng thái Phân quyền</h3>
                    {loading ? (
                        <LoadingSkeleton count={3} />
                    ) : (
                        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg p-4">
                            {/* Placeholder for Pie/Donut Chart */}
                            <p className="text-gray-500 text-sm">
                                Biểu đồ tròn: Hoàn thành ({getStatValue('assignmentStats.completed')}) vs Đang chờ ({getStatValue('assignmentStats.pending')}) vs Quá hạn ({getStatValue('assignmentStats.overdue')})
                            </p>
                        </div>
                    )}
                </div>
                {/* Chart 4: Standard & Criteria Count */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><Database className="w-5 h-5 mr-2 text-blue-500"/>Số lượng Tiêu chuẩn & Tiêu chí (Hoạt động)</h3>
                    {loading ? (
                        <LoadingSkeleton count={3} />
                    ) : (
                        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg p-4">
                            {/* Placeholder for Horizontal Bar Chart */}
                            <p className="text-gray-500 text-sm">
                                Biểu đồ cột ngang: Tiêu chuẩn hoạt động ({getStatValue('standardStats.active')}) và Tiêu chí hoạt động ({getStatValue('criteriaStats.active')})
                            </p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default AdminDashboard;