import { useState } from 'react'
import { Search, X, Filter } from 'lucide-react'

export function SearchBox({
                              placeholder = 'Tìm kiếm...',
                              onSearch,
                              onClear,
                              defaultValue = '',
                              showFilters = false,
                              onToggleFilters,
                              className = ''
                          }) {
    const [searchValue, setSearchValue] = useState(defaultValue)
    const [isFocused, setIsFocused] = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault()
        onSearch?.(searchValue)
    }

    const handleClear = () => {
        setSearchValue('')
        onClear?.()
    }

    const handleInputChange = (e) => {
        setSearchValue(e.target.value)
        if (onSearch) {
            clearTimeout(window.searchTimeout)
            window.searchTimeout = setTimeout(() => {
                onSearch(e.target.value)
            }, 500)
        }
    }

    return (
        <form onSubmit={handleSubmit} className={`relative ${className}`}>
            <div className={`relative flex items-center transition-all rounded-xl ${
                isFocused ? 'ring-2 ring-opacity-20' : ''
            }`} style={isFocused ? {
                boxShadow: '0 0 0 3px rgba(91, 82, 225, 0.1)',
                border: '1px solid #5B52E1'
            } : {}}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5" style={{ color: '#94A3B8' }} />
                </div>

                <input
                    type="text"
                    value={searchValue}
                    onChange={handleInputChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    className="block w-full pl-12 pr-14 py-3.5 border rounded-xl focus:outline-none sm:text-sm transition-all"
                    style={{
                        borderColor: '#E2E8F0',
                        color: '#1E293B',
                        background: '#F8FAFC'
                    }}
                />

                <div className="absolute inset-y-0 right-0 flex items-center">
                    {searchValue && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            style={{ color: '#64748B' }}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}

                    {showFilters && (
                        <button
                            type="button"
                            onClick={onToggleFilters}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors border-l ml-1"
                            style={{
                                color: '#64748B',
                                borderColor: '#E2E8F0'
                            }}
                        >
                            <Filter className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </form>
    )
}

export function AdvancedSearchBox({
                                      fields = [],
                                      onSearch,
                                      onClear,
                                      className = ''
                                  }) {
    const [searchData, setSearchData] = useState({})

    const handleFieldChange = (fieldName, value) => {
        const newSearchData = { ...searchData, [fieldName]: value }
        setSearchData(newSearchData)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        onSearch?.(searchData)
    }

    const handleClear = () => {
        setSearchData({})
        onClear?.()
    }

    return (
        <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fields.map((field) => (
                    <div key={field.name}>
                        <label className="block text-sm font-semibold mb-2" style={{ color: '#1E293B' }}>
                            {field.label}
                        </label>
                        {field.type === 'select' ? (
                            <select
                                value={searchData[field.name] || ''}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                className="block w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none sm:text-sm transition-all"
                                style={{
                                    borderColor: '#E2E8F0',
                                    color: '#1E293B',
                                    background: '#FFFFFF'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#5B52E1'
                                    e.target.style.boxShadow = '0 0 0 3px rgba(91, 82, 225, 0.1)'
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#E2E8F0'
                                    e.target.style.boxShadow = 'none'
                                }}
                            >
                                <option value="">{field.placeholder || `Chọn ${field.label}`}</option>
                                {field.options?.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type={field.type || 'text'}
                                value={searchData[field.name] || ''}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                placeholder={field.placeholder}
                                className="block w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none sm:text-sm transition-all"
                                style={{
                                    borderColor: '#E2E8F0',
                                    color: '#1E293B',
                                    background: '#FFFFFF'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#5B52E1'
                                    e.target.style.boxShadow = '0 0 0 3px rgba(91, 82, 225, 0.1)'
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#E2E8F0'
                                    e.target.style.boxShadow = 'none'
                                }}
                            />
                        )}
                    </div>
                ))}
            </div>

            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={handleClear}
                    className="px-5 py-3 text-sm font-medium border rounded-xl hover:bg-gray-50 focus:outline-none transition-all"
                    style={{
                        borderColor: '#E2E8F0',
                        color: '#1E293B',
                        background: '#F8FAFC'
                    }}
                >
                    Xóa bộ lọc
                </button>
                <button
                    type="submit"
                    className="px-5 py-3 text-sm font-medium text-white rounded-xl focus:outline-none transition-all"
                    style={{
                        background: 'linear-gradient(135deg, #5B52E1 0%, #3B82F6 100%)',
                        boxShadow: '0 4px 12px rgba(91, 82, 225, 0.25)'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                    Tìm kiếm
                </button>
            </div>
        </form>
    )
}