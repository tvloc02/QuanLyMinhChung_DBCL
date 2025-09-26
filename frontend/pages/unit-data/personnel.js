import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import Modal from '../../components/common/Modal'
import Pagination from '../../components/common/Pagination'
import { formatDate, formatNumber } from '../../utils/helpers'
import toast from 'react-hot-toast'
import {
    Users,
    Plus,
    Search,
    Filter,
    Eye,
    Edit,
    Trash2,
    User,
    Building,
    Calendar,
    Mail,
    Phone,
    GraduationCap,
    Award,
    BookOpen,
    Download,
    Upload,
    MoreVertical,
    UserCheck,
    UserX,
    Star,
    Briefcase,
    MapPin,
    Clock,
    FileText
} from 'lucide-react'

export default function PersonnelPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    // State management
    const [personnel, setPersonnel] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedPersonnel, setSelectedPersonnel] = useState([])

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showPositionModal, setShowPositionModal] = useState(false)
    const [currentPerson, setCurrentPerson] = useState(null)

    const [searchQuery, setSearchQuery] = useState('')
    const [filters, setFilters] = useState({
        facultyId: '',
        departmentId: '',
        position: '',
        status: '',
        isExpert: '',
        academicLevel: ''
    })

    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [pagination, setPagination] = useState({})

    const [facultyOptions, setFacultyOptions] = useState([])
    const [departmentOptions, setDepartmentOptions] = useState([])
    const [statistics, setStatistics] = useState({})

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user) {
            fetchPersonnel()
            fetchOptions()
            fetchStatistics()
        }
    }, [user, currentPage, searchQuery, filters])

    const fetchPersonnel = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: currentPage,
                limit: 10,
                search: searchQuery,
                ...filters
            })

            const response = await fetch(`/api/users?${params}`)
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }
            const data = await response.json()

            if (data.success) {
                setPersonnel(data.data.users)
                setPagination(data.data.pagination)
                setTotalPages(data.data.pagination.pages)
            }
        } catch (error) {
            console.error('Lỗi tải danh sách nhân sự:', error)
            // Set default data when API is not available
            setPersonnel([])
            setPagination({ current: 1, total: 0, pages: 1 })
            setTotalPages(1)
            if (error.message.includes('HTTP') || error.message.includes('fetch')) {
                toast.error('Không thể kết nối đến server. Vui lòng kiểm tra backend server.')
            } else {
                toast.error('Lỗi tải danh sách nhân sự')
            }
        } finally {
            setLoading(false)
        }
    }

    const fetchOptions = async () => {
        try {
            const response = await fetch('/api/faculties')
            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    setFacultyOptions(data.data)
                }
            }
        } catch (error) {
            console.error('Lỗi tải options:', error)
            setFacultyOptions([])
        }
    }

    const fetchDepartments = async (facultyId) => {
        try {
            const response = await fetch(`/api/departments?facultyId=${facultyId}`)
            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    setDepartmentOptions(data.data)
                }
            }
        } catch (error) {
            console.error('Lỗi tải danh sách bộ môn:', error)
            setDepartmentOptions([])
        }
    }

    const fetchStatistics = async () => {
        try {
            const response = await fetch('/api/users/statistics')
            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    setStatistics(data.data)
                }
            }
        } catch (error) {
            console.error('Lỗi tải thống kê:', error)
            // Set default statistics
            setStatistics({
                totalUsers: 0,
                activeUsers: 0,
                staffUsers: 0,
                expertUsers: 0,
                managerUsers: 0
            })
        }
    }

    const handleCreate = () => {

        setCurrentPerson(null)
        setShowCreateModal(true)
    }

    const handleEdit = (person) => {
        setCurrentPerson(person)
        setFormData({
            fullName: person.fullName,
            employeeId: person.employeeId || '',
            email: person.email,
            phoneNumber: person.phoneNumber || '',
            position: person.positions?.[0]?.title || '',
            facultyId: person.facultyId?._id || '',
            departmentId: person.departmentId?._id || '',
            qualifications: person.qualifications || [],
            specializations: person.specializations || [],
            workingYears: person.workingYears || '',
            dateOfBirth: person.dateOfBirth ? person.dateOfBirth.split('T')[0] : '',
            dateJoined: person.dateJoined ? person.dateJoined.split('T')[0] : '',
            academicLevel: person.academicLevel || 'cu_nhan',
            isExpert: person.role === 'expert',
            positions: person.positions || []
        })

        if (person.facultyId?._id) {
            fetchDepartments(person.facultyId._id)
        }

        setShowEditModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const submitData = {
                ...formData,
                role: formData.isExpert ? 'expert' : 'staff',
                positions: formData.position ? [
                    {
                        title: formData.position,
                        department: formData.departmentId,
                        isMain: true,
                        isActive: true,
                        startDate: formData.dateJoined || new Date()
                    }
                ] : []
            }

            let response, data
            if (currentPerson) {
                // Update person
                response = await fetch(`/api/users/${currentPerson._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(submitData)
                })
                data = await response.json()
                if (data.success) {
                    toast.success('Cập nhật nhân sự thành công')
                    setShowEditModal(false)
                }
            } else {
                // Create person
                response = await fetch('/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(submitData)
                })
                data = await response.json()
                if (data.success) {
                    toast.success('Tạo nhân sự thành công')
                    setShowCreateModal(false)
                }
            }

            fetchPersonnel()
            fetchStatistics()
            setCurrentPerson(null)
        } catch (error) {
            console.error('Lỗi lưu thông tin nhân sự:', error)
            toast.error('Lỗi lưu thông tin nhân sự')
        }
    }

    const handleDelete = async () => {
        try {
            const response = await fetch(`/api/users/${currentPerson._id}`, {
                method: 'DELETE'
            })
            const data = await response.json()
            if (data.success) {
                toast.success('Xóa nhân sự thành công')
                setShowDeleteModal(false)
                setCurrentPerson(null)
                fetchPersonnel()
                fetchStatistics()
            }
        } catch (error) {
            console.error('Lỗi xóa nhân sự:', error)
            toast.error('Lỗi xóa nhân sự')
        }
    }

    const handleViewDetail = async (person) => {
        try {
            const response = await fetch(`/api/users/${person._id}`)
            const data = await response.json()
            if (data.success) {
                setCurrentPerson(data.data)
                setShowDetailModal(true)
            }
        } catch (error) {
            console.error('Lỗi tải chi tiết nhân sự:', error)
            toast.error('Lỗi tải chi tiết nhân sự')
        }
    }

    const handleAddPosition = async (positionData) => {
        try {
            const response = await fetch(`/api/users/${currentPerson._id}/positions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(positionData)
            })
            const data = await response.json()
            if (data.success) {
                toast.success('Thêm chức vụ thành công')
                setShowPositionModal(false)
                fetchPersonnel()
            }
        } catch (error) {
            console.error('Lỗi thêm chức vụ:', error)
            toast.error('Lỗi thêm chức vụ')
        }
    }

    const handleRemovePosition = async (positionId) => {
        try {
            const response = await fetch(`/api/users/${currentPerson._id}/positions/${positionId}`, {
                method: 'DELETE'
            })
            const data = await response.json()
            if (data.success) {
                toast.success('Xóa chức vụ thành công')
                fetchPersonnel()
            }
        } catch (error) {
            console.error('Lỗi xóa chức vụ:', error)
            toast.error('Lỗi xóa chức vụ')
        }
    }

    const addQualification = () => {
        setFormData({
            ...formData,
            qualifications: [...formData.qualifications, '']
        })
    }

    const updateQualification = (index, value) => {
        const newQualifications = [...formData.qualifications]
        newQualifications[index] = value
        setFormData({
            ...formData,
            qualifications: newQualifications
        })
    }

    const removeQualification = (index) => {
        setFormData({
            ...formData,
            qualifications: formData.qualifications.filter((_, i) => i !== index)
        })
    }

    const addSpecialization = () => {
        setFormData({
            ...formData,
            specializations: [...formData.specializations, '']
        })
    }

    const updateSpecialization = (index, value) => {
        const newSpecializations = [...formData.specializations]
        newSpecializations[index] = value
        setFormData({
            ...formData,
            specializations: newSpecializations
        })
    }

    const removeSpecialization = (index) => {
        setFormData({
            ...formData,
            specializations: formData.specializations.filter((_, i) => i !== index)
        })
    }

    const getPositionBadge = (position) => {
        const positionConfig = positions.find(p => p.value === position)
        const colors = {
            'truong_khoa': 'bg-purple-100 text-purple-800',
            'pho_truong_khoa': 'bg-blue-100 text-blue-800',
            'truong_bo_mon': 'bg-green-100 text-green-800',
            'pho_truong_bo_mon': 'bg-yellow-100 text-yellow-800',
            'giang_vien': 'bg-gray-100 text-gray-800'
        }

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[position] || 'bg-gray-100 text-gray-800'}`}>
                {positionConfig?.label || position}
            </span>
        )
    }

    const getAcademicLevelBadge = (level) => {
        const levelConfig = academicLevels.find(l => l.value === level)
        const colors = {
            'tien_si': 'bg-red-100 text-red-800',
            'thac_si': 'bg-blue-100 text-blue-800',
            'cu_nhan': 'bg-green-100 text-green-800',
            'ky_su': 'bg-yellow-100 text-yellow-800'
        }

        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[level] || 'bg-gray-100 text-gray-800'}`}>
                {levelConfig?.label || level}
            </span>
        )
    }

    const PersonnelForm = ({ onSubmit, onClose }) => (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Họ và tên *
                    </label>
                    <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập họ và tên..."
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mã nhân viên
                    </label>
                    <input
                        type="text"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({...formData, employeeId: e.target.value.toUpperCase()})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập mã nhân viên..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="email@cmc.edu.vn"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số điện thoại
                    </label>
                    <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0123456789"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Khoa *
                    </label>
                    <select
                        value={formData.facultyId}
                        onChange={(e) => {
                            setFormData({...formData, facultyId: e.target.value, departmentId: ''})
                            if (e.target.value) {
                                fetchDepartments(e.target.value)
                            }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    >
                        <option value="">Chọn khoa...</option>
                        {facultyOptions.map(faculty => (
                            <option key={faculty._id} value={faculty._id}>
                                {faculty.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bộ môn/Ngành
                    </label>
                    <select
                        value={formData.departmentId}
                        onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!formData.facultyId}
                    >
                        <option value="">Chọn bộ môn/ngành...</option>
                        {departmentOptions.map(dept => (
                            <option key={dept._id} value={dept._id}>
                                {dept.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chức vụ chính
                    </label>
                    <select
                        value={formData.position}
                        onChange={(e) => setFormData({...formData, position: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Chọn chức vụ...</option>
                        {positions.map(position => (
                            <option key={position.value} value={position.value}>
                                {position.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trình độ học vấn
                    </label>
                    <select
                        value={formData.academicLevel}
                        onChange={(e) => setFormData({...formData, academicLevel: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {academicLevels.map(level => (
                            <option key={level.value} value={level.value}>
                                {level.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số năm kinh nghiệm
                    </label>
                    <input
                        type="number"
                        value={formData.workingYears}
                        onChange={(e) => setFormData({...formData, workingYears: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        placeholder="0"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày sinh
                    </label>
                    <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày vào làm
                    </label>
                    <input
                        type="date"
                        value={formData.dateJoined}
                        onChange={(e) => setFormData({...formData, dateJoined: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Qualifications */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                        Bằng cấp chuyên môn
                    </label>
                    <button
                        type="button"
                        onClick={addQualification}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        + Thêm bằng cấp
                    </button>
                </div>
                <div className="space-y-2">
                    {formData.qualifications.map((qualification, index) => (
                        <div key={index} className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={qualification}
                                onChange={(e) => updateQualification(index, e.target.value)}
                                placeholder="Nhập bằng cấp..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => removeQualification(index)}
                                className="text-red-600 hover:text-red-800 p-1"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Specializations */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                        Chuyên môn
                    </label>
                    <button
                        type="button"
                        onClick={addSpecialization}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        + Thêm chuyên môn
                    </button>
                </div>
                <div className="space-y-2">
                    {formData.specializations.map((specialization, index) => (
                        <div key={index} className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={specialization}
                                onChange={(e) => updateSpecialization(index, e.target.value)}
                                placeholder="Nhập chuyên môn..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => removeSpecialization(index)}
                                className="text-red-600 hover:text-red-800 p-1"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Expert status */}
            <div>
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        checked={formData.isExpert}
                        onChange={(e) => setFormData({...formData, isExpert: e.target.checked})}
                        className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Là chuyên gia đánh giá</span>
                </label>
            </div>

            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Hủy
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                    {currentPerson ? 'Cập nhật' : 'Tạo mới'}
                </button>
            </div>
        </form>
    )

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <Layout
            title=""
            breadcrumbItems={breadcrumbItems}
        >
            <div className="space-y-6">
                {/* Backend Connection Notice */}
                {personnel.length === 0 && !loading && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">
                                    Không thể kết nối đến Backend Server
                                </h3>
                                <div className="mt-2 text-sm text-yellow-700">
                                    <p>
                                        Vui lòng khởi động backend server tại port 5001.
                                        Chạy lệnh: <code className="bg-yellow-100 px-2 py-1 rounded">npm start</code> hoặc <code className="bg-yellow-100 px-2 py-1 rounded">node server.js</code> trong thư mục backend.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý Nhân sự</h1>
                        <p className="text-gray-600 mt-1">Quản lý thông tin nhân sự của trường</p>
                    </div>
                    <div className="flex space-x-3">
                        <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            <Download className="h-4 w-4 mr-2" />
                            Xuất Excel
                        </button>
                        <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            <Upload className="h-4 w-4 mr-2" />
                            Nhập Excel
                        </button>
                        <button
                            onClick={handleCreate}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Thêm nhân sự
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Tổng nhân sự</p>
                                <p className="text-2xl font-semibold text-gray-900">{statistics.totalUsers || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <GraduationCap className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Giảng viên</p>
                                <p className="text-2xl font-semibold text-gray-900">{statistics.staffUsers || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Star className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Chuyên gia</p>
                                <p className="text-2xl font-semibold text-gray-900">{statistics.expertUsers || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Award className="h-6 w-6 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Tiến sĩ</p>
                                <p className="text-2xl font-semibold text-gray-900">0</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <Briefcase className="h-6 w-6 text-gray-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Quản lý</p>
                                <p className="text-2xl font-semibold text-gray-900">{statistics.managerUsers || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Tìm kiếm nhân sự..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <select
                                value={filters.facultyId}
                                onChange={(e) => {
                                    setFilters({...filters, facultyId: e.target.value, departmentId: ''})
                                    if (e.target.value) {
                                        fetchDepartments(e.target.value)
                                    }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tất cả khoa</option>
                                {facultyOptions.map(faculty => (
                                    <option key={faculty._id} value={faculty._id}>{faculty.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <select
                                value={filters.departmentId}
                                onChange={(e) => setFilters({...filters, departmentId: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={!filters.facultyId}
                            >
                                <option value="">Tất cả bộ môn</option>
                                {departmentOptions.map(dept => (
                                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <select
                                value={filters.position}
                                onChange={(e) => setFilters({...filters, position: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tất cả chức vụ</option>
                                {positions.map(position => (
                                    <option key={position.value} value={position.value}>{position.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <select
                                value={filters.isExpert}
                                onChange={(e) => setFilters({...filters, isExpert: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tất cả</option>
                                <option value="true">Chuyên gia</option>
                                <option value="false">Không phải chuyên gia</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Personnel Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nhân sự
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Đơn vị
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Chức vụ
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trình độ
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Liên hệ
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center">
                                        <div className="flex justify-center">
                                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : personnel.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                        Không có dữ liệu
                                    </td>
                                </tr>
                            ) : (
                                personnel.map(person => (
                                    <tr key={person._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                                    <User className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {person.fullName}
                                                        </div>
                                                        {person.role === 'expert' && (
                                                            <Star className="h-4 w-4 text-yellow-500 ml-2" />
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {person.employeeId || person.email.split('@')[0]}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {person.facultyId?.name}
                                                </div>
                                                {person.departmentId && (
                                                    <div className="text-sm text-gray-500">
                                                        {person.departmentId.name}
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            {person.positions && person.positions.length > 0 ? (
                                                <div className="space-y-1">
                                                    {person.positions.slice(0, 2).map((position, index) => (
                                                        <div key={index}>
                                                            {getPositionBadge(position.title)}
                                                        </div>
                                                    ))}
                                                    {person.positions.length > 2 && (
                                                        <span className="text-xs text-gray-500">
                                                            +{person.positions.length - 2} khác
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-500">Chưa có</span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4">
                                            {getAcademicLevelBadge(person.academicLevel)}
                                            {person.qualifications && person.qualifications.length > 0 && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {person.qualifications.slice(0, 2).join(', ')}
                                                    {person.qualifications.length > 2 && '...'}
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Mail className="h-3 w-3 mr-1" />
                                                    {person.email}
                                                </div>
                                                {person.phoneNumber && (
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Phone className="h-3 w-3 mr-1" />
                                                        {person.phoneNumber}
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                person.status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {person.status === 'active' ? 'Đang làm việc' : 'Nghỉ việc'}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleViewDetail(person)}
                                                    className="text-blue-600 hover:text-blue-800 p-1"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(person)}
                                                    className="text-green-600 hover:text-green-800 p-1"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setCurrentPerson(person)
                                                        setShowDeleteModal(true)
                                                    }}
                                                    className="text-red-600 hover:text-red-800 p-1"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="border-t border-gray-200 px-6 py-3">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={pagination.total}
                                itemsPerPage={10}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>

                {/* Create Personnel Modal */}
                <Modal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="Thêm nhân sự mới"
                    size="large"
                >
                    <PersonnelForm
                        onSubmit={handleSubmit}
                        onClose={() => setShowCreateModal(false)}
                    />
                </Modal>

                {/* Edit Personnel Modal */}
                <Modal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    title="Chỉnh sửa nhân sự"
                    size="large"
                >
                    <PersonnelForm
                        onSubmit={handleSubmit}
                        onClose={() => setShowEditModal(false)}
                    />
                </Modal>

                {/* Personnel Detail Modal */}
                <Modal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    title="Chi tiết nhân sự"
                    size="large"
                >
                    {currentPerson && (
                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        {currentPerson.fullName}
                                        {currentPerson.role === 'expert' && (
                                            <Star className="inline h-5 w-5 text-yellow-500 ml-2" />
                                        )}
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Mã nhân viên:</span>
                                            <p className="mt-1 text-sm text-gray-900">{currentPerson.employeeId || 'Chưa có'}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Email:</span>
                                            <p className="mt-1 text-sm text-gray-900">{currentPerson.email}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Số điện thoại:</span>
                                            <p className="mt-1 text-sm text-gray-900">{currentPerson.phoneNumber || 'Chưa có'}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Trình độ:</span>
                                            <p className="mt-1">{getAcademicLevelBadge(currentPerson.academicLevel)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Đơn vị công tác</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Khoa:</span>
                                            <p className="mt-1 text-sm text-gray-900">{currentPerson.facultyId?.name}</p>
                                        </div>
                                        {currentPerson.departmentId && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-500">Bộ môn/Ngành:</span>
                                                <p className="mt-1 text-sm text-gray-900">{currentPerson.departmentId.name}</p>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Số năm kinh nghiệm:</span>
                                            <p className="mt-1 text-sm text-gray-900">{currentPerson.workingYears || 0} năm</p>
                                        </div>
                                        {currentPerson.dateJoined && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-500">Ngày vào làm:</span>
                                                <p className="mt-1 text-sm text-gray-900">
                                                    {formatDate(currentPerson.dateJoined)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Qualifications */}
                            {currentPerson.qualifications && currentPerson.qualifications.length > 0 && (
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Bằng cấp chuyên môn</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {currentPerson.qualifications.map((qualification, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                                            >
                                                {qualification}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Specializations */}
                            {currentPerson.specializations && currentPerson.specializations.length > 0 && (
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Lĩnh vực chuyên môn</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {currentPerson.specializations.map((specialization, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                                            >
                                                {specialization}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Positions */}
                            {currentPerson.positions && currentPerson.positions.length > 0 && (
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Chức vụ hiện tại</h4>
                                    <div className="space-y-2">
                                        {currentPerson.positions.map((position, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    {getPositionBadge(position.title)}
                                                    {position.department && (
                                                        <span className="text-sm text-gray-600">{position.department.name}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {position.isMain && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                            Chính
                                                        </span>
                                                    )}
                                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                                        position.isActive
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {position.isActive ? 'Đang giữ' : 'Đã kết thúc'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Additional Info */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khác</h4>
                                <div className="grid grid-cols-2 gap-6">
                                    {currentPerson.dateOfBirth && (
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Ngày sinh:</span>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {formatDate(currentPerson.dateOfBirth)}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Trạng thái chuyên gia:</span>
                                        <p className="mt-1">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                currentPerson.role === 'expert'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {currentPerson.role === 'expert' ? 'Là chuyên gia' : 'Không phải chuyên gia'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    title="Xác nhận xóa"
                >
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Bạn có chắc chắn muốn xóa nhân sự <strong>{currentPerson?.fullName}</strong>?
                        </p>
                        <p className="text-sm text-red-600">
                            Hành động này không thể hoàn tác.
                        </p>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </Layout>
    )
}