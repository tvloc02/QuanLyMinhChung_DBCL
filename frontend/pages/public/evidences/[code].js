import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { ArrowLeft, Loader2, AlertCircle, FileText } from 'lucide-react'

export default function PublicEvidenceView() {
    const router = useRouter()
    const { code } = router.query
    const [evidence, setEvidence] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (code) {
            fetchEvidence()
        }
    }, [code])

    const fetchEvidence = async () => {
        try {
            setLoading(true)
            const response = await axios.get(`/public/evidences/${code}`)

            if (response.data.success) {
                setEvidence(response.data.data)
            } else {
                setError(response.data.message || 'Không tìm thấy minh chứng')
            }
        } catch (err) {
            console.error('Fetch evidence error:', err)
            setError(err.response?.data?.message || 'Lỗi khi tải minh chứng')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Đang tải minh chứng...</p>
                </div>
            </div>
        )
    }

    if (error || !evidence) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
                    <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
                        Lỗi
                    </h1>
                    <p className="text-center text-gray-600 mb-6">
                        {error || 'Không tìm thấy minh chứng'}
                    </p>
                    <button
                        onClick={() => router.back()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Quay lại
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-6 px-4 py-2 hover:bg-blue-50 rounded-lg transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Quay lại
                </button>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                                <FileText className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-mono font-semibold bg-white bg-opacity-20 px-3 py-1 rounded-lg">
                                        {evidence.code}
                                    </span>
                                </div>
                                <h1 className="text-3xl font-bold mb-2">
                                    {evidence.name}
                                </h1>
                                {evidence.description && (
                                    <p className="text-blue-100">
                                        {evidence.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {evidence.standardId && (
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                                    <p className="text-sm font-semibold text-gray-600 mb-2">
                                        Tiêu chuẩn
                                    </p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {evidence.standardId.code} - {evidence.standardId.name}
                                    </p>
                                </div>
                            )}

                            {evidence.criteriaId && (
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                                    <p className="text-sm font-semibold text-gray-600 mb-2">
                                        Tiêu chí
                                    </p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {evidence.criteriaId.code} - {evidence.criteriaId.name}
                                    </p>
                                </div>
                            )}

                            {evidence.createdBy && (
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                                    <p className="text-sm font-semibold text-gray-600 mb-2">
                                        Người tạo
                                    </p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {evidence.createdBy.fullName}
                                    </p>
                                </div>
                            )}

                            {evidence.createdAt && (
                                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                                    <p className="text-sm font-semibold text-gray-600 mb-2">
                                        Ngày tạo
                                    </p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {new Date(evidence.createdAt).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                            )}
                        </div>

                        {evidence.content && (
                            <div className="border-t pt-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    Nội dung
                                </h2>
                                <div className="prose max-w-none bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <div dangerouslySetInnerHTML={{ __html: evidence.content }} />
                                </div>
                            </div>
                        )}

                        {evidence.attachments && evidence.attachments.length > 0 && (
                            <div className="border-t pt-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    Tài liệu đính kèm
                                </h2>
                                <div className="space-y-3">
                                    {evidence.attachments.map((attachment, idx) => (
                                        <a
                                            key={idx}
                                            href={attachment.url || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                                        >
                                            <p className="text-sm font-medium text-blue-600 hover:text-blue-800">
                                                📎 {attachment.name || attachment.originalName || 'Tải xuống'}
                                            </p>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}