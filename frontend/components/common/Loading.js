export default function Loading({ size = 'medium', message = 'Đang tải...' }) {
    const sizeClasses = {
        small: 'w-6 h-6',
        medium: 'w-8 h-8',
        large: 'w-12 h-12'
    }

    return (
        <div className="flex flex-col items-center justify-center space-y-3">
            <div className={`${sizeClasses[size]} border-2 border-blue-600 border-t-transparent rounded-full animate-spin`}></div>
            {message && <p className="text-gray-600 text-sm">{message}</p>}
        </div>
    )
}

export function LoadingOverlay({ message = 'Đang xử lý...', show = true }) {
    if (!show) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg">
                <Loading message={message} />
            </div>
        </div>
    )
}

export function LoadingSkeleton({ className = '' }) {
    return (
        <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
    )
}

export function TableLoading({ rows = 5, cols = 4 }) {
    return (
        <div className="space-y-4">
            {Array(rows).fill().map((_, i) => (
                <div key={i} className="flex space-x-4">
                    {Array(cols).fill().map((_, j) => (
                        <LoadingSkeleton key={j} className="h-4 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    )
}