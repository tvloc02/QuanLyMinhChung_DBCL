import React, { useState, useEffect } from 'react'
import { apiMethods } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { useCurrentAcademicYear } from '../hooks/useData'
import { formatDate, formatRelativeTime } from '../utils/formatters'

const TestConnection = () => {
    const { user, isAuthenticated } = useAuth()
    const [testResults, setTestResults] = useState({})
    const [loading, setLoading] = useState(false)

    const {
        data: currentAcademicYear,
        loading: yearLoading,
        error: yearError
    } = useCurrentAcademicYear()

    const runTest = async (testName, testFn) => {
        setTestResults(prev => ({
            ...prev,
            [testName]: { status: 'running', startTime: Date.now() }
        }))

        try {
            const result = await testFn()
            setTestResults(prev => ({
                ...prev,
                [testName]: {
                    status: 'success',
                    result,
                    duration: Date.now() - prev[testName].startTime
                }
            }))
        } catch (error) {
            setTestResults(prev => ({
                ...prev,
                [testName]: {
                    status: 'error',
                    error: error.message || 'Unknown error',
                    duration: Date.now() - prev[testName].startTime
                }
            }))
        }
    }

    const runAllTests = async () => {
        setLoading(true)
        setTestResults({})

        const tests = [
            {
                name: 'Health Check',
                fn: () => apiMethods.system.getHealth()
            },
            {
                name: 'Authentication Check',
                fn: () => apiMethods.auth.me()
            },
            {
                name: 'Academic Years',
                fn: () => apiMethods.academicYears.getAll({ limit: 5 })
            },
            {
                name: 'Programs',
                fn: () => apiMethods.programs.getAll({ limit: 5 })
            },
            {
                name: 'Organizations',
                fn: () => apiMethods.organizations.getAll({ limit: 5 })
            },
            {
                name: 'Standards',
                fn: () => apiMethods.standards.getAll({ limit: 5 })
            },
            {
                name: 'Criteria',
                fn: () => apiMethods.criteria.getAll({ limit: 5 })
            },
            {
                name: 'Evidences',
                fn: () => apiMethods.evidences.getAll({ limit: 5 })
            },
            {
                name: 'Users',
                fn: () => apiMethods.users.getAll({ limit: 5 })
            },
            {
                name: 'Reports',
                fn: () => apiMethods.reports.getAll({ limit: 5 })
            },
            {
                name: 'System Stats',
                fn: () => apiMethods.system.getStats()
            }
        ]

        for (const test of tests) {
            await runTest(test.name, test.fn)
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 100))
        }

        setLoading(false)
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'running':
                return '🔄'
            case 'success':
                return '✅'
            case 'error':
                return '❌'
            default:
                return '⏳'
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'running':
                return 'text-blue-600'
            case 'success':
                return 'text-green-600'
            case 'error':
                return 'text-red-600'
            default:
                return 'text-gray-600'
        }
    }

    useEffect(() => {
        // Auto run tests on component mount if authenticated
        if (isAuthenticated) {
            runAllTests()
        }
    }, [isAuthenticated])

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Backend Connection Test
                </h2>
                <p className="text-gray-600">
                    Kiểm tra kết nối và tính năng của backend API
                </p>
            </div>

            {/* Authentication Status */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Trạng thái đăng nhập</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <span className="font-medium">Trạng thái: </span>
                        <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                            {isAuthenticated ? '✅ Đã đăng nhập' : '❌ Chưa đăng nhập'}
                        </span>
                    </div>
                    {user && (
                        <>
                            <div>
                                <span className="font-medium">Người dùng: </span>
                                <span>{user.fullName}</span>
                            </div>
                            <div>
                                <span className="font-medium">Email: </span>
                                <span>{user.email}</span>
                            </div>
                            <div>
                                <span className="font-medium">Vai trò: </span>
                                <span className="capitalize">{user.role}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Current Academic Year */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Năm học hiện tại</h3>
                {yearLoading ? (
                    <div className="text-blue-600">🔄 Đang tải...</div>
                ) : yearError ? (
                    <div className="text-red-600">❌ Lỗi: {yearError.message}</div>
                ) : currentAcademicYear?.data ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <span className="font-medium">Tên: </span>
                            <span>{currentAcademicYear.data.name}</span>
                        </div>
                        <div>
                            <span className="font-medium">Mã: </span>
                            <span>{currentAcademicYear.data.code}</span>
                        </div>
                        <div>
                            <span className="font-medium">Trạng thái: </span>
                            <span className="capitalize">{currentAcademicYear.data.status}</span>
                        </div>
                        <div>
                            <span className="font-medium">Hiện tại: </span>
                            <span className={currentAcademicYear.data.isCurrent ? 'text-green-600' : 'text-gray-600'}>
                                {currentAcademicYear.data.isCurrent ? '✅ Có' : '❌ Không'}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-600">Không có năm học hiện tại</div>
                )}
            </div>

            {/* Test Controls */}
            <div className="mb-6">
                <button
                    onClick={runAllTests}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
                >
                    {loading ? '🔄 Đang chạy test...' : '🚀 Chạy tất cả test'}
                </button>
            </div>

            {/* Test Results */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Kết quả test</h3>

                {Object.keys(testResults).length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
                        Chưa có kết quả test nào
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(testResults).map(([testName, result]) => (
                            <div
                                key={testName}
                                className="p-4 border border-gray-200 rounded-lg"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium">{testName}</h4>
                                    <span className={`text-lg ${getStatusColor(result.status)}`}>
                                        {getStatusIcon(result.status)}
                                    </span>
                                </div>

                                <div className="text-sm text-gray-600 space-y-1">
                                    <div>
                                        <span className="font-medium">Trạng thái: </span>
                                        <span className={getStatusColor(result.status)}>
                                            {result.status === 'running' ? 'Đang chạy' :
                                                result.status === 'success' ? 'Thành công' : 'Lỗi'}
                                        </span>
                                    </div>

                                    {result.duration && (
                                        <div>
                                            <span className="font-medium">Thời gian: </span>
                                            <span>{result.duration}ms</span>
                                        </div>
                                    )}

                                    {result.error && (
                                        <div>
                                            <span className="font-medium">Lỗi: </span>
                                            <span className="text-red-600">{result.error}</span>
                                        </div>
                                    )}

                                    {result.result?.data && (
                                        <div>
                                            <span className="font-medium">Dữ liệu: </span>
                                            <span>
                                                {Array.isArray(result.result.data)
                                                    ? `${result.result.data.length} items`
                                                    : typeof result.result.data === 'object'
                                                        ? `${Object.keys(result.result.data).length} fields`
                                                        : 'OK'
                                                }
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Test Summary */}
            {Object.keys(testResults).length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Tóm tắt</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-green-600">
                                {Object.values(testResults).filter(r => r.status === 'success').length}
                            </div>
                            <div className="text-sm text-gray-600">Thành công</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-red-600">
                                {Object.values(testResults).filter(r => r.status === 'error').length}
                            </div>
                            <div className="text-sm text-gray-600">Lỗi</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-blue-600">
                                {Object.values(testResults).filter(r => r.status === 'running').length}
                            </div>
                            <div className="text-sm text-gray-600">Đang chạy</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Debug Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Thông tin debug</h3>
                <div className="text-sm text-gray-600 space-y-1">
                    <div>
                        <span className="font-medium">API Base URL: </span>
                        <span>{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}</span>
                    </div>
                    <div>
                        <span className="font-medium">Environment: </span>
                        <span>{process.env.NODE_ENV}</span>
                    </div>
                    <div>
                        <span className="font-medium">Timestamp: </span>
                        <span>{new Date().toLocaleString('vi-VN')}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TestConnection