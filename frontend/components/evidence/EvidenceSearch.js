import { useState, useEffect } from 'react'
import { Search, Filter, X, Calendar, FileText } from 'lucide-react'
import { debounce } from '../../utils/helpers'

export default function EvidenceSearch({ onSearch, defaultFilters = {}, className = '' }) {
    const [searchQuery, setSearchQuery] = useState('')
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [filters, setFilters] = useState({
        program: '',
        organization: '',
        standard: '',
        criteria: '',
        status: '',
        dateFrom: '',
        dateTo: '',
        ...defaultFilters
    })

    const statusOptions = [
        { value: 'draft', label: 'Nháp' },
        { value: 'pending', label: 'Chờ xử lý' },
        { value: 'approved', label: 'Đã phê duyệt' },
        { value: 'rejected', label: 'Từ chối' }
    ]

    const debouncedSearch = debounce((query, currentFilters) => {
        onSearch?.(query, currentFilters)
    }, 500)

    useEffect(() => {
        debouncedSearch(searchQuery, filters)
    }, [searchQuery, filters])

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value)
    }

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }))
    }

    const handleClearSearch = () => {
        setSearchQuery('')
    }

    const handleClearFilters = () => {
        setFilters({
            program: '',
            organization: '',
            standard: '',
            criteria: '',
            status: '',
            dateFrom: '',
            dateTo: ''
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        onSearch?.(searchQuery, filters)
    }

    const getActiveFiltersCount = () => {
        return Object.values(filters).filter(value => value && value !== '').length
    }

    const filteredCriteria = criteria.filter(criterion =>
        !filters.standard || criterion.standardId === filters.standard
    )

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Basic Search */}
            <form onSubmit={handleSubmit} className="relative">
                <div className="flex items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Tìm kiếm theo tên, mã minh chứng, mô tả..."
                            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`ml-3 inline-flex items-center px-4 py-3 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            showAdvanced || getActiveFiltersCount() > 0
                                ? 'border-blue-300 text-blue-700 bg-blue-50'
                                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                        }`}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Bộ lọc
                        {getActiveFiltersCount() > 0 && (
                            <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                                {getActiveFiltersCount()}
                            </span>
                        )}
                    </button>
                </div>
            </form>

            {showAdvanced && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">
                            Bộ lọc nâng cao
                        </h3>
                        <button
                            onClick={handleClearFilters}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            Xóa tất cả bộ lọc
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Chương trình đánh giá
                            </label>
                            <select
                                value={filters.program}
                                onChange={(e) => handleFilterChange('program', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Tất cả chương trình</option>
                                {programs.map(program => (
                                    <option key={program.id} value={program.id}>
                                        {program.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tổ chức
                            </label>
                            <select
                                value={filters.organization}
                                onChange={(e) => handleFilterChange('organization', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Tất cả tổ chức</option>
                                {organizations.map(org => (
                                    <option key={org.id} value={org.id}>
                                        {org.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Trạng thái
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Tất cả trạng thái</option>
                                {statusOptions.map(status => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tiêu chuẩn
                            </label>
                            <select
                                value={filters.standard}
                                onChange={(e) => {
                                    handleFilterChange('standard', e.target.value)
                                    // Clear criteria when standard changes
                                    if (filters.criteria) {
                                        handleFilterChange('criteria', '')
                                    }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Tất cả tiêu chuẩn</option>
                                {standards.map(standard => (
                                    <option key={standard.id} value={standard.id}>
                                        {standard.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tiêu chí
                            </label>
                            <select
                                value={filters.criteria}
                                onChange={(e) => handleFilterChange('criteria', e.target.value)}
                                disabled={!filters.standard}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="">
                                    {filters.standard ? 'Tất cả tiêu chí' : 'Chọn tiêu chuẩn trước'}
                                </option>
                                {filteredCriteria.map(criterion => (
                                    <option key={criterion.id} value={criterion.id}>
                                        {criterion.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Từ ngày
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="date"
                                    value={filters.dateFrom}
                                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Đến ngày
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="date"
                                    value={filters.dateTo}
                                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                    min={filters.dateFrom}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {getActiveFiltersCount() > 0 && (
                <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-gray-600">Bộ lọc đang áp dụng:</span>
                    {Object.entries(filters).map(([key, value]) => {
                        if (!value) return null

                        let label = ''
                        let displayValue = value

                        switch (key) {
                            case 'program':
                                label = 'Chương trình'
                                displayValue = programs.find(p => p.id === value)?.name || value
                                break
                            case 'organization':
                                label = 'Tổ chức'
                                displayValue = organizations.find(o => o.id === value)?.name || value
                                break
                            case 'standard':
                                label = 'Tiêu chuẩn'
                                displayValue = standards.find(s => s.id === value)?.name || value
                                break
                            case 'criteria':
                                label = 'Tiêu chí'
                                displayValue = criteria.find(c => c.id === value)?.name || value
                                break
                            case 'status':
                                label = 'Trạng thái'
                                displayValue = statusOptions.find(s => s.value === value)?.label || value
                                break
                            case 'dateFrom':
                                label = 'Từ ngày'
                                break
                            case 'dateTo':
                                label = 'Đến ngày'
                                break
                            default:
                                return null
                        }

                        return (
                            <span
                                key={key}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                                {label}: {displayValue}
                                <button
                                    onClick={() => handleFilterChange(key, '')}
                                    className="ml-2 text-blue-600 hover:text-blue-800"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )
                    })}
                </div>
            )}
        </div>
    )
}