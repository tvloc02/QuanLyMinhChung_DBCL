import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    Target, CheckCircle, Clock, Star, Award, ClipboardCheck,
    Edit, Activity, BookOpen, AlertCircle, Calendar, ListTodo
} from 'lucide-react';
import { StatCard, QuickAction, LoadingSkeleton, EmptyState } from '../shared/DashboardComponents';

const ExpertDashboard = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        myAssignments: 0,
        completed: 0,
        pending: 0,
        avgScore: 0
    });
    const [urgentTasks, setUrgentTasks] = useState([]);
    const [assignmentStats, setAssignmentStats] = useState({
        completionRate: 0,
        onTimeRate: 0
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch expert stats (dashboardController.js)
            const statsResponse = await fetch('/api/dashboard/expert/stats', { headers });

            if (statsResponse.ok) {
                const result = await statsResponse.json();
                if (result.success) {
                    setStats(result.data);
                }
            }

            // Fetch urgent/upcoming tasks (assignmentController.js)
            const upcomingResponse = await fetch('/api/assignments/upcoming-deadlines?days=7', { headers });

            if (upcomingResponse.ok) {
                const result = await upcomingResponse.json();
                if (result.success) {
                    setUrgentTasks(result.data || []);
                }
            }

            // Fetch assignment statistics (assignmentController.js)
            const assignmentStatsResponse = await fetch('/api/assignments/stats', { headers });

            if (assignmentStatsResponse.ok) {
                const result = await assignmentStatsResponse.json();
                if (result.success) {
                    const totalAssignments = result.data.totalAssignments || 1;
                    const completed = result.data.completedAssignments || 0;
                    const onTime = result.data.onTimeCompletedAssignments || 0;

                    setAssignmentStats({
                        completionRate: totalAssignments > 0 ? ((completed / totalAssignments) * 100).toFixed(1) : 0,
                        onTimeRate: completed > 0 ? ((onTime / completed) * 100).toFixed(1) : 0
                    });
                }
            }

        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Không thể tải dữ liệu dashboard');
        } finally {
            setLoading(false);
        }
    };

    const getDaysRemaining = (deadline) => {
        if (!deadline) return null;
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getPriorityColor = (priority) => {
        switch(priority) {
            case 'urgent': return 'border-red-400 bg-red-50';
            case 'high': return 'border-orange-400 bg-orange-50';
            default: return 'border-yellow-400 bg-yellow-50';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl shadow-lg p-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Chào mừng bạn đến với hệ thống</h1>
                        <p className="text-indigo-100">Đánh giá và nhận xét báo cáo</p>
                    </div>
                    <Award className="w-16 h-16 opacity-20" />
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
                    title="Phân công mới/đang làm"
                    value={stats.myAssignments}
                    icon={ListTodo}
                    color="bg-blue-500"
                    loading={loading}
                />
                <StatCard
                    title="Đánh giá đã hoàn thành"
                    value={stats.completed}
                    icon={CheckCircle}
                    color="bg-green-500"
                    loading={loading}
                />
                <StatCard
                    title="Đánh giá đang nháp"
                    value={stats.pending}
                    icon={Clock}
                    color="bg-yellow-500"
                    loading={loading}
                />
                <StatCard
                    title="Điểm TB đánh giá"
                    value={stats.avgScore}
                    icon={Star}
                    color="bg-purple-500"
                    loading={loading}
                />
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Thao tác nhanh</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <QuickAction
                        title="Phân công của tôi"
                        description="Xem các nhiệm vụ được giao"
                        icon={ClipboardCheck}
                        color="bg-blue-500"
                        href="/assignments?expertId=me"
                    />
                    <QuickAction
                        title="Tạo đánh giá nháp"
                        description="Khởi tạo đánh giá cho phân công"
                        icon={Edit}
                        color="bg-green-500"
                        href="/evaluations/create"
                    />
                    <QuickAction
                        title="Lịch sử đánh giá"
                        description="Xem các đánh giá đã thực hiện"
                        icon={Activity}
                        color="bg-purple-500"
                        href="/evaluations?evaluatorId=me"
                    />
                    <QuickAction
                        title="Hướng dẫn"
                        description="Tài liệu hướng dẫn đánh giá"
                        icon={BookOpen}
                        color="bg-orange-500"
                        href="/guides"
                    />
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Urgent Tasks */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Nhiệm vụ sắp đến hạn (7 ngày)</h3>
                        <button
                            onClick={() => router.push('/assignments?status=pending')}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            Xem tất cả
                        </button>
                    </div>

                    {loading ? (
                        <LoadingSkeleton count={3} />
                    ) : urgentTasks.length > 0 ? (
                        <div className="space-y-3">
                            {urgentTasks.slice(0, 3).map((task) => {
                                const daysRemaining = getDaysRemaining(task.deadline);
                                return (
                                    <div
                                        key={task._id}
                                        className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${getPriorityColor(task.priority)}`}
                                        onClick={() => router.push(`/assignments/${task._id}`)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 mb-1 truncate">
                                                    {task.reportId?.title || 'Báo cáo không có tiêu đề'}
                                                </p>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    Mã: {task.reportId?.code}
                                                </p>
                                                <div className="flex items-center text-xs text-red-600">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {daysRemaining !== null && (
                                                        <span>
                                                            {daysRemaining > 0
                                                                ? `Còn ${daysRemaining} ngày`
                                                                : daysRemaining === 0
                                                                    ? 'Hết hạn hôm nay'
                                                                    : `Quá hạn ${Math.abs(daysRemaining)} ngày`}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 ml-3">
                                                Đánh giá
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState
                            icon={CheckCircle}
                            title="Không có nhiệm vụ khẩn cấp"
                            description="Tất cả nhiệm vụ đều trong tầm kiểm soát (7 ngày tới)"
                        />
                    )}
                </div>

                {/* Assignment Statistics */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Hiệu suất phân công</h3>

                    {loading ? (
                        <div className="space-y-4">
                            <div className="animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                                <div className="h-12 bg-gray-200 rounded"></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="h-24 bg-gray-200 rounded"></div>
                                <div className="h-24 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Tỷ lệ hoàn thành</span>
                                    <span className="text-2xl font-bold text-green-600">
                                        {assignmentStats.completionRate}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-600 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${assignmentStats.completionRate}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50 rounded-lg text-center">
                                    <p className="text-sm text-gray-600 mb-1">Hoàn thành đúng hạn</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {assignmentStats.onTimeRate}%
                                    </p>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-lg text-center">
                                    <p className="text-sm text-gray-600 mb-1">Quá hạn (trong 7 ngày)</p>
                                    <p className="text-2xl font-bold text-purple-600">
                                        {urgentTasks.filter(t => getDaysRemaining(t.deadline) < 0).length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExpertDashboard;