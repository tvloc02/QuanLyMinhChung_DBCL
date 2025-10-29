import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiMethods } from '../../services/api'

export default function CreateReportDebug() {
    const [debugInfo, setDebugInfo] = useState({
        programs: null,
        organizations: null,
        error: null
    })

    useEffect(() => {
        testAPI()
    }, [])

    const testAPI = async () => {
        console.log('🔍 Starting API Debug...')

        try {
            // Test 1: Programs API
            console.log('📡 Testing Programs API...')
            const programsResponse = await apiMethods.programs.getAll({ limit: 100 })
            console.log('✅ Programs Response:', programsResponse)
            console.log('📊 Programs Data Structure:', {
                hasData: !!programsResponse.data,
                dataKeys: programsResponse.data ? Object.keys(programsResponse.data) : [],
                dataType: typeof programsResponse.data,
                fullData: programsResponse.data
            })

            // Test 2: Organizations API
            console.log('📡 Testing Organizations API...')
            const orgsResponse = await apiMethods.organizations.getAll({ limit: 100 })
            console.log('✅ Organizations Response:', orgsResponse)
            console.log('📊 Organizations Data Structure:', {
                hasData: !!orgsResponse.data,
                dataKeys: orgsResponse.data ? Object.keys(orgsResponse.data) : [],
                dataType: typeof orgsResponse.data,
                fullData: orgsResponse.data
            })

            setDebugInfo({
                programs: programsResponse.data,
                organizations: orgsResponse.data,
                error: null
            })

        } catch (error) {
            console.error('❌ API Error:', error)
            console.error('Error Details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                config: error.config
            })

            setDebugInfo({
                programs: null,
                organizations: null,
                error: {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status
                }
            })
        }
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h1>🐛 Create Report - Debug Mode</h1>

            <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0' }}>
                <h2>Debug Information:</h2>
                <pre style={{ background: 'white', padding: '10px', overflow: 'auto' }}>
                    {JSON.stringify(debugInfo, null, 2)}
                </pre>
            </div>

            <div style={{ marginTop: '20px' }}>
                <button onClick={testAPI} style={{ padding: '10px 20px', fontSize: '16px' }}>
                    🔄 Test Again
                </button>
            </div>

            <div style={{ marginTop: '20px', padding: '10px', background: '#fff3cd' }}>
                <h3>📋 Checklist:</h3>
                <ul>
                    <li>Backend đang chạy? {debugInfo.programs !== null || debugInfo.error ? '✅' : '❓'}</li>
                    <li>Programs API response? {debugInfo.programs ? '✅' : '❌'}</li>
                    <li>Organizations API response? {debugInfo.organizations ? '✅' : '❌'}</li>
                    <li>Có lỗi? {debugInfo.error ? '❌ YES' : '✅ NO'}</li>
                </ul>
            </div>
        </div>
    )
}