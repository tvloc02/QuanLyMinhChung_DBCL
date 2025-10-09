import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
    AlertCircle, Save, X, Eye, EyeOff, Plus, Trash, Users, Shield,
    Sparkles, Zap, Loader2, User, Mail, Phone, MapPin, Briefcase,
    GraduationCap, Award, Calendar, Globe, FileText
} from 'lucide-react'
import api from '../../services/api'

export default function CreateUserForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [generatedPassword, setGeneratedPassword] = useState('')
    const [expertiseInput, setExpertiseInput] = useState('')
    const [useCustomPassword, setUseCustomPassword] = useState(false)
    const [activeTab, setActiveTab] = useState('basic') // basic, roles, access, additional

    const [formData, setFormData] = useState({
        // Thông tin cơ bản
        email: '',
        fullName: '',
        password: '',
        phoneNumber: '',
        dateOfBirth: '',
        gender: '',
        bio: '',

        // Vai trò - Mảng roles
        roles: [],

        status: 'active',
        department: '',
        position: '',
        expertise: [],

        // Địa chỉ
        address: {
            street: '',
            city: '',
            state: '',
            country: 'Vietnam',
            zipCode: ''
        },

        // Social links
        socialLinks: {
            linkedin: '',
            facebook: '',
            twitter: ''
        },

        // Languages
        languages: [],

        // Education
        education: [],

        // Work Experience
        workExperience: [],

        // Certifications
        certifications: [],

        // Nhóm và quyền
        userGroups: [],
        mustChangePassword: true,
        academicYearAccess: [],
        programAccess: [],
        organizationAccess: [],
        standardAccess: [],
        criteriaAccess: [],

        notificationSettings: {
            email: true,
            inApp: true,
            assignment: true,
            evaluation: true,
            deadline: true
        }
    })

    const [errors, setErrors] = useState({})
    const [accessOptions, setAccessOptions] = useState({
        academicYears: [],
        programs: [],
        organizations: [],
        standards: [],
        criteria: [],
        userGroups: []
    })

    const roleOptions = [
        { value: 'admin', label: 'Quản trị viên', color: 'from-red-500 to-pink-500', icon: '👑' },
        { value: 'manager', label: 'Cán bộ quản lý', color: 'from-blue-500 to-indigo-500', icon: '📊' },
        { value: 'expert', label: 'Chuyên gia đánh giá', color: 'from-green-500 to-emerald-500', icon: '🎓' },
        { value: 'advisor', label: 'Tư vấn/Giám sát', color: 'from-purple-500 to-violet-500', icon: '💡' }
    ]

    const genderOptions = [
        { value: 'male', label: 'Nam' },
        { value: 'female', label: 'Nữ' },
        { value: 'other', label: 'Khác' }
    ]

    useEffect(() => {
        fetchAccessOptions()
    }, [])

    const fetchAccessOptions = async () => {
        try {
            const [academicYears, programs, organizations, standards, criteria, userGroups] = await Promise.all([
                api.get('/academic-years').catch(() => ({ data: { data: [] } })),
                api.get('/programs').catch(() => ({ data: { data: [] } })),
                api.get('/organizations').catch(() => ({ data: { data: [] } })),
                api.get('/standards').catch(() => ({ data: { data: [] } })),
                api.get('/criteria').catch(() => ({ data: { data: [] } })),
                api.get('/user-groups').catch(() => ({ data: { data: { groups: [] } } }))
            ])

            setAccessOptions({
                academicYears: academicYears.data.data || [],
                programs: programs.data.data || [],
                organizations: organizations.data.data || [],
                standards: standards.data.data || [],
                criteria: criteria.data.data || [],
                userGroups: userGroups.data.data.groups || []
            })
        } catch (error) {
            console.error('Error fetching access options:', error)
        }
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target

        if (type === 'checkbox') {
            if (name.includes('.')) {
                const [parent, child] = name.split('.')
                setFormData(prev => ({
                    ...prev,
                    [parent]: {
                        ...prev[parent],
                        [child]: checked
                    }
                }))
            } else {
                setFormData(prev => ({ ...prev, [name]: checked }))
            }
        } else if (name.includes('.')) {
            const [parent, child] = name.split('.')
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const toggleRole = (role) => {
        setFormData(prev => {
            const roles = prev.roles.includes(role)
                ? prev.roles.filter(r => r !== role)
                : [...prev.roles, role]
            return { ...prev, roles }
        })
    }

    const handleMultiSelect = (name, value) => {
        setFormData(prev => {
            const currentValues = prev[name] || []
            if (currentValues.includes(value)) {
                return {
                    ...prev,
                    [name]: currentValues.filter(v => v !== value)
                }
            } else {
                return {
                    ...prev,
                    [name]: [...currentValues, value]
                }
            }
        })
    }

    const addExpertise = () => {
        if (expertiseInput.trim()) {
            setFormData(prev => ({
                ...prev,
                expertise: [...prev.expertise, expertiseInput.trim()]
            }))
            setExpertiseInput('')
        }
    }

    const removeExpertise = (index) => {
        setFormData(prev => ({
            ...prev,
            expertise: prev.expertise.filter((_, i) => i !== index)
        }))
    }

    const addEducation = () => {
        setFormData(prev => ({
            ...prev,
            education: [...prev.education, {
                institution: '',
                degree: '',
                fieldOfStudy: '',
                startDate: '',
                endDate: '',
                description: ''
            }]
        }))
    }

    const removeEducation = (index) => {
        setFormData(prev => ({
            ...prev,
            education: prev.education.filter((_, i) => i !== index)
        }))
    }

    const updateEducation = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            education: prev.education.map((edu, i) =>
                i === index ? { ...edu, [field]: value } : edu
            )
        }))
    }

    const addWorkExperience = () => {
        setFormData(prev => ({
            ...prev,
            workExperience: [...prev.workExperience, {
                company: '',
                position: '',
                startDate: '',
                endDate: '',
                current: false,
                description: ''
            }]
        }))
    }

    const removeWorkExperience = (index) => {
        setFormData(prev => ({
            ...prev,
            workExperience: prev.workExperience.filter((_, i) => i !== index)
        }))
    }

    const updateWorkExperience = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            workExperience: prev.workExperience.map((exp, i) =>
                i === index ? { ...exp, [field]: value } : exp
            )
        }))
    }

    const addCertification = () => {
        setFormData(prev => ({
            ...prev,
            certifications: [...prev.certifications, {
                name: '',
                issuer: '',
                issueDate: '',
                expiryDate: '',
                credentialId: ''
            }]
        }))
    }

    const removeCertification = (index) => {
        setFormData(prev => ({
            ...prev,
            certifications: prev.certifications.filter((_, i) => i !== index)
        }))
    }

    const updateCertification = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            certifications: prev.certifications.map((cert, i) =>
                i === index ? { ...cert, [field]: value } : cert
            )
        }))
    }

    const validateForm = () => {
        const newErrors = {}

        if (!formData.email.trim()) {
            newErrors.email = 'Email là bắt buộc'
        }

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Họ tên là bắt buộc'
        } else if (formData.fullName.trim().length < 2) {
            newErrors.fullName = 'Họ tên phải có ít nhất 2 ký tự'
        }

        if (formData.roles.length === 0) {
            newErrors.roles = 'Phải chọn ít nhất một vai trò'
        }

        if (formData.phoneNumber && !/^[0-9]{10,11}$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = 'Số điện thoại không hợp lệ'
        }

        if (useCustomPassword) {
            if (!formData.password) {
                newErrors.password = 'Mật khẩu là bắt buộc'
            } else if (formData.password.length < 6) {
                newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            setMessage({
                type: 'error',
                text: 'Vui lòng kiểm tra lại thông tin'
            })
            return
        }

        try {
            setLoading(true)
            setMessage({ type: '', text: '' })

            const dataToSend = { ...formData }

            if (!useCustomPassword) {
                delete dataToSend.password
            }

            const response = await api.post('/api/users', dataToSend)

            if (response.data.success) {
                setGeneratedPassword(response.data.data.defaultPassword)
                setMessage({
                    type: 'success',
                    text: `Tạo người dùng thành công!`
                })

                setTimeout(() => {
                    router.push('/users/users')
                }, 3000)
            }
        } catch (error) {
            console.error('Error creating user:', error)
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Lỗi khi tạo người dùng'
            })
        } finally {
            setLoading(false)
        }
    }

    const tabs = [
        { id: 'basic', label: 'Thông tin cơ bản', icon: User },
        { id: 'roles', label: 'Vai trò & Nhóm', icon: Shield },
        { id: 'access', label: 'Phân quyền', icon: Award },
        { id: 'additional', label: 'Thông tin bổ sung', icon: FileText }
    ]

    return (
        <div className="space-y-6">
            {/* Success/Error Message */}
            {message.text && (
                <div className={`rounded-2xl border p-6 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300 ${
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
                            <h3 className={`font-bold text-lg mb-2 ${
                                message.type === 'success' ? 'text-green-900' : 'text-red-900'
                            }`}>
                                {message.type === 'success' ? 'Thành công!' : 'Có lỗi xảy ra'}
                            </h3>
                            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                                {message.text}
                            </p>
                            {generatedPassword && (
                                <div className="mt-4 p-4 bg-white rounded-xl border border-green-200 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-green-900 font-semibold mb-1">Mật khẩu mặc định:</p>
                                            <p className="font-mono font-bold text-green-900 text-lg">
                                                {showPassword ? generatedPassword : '••••••••'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="px-4 py-2 text-sm text-green-700 hover:text-green-900 bg-green-50 hover:bg-green-100 rounded-lg transition-all font-medium"
                                        >
                                            {showPassword ? 'Ẩn' : 'Hiện'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tabs Navigation */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
                    <div className="flex gap-2 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Basic Info Tab */}
                    {activeTab === 'basic' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Thông tin cá nhân */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl">
                                        <User className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Thông tin cá nhân</h3>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                                    errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200'
                                                }`}
                                                placeholder="vd: nguyenvana"
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className="mt-2 text-sm text-red-600 flex items-center">
                                                <AlertCircle className="w-4 h-4 mr-1" />
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Họ và tên <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                                errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-200'
                                            }`}
                                            placeholder="Nguyễn Văn A"
                                        />
                                        {errors.fullName && (
                                            <p className="mt-2 text-sm text-red-600 flex items-center">
                                                <AlertCircle className="w-4 h-4 mr-1" />
                                                {errors.fullName}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Số điện thoại
                                            </label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    name="phoneNumber"
                                                    value={formData.phoneNumber}
                                                    onChange={handleChange}
                                                    className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                                        errors.phoneNumber ? 'border-red-500 bg-red-50' : 'border-gray-200'
                                                    }`}
                                                    placeholder="0123456789"
                                                />
                                            </div>
                                            {errors.phoneNumber && (
                                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                                    <AlertCircle className="w-4 h-4 mr-1" />
                                                    {errors.phoneNumber}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Ngày sinh
                                            </label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="date"
                                                    name="dateOfBirth"
                                                    value={formData.dateOfBirth}
                                                    onChange={handleChange}
                                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Giới tính
                                        </label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        >
                                            <option value="">Chọn giới tính</option>
                                            {genderOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Phòng ban
                                            </label>
                                            <input
                                                type="text"
                                                name="department"
                                                value={formData.department}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                                placeholder="Phòng Đảm bảo chất lượng"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Chức vụ
                                            </label>
                                            <input
                                                type="text"
                                                name="position"
                                                value={formData.position}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                                placeholder="Chuyên viên"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Giới thiệu bản thân
                                        </label>
                                        <textarea
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleChange}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                                            placeholder="Giới thiệu ngắn về bản thân..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Địa chỉ */}
                            <div className="space-y-6">
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                                            <MapPin className="w-6 h-6 text-green-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">Địa chỉ</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Địa chỉ
                                            </label>
                                            <input
                                                type="text"
                                                name="address.street"
                                                value={formData.address.street}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                                placeholder="Số nhà, tên đường"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Thành phố
                                                </label>
                                                <input
                                                    type="text"
                                                    name="address.city"
                                                    value={formData.address.city}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                                    placeholder="Hà Nội"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Quốc gia
                                                </label>
                                                <input
                                                    type="text"
                                                    name="address.country"
                                                    value={formData.address.country}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                                    placeholder="Vietnam"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Social Links */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                                            <Globe className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">Mạng xã hội</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                LinkedIn
                                            </label>
                                            <input
                                                type="url"
                                                name="socialLinks.linkedin"
                                                value={formData.socialLinks.linkedin}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                                placeholder="https://linkedin.com/in/..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Facebook
                                            </label>
                                            <input
                                                type="url"
                                                name="socialLinks.facebook"
                                                value={formData.socialLinks.facebook}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                                placeholder="https://facebook.com/..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Twitter
                                            </label>
                                            <input
                                                type="url"
                                                name="socialLinks.twitter"
                                                value={formData.socialLinks.twitter}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                                placeholder="https://twitter.com/..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Mật khẩu */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                                            <Shield className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">Mật khẩu</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    checked={!useCustomPassword}
                                                    onChange={() => setUseCustomPassword(false)}
                                                    className="w-5 h-5 text-indigo-600"
                                                />
                                                <div className="flex items-center space-x-2">
                                                    <Sparkles className="w-5 h-5 text-indigo-600" />
                                                    <span className="text-sm font-semibold text-indigo-900">
                                                        Sử dụng mật khẩu mặc định (TênĐăngNhập@123)
                                                    </span>
                                                </div>
                                            </label>
                                        </div>

                                        <div className="p-4 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all">
                                            <label className="flex items-start gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="mustChangePassword"
                                                    checked={formData.mustChangePassword}
                                                    onChange={handleChange}
                                                    className="w-5 h-5 mt-1 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <div>
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        Bắt buộc đổi mật khẩu ở lần đăng nhập đầu
                                                    </span>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Người dùng sẽ phải đổi mật khẩu ngay sau khi đăng nhập lần đầu
                                                    </p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Roles Tab */}
                    {activeTab === 'roles' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Vai trò */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                                        <Shield className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Vai trò</h3>
                                        <p className="text-sm text-gray-500">Chọn một hoặc nhiều vai trò</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {roleOptions.map((role) => (
                                        <div
                                            key={role.value}
                                            onClick={() => toggleRole(role.value)}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                formData.roles.includes(role.value)
                                                    ? `border-transparent bg-gradient-to-r ${role.color} shadow-lg`
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`text-3xl ${formData.roles.includes(role.value) ? 'grayscale-0' : 'grayscale'}`}>
                                                    {role.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <div className={`font-bold ${
                                                        formData.roles.includes(role.value) ? 'text-white' : 'text-gray-900'
                                                    }`}>
                                                        {role.label}
                                                    </div>
                                                    <div className={`text-sm ${
                                                        formData.roles.includes(role.value) ? 'text-white/90' : 'text-gray-500'
                                                    }`}>
                                                        {role.value}
                                                    </div>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                                    formData.roles.includes(role.value)
                                                        ? 'bg-white border-white'
                                                        : 'border-gray-300'
                                                }`}>
                                                    {formData.roles.includes(role.value) && (
                                                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {errors.roles && (
                                    <p className="mt-4 text-sm text-red-600 flex items-center bg-red-50 p-3 rounded-lg">
                                        <AlertCircle className="w-4 h-4 mr-2" />
                                        {errors.roles}
                                    </p>
                                )}

                                {formData.roles.length > 0 && (
                                    <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                                        <p className="text-sm font-semibold text-indigo-900 mb-2">
                                            Đã chọn {formData.roles.length} vai trò:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.roles.map(r => {
                                                const roleOption = roleOptions.find(ro => ro.value === r)
                                                return (
                                                    <span key={r} className="px-3 py-1 bg-white text-indigo-700 rounded-lg text-sm font-medium border border-indigo-200">
                                                        {roleOption?.icon} {roleOption?.label}
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Nhóm người dùng */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                                        <Users className="w-6 h-6 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Nhóm người dùng</h3>
                                </div>

                                {accessOptions.userGroups.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                                        <p className="text-sm text-gray-500">Chưa có nhóm người dùng nào</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                        {accessOptions.userGroups.map((group) => (
                                            <label
                                                key={group._id}
                                                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                    formData.userGroups?.includes(group._id)
                                                        ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-sm'
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.userGroups?.includes(group._id)}
                                                    onChange={() => handleMultiSelect('userGroups', group._id)}
                                                    className="w-5 h-5 mt-1 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-gray-900">{group.name}</div>
                                                    <div className="text-xs text-gray-500 mt-1 font-mono">{group.code}</div>
                                                    {group.description && (
                                                        <div className="text-xs text-gray-600 mt-2">{group.description}</div>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                                                        <span className={`text-xs px-3 py-1 rounded-full font-medium border ${
                                                            group.type === 'system' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                                'bg-green-100 text-green-700 border-green-200'
                                                        }`}>
                                                            {group.type === 'system' ? 'Hệ thống' : 'Tùy chỉnh'}
                                                        </span>
                                                        {group.permissions && (
                                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                                                                {group.permissions.length} quyền
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Access Tab */}
                    {activeTab === 'access' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl">
                                    <Award className="w-6 h-6 text-orange-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Phân quyền truy cập</h3>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {[
                                    { key: 'academicYearAccess', label: 'Năm học', options: accessOptions.academicYears, color: 'blue' },
                                    { key: 'programAccess', label: 'Chương trình', options: accessOptions.programs, color: 'green' },
                                    { key: 'organizationAccess', label: 'Tổ chức', options: accessOptions.organizations, color: 'purple' },
                                    { key: 'standardAccess', label: 'Tiêu chuẩn', options: accessOptions.standards, color: 'orange' },
                                    { key: 'criteriaAccess', label: 'Tiêu chí', options: accessOptions.criteria, color: 'pink' }
                                ].map((section) => (
                                    section.options.length > 0 && (
                                        <div key={section.key} className="bg-gray-50 rounded-xl p-4">
                                            <label className="block text-sm font-semibold text-gray-900 mb-3">
                                                {section.label}
                                                <span className={`ml-2 text-xs text-${section.color}-600 bg-${section.color}-50 px-3 py-1 rounded-lg font-semibold`}>
                                                    {formData[section.key].length} đã chọn
                                                </span>
                                            </label>
                                            <div className="max-h-48 overflow-y-auto border-2 border-gray-200 rounded-xl p-3 space-y-2 bg-white">
                                                {section.options.map((item) => (
                                                    <label
                                                        key={item._id}
                                                        className="flex items-center gap-3 p-3 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 rounded-lg cursor-pointer transition-all"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={formData[section.key].includes(item._id)}
                                                            onChange={() => handleMultiSelect(section.key, item._id)}
                                                            className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                                        />
                                                        <span className="text-sm text-gray-700 font-medium">{item.code} - {item.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>

                            {/* Notification Settings */}
                            <div className="mt-6 bg-gray-50 rounded-xl p-4">
                                <h4 className="text-sm font-bold text-gray-900 mb-4">Cài đặt thông báo</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {[
                                        { name: 'email', label: 'Email' },
                                        { name: 'inApp', label: 'Trong ứng dụng' },
                                        { name: 'assignment', label: 'Phân công' },
                                        { name: 'evaluation', label: 'Đánh giá' },
                                        { name: 'deadline', label: 'Deadline' }
                                    ].map((item) => (
                                        <label key={item.name} className="flex items-center gap-3 p-3 hover:bg-white rounded-xl cursor-pointer transition-all border border-transparent hover:border-gray-200">
                                            <input
                                                type="checkbox"
                                                name={`notificationSettings.${item.name}`}
                                                checked={formData.notificationSettings[item.name]}
                                                onChange={handleChange}
                                                className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-700 font-medium">{item.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Additional Info Tab */}
                    {activeTab === 'additional' && (
                        <div className="space-y-6">
                            {/* Lĩnh vực chuyên môn */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                                        <Briefcase className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Lĩnh vực chuyên môn</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={expertiseInput}
                                            onChange={(e) => setExpertiseInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                                            placeholder="Nhập lĩnh vực chuyên môn"
                                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={addExpertise}
                                            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg flex items-center gap-2 transition-all font-medium"
                                        >
                                            <Plus className="w-5 h-5" />
                                            Thêm
                                        </button>
                                    </div>

                                    {formData.expertise.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {formData.expertise.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-full border-2 border-indigo-200"
                                                >
                                                    <span className="text-sm font-medium">{item}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeExpertise(index)}
                                                        className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-full p-1 transition-all"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Education */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                                            <GraduationCap className="w-6 h-6 text-green-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">Học vấn</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addEducation}
                                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg flex items-center gap-2 transition-all font-medium text-sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Thêm
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {formData.education.map((edu, index) => (
                                        <div key={index} className="p-4 border-2 border-gray-200 rounded-xl space-y-3">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-semibold text-gray-900">Học vấn #{index + 1}</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => removeEducation(index)}
                                                    className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="Trường/Tổ chức"
                                                    value={edu.institution}
                                                    onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                                                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Bằng cấp"
                                                    value={edu.degree}
                                                    onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Chuyên ngành"
                                                    value={edu.fieldOfStudy}
                                                    onChange={(e) => updateEducation(index, 'fieldOfStudy', e.target.value)}
                                                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <input
                                                    type="date"
                                                    placeholder="Ngày bắt đầu"
                                                    value={edu.startDate}
                                                    onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                                                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Work Experience - Similar structure */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl">
                                            <Briefcase className="w-6 h-6 text-orange-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">Kinh nghiệm làm việc</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addWorkExperience}
                                        className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:shadow-lg flex items-center gap-2 transition-all font-medium text-sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Thêm
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {formData.workExperience.map((exp, index) => (
                                        <div key={index} className="p-4 border-2 border-gray-200 rounded-xl space-y-3">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-semibold text-gray-900">Kinh nghiệm #{index + 1}</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => removeWorkExperience(index)}
                                                    className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="Công ty"
                                                    value={exp.company}
                                                    onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                                                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Vị trí"
                                                    value={exp.position}
                                                    onChange={(e) => updateWorkExperience(index, 'position', e.target.value)}
                                                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <input
                                                    type="date"
                                                    placeholder="Ngày bắt đầu"
                                                    value={exp.startDate}
                                                    onChange={(e) => updateWorkExperience(index, 'startDate', e.target.value)}
                                                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <input
                                                    type="date"
                                                    placeholder="Ngày kết thúc"
                                                    value={exp.endDate}
                                                    onChange={(e) => updateWorkExperience(index, 'endDate', e.target.value)}
                                                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    disabled={exp.current}
                                                />
                                            </div>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={exp.current}
                                                    onChange={(e) => updateWorkExperience(index, 'current', e.target.checked)}
                                                    className="w-4 h-4 text-indigo-600 rounded"
                                                />
                                                <span className="text-sm text-gray-700">Đang làm việc</span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Certifications */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                                            <Award className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">Chứng chỉ</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addCertification}
                                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg flex items-center gap-2 transition-all font-medium text-sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Thêm
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {formData.certifications.map((cert, index) => (
                                        <div key={index} className="p-4 border-2 border-gray-200 rounded-xl space-y-3">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-semibold text-gray-900">Chứng chỉ #{index + 1}</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => removeCertification(index)}
                                                    className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="Tên chứng chỉ"
                                                    value={cert.name}
                                                    onChange={(e) => updateCertification(index, 'name', e.target.value)}
                                                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Tổ chức cấp"
                                                    value={cert.issuer}
                                                    onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                                                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <input
                                                    type="date"
                                                    placeholder="Ngày cấp"
                                                    value={cert.issueDate}
                                                    onChange={(e) => updateCertification(index, 'issueDate', e.target.value)}
                                                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Mã chứng chỉ"
                                                    value={cert.credentialId}
                                                    onChange={(e) => updateCertification(index, 'credentialId', e.target.value)}
                                                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-4 sticky bottom-0 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-8 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium"
                        disabled={loading}
                    >
                        <div className="flex items-center space-x-2">
                            <X className="w-5 h-5" />
                            <span>Hủy</span>
                        </div>
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Đang tạo...</span>
                            </>
                        ) : (
                            <>
                                <Zap className="w-5 h-5" />
                                <span>Tạo người dùng</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}