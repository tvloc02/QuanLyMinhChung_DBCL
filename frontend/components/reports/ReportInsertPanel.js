// frontend/components/reports/ReportInsertPanel.js
import { useState, useEffect } from 'react'
import { BookOpen, Search, ChevronDown, Plus, Loader, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'

export default function ReportInsertPanel({
                                              standardId,
                                              criteriaId,
                                              programId,
                                              organizationId,
                                              reportType,
                                              onInsert,
                                              disabled
                                          }) {
    const [reports, setReports] = useState([])
    const [filteredReports, setFilteredReports] = useState([])
    const [searchText, setSearchText] = useState('')
    const [loading, setLoading] = useState(false)
    const [expandedReports, setExpandedReports] = useState(new Set())

    useEffect(() => {
        if (standardId || criteriaId) {
            fetchReports()
        }
    }, [standardId, criteriaId, reportType])

    useEffect(() => {
        const filtered = reports.filter(r =>
            r.code?.toLowerCase().includes(searchText.toLowerCase()) ||
            r.title?.toLowerCase().includes(searchText.toLowerCase())
        )
        setFilteredReports(filtered)
    }, [searchText, reports])

    const fetchReports = async () => {
        try {
            setLoading(true)
            let query = {
                programId,
                organizationId,
                status: ['public', 'published']
            }

            if (reportType === 'standard' && standardId) {
                query.type = 'criteria'
                query.standardId = standardId
            } else if (reportType === 'overall_tdg') {
                query.type = ['criteria', 'standard']
            }

            const response = await apiMethods.reports.getAll(query)
            setReports(response.data.data.reports || [])
        } catch (error) {
            console.error('Error fetching reports:', error)
            toast.error('Lỗi khi tải danh sách báo cáo')
        } finally {
            setLoading(false)
        }
    }

    const toggleExpanded = (reportId) => {
        setExpandedReports(prev => {
            const newSet = new Set(prev)
            if (newSet.has(reportId)) {
                newSet.delete(reportId)
            } else {
                newSet.add(reportId)
            }
            return newSet
        })
    }

    const handleInsertReport = (report, hideAuthor = false) => {
        const authorText = hideAuthor ? '' : ` (Tác giả: ${report.createdBy?.fullName || 'N/A'})`
        const html = `
            <div style="margin: 20px 0; padding: 15px; border: 2px solid #0369a1; border-left: 6px solid #0369a1; border-radius: 8px; background: #f0f9ff;">
                <p style="margin: 0; color: #0369a1; font-weight: bold; font-size: 1.1em; border-bottom: 2px solid #06b6d4; padding-bottom: 8px;">
                    📋 Báo cáo: ${report.code} - ${report.title}${authorText}
                </p>
                <div style="margin-top: 12px; color: #334155; line-height: 1.6;">
                    ${report.content || '<em>Không có nội dung</em>'}
                </div>
            </div>
        `
        onInsert(html)
        toast.success(`Đã chèn báo cáo ${report.code}`)
    }

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-sky-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-600" />
                Chèn Báo Cáo
            </h3>

            <input
                type="text"
                placeholder="Tìm kiếm theo mã hoặc tiêu đề..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full px-4 py-2 border-2 border-sky-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />

            <div className="bg-sky-50 border-2 border-sky-200 rounded-lg p-3 max-h-80 overflow-y-auto space-y-2">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader className="w-5 h-5 text-sky-600 animate-spin" />
                    </div>
                ) : filteredReports.length > 0 ? (
                    filteredReports.map(report => (
                        <div key={report._id} className="bg-white border-2 border-sky-100 rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between p-3 hover:bg-sky-50 transition-all group">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-sky-700">{report.code}</p>
                                    <p className="text-xs text-gray-600 truncate">{report.title}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {report.createdBy?.fullName || 'N/A'}
                                    </p>
                                </div>
                                <div className="flex gap-2 ml-2">
                                    <button
                                        onClick={() => toggleExpanded(report._id)}
                                        className="p-2 bg-sky-200 text-sky-700 rounded-lg hover:bg-sky-300 transition-all"
                                        title="Xem trước"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleInsertReport(report, false)}
                                        className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-all opacity-0 group-hover:opacity-100"
                                        title="Chèn (hiển thị tác giả)"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {expandedReports.has(report._id) && (
                                <div className="border-t-2 border-sky-200 p-3 bg-gradient-to-br from-sky-50 to-cyan-50 max-h-48 overflow-y-auto text-xs text-gray-700">
                                    <div dangerouslySetInnerHTML={{ __html: report.content || '<em>Không có nội dung</em>' }} />

                                    <div className="mt-3 flex gap-2 pt-3 border-t border-sky-200">
                                        <button
                                            onClick={() => handleInsertReport(report, false)}
                                            className="flex-1 px-3 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 text-xs font-medium transition-all"
                                        >
                                            Chèn (có tác giả)
                                        </button>
                                        <button
                                            onClick={() => handleInsertReport(report, true)}
                                            className="flex-1 px-3 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 text-xs font-medium transition-all"
                                        >
                                            Chèn (ẩn tác giả)
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-xs text-gray-500 text-center py-4">
                        {searchText ? 'Không tìm thấy báo cáo' : 'Chưa có báo cáo nào'}
                    </p>
                )}
            </div>
        </div>
    )
}