import { useState } from 'react'
import { X, Star } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SelfEvaluationModal({ onClose, onSubmit, initialData = null }) {
    const [content, setContent] = useState(initialData?.content || '')
    const [score, setScore] = useState(initialData?.score || 0)
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!content.trim()) {
            toast.error('Vui lòng nhập nội dung đánh giá')
            return
        }

        if (!score || score < 1 || score > 7) {
            toast.error('Vui lòng chọn điểm từ 1 đến 7')
            return
        }

        try {
            setSubmitting(true)
            const evalData = {
                content: content.trim(),
                score: parseInt(score)
            }
            console.log('Publishing report with evaluation:', evalData)
            await onSubmit(evalData)
        } catch (error) {
            console.error('Submit evaluation error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi lưu tự đánh giá')
        } finally {
            setSubmitting(false)
        }
    }

    const scoreDescriptions = {
        1: 'Rất kém',
        2: 'Kém',
        3: 'Trung bình yếu',
        4: 'Trung bình',
        5: 'Khá',
        6: 'Tốt',
        7: 'Xuất sắc'
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 p-6 flex items-center justify-between rounded-t-2xl">
                    <h2 className="text-2xl font-bold text-white flex items-center">
                        <Star className="h-6 w-6 mr-2" />
                        Tự đánh giá báo cáo trước khi xuất bản
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                        disabled={submitting}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Nội dung đánh giá <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={8}
                            placeholder="Nhập nội dung tự đánh giá về báo cáo của bạn..."
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            maxLength={5000}
                            required
                            disabled={submitting}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            {content.length}/5000 ký tự
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Điểm tự đánh giá <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-7 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setScore(s)}
                                    disabled={submitting}
                                    className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                                        score === s
                                            ? 'border-green-500 bg-green-50 shadow-md transform scale-105'
                                            : 'border-gray-300 hover:border-green-300 hover:bg-gray-50'
                                    } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span className={`text-2xl font-bold ${score === s ? 'text-green-600' : 'text-gray-600'}`}>
                                        {s}
                                    </span>
                                    <span className={`text-xs mt-1 text-center ${score === s ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
                                        {scoreDescriptions[s]}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            Chọn điểm từ 1 (Rất kém) đến 7 (Xuất sắc)
                        </p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="text-sm text-green-800">
                            <strong>⚠️ Lưu ý quan trọng:</strong> Sau khi hoàn thành tự đánh giá, báo cáo của bạn sẽ được <strong>xuất bản công khai</strong> ngay lập tức.
                            Vui lòng kiểm tra kỹ lưỡng trước khi xuất bản. Hãy đánh giá một cách khách quan và trung thực về chất lượng báo cáo của bạn.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-all disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Đang xuất bản...
                                </>
                            ) : (
                                <>
                                    <Star className="h-4 w-4" />
                                    Lưu & Xuất bản công khai
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}