import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    FileText, Clock, CheckCircle, Target, ClipboardCheck,
    Plus, UserCheck, BarChart3, Download, ArrowRight, Loader2
} from 'lucide-react';
import { StatCard, QuickAction, LoadingSkeleton, EmptyState } from '../shared/DashboardComponents';

const ManagerDashboard = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalReports: 0,
        pendingEvaluations: 0,
        completedReports: 0,
        myAssignments: 0
    });
    const [pendingReports, setPendingReports] = useState([]);
    const [recentAssignments, setRecentAssignments] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Fetch manager stats
            const statsResponse = await fetch('/api/dashboard/manager/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (statsResponse.ok) {
                const result = await statsResponse.json();
                if (result.success) {
                    setStats(result.data);
                }
            }

            // Fetch pending reports
            const reportsResponse = await fetch('/api/reports?status=pending&limit=5', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (reportsResponse.ok) {
                const result = await reportsResponse.json();
                if (result.success) {
                    setPendingReports(result.data.reports || []);
                }
            }

            // Fetch recent assignments
            const assignmentsResponse = await fetch('/api/assignments?limit=5&sortOrder=desc', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (assignmentsResponse.ok) {
                const result = await assignmentsResponse.json();
                if (result.success) {
                    setRecentAssignments(result.data.assignments || []);
                }
            }

        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Không thể tải dữ liệu dashboard');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800' },
            in_progress: { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-800' },
            completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
            rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-800' }
        };

        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${config.color}`}>
        {config.label}
      </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Chào mừng bạn đến với hệ thống</h1>
                        <p className="text-indigo-100">Quản lý báo cáo và phân công đánh giá</p>
                    </div>
                    <ClipboardCheck className="w-16 h-16 opacity-20" />
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
                    title="Tổng báo cáo"
                    value={stats.totalReports}
                    icon={FileText}
                    color="bg-blue-500"
                    loading={loading}
                />
                <StatCard
                    title="Chờ đánh giá"
                    value={stats.pendingEvaluations}
                    icon={Clock}
                    color="bg-yellow-500"
                    loading={loading}
                />
                <StatCard
                    title="Đã hoàn thành"
                    value={stats.completedReports}
                    icon={CheckCircle}
                    color="bg-green-500"
                    loading={loading}
                />
                <StatCard
                    title="Phân công của tôi"
                    value={stats.myAssignments}
                    icon={Target}
                    color="bg-purple-500"
                    loading={loading}
                />
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Thao tác nhanh</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <QuickAction
                        title="Tạo báo cáo"
                        description="Tạo báo cáo đánh giá mới"
                        icon={Plus}
                        color="bg-blue-500"
                        href="/reports/create"
                    />
                    <QuickAction
                        title="Phân công đánh giá"
                        description="Phân công chuyên gia"
                        icon={UserCheck}
                        color="bg-green-500"
                        href="/assignments/create"
                    />
                    <QuickAction
                        title="Theo dõi tiến độ"
                        description="Xem tiến độ đánh giá"
                        icon={BarChart3}
                        color="bg-purple-500"
                        href="/reports/progress"
                    />
                    <QuickAction
                        title="Xuất báo cáo"
                        description="Tải báo cáo tổng hợp"
                        icon={Download}
                        color="bg-orange-500"
                        href="/reports/export"
                    />
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Reports */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Báo cáo cần xử lý</h3>
                        <button
                            onClick={() => router.push('/reports?status=pending')}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            Xem tất cả
                        </button>
                    </div>

                    {loading ? (
                        <LoadingSkeleton count={4} />
                    ) : pendingReports.length > 0 ? (
                        <div className="space-y-3">
                            {pendingReports.map((report) => (
                                <div
                                    key={report._id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                    onClick={() => router.push(`/reports/${report._id}`)}
                                >
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {report.title || 'Báo cáo không có tiêu đề'}
                                            </p>
                                            <p className="text-xs text-gray-600">{report.code}</p>
                                        </div>
                                    </div>
                                    <button className="text-blue-600 hover:text-blue-700 ml-2">
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={FileText}
                            title="Không có báo cáo chờ xử lý"
                            description="Tất cả báo cáo đã được xử lý"
                        />
                    )}
                </div>

                {/* Recent Assignments */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Phân công gần đây</h3>
                        <button
                            onClick={() => router.push('/assignments')}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            Xem tất cả
                        </button>
                    </div>

                    {loading ? (
                        <LoadingSkeleton count={4} />
                    ) : recentAssignments.length > 0 ? (
                        <div className="space-y-3">
                            {recentAssignments.map((assignment) => (
                                <div
                                    key={assignment._id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">
                        {assignment.expertId?.fullName?.substring(0, 2).toUpperCase() || 'CV'}
                      </span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {assignment.expertId?.fullName || 'Chuyên gia'}
                                            </p>
                                            <p className="text-xs text-gray-600 truncate">
                                                {assignment.reportId?.title || assignment.reportId?.code}
                                            </p>
                                        </div>
                                    </div>
                                    {getStatusBadge(assignment.status)}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={UserCheck}
                            title="Chưa có phân công"
                            description="Các phân công sẽ hiển thị ở đây"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;