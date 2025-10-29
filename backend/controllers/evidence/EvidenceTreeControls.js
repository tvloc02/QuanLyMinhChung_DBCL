import { Download, RefreshCw, Upload, BookOpen, Building2, Maximize2, Minimize2 } from 'lucide-react'

export default function EvidenceTreeControls({
                                                 programs,
                                                 organizations,
                                                 selectedProgram,
                                                 selectedOrganization,
                                                 onProgramChange,
                                                 onOrganizationChange,
                                                 onExpandAll,
                                                 onCollapseAll,
                                                 onImport,
                                                 loading
                                             }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <BookOpen className="inline h-4 w-4 mr-2" />
                        Chương trình đánh giá
                    </label>
                    <select
                        value={selectedProgram}
                        onChange={(e) => onProgramChange(e.target.value)}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 text-sm"
                    >
                        <option value="">Chọn chương trình...</option>
                        {programs.map(program => (
                            <option key={program._id} value={program._id}>
                                {program.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Building2 className="inline h-4 w-4 mr-2" />
                        Tổ chức
                    </label>
                    <select
                        value={selectedOrganization}
                        onChange={(e) => onOrganizationChange(e.target.value)}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 text-sm"
                    >
                        <option value="">Chọn tổ chức...</option>
                        {organizations.map(org => (
                            <option key={org._id} value={org._id}>
                                {org.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Thao tác
                    </label>
                    <div className="flex space-x-2">
                        <button
                            onClick={onExpandAll}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
                        >
                            <Maximize2 className="h-4 w-4" />
                            <span>Mở rộng</span>
                        </button>
                        <button
                            onClick={onCollapseAll}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
                        >
                            <Minimize2 className="h-4 w-4" />
                            <span>Thu gọn</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex space-x-2">
                <label
                    htmlFor="fileInput"
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium cursor-pointer"
                >
                    <Upload className="h-4 w-4" />
                    <span>Import từ file Excel</span>
                </label>
                <input
                    id="fileInput"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={onImport}
                    disabled={loading}
                    className="hidden"
                />
                <button
                    disabled={loading}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                >
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                </button>
                <button
                    disabled={loading}
                    className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 transition-colors font-medium"
                >
                    <RefreshCw className="h-4 w-4" />
                    <span>Làm mới</span>
                </button>
            </div>
        </div>
    )
}