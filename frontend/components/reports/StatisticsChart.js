export default function StatisticsChart({ stats }) {
    const total = stats.total || 0
    const approved = stats.approved || 0
    const pending = stats.pending || 0
    const rejected = stats.rejected || 0

    const approvedPercentage = total > 0 ? Math.round((approved / total) * 100) : 0
    const pendingPercentage = total > 0 ? Math.round((pending / total) * 100) : 0
    const rejectedPercentage = total > 0 ? Math.round((rejected / total) * 100) : 0

    const circumference = 2 * Math.PI * 15.9155
    const approvedOffset = circumference - (approvedPercentage / 100) * circumference
    const pendingOffset = circumference - (pendingPercentage / 100) * circumference
    const rejectedOffset = circumference - (rejectedPercentage / 100) * circumference

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê minh chứng</h3>

            <div className="text-center mb-6">
                <div className="w-40 h-40 mx-auto mb-4 relative">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="2"
                        />
                        <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2"
                            strokeDasharray={`${(approvedPercentage / 100) * circumference}, ${circumference}`}
                            strokeDashoffset="0"
                        />
                        <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="2"
                            strokeDasharray={`${(pendingPercentage / 100) * circumference}, ${circumference}`}
                            strokeDashoffset={`-${(approvedPercentage / 100) * circumference}`}
                        />
                        <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="2"
                            strokeDasharray={`${(rejectedPercentage / 100) * circumference}, ${circumference}`}
                            strokeDashoffset={`-${((approvedPercentage + pendingPercentage) / 100) * circumference}`}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <span className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</span>
                            <p className="text-sm text-gray-600">Tổng số</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Đã phê duyệt</span>
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">{approved.toLocaleString()}</span>
                        <span className="text-xs text-gray-500 ml-1">({approvedPercentage}%)</span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Chờ xử lý</span>
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">{pending.toLocaleString()}</span>
                        <span className="text-xs text-gray-500 ml-1">({pendingPercentage}%)</span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Từ chối</span>
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">{rejected.toLocaleString()}</span>
                        <span className="text-xs text-gray-500 ml-1">({rejectedPercentage}%)</span>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p className="text-lg font-semibold text-green-600">{approvedPercentage}%</p>
                        <p className="text-xs text-gray-600">Tỷ lệ phê duyệt</p>
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-blue-600">{total > 0 ? Math.round(((approved + pending) / total) * 100) : 0}%</p>
                        <p className="text-xs text-gray-600">Đang xử lý</p>
                    </div>
                </div>
            </div>
        </div>
    )
}