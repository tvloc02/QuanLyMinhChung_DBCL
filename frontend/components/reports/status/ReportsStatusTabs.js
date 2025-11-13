import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { apiMethods } from '../../../services/api';
import toast from 'react-hot-toast';
import { Search, Filter, RefreshCw } from 'lucide-react';
import ReportListTable from './ReportListTable';

export default function ReportsStatusTabs({ statusTabs, activeTab, setActiveTab, userRole, userId, typeFilter, isEvaluatorView }) {
    const router = useRouter();

    const initialFilters = {
        search: '',
        programId: '',
        organizationId: '',
        standardId: '',
        criteriaId: '',
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        status: '', // Đặt trạng thái ban đầu là rỗng
        createdBy: '' // Đặt người tạo ban đầu là rỗng
    };
    const [filters, setFilters] = useState(initialFilters);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0, limit: 10 });
    const [showFilters, setShowFilters] = useState(false);

    const [programs, setPrograms] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [standards, setStandards] = useState([]);
    const [criteria, setCriteria] = useState([]);

    const currentStatusConfig = statusTabs.find(tab => tab.id === activeTab);

    useEffect(() => {
        // Reset filters khi đổi tab chính
        setFilters(prev => ({ ...initialFilters, limit: prev.limit }));
        if (userRole) {
            // Đảm bảo chạy fetchReportData sau khi filters được cập nhật
            setTimeout(() => {
                fetchReportData(1);
            }, 0);

            if (userRole === 'manager' || userRole === 'admin') {
                fetchFilterData();
            }
        }
    }, [activeTab, userRole]);

    useEffect(() => {
        if (userRole) {
            fetchReportData(filters.page);
        }
    }, [filters.page, filters.search, filters.programId, filters.standardId, filters.criteriaId, typeFilter, filters.limit]); // Thêm filters.limit

    const fetchFilterData = async () => {
        try {
            const [programsRes, orgsRes] = await Promise.all([
                apiMethods.programs.getAll(),
                apiMethods.organizations.getAll()
            ]);
            setPrograms(programsRes.data?.data?.programs || []);
            setOrganizations(orgsRes.data?.data?.organizations || []);
        } catch (error) {
            console.error('Fetch filter data error:', error);
        }
    };

    const fetchStandards = async (programId, organizationId) => {
        if (!programId || !organizationId) return;
        try {
            const response = await apiMethods.standards.getAll({ programId, organizationId });
            setStandards(response.data?.data?.standards || response.data?.data || []);
        } catch (error) {
            setStandards([]);
        }
    };

    const fetchCriteria = async (standardId) => {
        if (!standardId) return;
        try {
            const response = await apiMethods.criteria.getAll({ standardId });
            setCriteria(response.data?.data?.criterias || response.data?.data?.criteria || []);
        } catch (error) {
            setCriteria([]);
        }
    };

    const fetchReportData = async (page = 1) => {
        const currentConfig = statusTabs.find(tab => tab.id === activeTab);
        if (!currentConfig) return;

        let statusParam = '';
        let createdByParam = '';

        // Tách status và createdBy từ statusQuery của tab
        const queries = currentConfig.statusQuery?.split('&').filter(q => q) || [];
        queries.forEach(query => {
            if (query.startsWith('status=')) {
                statusParam = query.replace('status=', '');
            } else if (query.startsWith('createdBy=me')) {
                createdByParam = userId;
            }
        });


        try {
            setLoading(true);

            const params = {
                ...filters,
                page: page,
                limit: filters.limit,
                type: typeFilter, // Áp dụng type filter
                status: statusParam,
                createdBy: createdByParam
            };

            if (isEvaluatorView) {
                params.evaluatorId = userId;
                delete params.type; // Loại bỏ type vì backend tự xử lý
            }

            // Loại bỏ các tham số rỗng (bao gồm cả các tham số reset)
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null || (Array.isArray(params[key]) && params[key].length === 0)) {
                    delete params[key];
                }
            });

            // Xử lý trường hợp "Tất cả" statusQuery='' -> không gửi status param

            const response = await apiMethods.reports.getAll(params);
            const data = response.data?.data || response.data;

            setReports(data?.reports || []);
            setPagination(data?.pagination || { current: page, pages: 1, total: 0, limit: filters.limit, hasNext: page * filters.limit < data?.total, hasPrev: page > 1 });
        } catch (error) {
            console.error("Fetch reports error:", error.response?.data?.message || error.message);
            toast.error(error.response?.data?.message || 'Không thể tải danh sách báo cáo');
            setReports([]);
            setPagination({ current: page, pages: 1, total: 0, limit: filters.limit, hasNext: false, hasPrev: false });
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (name, value) => {
        setFilters(prev => {
            const newFilters = { ...prev, [name]: value, page: 1 };
            if (name === 'programId' || name === 'organizationId') {
                if (newFilters.programId && newFilters.organizationId) {
                    fetchStandards(newFilters.programId, newFilters.organizationId);
                } else {
                    setStandards([]);
                    newFilters.standardId = '';
                    newFilters.criteriaId = '';
                    setCriteria([]);
                }
            } else if (name === 'standardId') {
                if (newFilters.standardId) {
                    fetchCriteria(newFilters.standardId);
                } else {
                    newFilters.criteriaId = '';
                    setCriteria([]);
                }
            }
            return newFilters;
        });
    };

    const handleActionSuccess = () => {
        fetchReportData(pagination.current);
    };

    const shouldHideFilters = isEvaluatorView || typeFilter === 'standard' || typeFilter === 'criteria';

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="flex overflow-x-auto border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                {statusTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-4 font-semibold transition-all text-sm whitespace-nowrap border-b-2 ${
                            activeTab === tab.id
                                ? 'text-blue-600 border-blue-500 bg-blue-50'
                                : 'text-gray-600 border-transparent hover:text-gray-900'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tiêu đề, mã báo cáo..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === 'Enter') fetchReportData(1) }}
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {!shouldHideFilters && (
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`inline-flex items-center px-4 py-3 rounded-xl transition-all font-semibold ${
                                    showFilters
                                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <Filter className="h-5 w-5 mr-2" />
                                Bộ lọc
                            </button>
                        )}
                        <button
                            onClick={() => fetchReportData(1)}
                            disabled={loading}
                            className="inline-flex items-center px-4 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all font-semibold text-gray-700"
                        >
                            <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Làm mới
                        </button>
                    </div>
                </div>

                {showFilters && !shouldHideFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Chương trình</label>
                            <select value={filters.programId} onChange={(e) => handleFilterChange('programId', e.target.value)} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Tất cả</option>
                                {programs.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Tổ chức</label>
                            <select value={filters.organizationId} onChange={(e) => handleFilterChange('organizationId', e.target.value)} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Tất cả</option>
                                {organizations.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Tiêu chuẩn</label>
                            <select value={filters.standardId} onChange={(e) => handleFilterChange('standardId', e.target.value)} disabled={!filters.programId || !filters.organizationId} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100">
                                <option value="">Tất cả</option>
                                {standards.map(s => <option key={s._id} value={s._id}>{s.code} - {s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Tiêu chí</label>
                            <select value={filters.criteriaId} onChange={(e) => handleFilterChange('criteriaId', e.target.value)} disabled={!filters.standardId} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100">
                                <option value="">Tất cả</option>
                                {criteria.map(c => <option key={c._id} value={c._id}>{c.code} - {c.name}</option>)}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            <ReportListTable
                reports={reports}
                loading={loading}
                pagination={pagination}
                handlePageChange={(page) => setFilters(prev => ({ ...prev, page }))}
                userRole={userRole}
                userId={userId}
                handleActionSuccess={handleActionSuccess}
                isEvaluatorView={isEvaluatorView}
            />
        </div>
    );
}