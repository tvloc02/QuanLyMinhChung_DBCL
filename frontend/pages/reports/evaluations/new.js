import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../contexts/AuthContext'
import Layout from '../../../components/common/Layout'
import { apiMethods } from '../../../services/api'
import toast from 'react-hot-toast'
import {
    Plus, Save, ArrowLeft, FileText, Loader2, AlertCircle, X,
    BookOpen, UserCheck, Calendar
} from 'lucide-react'

export default function CreateEvaluationPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const { assignmentId } = router.query

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [assignment, setAssignment] = useState(null)
    const [report, setReport] = useState(null)
    const [message, setMessage] = useState({ type: '', text: '' })

    const breadcrumbItems = [
        { name: 'Phân công', path: '/reports/assignments' },
        { name: 'Đánh giá của tôi', path: '/reports/expert-assignments' },
        { name: 'Tạo đánh giá mới', icon: Plus }
    ]

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        } else if (user && assignmentId) {
            fetchAssignmentDetails()
        }
    }, [user, isLoading, assignmentId, router])

    const fetchAssignmentDetails = async () => {
        try {
            setLoading(true)
            const assignmentRes = await apiMethods.assignments.getById(assignmentId)
            const assignmentData = assignmentRes.data?.data
            setAssignment(assignmentData)

            if (assignmentData.evaluationId) {
                // Nếu đã có Evaluation, chuyển hướng sang trang chỉnh sửa
                router.replace(`/reports/evaluations/${assignmentData.evaluationId}`);
                return;
            }

            // Lấy thông tin report (giả định assignment trả về reportId đã populate)
            // Nếu không, cần gọi thêm apiMethods.reports.getById(assignmentData.reportId)
            setReport(assignmentData.reportId);

        } catch (error) {
            console.error('Fetch assignment error:', error)
            toast.error('Lỗi tải thông tin phân công')
            router.push('/reports/expert-assignments'); // Quay lại trang danh sách
        } finally {
            setLoading(false)
        }
    }

    const handleCreateEvaluation = async (e) => {
        e.preventDefault()

        if (!assignmentId) return;

        try {
            setSubmitting(true)
            const response = await apiMethods.evaluations.create({ assignmentId })

            if (response.data.success) {
                toast.success('Khởi tạo đánh giá thành công. Bắt đầu đánh giá!')
                // Chuyển hướng đến trang chỉnh sửa đánh giá vừa tạo
                const newEvaluationId = response.data.data._id;
                setTimeout(() => {
                    router.push(`/reports/evaluations/${newEvaluationId}`)
                }, 1000)
            }
        } catch (error) {
            console.error('Create evaluation error:', error)
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Lỗi khởi tạo đánh giá'
            })
        } finally {
            setSubmitting(false)
        }
    }

    if (isLoading || loading) {
        return (
            <Layout title="Đang tải..." breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </Layout>
        )
    }

    if (!user || !assignment) {
        return null;
    }

    // Đảm bảo chỉ Expert mới có quyền tạo đánh giá cho assignment của mình
    if (assignment.expertId.toString() !== user.id.toString()) {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="p-8 text-center bg-red-50 border border-red-200 rounded-xl mt-6">
                    <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-800">Truy cập bị từ chối</h2>
                    <p className="text-red-700">Bạn không phải là chuyên gia được phân công cho nhiệm vụ này.</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="max-w-8xl mx-auto space-y-6">

                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                                <BookOpen className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Khởi tạo đánh giá báo cáo</h1>
                                <p className="text-purple-100">Bắt đầu quá trình đánh giá cho phân công đã chọn</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/reports/expert-assignments')}
                            className="flex items-center space-x-2 px-6 py-3 bg-white text-purple-600 rounded-xl hover:shadow-xl transition-all font-medium"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Danh sách phân công</span>
                        </button>
                    </div>
                </div>

                {/* Assignment Info */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Thông tin phân công</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                        <div className='flex items-center space-x-2'>
                            <FileText className='w-5 h-5 text-indigo-500' />
                            <span className="font-semibold text-gray-700">Báo cáo:</span>
                            <span className="text-gray-900">{report?.title} ({report?.code})</span>
                        </div>
                        <div className='flex items-center space-x-2'>
                            <Calendar className='w-5 h-5 text-indigo-500' />
                            <span className="font-semibold text-gray-700">Hạn chót:</span>
                            <span className="text-gray-900">{formatDate(assignment.deadline)}</span>
                        </div>
                        <div className='flex items-center space-x-2'>
                            <UserCheck className='w-5 h-5 text-indigo-500' />
                            <span className="font-semibold text-gray-700">Phân công bởi:</span>
                            <span className="text-gray-900">{assignment.assignedBy?.fullName || 'N/A'}</span>
                        </div>
                        <div className='flex items-center space-x-2'>
                            <AlertCircle className='w-5 h-5 text-indigo-500' />
                            <span className="font-semibold text-gray-700">Trạng thái hiện tại:</span>
                            <span className="text-green-600 font-bold">{assignment.statusText}</span>
                        </div>
                    </div>

                    {assignment.assignmentNote && (
                        <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                            <span className="font-semibold text-indigo-800">Ghi chú từ Người phân công:</span>
                            <p className="text-indigo-900 mt-1">{assignment.assignmentNote}</p>
                        </div>
                    )}
                </div>

                {/* Action Block */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                    {message.text && (
                        <div className={`rounded-lg border p-4 mb-6 ${message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                            {message.text}
                        </div>
                    )}
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        Sẵn sàng để bắt đầu đánh giá?
                    </h3>
                    <p className="text-gray-600 mb-8">
                        Thao tác này sẽ khởi tạo một Bản nháp đánh giá (Draft Evaluation) và cập nhật trạng thái phân công thành **Đang đánh giá**.
                    </p>
                    <button
                        onClick={handleCreateEvaluation}
                        disabled={submitting || assignment.status === 'completed'}
                        className="flex items-center justify-center space-x-2 px-10 py-4 mx-auto bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-xl disabled:opacity-50 transition-all font-medium text-lg"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span>Đang khởi tạo...</span>
                            </>
                        ) : (
                            <>
                                <BookOpen className="w-6 h-6" />
                                <span>Khởi tạo và Bắt đầu Đánh giá</span>
                            </>
                        )}
                    </button>
                    {assignment.status === 'completed' && <p className="text-red-500 mt-4">Phân công này đã hoàn thành.</p>}
                </div>
            </div>
        </Layout>
    )
}