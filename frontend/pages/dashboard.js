import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/common/Layout';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import ManagerDashboard from '../components/dashboard/ManagerDashboard';
import ExpertDashboard from '../components/dashboard/ExpertDashboard';
import TdgDashboard from '../components/dashboard/tdgDashboard';
import { dashboardService } from '../services/dashboardService'; // Import service mới
import { useInitData } from "../contexts/useInitData";

// --- Custom Hook để fetch dữ liệu dashboard ---
const useDashboardData = (user, academicYearId) => {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!user || !academicYearId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const fetches = [];

        try {
            switch (user.role) {
                case 'admin':
                    fetches.push(dashboardService.getAllAdminStats(academicYearId));
                    break;
                case 'manager':
                    fetches.push(dashboardService.getManagerStats());
                    fetches.push(dashboardService.getManagerDraftReports(5));
                    fetches.push(dashboardService.getManagerRecentAssignments(5));
                    break;
                case 'expert':
                    fetches.push(dashboardService.getExpertStats());
                    fetches.push(dashboardService.getUpcomingDeadlines(7));
                    fetches.push(dashboardService.getExpertAssignmentStats());
                    break;
                case 'tdg':
                    fetches.push(dashboardService.getAdvisorStats());
                    fetches.push(dashboardService.getRecentEvidences(5));
                    fetches.push(dashboardService.getEvidencesByStandardStats());
                    break;
                default:
                    break;
            }

            // Xử lý kết quả từ các Promise
            const results = await Promise.all(fetches.map(p => p.catch(e => {
                console.error('Fetch error:', e);
                return { success: false, error: e.message };
            })));

            const new_data = {};

            // Map dữ liệu vào object dựa trên thứ tự fetch
            switch (user.role) {
                case 'admin':
                    new_data.adminStats = results[0]?.data;
                    new_data.recentActivities = new_data.adminStats?.recentActivities; // Giả định adminStats bao gồm activities
                    break;
                case 'manager':
                    new_data.managerStats = results[0]?.data;
                    new_data.pendingReports = results[1]?.data?.reports;
                    new_data.recentAssignments = results[2]?.data?.assignments;
                    break;
                case 'expert':
                    new_data.expertStats = results[0]?.data;
                    new_data.urgentTasks = results[1]?.data;
                    new_data.assignmentStats = results[2]?.data;
                    break;
                case 'tdg':
                    new_data.advisorStats = results[0]?.data;
                    new_data.recentEvidences = results[1]?.data?.evidences;
                    new_data.standardStats = results[2]?.data;
                    break;
                default:
                    break;
            }

            setData(new_data);

        } catch (e) {
            console.error('Main Dashboard Fetch Error:', e);
            setError('Không thể tải dữ liệu dashboard: ' + e.message);
        } finally {
            setLoading(false);
        }
    }, [user, academicYearId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error };
};
// ------------------------------------------------------------------

export default function DashboardPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    // Giả định useInitData trả về academicYearId hiện tại
    const { academicYearId } = useInitData(user);

    const { data, loading, error } = useDashboardData(user, academicYearId);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
        }
    }, [user, authLoading, router]);

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="loading-spinner text-4xl">Đang tải dữ liệu...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    if (error) {
        return (
            <Layout>
                <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    <h1 className="text-xl font-bold">Lỗi tải Dashboard</h1>
                    <p>{error}</p>
                    <p>Vui lòng kiểm tra kết nối API.</p>
                </div>
            </Layout>
        );
    }

    const renderDashboard = () => {
        switch(user.role) {
            case 'admin':
                return <AdminDashboard
                    stats={data.adminStats}
                    recentActivities={data.recentActivities}
                    loading={loading}
                />;
            case 'manager':
                return <ManagerDashboard
                    stats={data.managerStats}
                    pendingReports={data.pendingReports}
                    recentAssignments={data.recentAssignments}
                    loading={loading}
                />;
            case 'expert':
                return <ExpertDashboard
                    stats={data.expertStats}
                    urgentTasks={data.urgentTasks}
                    assignmentStats={data.assignmentStats}
                    loading={loading}
                />;
            case 'tdg':
                return <TdgDashboard
                    stats={data.advisorStats}
                    recentEvidences={data.recentEvidences}
                    standardStats={data.standardStats}
                    loading={loading}
                />;
            default:
                return <div>Dashboard không được tìm thấy cho vai trò: {user.role}</div>;
        }
    };

    return (
        <Layout>
            {renderDashboard()}
        </Layout>
    );
}