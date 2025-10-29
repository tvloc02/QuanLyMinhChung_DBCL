import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    Users, FileText, Calendar, Clock, Shield, Settings,
    Download, Activity, BarChart3, Database, Loader2
} from 'lucide-react';
import { StatCard, QuickAction, ActivityItem, LoadingSkeleton, EmptyState } from '../shared/DashboardComponents';

const AdminDashboard = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalEvidences: 0,
        activeYears: 0,
        pendingReports: 0
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
            const token = localStorage.getItem('token');

            // Fetch stats
            const statsResponse = await fetch('/api/dashboard/admin/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (statsResponse.ok) {
                const statsResult = await statsResponse.json();
                if (statsResult.success) {
                    setStats(statsResult.data);
                }
            }

            // Fetch recent activities
            const activitiesResponse = await fetch('/api/activity-logs?limit=10&sortOrder=desc', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (activitiesResponse.ok) {
                const activitiesResult = await activitiesResponse.json();
                if (activitiesResult.success) {
                    setActivities(activitiesResult.data.logs || []);
                }
            }

            // Fetch user statistics by role
            const userStatsResponse = await fetch('/api/users/statistics', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (userStatsResponse.ok) {
                const userStatsResult = await userStatsResponse.json();
                if (userStatsResult.success) {
                    const data = userStatsResult.data;
                    setRoleStats([
                        { role: 'Admin', count: data.adminUsers || 0, total: data.totalUsers || 1, color: 'bg-indigo-600' },
                        { role: 'Manager', count: data.managerUsers || 0, total: data.totalUsers || 1, color: 'bg-blue-600' },
                        { role: 'Expert', count: data.expertUsers || 0, total: data.totalUsers || 1, color: 'bg-green-600' },
                        { role: 'Advisor', count: data.advisorUsers || 0, total: data.totalUsers || 1, color: 'bg-purple-600' }
                    ]);
                }
            }

        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Không thể tải dữ liệu dashboard');
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
                        <h1 className="text-3xl font-bold mb-2">Chào mừng bạn đến với hệ thống</h1>
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
                        href="/users/create"
                    />
                    <QuickAction
                        title="Năm học"
                        description="Quản lý năm học và sao chép"
                        icon={Calendar}
                        color="bg-purple-500"
                        href="/academic-years/academic-years"
                    />
                    <QuickAction
                        title="Cấu hình hệ thống"
                        description="Cài đặt và bảo mật"
                        icon={Settings}
                        color="bg-gray-600"
                        href="/settings"
                    />
                    <QuickAction
                        title="Sao lưu dữ liệu"
                        description="Backup và khôi phục"
                        icon={Download}
                        color="bg-green-500"
                        href="/settings/backups"
                    />
                </div>
            </div>

            {/* Activity & Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activities */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                                    user={activity.userId?.fullName || activity.userId?.email}
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

                {/* Role Statistics */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê theo vai trò</h3>

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