import { useState } from 'react'
import { Search, X, Filter } from 'lucide-react'

export default function SearchBox({
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
        // Auto-search as user types (debounced)
        if (onSearch) {
            clearTimeout(window.searchTimeout)
            window.searchTimeout = setTimeout(() => {
                onSearch(e.target.value)
            }, 500)
        }
    }

    return (
        <form onSubmit={handleSubmit} className={`relative ${className}`}>
            <div className={`relative flex items-center transition-all ${
                isFocused ? 'ring-2 ring-blue-500 ring-opacity-20' : ''
            }`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>

                <input
                    type="text"
                    value={searchValue}
                    onChange={handleInputChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />

                <div className="absolute inset-y-0 right-0 flex items-center">
                    {searchValue && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}

                    {showFilters && (
                        <button
                            type="button"
                            onClick={onToggleFilters}
                            className="p-2 text-gray-400 hover:text-gray-600 border-l border-gray-300 ml-1"
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label}
                        </label>
                        {field.type === 'select' ? (
                            <select
                                value={searchData[field.name] || ''}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        )}
                    </div>
                ))}
            </div>

            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={handleClear}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Xóa bộ lọc
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Tìm kiếm
                </button>
            </div>
        </form>
    )
}