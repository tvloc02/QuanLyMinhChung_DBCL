import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    Users, FileText, Calendar, Clock, Shield, Settings,
    Download, Activity, BarChart3, Database, Loader2
} from 'lucide-react';
import { StatCard, QuickAction, ActivityItem, LoadingSkeleton, EmptyState } from '../shared/DashboardComponents';
import { apiMethods } from '../../services/api';

const AdminDashboard = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalEvidences: 0,
        activeYears: 0,
        pendingReports: 0,
        totalPrograms: 0,
        totalLogs: 0
    });
    const [activities, setActivities] = useState([]);
    const [roleStats, setRoleStats] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Admin Stats (API: /api/dashboard/admin/stats)
            const statsResult = await apiMethods.dashboard.getAdminStats();
            const data = statsResult.data.data;
            setStats(prev => ({
                ...prev,
                totalUsers: data.totalUsers || 0,
                totalEvidences: data.totalEvidences || 0,
                activeYears: data.activeYears || 0,
                pendingReports: data.pendingReports || 0,
                totalPrograms: data.totalPrograms || 0,
                totalLogs: data.totalLogs || 0
            }));


            // 2. Fetch User Statistics by Role (API: /api/users/statistics)
            const userStatsResult = await apiMethods.users.getStatistics();
            const userStatsData = userStatsResult.data.data;

            // FIX: Role 'expert' và 'evaluator' có thể bị nhầm lẫn trong logic cũ, sử dụng các trường cụ thể
            const totalUsers = userStatsData.totalUsers || 1;
            setRoleStats([
                { role: 'Admin', count: userStatsData.adminUsers || 0, total: totalUsers, color: 'bg-indigo-600' },
                { role: 'Manager', count: userStatsData.managerUsers || 0, total: totalUsers, color: 'bg-blue-600' },
                { role: 'Reporter', count: userStatsData.reporterUsers || 0, total: totalUsers, color: 'bg-green-600' },
                { role: 'Evaluator', count: userStatsData.evaluatorUsers || 0, total: totalUsers, color: 'bg-purple-600' }
            ]);

            // 3. Fetch Recent Activities (API: /api/activity-logs)
            const activitiesResult = await apiMethods.activityLogs.getAll({ limit: 10, sortOrder: 'desc' });
            setActivities(activitiesResult.data.data.logs || []);

        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError(err.response?.data?.message || 'Không thể tải dữ liệu dashboard');
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl shadow-lg p-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Chào mừng, Admin!</h1>
                        <p className="text-indigo-100">Tổng quan hệ thống và quản lý</p>
                    </div>
                    <Shield className="w-16 h-16 opacity-20" />
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Tổng người dùng"
                    value={stats.totalUsers}
                    icon={Users}
                    color="bg-blue-500"
                    loading={loading}
                />
                <StatCard
                    title="Tổng minh chứng"
                    value={stats.totalEvidences}
                    icon={FileText}
                    color="bg-green-500"
                    loading={loading}
                />
                <StatCard
                    title="Năm học hoạt động"
                    value={stats.activeYears}
                    icon={Calendar}
                    color="bg-purple-500"
                    loading={loading}
                />
                <StatCard
                    title="Báo cáo chờ duyệt"
                    value={stats.pendingReports}
                    icon={Clock}
                    color="bg-orange-500"
                    loading={loading}
                />
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Thao tác nhanh</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <QuickAction
                        title="Quản lý người dùng"
                        description="Thêm, sửa, xóa người dùng"
                        icon={Users}
                        color="bg-blue-500"
                        href="/admin/users"
                    />
                    <QuickAction
                        title="Tạo năm học mới"
                        description="Khởi tạo năm học và sao chép dữ liệu"
                        icon={Calendar}
                        color="bg-purple-500"
                        href="/admin/academic-years"
                    />
                    <QuickAction
                        title="Sao lưu hệ thống"
                        description="Thực hiện sao lưu cơ sở dữ liệu"
                        icon={Database}
                        color="bg-green-500"
                        onClick={() => apiMethods.system.backup().then(() => toast.success('Yêu cầu sao lưu đã được gửi!'))}
                    />
                    <QuickAction
                        title="Audit Log"
                        description="Xem toàn bộ nhật ký hoạt động"
                        icon={Activity}
                        color="bg-gray-600"
                        href="/admin/activity-logs"
                    />
                </div>
            </div>

            {/* Activity & Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activities */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Nhật ký hoạt động (Tổng: {stats.totalLogs})</h3>
                        <button
                            onClick={() => router.push('/admin/activity-logs')}
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
                                    severity={activity.severity}
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

                {/* Role Statistics */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê người dùng theo vai trò</h3>

                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="animate-pulse">
                                    <div className="flex justify-between text-sm mb-2">
                                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {roleStats.map((stat, index) => (
                                <div key={index}>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-600">{stat.role}</span>
                                        <span className="font-semibold">{stat.count} người</span>
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
            </div>
        </div>
    );
};

export default AdminDashboard;