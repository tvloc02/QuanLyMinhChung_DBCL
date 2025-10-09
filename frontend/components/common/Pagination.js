import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({
                                       currentPage = 1,
                                       totalPages = 1,
                                       totalItems = 0,
                                       itemsPerPage = 10,
                                       onPageChange,
                                       showInfo = true
                                   }) {
    const startItem = (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalItems)

    const getVisiblePages = () => {
        const pages = []
        const delta = 2
        const start = Math.max(1, currentPage - delta)
        const end = Math.min(totalPages, currentPage + delta)

        if (start > 1) {
            pages.push(1)
            if (start > 2) pages.push('...')
        }

        for (let i = start; i <= end; i++) {
            pages.push(i)
        }

        if (end < totalPages) {
            if (end < totalPages - 1) pages.push('...')
            pages.push(totalPages)
        }

        return pages
    }

    if (totalPages <= 1) return null

    return (
        <div className="flex items-center justify-between border-t bg-white px-6 py-4 sm:px-6"
             style={{ borderColor: '#E2E8F0' }}>
            <div className="flex flex-1 justify-between sm:hidden">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    style={{
                        borderColor: '#E2E8F0',
                        color: '#1E293B',
                        background: '#FFFFFF'
                    }}
                >
                    Trước
                </button>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    style={{
                        borderColor: '#E2E8F0',
                        color: '#1E293B',
                        background: '#FFFFFF'
                    }}
                >
                    Tiếp
                </button>
            </div>

            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                {showInfo && (
                    <div>
                        <p className="text-sm" style={{ color: '#64748B' }}>
                            Hiển thị <span className="font-semibold" style={{ color: '#1E293B' }}>{startItem}</span> đến{' '}
                            <span className="font-semibold" style={{ color: '#1E293B' }}>{endItem}</span> trong{' '}
                            <span className="font-semibold" style={{ color: '#1E293B' }}>{totalItems}</span> kết quả
                        </p>
                    </div>
                )}

                <div>
                    <nav className="isolate inline-flex -space-x-px rounded-xl shadow-sm" aria-label="Pagination">
                        {/* Previous button */}
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center rounded-l-xl px-3 py-2 hover:bg-gray-50 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            style={{
                                borderColor: '#E2E8F0',
                                color: '#64748B',
                                border: '1px solid #E2E8F0'
                            }}
                        >
                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>

                        {getVisiblePages().map((page, index) => (
                            <div key={index}>
                                {page === '...' ? (
                                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold"
                                          style={{
                                              borderColor: '#E2E8F0',
                                              color: '#64748B',
                                              border: '1px solid #E2E8F0',
                                              borderLeft: 'none'
                                          }}>
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => onPageChange(page)}
                                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold hover:bg-gray-50 focus:z-20 transition-all ${
                                            page === currentPage ? 'text-white' : ''
                                        }`}
                                        style={page === currentPage ? {
                                            background: 'linear-gradient(135deg, #5B52E1 0%, #3B82F6 100%)',
                                            border: '1px solid #5B52E1',
                                            borderLeft: 'none',
                                            boxShadow: '0 2px 8px rgba(91, 82, 225, 0.25)'
                                        } : {
                                            borderColor: '#E2E8F0',
                                            color: '#1E293B',
                                            border: '1px solid #E2E8F0',
                                            borderLeft: 'none'
                                        }}
                                    >
                                        {page}
                                    </button>
                                )}
                            </div>
                        ))}

                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center rounded-r-xl px-3 py-2 hover:bg-gray-50 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            style={{
                                borderColor: '#E2E8F0',
                                color: '#64748B',
                                border: '1px solid #E2E8F0',
                                borderLeft: 'none'
                            }}
                        >
                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    )
}