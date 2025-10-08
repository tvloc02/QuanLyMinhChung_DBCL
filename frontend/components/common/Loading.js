export default function Loading({ size = 'medium', message = 'Đang tải...' }) {
    const sizeClasses = {
        small: 'w-6 h-6',
        medium: 'w-8 h-8',
        large: 'w-12 h-12'
    }

    return (
        <div className="flex flex-col items-center justify-center space-y-3">
            <div
                className={`${sizeClasses[size]} border-3 rounded-full animate-spin`}
                style={{
                    borderWidth: '3px',
                    borderColor: 'rgba(91, 82, 225, 0.2)',
                    borderTopColor: '#5B52E1'
                }}
            ></div>
            {message && <p className="text-sm font-medium" style={{ color: '#64748B' }}>{message}</p>}
        </div>
    )
}

export function LoadingOverlay({ message = 'Đang xử lý...', show = true }) {
    if (!show) return null

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(4px)'
            }}
        >
            <div className="bg-white rounded-2xl p-8 shadow-xl"
                 style={{
                     border: '1px solid #E2E8F0',
                     boxShadow: '0 20px 60px rgba(15, 23, 42, 0.15)'
                 }}>
                <Loading message={message} />
            </div>
        </div>
    )
}

export function LoadingSkeleton({ className = '' }) {
    return (
        <div
            className={`animate-pulse rounded-xl ${className}`}
            style={{ background: '#E2E8F0' }}
        ></div>
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