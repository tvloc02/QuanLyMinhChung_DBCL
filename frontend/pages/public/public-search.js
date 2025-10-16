import { useState, useEffect } from 'react';
import Head from 'next/head';

// Cấu hình URL API. Sử dụng biến môi trường khi deploy.
const API_BASE_URL = '/api/public';

/**
 * Component hiển thị Trang Tra Cứu Công Khai
 */
const PublicSearchPage = () => {
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYearId, setSelectedYearId] = useState('');
    const [keyword, setKeyword] = useState('');
    const [criteriaCode, setCriteriaCode] = useState('');
    const [evidences, setEvidences] = useState([]);
    const [summary, setSummary] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // 1. Tải danh sách năm học khi component mount
    useEffect(() => {
        const loadAcademicYears = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/academic-years`);
                const result = await response.json();

                if (result.success && result.data) {
                    setAcademicYears(result.data);
                    // Tự động chọn năm học hiện tại nếu có
                    const currentYear = result.data.find(y => y.isCurrent);
                    if (currentYear) {
                        setSelectedYearId(currentYear._id);
                    }
                }
            } catch (err) {
                console.error('Lỗi tải năm học:', err);
            }
        };
        loadAcademicYears();
    }, []);

    // 2. Thực hiện Tra Cứu
    const performSearch = async (e) => {
        e.preventDefault();
        setEvidences([]);
        setSummary('');
        setError('');

        if (!selectedYearId && !keyword && !criteriaCode) {
            setError('Vui lòng chọn năm học hoặc nhập từ khóa/mã tiêu chí để tra cứu.');
            return;
        }

        setLoading(true);

        try {
            const queryParams = new URLSearchParams();
            if (selectedYearId) queryParams.append('academicYearId', selectedYearId);
            if (keyword) queryParams.append('keyword', keyword);
            if (criteriaCode) queryParams.append('criteriaCode', criteriaCode);

            const response = await fetch(`${API_BASE_URL}/evidences/search?${queryParams.toString()}`);
            const result = await response.json();

            if (!result.success) {
                setError(`Lỗi: ${result.message}`);
                return;
            }

            const foundEvidences = result.data.evidences || [];
            const total = result.data.total || 0;

            setEvidences(foundEvidences);
            setSummary(
                `Tìm thấy ${total} minh chứng được phê duyệt trong Năm học ${result.data.academicYear.code}.`
            );

        } catch (err) {
            console.error('Lỗi khi tra cứu:', err);
            setError('Lỗi hệ thống khi tra cứu minh chứng.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Tra Cứu Minh Chứng Công Khai</title>
            </Head>
            <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
                <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-lg">

                    <h1 className="text-3xl font-bold text-primary-blue border-b-2 border-primary-blue pb-3 mb-6">
                        Tra Cứu Minh Chứng Công Khai 🌐
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Chọn năm học và nhập các điều kiện tra cứu để tìm kiếm các minh chứng đã được phê duyệt công khai.
                    </p>

                    {/* Form Tra cứu */}
                    <form onSubmit={performSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-300 rounded-lg bg-gray-100 mb-6">
                        <select
                            id="academicYearId"
                            value={selectedYearId}
                            onChange={(e) => setSelectedYearId(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-blue focus:border-primary-blue md:col-span-1"
                        >
                            <option value="">-- Chọn Năm Học (Mặc định: Hiện tại) --</option>
                            {academicYears.map(year => (
                                <option key={year._id} value={year._id}>
                                    {`${year.name} (${year.code}) ${year.isCurrent ? ' (Hiện tại)' : ''}`}
                                </option>
                            ))}
                        </select>

                        <input
                            type="text"
                            id="keyword"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Từ khóa (Tên/Mã Minh chứng)"
                            className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-blue focus:border-primary-blue md:col-span-1"
                        />

                        <input
                            type="text"
                            id="criteriaCode"
                            value={criteriaCode}
                            onChange={(e) => setCriteriaCode(e.target.value)}
                            placeholder="Mã Tiêu chí (VD: 01)"
                            className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-blue focus:border-primary-blue md:col-span-1"
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className={`p-2 rounded-md font-semibold text-white transition duration-200 ${
                                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-secondary-green hover:bg-green-600'
                            }`}
                        >
                            {loading ? 'Đang Tra Cứu...' : 'Tra Cứu'}
                        </button>
                    </form>

                    {/* Hiển thị Thông báo */}
                    {error && <div className="text-red-500 font-bold mb-4">{error}</div>}
                    {summary && <div className="text-lg font-semibold text-dark-text mb-4">{summary}</div>}

                    {/* Danh sách Kết quả */}
                    <div className="space-y-4">
                        {evidences.length > 0 ? (
                            evidences.map((e) => (
                                <div key={e._id} className="bg-gray-50 p-4 border-l-4 border-primary-blue rounded-lg shadow-sm">
                                    <h3 className="text-xl font-bold text-blue-800 mb-1">
                                        {e.code} - {e.name}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Phân loại:
                                        <span className="font-medium text-dark-text ml-1">
                      Tiêu chuẩn {e.standardId?.code} / Tiêu chí {e.criteriaId?.code}
                    </span>
                                    </p>
                                    <p className="mt-2 text-gray-700 text-sm">
                                        Mô tả: {e.description || 'Không có mô tả chi tiết'}
                                    </p>
                                    <p className="text-xs mt-1 text-gray-500">
                                        Tổ chức ban hành: {e.issuingAgency || 'Không rõ'} |
                                        Loại tài liệu: {e.documentType || 'N/A'} |
                                        Ngày ban hành: {e.issueDate ? new Date(e.issueDate).toLocaleDateString('vi-VN') : 'N/A'}
                                    </p>
                                    <div className="mt-3">
                                        {/* Để bật tính năng tải, bạn cần API để lấy fileId của minh chứng đã duyệt */}
                                        <button
                                            disabled
                                            className="text-sm font-semibold text-primary-blue/50 cursor-not-allowed"
                                            title="Chức năng tải file cần ID File chi tiết (không công khai theo mặc định)"
                                        >
                                            🔗 Yêu cầu tải file (Disabled)
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            !loading && summary && evidences.length === 0 && (
                                <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
                                    Không tìm thấy minh chứng nào được phê duyệt phù hợp.
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default PublicSearchPage;