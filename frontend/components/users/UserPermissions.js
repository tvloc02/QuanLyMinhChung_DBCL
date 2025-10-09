import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
    AlertCircle, Save, X, Shield, Calendar,
    BookOpen, Building, FileText, List, RefreshCw, Loader2, Zap
} from 'lucide-react'
import api from '../../services/api'

export default function UserPermissions({ userId }) {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [user, setUser] = useState(null)

    const [permissions, setPermissions] = useState({
        academicYearAccess: [],
        programAccess: [],
        organizationAccess: [],
        standardAccess: [],
        criteriaAccess: []
    })

    const [availableOptions, setAvailableOptions] = useState({
        academicYears: [],
        programs: [],
        organizations: [],
        standards: [],
        criteria: []
    })

    useEffect(() => {
        if (userId) {
            fetchUserAndOptions()
        }
    }, [userId])

    const fetchUserAndOptions = async () => {
        try {
            setLoading(true)

            const [userRes, academicYearsRes, programsRes, organizationsRes, standardsRes, criteriaRes] = await Promise.all([
                api.get(`/users/${userId}`),
                api.get('/academic-years').catch(() => ({ data: { data: [] } })),
                api.get('/programs').catch(() => ({ data: { data: [] } })),
                api.get('/organizations').catch(() => ({ data: { data: [] } })),
                api.get('/standards').catch(() => ({ data: { data: [] } })),
                api.get('/criteria').catch(() => ({ data: { data: [] } }))
            ])

            if (userRes.data.success) {
                const userData = userRes.data.data
                setUser(userData)

                setPermissions({
                    academicYearAccess: userData.academicYearAccess?.map(item => item._id || item) || [],
                    programAccess: userData.programAccess?.map(item => item._id || item) || [],
                    organizationAccess: userData.organizationAccess?.map(item => item._id || item) || [],
                    standardAccess: userData.standardAccess?.map(item => item._id || item) || [],
                    criteriaAccess: userData.criteriaAccess?.map(item => item._id || item) || []
                })
            }

            setAvailableOptions({
                academicYears: academicYearsRes.data.data || [],
                programs: programsRes.data.data || [],
                organizations: organizationsRes.data.data || [],
                standards: standardsRes.data.data || [],
                criteria: criteriaRes.data.data || []
            })

        } catch (error) {
            console.error('Error fetching data:', error)
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Lỗi khi tải dữ liệu'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleToggle = (category, itemId) => {
        setPermissions(prev => {
            const currentValues = prev[category] || []
            if (currentValues.includes(itemId)) {
                return {
                    ...prev,
                    [category]: currentValues.filter(id => id !== itemId)
                }
            } else {
                return {
                    ...prev,
                    [category]: [...currentValues, itemId]
                }
            }
        })
    }

    const handleSelectAll = (category) => {
        const categoryKey = getCategoryKey(category)
        const allIds = availableOptions[categoryKey].map(item => item._id)
        setPermissions(prev => ({
            ...prev,
            [category]: allIds
        }))
    }

    const handleDeselectAll = (category) => {
        setPermissions(prev => ({
            ...prev,
            [category]: []
        }))
    }

    const getCategoryKey = (category) => {
        const mapping = {
            academicYearAccess: 'academicYears',
            programAccess: 'programs',
            organizationAccess: 'organizations',
            standardAccess: 'standards',
            criteriaAccess: 'criteria'
        }
        return mapping[category]
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            setSaving(true)
            setMessage({ type: '', text: '' })

            const response = await api.put(`/users/${userId}/permissions`, permissions)

            if (response.data.success) {
                setMessage({
                    type: 'success',
                    text: 'Cập nhật quyền truy cập thành công'
                })

                setTimeout(() => {
                    router.push('/users')
                }, 2000)
            }
        } catch (error) {
            console.error('Error updating permissions:', error)
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Lỗi khi cập nhật quyền truy cập'
            })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Không tìm thấy người dùng</p>
            </div>
        )
    }

    const permissionSections = [
        {
            key: 'academicYearAccess',
            title: 'Năm học',
            icon: Calendar,
            color: 'blue',
            options: availableOptions.academicYears
        },
        {
            key: 'programAccess',
            title: 'Chương trình',
            icon: BookOpen,
            color: 'green',
            options: availableOptions.programs
        },
        {
            key: 'organizationAccess',
            title: 'Tổ chức',
            icon: Building,
            color: 'purple',
            options: availableOptions.organizations
        },
        {
            key: 'standardAccess',
            title: 'Tiêu chuẩn',
            icon: FileText,
            color: 'orange',
            options: availableOptions.standards
        },
        {
            key: 'criteriaAccess',
            title: 'Tiêu chí',
            icon: List,
            color: 'pink',
            options: availableOptions.criteria
        }
    ]

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Message Alert */}
                {message.text && (
                    <div className={`rounded-2xl border p-6 shadow-lg ${
                        message.type === 'success'
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                            : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
                    }`}>
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                    message.type === 'success' ? 'bg-green-100' : 'bg-red-100'
                                }`}>
                                    <AlertCircle className={`w-7 h-7 ${
                                        message.type === 'success' ? 'text-green-600' : 'text-red-600'
                                    }`} />
                                </div>
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className={`font-bold text-lg mb-1 ${
                                    message.type === 'success' ? 'text-green-900' : 'text-red-900'
                                }`}>
                                    {message.type === 'success' ? 'Thành công!' : 'Có lỗi xảy ra'}
                                </h3>
                                <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                                    {message.text}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* User Info */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                            <Shield className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold mb-1">Phân quyền người dùng</h1>
                            <div className="flex items-center space-x-4 text-indigo-100">
                                <span className="font-semibold">{user.fullName}</span>
                                <span>•</span>
                                <span>{user.email}@cmcu.edu.vn</span>
                                <span>•</span>
                                <span>{user.position || 'Chưa cập nhật'}</span>
                            </div>
                        </div>
                        <div className="w-20 h-20 rounded-2xl bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center">
                            <span className="text-white font-bold text-3xl">
                                {user.fullName?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Permission Sections */}
                {permissionSections.map((section) => {
                    const Icon = section.icon
                    return (
                        <div key={section.key} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className={`p-3 bg-gradient-to-br from-${section.color}-50 to-${section.color}-100 rounded-xl`}>
                                        <Icon className={`w-6 h-6 text-${section.color}-600`} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{section.title}</h3>
                                        <p className="text-sm text-gray-600">
                                            Đã chọn: <span className="font-semibold text-indigo-600">{permissions[section.key]?.length || 0}</span> / {section.options.length}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleSelectAll(section.key)}
                                        className="px-4 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all font-medium"
                                    >
                                        Chọn tất cả
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeselectAll(section.key)}
                                        className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all font-medium"
                                    >
                                        Bỏ chọn
                                    </button>
                                </div>
                            </div>

                            {section.options.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-xl">
                                    <p className="text-sm text-gray-500">
                                        Chưa có dữ liệu {section.title.toLowerCase()}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {section.options.map((option) => (
                                        <label
                                            key={option._id}
                                            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                permissions[section.key]?.includes(option._id)
                                                    ? `border-${section.color}-500 bg-gradient-to-r from-${section.color}-50 to-${section.color}-100 shadow-sm`
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={permissions[section.key]?.includes(option._id)}
                                                onChange={() => handleToggle(section.key, option._id)}
                                                className={`w-5 h-5 text-${section.color}-600 rounded focus:ring-2 focus:ring-${section.color}-500`}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-gray-900 truncate">
                                                    {option.name}
                                                </div>
                                                {option.code && (
                                                    <div className="text-xs text-gray-500 truncate font-mono mt-1">
                                                        {option.code}
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}

                {/* Actions */}
                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium"
                        disabled={saving}
                    >
                        <div className="flex items-center space-x-2">
                            <X className="w-5 h-5" />
                            <span>Hủy</span>
                        </div>
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Đang lưu...</span>
                            </>
                        ) : (
                            <>
                                <Zap className="w-5 h-5" />
                                <span>Lưu phân quyền</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}