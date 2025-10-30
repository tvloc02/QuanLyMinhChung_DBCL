import { BookOpen, Building2, Award, Target, FileText, Folder } from 'lucide-react'

export default function EvidenceTreeStatistics({
                                                   statistics,
                                                   selectedProgram,
                                                   selectedOrganization,
                                                   programs,
                                                   organizations,
                                                   onProgramChange,
                                                   onOrgChange,
                                                   // Thêm các props mới cho bộ lọc Tiêu chuẩn/Tiêu chí
                                                   standards = [],
                                                   criteria = [],
                                                   selectedStandard = '',
                                                   selectedCriteria = '',
                                                   onStandardChange = () => {},
                                                   onCriteriaChange = () => {}
                                               }) {
    const StatBox = ({ icon: Icon, label, value, color }) => (
        <div className="flex flex-col items-center p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-100 hover:border-gray-300 transition-all">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-600 text-center mt-1">{label}</div>
        </div>
    )

    return (
        <div className="space-y-4">
            {/* Selectors - ĐÃ THÊM Ô TIÊU CHUẨN VÀ TIÊU CHÍ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <BookOpen className="h-4 w-4 inline mr-1" />
                        Chương trình <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={selectedProgram}
                        onChange={(e) => onProgramChange(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Chọn chương trình</option>
                        {programs.map(p => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Building2 className="h-4 w-4 inline mr-1" />
                        Tổ chức <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={selectedOrganization}
                        onChange={(e) => onOrgChange(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Chọn tổ chức</option>
                        {organizations.map(o => (
                            <option key={o._id} value={o._id}>{o.name}</option>
                        ))}
                    </select>
                </div>

                {/* ⭐️ Ô Tiêu chuẩn mới */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Award className="h-4 w-4 inline mr-1" />
                        Tiêu chuẩn
                    </label>
                    <select
                        value={selectedStandard}
                        onChange={(e) => onStandardChange(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={!selectedProgram}
                    >
                        <option value="">Tất cả tiêu chuẩn</option>
                        {/* ⚠️ Cần truyền standards data vào đây */}
                        {standards.map(s => (
                            <option key={s._id || s.id} value={s._id || s.id}>{s.code} - {s.name}</option>
                        ))}
                    </select>
                </div>

                {/* ⭐️ Ô Tiêu chí mới */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Target className="h-4 w-4 inline mr-1" />
                        Tiêu chí
                    </label>
                    <select
                        value={selectedCriteria}
                        onChange={(e) => onCriteriaChange(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        disabled={!selectedStandard}
                    >
                        <option value="">Tất cả tiêu chí</option>
                        {/* ⚠️ Cần truyền criteria data vào đây */}
                        {criteria.map(c => (
                            <option key={c._id || c.id} value={c._id || c.id}>{c.code} - {c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Statistics Boxes - Điều chỉnh lại để chỉ bao gồm Tiêu chuẩn, Tiêu chí, Minh chứng và File */}
            {statistics ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">

                    <StatBox
                        icon={Award}
                        label="Tổng Tiêu chuẩn"
                        value={statistics.totalStandards || 0}
                        color="bg-gradient-to-br from-purple-500 to-purple-600"
                    />
                    <StatBox
                        icon={Target}
                        label="Tổng Tiêu chí"
                        value={statistics.totalCriteria || 0}
                        color="bg-gradient-to-br from-indigo-500 to-indigo-600"
                    />
                    <StatBox
                        icon={FileText}
                        label="Tổng Minh chứng"
                        value={statistics.totalEvidences || 0}
                        color="bg-gradient-to-br from-orange-500 to-orange-600"
                    />
                    <StatBox
                        icon={Folder} // Dùng Folder thay cho icon FileText để dễ phân biệt
                        label="Tổng Files"
                        value={statistics.totalFiles || 0} // Giả định có biến totalFiles
                        color="bg-gradient-to-br from-emerald-500 to-emerald-600"
                    />
                </div>
            ) : (
                <div className="p-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <p className="text-gray-500">Vui lòng chọn Chương trình và Tổ chức để xem thống kê</p>
                </div>
            )}
        </div>
    )
}