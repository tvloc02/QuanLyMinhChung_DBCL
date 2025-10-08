import { useState, useEffect } from 'react';
import {
    LayoutDashboard, FileText, Users, Settings, Calendar,
    CheckCircle, Clock, AlertCircle, TrendingUp, TrendingDown,
    ArrowRight, Bell, Download, Upload, Search, Plus,
    BarChart3, PieChart, Activity, Target, BookOpen,
    Building2, Folder, Eye, Edit, Zap, Award, UserCheck,
    ClipboardCheck, MessageSquare, Star, Shield
} from 'lucide-react';

// Reusable Components
const StatCard = ({ title, value, change, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                {change && (
                    <div className="flex items-center mt-2">
                        {trend === 'up' ? (
                            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                        ) : (
                            <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                        )}
                        <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {change}
            </span>
                    </div>
                )}
            </div>
            <div className={`${color} p-4 rounded-xl`}>
                <Icon className="w-8 h-8 text-white" />
            </div>
        </div>
    </div>
);

const QuickAction = ({ title, description, icon: Icon, color, onClick }) => (
    <button
        onClick={onClick}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-all w-full"
    >
        <div className={`${color} p-3 rounded-xl w-fit mb-4`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
    </button>
);

const ActivityItem = ({ action, user, time, type }) => {
    const getIcon = () => {
        switch(type) {
            case 'create': return <Plus className="w-4 h-4 text-blue-600" />;
            case 'update': return <Edit className="w-4 h-4 text-yellow-600" />;
            case 'approve': return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'reject': return <AlertCircle className="w-4 h-4 text-red-600" />;
            default: return <Activity className="w-4 h-4 text-gray-600" />;
        }
    };

    const getColor = () => {
        switch(type) {
            case 'create': return 'bg-blue-50';
            case 'update': return 'bg-yellow-50';
            case 'approve': return 'bg-green-50';
            case 'reject': return 'bg-red-50';
            default: return 'bg-gray-50';
        }
    };

    return (
        <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div className={`p-2 rounded-lg ${getColor()}`}>
                {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{action}</p>
                <p className="text-xs text-gray-600">{user}</p>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">{time}</span>
        </div>
    );
};

// Admin Dashboard
const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 156,
        totalEvidences: 1234,
        activeYears: 3,
        pendingReports: 23
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Dashboard Quản trị viên</h1>
                        <p className="text-indigo-100">Tổng quan hệ thống và quản lý</p>
                    </div>
                    <Shield className="w-16 h-16 opacity-20" />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Tổng người dùng"
                    value={stats.totalUsers}
                    change="+12%"
                    icon={Users}
                    color="bg-blue-500"
                    trend="up"
                />
                <StatCard
                    title="Tổng minh chứng"
                    value={stats.totalEvidences}
                    change="+8%"
                    icon={FileText}
                    color="bg-green-500"
                    trend="up"
                />
                <StatCard
                    title="Năm học hoạt động"
                    value={stats.activeYears}
                    icon={Calendar}
                    color="bg-purple-500"
                />
                <StatCard
                    title="Báo cáo chờ duyệt"
                    value={stats.pendingReports}
                    change="-5%"
                    icon={Clock}
                    color="bg-orange-500"
                    trend="down"
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
                        onClick={() => alert('Navigate to users')}
                    />
                    <QuickAction
                        title="Năm học"
                        description="Quản lý năm học và sao chép"
                        icon={Calendar}
                        color="bg-purple-500"
                        onClick={() => alert('Navigate to academic years')}
                    />
                    <QuickAction
                        title="Cấu hình hệ thống"
                        description="Cài đặt và bảo mật"
                        icon={Settings}
                        color="bg-gray-500"
                        onClick={() => alert('Navigate to settings')}
                    />
                    <QuickAction
                        title="Sao lưu dữ liệu"
                        description="Backup và khôi phục"
                        icon={Download}
                        color="bg-green-500"
                        onClick={() => alert('Navigate to backup')}
                    />
                </div>
            </div>

            {/* Activity & Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Hoạt động gần đây</h3>
                    <div className="space-y-2">
                        <ActivityItem action="Tạo người dùng mới" user="admin@cmc.edu.vn" time="2 phút trước" type="create" />
                        <ActivityItem action="Cập nhật năm học 2024-2025" user="admin@cmc.edu.vn" time="15 phút trước" type="update" />
                        <ActivityItem action="Phê duyệt báo cáo BC-2024-001" user="admin@cmc.edu.vn" time="1 giờ trước" type="approve" />
                        <ActivityItem action="Từ chối minh chứng MC-001" user="admin@cmc.edu.vn" time="2 giờ trước" type="reject" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê theo vai trò</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Admin</span>
                                <span className="font-semibold">5 người</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-indigo-600 h-2 rounded-full" style={{width: '10%'}}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Manager</span>
                                <span className="font-semibold">15 người</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{width: '30%'}}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Expert</span>
                                <span className="font-semibold">120 người</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-green-600 h-2 rounded-full" style={{width: '77%'}}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Advisor</span>
                                <span className="font-semibold">16 người</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-purple-600 h-2 rounded-full" style={{width: '10%'}}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Manager Dashboard
const ManagerDashboard = () => {
    const [stats, setStats] = useState({
        totalReports: 45,
        pendingEvaluations: 12,
        completedReports: 33,
        myAssignments: 8
    });

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl shadow-lg p-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Dashboard Quản lý</h1>
                        <p className="text-blue-100">Quản lý báo cáo và phân công đánh giá</p>
                    </div>
                    <ClipboardCheck className="w-16 h-16 opacity-20" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Tổng báo cáo"
                    value={stats.totalReports}
                    change="+5%"
                    icon={FileText}
                    color="bg-blue-500"
                    trend="up"
                />
                <StatCard
                    title="Chờ đánh giá"
                    value={stats.pendingEvaluations}
                    icon={Clock}
                    color="bg-yellow-500"
                />
                <StatCard
                    title="Đã hoàn thành"
                    value={stats.completedReports}
                    change="+15%"
                    icon={CheckCircle}
                    color="bg-green-500"
                    trend="up"
                />
                <StatCard
                    title="Phân công của tôi"
                    value={stats.myAssignments}
                    icon={Target}
                    color="bg-purple-500"
                />
            </div>

            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Thao tác nhanh</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <QuickAction
                        title="Tạo báo cáo"
                        description="Tạo báo cáo đánh giá mới"
                        icon={Plus}
                        color="bg-blue-500"
                    />
                    <QuickAction
                        title="Phân công đánh giá"
                        description="Phân công chuyên gia"
                        icon={UserCheck}
                        color="bg-green-500"
                    />
                    <QuickAction
                        title="Theo dõi tiến độ"
                        description="Xem tiến độ đánh giá"
                        icon={BarChart3}
                        color="bg-purple-500"
                    />
                    <QuickAction
                        title="Xuất báo cáo"
                        description="Tải báo cáo tổng hợp"
                        icon={Download}
                        color="bg-orange-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Báo cáo cần xử lý</h3>
                    <div className="space-y-3">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Báo cáo tiêu chuẩn {i}</p>
                                        <p className="text-xs text-gray-600">BC-2024-00{i}</p>
                                    </div>
                                </div>
                                <button className="text-blue-600 hover:text-blue-700">
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân công gần đây</h3>
                    <div className="space-y-3">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">CV{i}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Chuyên gia {i}</p>
                                        <p className="text-xs text-gray-600">Tiêu chuẩn {i}</p>
                                    </div>
                                </div>
                                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">Đang xử lý</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Expert Dashboard
const ExpertDashboard = () => {
    const [stats, setStats] = useState({
        myAssignments: 5,
        completed: 12,
        pending: 5,
        avgScore: 8.5
    });

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-lg p-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Dashboard Chuyên gia</h1>
                        <p className="text-green-100">Đánh giá và nhận xét báo cáo</p>
                    </div>
                    <Award className="w-16 h-16 opacity-20" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Phân công hiện tại"
                    value={stats.myAssignments}
                    icon={Target}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Đã hoàn thành"
                    value={stats.completed}
                    change="+3"
                    icon={CheckCircle}
                    color="bg-green-500"
                    trend="up"
                />
                <StatCard
                    title="Đang xử lý"
                    value={stats.pending}
                    icon={Clock}
                    color="bg-yellow-500"
                />
                <StatCard
                    title="Điểm TB đánh giá"
                    value={stats.avgScore}
                    icon={Star}
                    color="bg-purple-500"
                />
            </div>

            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Thao tác nhanh</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <QuickAction
                        title="Phân công của tôi"
                        description="Xem các nhiệm vụ được giao"
                        icon={ClipboardCheck}
                        color="bg-blue-500"
                    />
                    <QuickAction
                        title="Bắt đầu đánh giá"
                        description="Đánh giá báo cáo mới"
                        icon={Edit}
                        color="bg-green-500"
                    />
                    <QuickAction
                        title="Lịch sử đánh giá"
                        description="Xem các đánh giá đã thực hiện"
                        icon={Activity}
                        color="bg-purple-500"
                    />
                    <QuickAction
                        title="Hướng dẫn"
                        description="Tài liệu hướng dẫn đánh giá"
                        icon={BookOpen}
                        color="bg-orange-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Nhiệm vụ ưu tiên cao</h3>
                        <span className="text-sm px-3 py-1 bg-red-100 text-red-800 rounded-full font-medium">
              Khẩn cấp
            </span>
                    </div>
                    <div className="space-y-3">
                        {[1,2,3].map(i => (
                            <div key={i} className="border border-red-200 bg-red-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 mb-1">Báo cáo tiêu chuẩn {i}</p>
                                        <p className="text-sm text-gray-600 mb-2">Mã: BC-2024-00{i}</p>
                                        <div className="flex items-center text-xs text-red-600">
                                            <Clock className="w-3 h-3 mr-1" />
                                            Hạn: {2+i} ngày
                                        </div>
                                    </div>
                                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                                        Đánh giá
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê đánh giá</h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Tỷ lệ hoàn thành</span>
                                <span className="text-2xl font-bold text-green-600">85%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-green-600 h-2 rounded-full" style={{width: '85%'}}></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg text-center">
                                <p className="text-sm text-gray-600 mb-1">Đúng hạn</p>
                                <p className="text-2xl font-bold text-blue-600">95%</p>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-lg text-center">
                                <p className="text-sm text-gray-600 mb-1">Điểm TB</p>
                                <p className="text-2xl font-bold text-purple-600">8.5</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Advisor Dashboard
const AdvisorDashboard = () => {
    const [stats, setStats] = useState({
        evidences: 89,
        standards: 12,
        programs: 3,
        files: 234
    });

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-lg p-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Dashboard Tư vấn</h1>
                        <p className="text-purple-100">Quản lý minh chứng và hỗ trợ</p>
                    </div>
                    <MessageSquare className="w-16 h-16 opacity-20" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Minh chứng quản lý"
                    value={stats.evidences}
                    change="+7%"
                    icon={FileText}
                    color="bg-blue-500"
                    trend="up"
                />
                <StatCard
                    title="Tiêu chuẩn"
                    value={stats.standards}
                    icon={Target}
                    color="bg-green-500"
                />
                <StatCard
                    title="Chương trình"
                    value={stats.programs}
                    icon={BookOpen}
                    color="bg-purple-500"
                />
                <StatCard
                    title="Tệp đính kèm"
                    value={stats.files}
                    change="+12%"
                    icon={Folder}
                    color="bg-orange-500"
                    trend="up"
                />
            </div>

            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Thao tác nhanh</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <QuickAction
                        title="Thêm minh chứng"
                        description="Tạo minh chứng mới"
                        icon={Plus}
                        color="bg-blue-500"
                    />
                    <QuickAction
                        title="Import Excel"
                        description="Nhập từ file Excel"
                        icon={Upload}
                        color="bg-green-500"
                    />
                    <QuickAction
                        title="Tìm kiếm"
                        description="Tìm minh chứng"
                        icon={Search}
                        color="bg-purple-500"
                    />
                    <QuickAction
                        title="Xuất dữ liệu"
                        description="Tải về Excel/PDF"
                        icon={Download}
                        color="bg-orange-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Minh chứng gần đây</h3>
                    <div className="space-y-3">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <Folder className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Minh chứng TC{i}-001</p>
                                        <p className="text-xs text-gray-600">Tiêu chuẩn {i}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button className="p-2 hover:bg-gray-200 rounded-lg">
                                        <Eye className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <button className="p-2 hover:bg-gray-200 rounded-lg">
                                        <Edit className="w-4 h-4 text-gray-600" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê theo tiêu chuẩn</h3>
                    <div className="space-y-3">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                        i % 4 === 0 ? 'bg-blue-100' :
                                            i % 4 === 1 ? 'bg-green-100' :
                                                i % 4 === 2 ? 'bg-purple-100' : 'bg-orange-100'
                                    }`}>
                                        <Target className={`w-5 h-5 ${
                                            i % 4 === 0 ? 'text-blue-600' :
                                                i % 4 === 1 ? 'text-green-600' :
                                                    i % 4 === 2 ? 'text-purple-600' : 'text-orange-600'
                                        }`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Tiêu chuẩn {i}</p>
                                        <p className="text-xs text-gray-600">{15 + i * 5} minh chứng</p>
                                    </div>
                                </div>
                                <span className="text-sm font-semibold text-gray-900">{80 + i}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main App Component
export default function App() {
    const [currentRole, setCurrentRole] = useState('admin');

    const roles = [
        { id: 'admin', name: 'Admin', icon: Shield },
        { id: 'manager', name: 'Manager', icon: ClipboardCheck },
        { id: 'expert', name: 'Expert', icon: Award },
        { id: 'advisor', name: 'Advisor', icon: MessageSquare }
    ];

    const renderDashboard = () => {
        switch(currentRole) {
            case 'admin': return <AdminDashboard />;
            case 'manager': return <ManagerDashboard />;
            case 'expert': return <ExpertDashboard />;
            case 'advisor': return <AdvisorDashboard />;
            default: return <AdminDashboard />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Role Selector */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Chọn vai trò để xem Dashboard</h2>
                        <div className="flex space-x-2">
                            {roles.map(role => {
                                const Icon = role.icon;
                                return (
                                    <button
                                        key={role.id}
                                        onClick={() => setCurrentRole(role.id)}
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                            currentRole === role.id
                                                ? 'bg-indigo-600 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{role.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {renderDashboard()}
            </div>
        </div>
    );
}