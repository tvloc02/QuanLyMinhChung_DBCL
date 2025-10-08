import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    FileText, Target, BookOpen, Folder, MessageSquare,
    Plus, Upload, Search, Download, Eye, Edit
} from 'lucide-react';
import { StatCard, QuickAction, LoadingSkeleton, EmptyState } from '../shared/DashboardComponents';

const AdvisorDashboard = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        evidences: 0,
        standards: 0,
        programs: 0,
        files: 0
    });
    const [recentEvidences, setRecentEvidences] = useState([]);
    const [standardStats, setStandardStats] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Fetch advisor stats
            const statsResponse = await fetch('/api/dashboard/advisor/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (statsResponse.ok) {
                const result = await statsResponse.json();
                if (result.success) {
                    setStats(result.data);
                }
            }

            // Fetch recent evidences
            const evidencesResponse = await fetch('/api/evidences?limit=5&sortOrder=desc', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (evidencesResponse.ok) {
                const result = await evidencesResponse.json();
                if (result.success) {
                    setRecentEvidences(result.data.evidences || []);
                }
            }

            // Fetch evidence statistics by standard
            const standardStatsResponse = await fetch('/api/evidences/statistics', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (standardStatsResponse.ok) {
                const result = await standardStatsResponse.json();
                if (result.success) {
                    // Transform data for display
                    const statsData = result.data.byStandard || [];
                    setStandardStats(statsData.slice(0, 4));
                }
            }

        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Không thể tải dữ liệu dashboard');
        } finally {
            setLoading(false);
        }
    };

    const getStandardColor = (index) => {
        const colors = [
            { icon: 'bg-blue-100', text: 'text-blue-600' },
            { icon: 'bg-green-100', text: 'text-green-600' },
            { icon: 'bg-purple-100', text: 'text-purple-600' },
            { icon: 'bg-orange-100', text: 'text-orange-600' }
        ];
        return colors[index % colors.length];
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Chào mừng bạn đến với hệ thống</h1>
                        <p className="text-indigo-100">Quản lý minh chứng và hỗ trợ</p>
                    </div>
                    <MessageSquare className="w-16 h-16 opacity-20" />
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
                    title="Minh chứng quản lý"
                    value={stats.evidences}
                    icon={FileText}
                    color="bg-blue-500"
                    loading={loading}
                />
                <StatCard
                    title="Tiêu chuẩn"
                    value={stats.standards}
                    icon={Target}
                    color="bg-green-500"
                    loading={loading}
                />
                <StatCard
                    title="Chương trình"
                    value={stats.programs}
                    icon={BookOpen}
                    color="bg-purple-500"
                    loading={loading}
                />
                <StatCard
                    title="Tệp đính kèm"
                    value={stats.files}
                    icon={Folder}
                    color="bg-orange-500"
                    loading={loading}
                />
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Thao tác nhanh</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <QuickAction
                        title="Thêm minh chứng"
                        description="Tạo minh chứng mới"
                        icon={Plus}
                        color="bg-blue-500"
                        href="/evidence-management/create"
                    />
                    <QuickAction
                        title="Import Excel"
                        description="Nhập từ file Excel"
                        icon={Upload}
                        color="bg-green-500"
                        href="/import-evidence"
                    />
                    <QuickAction
                        title="Tìm kiếm"
                        description="Tìm minh chứng"
                        icon={Search}
                        color="bg-purple-500"
                        href="/evidence-management"
                    />
                    <QuickAction
                        title="Xuất dữ liệu"
                        description="Tải về Excel/PDF"
                        icon={Download}
                        color="bg-orange-500"
                        href="/export-evidence"
                    />
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Evidences */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Minh chứng gần đây</h3>
                        <button
                            onClick={() => router.push('/evidence-management')}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            Xem tất cả
                        </button>
                    </div>

                    {loading ? (
                        <LoadingSkeleton count={4} />
                    ) : recentEvidences.length > 0 ? (
                        <div className="space-y-3">
                            {recentEvidences.map((evidence) => (
                                <div
                                    key={evidence._id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                        <Folder className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {evidence.name || 'Minh chứng không có tên'}
                                            </p>
                                            <p className="text-xs text-gray-600">{evidence.code}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 ml-2">
                                        <button
                                            onClick={() => router.push(`/evidence-management/${evidence._id}`)}
                                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                        >
                                            <Eye className="w-4 h-4 text-gray-600" />
                                        </button>
                                        <button
                                            onClick={() => router.push(`/evidence-management/${evidence._id}/edit`)}
                                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                        >
                                            <Edit className="w-4 h-4 text-gray-600" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Folder}
                            title="Chưa có minh chứng"
                            description="Hãy tạo minh chứng đầu tiên"
                        />
                    )}
                </div>

                {/* Standard Statistics */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê theo tiêu chuẩn</h3>

                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between animate-pulse">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                                        <div>
                                            <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                                            <div className="h-3 bg-gray-200 rounded w-20"></div>
                                        </div>
                                    </div>
                                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                                </div>
                            ))}
                        </div>
                    ) : standardStats.length > 0 ? (
                        <div className="space-y-3">
                            {standardStats.map((stat, index) => {
                                const colors = getStandardColor(index);
                                return (
                                    <div
                                        key={stat._id || index}
                                        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                                        onClick={() => router.push(`/evidence-management?standardId=${stat._id}`)}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.icon}`}>
                                                <Target className={`w-5 h-5 ${colors.text}`} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {stat.standardName || `Tiêu chuẩn ${index + 1}`}
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    {stat.count || 0} minh chứng
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900">
                      {stat.percentage || 0}%
                    </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Target}
                            title="Chưa có dữ liệu"
                            description="Thống kê sẽ hiển thị khi có minh chứng"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdvisorDashboard;