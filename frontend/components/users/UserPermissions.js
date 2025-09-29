import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
    AlertCircle, Save, X, Shield, Calendar,
    BookOpen, Building, FileText, List, RefreshCw
} from 'lucide-react'
import api from '../../utils/api'

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

            // Lấy thông tin user và các options song song
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
        const allIds = availableOptions[getCategoryKey(category)].map(item => item._id)
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

                // Redirect sau 2 giây
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
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <p className="text-center text-gray-500">Không tìm thấy người dùng</p>
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
        <div className="max-w-6xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Message Alert */}
                {message.text && (
                    <div className={`p-4 rounded-lg ${
                        message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            <p>{message.text}</p>
                        </div>
                    </div>
                )}

                {/* User Info */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-xl">
                                {user.fullName?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{user.fullName}</h2>
                            <p className="text-sm text-gray-600">{user.email}@cmcu.edu.vn</p>
                            <p className="text-sm text-gray-500">{user.position || 'Chưa cập nhật'} - {user.department || 'Chưa cập nhật'}</p>
                        </div>
                    </div>
                </div>

                {/* Permission Sections */}
                {permissionSections.map((section) => (
                    <div key={section.key} className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 bg-${section.color}-100 rounded-lg`}>
                                    <section.icon className={`w-5 h-5 text-${section.color}-600`} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                                    <p className="text-sm text-gray-600">
                                        Đã chọn: {permissions[section.key]?.length || 0} / {section.options.length}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleSelectAll(section.key)}
                                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                                >
                                    Chọn tất cả
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDeselectAll(section.key)}
                                    className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded"
                                >
                                    Bỏ chọn
                                </button>
                            </div>
                        </div>

                        {section.options.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">
                                Chưa có dữ liệu {section.title.toLowerCase()}
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {section.options.map((option) => (
                                    <label
                                        key={option._id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                            permissions[section.key]?.includes(option._id)
                                                ? `border-${section.color}-500 bg-${section.color}-50`
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={permissions[section.key]?.includes(option._id)}
                                            onChange={() => handleToggle(section.key, option._id)}
                                            className={`w-5 h-5 text-${section.color}-600 rounded focus:ring-2 focus:ring-${section.color}-500`}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 truncate">
                                                {option.name}
                                            </div>
                                            {option.code && (
                                                <div className="text-xs text-gray-500 truncate">
                                                    {option.code}
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    >
                        <X className="w-5 h-5" />
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        {saving ? 'Đang lưu...' : 'Lưu phân quyền'}
                    </button>
                </div>
            </form>
        </div>
    )
}