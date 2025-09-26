import React, { useState } from 'react'
import { Bug, Eye, EyeOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { useAcademicYearContext } from '../utils/academicYear'
import { useAuth } from '../hooks/useAuth'
import { api } from '../hooks/useApi'

const DebugAcademicYear = () => {
    const { user } = useAuth()
    const {
        currentYear,
        selectedYear,
        availableYears,
        effectiveYear,
        loading,
        error,
        reload
    } = useAcademicYearContext()

    const [showDebug, setShowDebug] = useState(false)
    const [testResults, setTestResults] = useState(null)
    const [testing, setTesting] = useState(false)

    // Only show in development or for admin users
    if (process.env.NODE_ENV === 'production' && user?.role !== 'admin') {
        return null
    }

    const runTests = async () => {
        setTesting(true)
        const results = {
            apiConnection: { status: 'testing', message: 'Testing API connection...' },
            currentYearAPI: { status: 'testing', message: 'Testing current year endpoint...' },
            allYearsAPI: { status: 'testing', message: 'Testing all years endpoint...' },
            authentication: { status: 'testing', message: 'Testing authentication...' },
            localStorage: { status: 'testing', message: 'Testing localStorage...' }
        }

        setTestResults({ ...results })

        try {
            // Test API connection
            const healthResponse = await api.get('/health').catch(() => null)
            if (healthResponse && healthResponse.status === 200) {
                results.apiConnection = { status: 'success', message: 'API connection successful' }
            } else {
                results.apiConnection = { status: 'error', message: 'API connection failed' }
            }
        } catch (error) {
            results.apiConnection = { status: 'error', message: `API connection error: ${error.message}` }
        }

        try {
            // Test current year endpoint
            const currentResponse = await api.get('/academic-years/current')
            if (currentResponse.data.success) {
                results.currentYearAPI = {
                    status: 'success',
                    message: `Current year API working - found: ${currentResponse.data.data?.name || 'No current year'}`,
                    data: currentResponse.data.data
                }
            } else {
                results.currentYearAPI = {
                    status: 'warning',
                    message: 'Current year API responded but no current year set',
                    data: currentResponse.data
                }
            }
        } catch (error) {
            results.currentYearAPI = {
                status: 'error',
                message: `Current year API error: ${error.response?.data?.message || error.message}`
            }
        }

        try {
            // Test all years endpoint
            const allResponse = await api.get('/academic-years/all')
            if (allResponse.data.success && Array.isArray(allResponse.data.data)) {
                results.allYearsAPI = {
                    status: 'success',
                    message: `All years API working - found ${allResponse.data.data.length} years`,
                    data: allResponse.data.data
                }
            } else {
                results.allYearsAPI = {
                    status: 'warning',
                    message: 'All years API responded but no data returned',
                    data: allResponse.data
                }
            }
        } catch (error) {
            results.allYearsAPI = {
                status: 'error',
                message: `All years API error: ${error.response?.data?.message || error.message}`
            }
        }

        // Test authentication
        if (user && api.defaults.headers.common['Authorization']) {
            results.authentication = { status: 'success', message: 'User authenticated with token' }
        } else {
            results.authentication = { status: 'error', message: 'No authentication token found' }
        }

        // Test localStorage
        try {
            const testKey = 'debug_test'
            const testValue = 'test'
            localStorage.setItem(testKey, testValue)
            const retrieved = localStorage.getItem(testKey)
            localStorage.removeItem(testKey)

            if (retrieved === testValue) {
                results.localStorage = { status: 'success', message: 'localStorage working correctly' }
            } else {
                results.localStorage = { status: 'error', message: 'localStorage read/write failed' }
            }
        } catch (error) {
            results.localStorage = { status: 'error', message: `localStorage error: ${error.message}` }
        }

        setTestResults(results)
        setTesting(false)
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-600" />
            case 'warning':
                return <AlertCircle className="h-4 w-4 text-yellow-600" />
            case 'error':
                return <AlertCircle className="h-4 w-4 text-red-600" />
            default:
                return <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'success':
                return 'text-green-800 bg-green-50 border-green-200'
            case 'warning':
                return 'text-yellow-800 bg-yellow-50 border-yellow-200'
            case 'error':
                return 'text-red-800 bg-red-50 border-red-200'
            default:
                return 'text-blue-800 bg-blue-50 border-blue-200'
        }
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="flex flex-col items-end space-y-2">
                {/* Debug Panel */}
                {showDebug && (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg w-96 max-h-96 overflow-y-auto">
                        <div className="px-4 py-3 border-b border-gray-200">
                            <h3 className="text-sm font-medium text-gray-900 flex items-center">
                                <Bug className="h-4 w-4 mr-2" />
                                Academic Year Debug Panel
                            </h3>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Current State */}
                            <div>
                                <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wider mb-2">
                                    Current State
                                </h4>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span>Loading:</span>
                                        <span className={loading ? 'text-yellow-600' : 'text-green-600'}>
                                            {loading ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Error:</span>
                                        <span className={error ? 'text-red-600' : 'text-green-600'}>
                                            {error ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Current Year:</span>
                                        <span className={currentYear ? 'text-green-600' : 'text-red-600'}>
                                            {currentYear ? 'Set' : 'Not Set'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Selected Year:</span>
                                        <span className={selectedYear ? 'text-blue-600' : 'text-gray-600'}>
                                            {selectedYear ? 'Set' : 'None'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Available Years:</span>
                                        <span className={availableYears.length > 0 ? 'text-green-600' : 'text-red-600'}>
                                            {availableYears.length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Effective Year:</span>
                                        <span className={effectiveYear ? 'text-green-600' : 'text-red-600'}>
                                            {effectiveYear ? effectiveYear.name : 'None'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* User Info */}
                            <div>
                                <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wider mb-2">
                                    User Info
                                </h4>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span>Authenticated:</span>
                                        <span className={user ? 'text-green-600' : 'text-red-600'}>
                                            {user ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Role:</span>
                                        <span className="text-gray-800">
                                            {user?.role || 'None'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Can Switch:</span>
                                        <span className={user?.role === 'admin' || user?.role === 'manager' ? 'text-green-600' : 'text-red-600'}>
                                            {user?.role === 'admin' || user?.role === 'manager' ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Test Results */}
                            {testResults && (
                                <div>
                                    <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wider mb-2">
                                        Test Results
                                    </h4>
                                    <div className="space-y-2">
                                        {Object.entries(testResults).map(([key, result]) => (
                                            <div key={key} className={`p-2 rounded border text-xs ${getStatusColor(result.status)}`}>
                                                <div className="flex items-start space-x-2">
                                                    {getStatusIcon(result.status)}
                                                    <div className="flex-1">
                                                        <div className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                                                        <div className="mt-1">{result.message}</div>
                                                        {result.data && (
                                                            <details className="mt-1">
                                                                <summary className="cursor-pointer text-xs opacity-75">View Data</summary>
                                                                <pre className="mt-1 text-xs overflow-auto max-h-20 bg-black bg-opacity-10 p-2 rounded">
                                                                    {JSON.stringify(result.data, null, 2)}
                                                                </pre>
                                                            </details>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex space-x-2">
                                <button
                                    onClick={runTests}
                                    disabled={testing}
                                    className="flex-1 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded"
                                >
                                    {testing ? 'Testing...' : 'Run Tests'}
                                </button>
                                <button
                                    onClick={reload}
                                    className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                                >
                                    <RefreshCw className="h-3 w-3" />
                                </button>
                            </div>

                            {/* Raw Data */}
                            <details>
                                <summary className="text-xs font-medium text-gray-700 cursor-pointer">
                                    View Raw Data
                                </summary>
                                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                                    {JSON.stringify({
                                        currentYear,
                                        selectedYear,
                                        availableYears,
                                        effectiveYear,
                                        loading,
                                        error: error?.message
                                    }, null, 2)}
                                </pre>
                            </details>
                        </div>
                    </div>
                )}

                {/* Toggle Button */}
                <button
                    onClick={() => setShowDebug(!showDebug)}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg"
                    title="Academic Year Debug Panel"
                >
                    {showDebug ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
        </div>
    )
}

export default DebugAcademicYear