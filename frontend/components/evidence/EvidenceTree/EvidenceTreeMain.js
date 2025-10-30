import { useState } from 'react'
import {
    ChevronDown, ChevronRight, FileText, Folder, FolderOpen, Loader2,
    Eye, Edit, Trash2, Upload, Users, FileTextIcon, Maximize2, Minimize2,
    GripVertical, Clock, Check, CheckCircle2, XCircle, Shield
} from 'lucide-react'
import toast from 'react-hot-toast'

const ActionButton = ({ icon: Icon, label, onClick, variant = 'secondary', size = 'sm', disabled = false }) => {
    const baseStyle = "flex items-center justify-center p-2 rounded-xl transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
    let variantStyle = "text-gray-700 bg-gray-100 border border-gray-300 hover:bg-gray-200"
    if (variant === 'primary') variantStyle = "text-white bg-blue-600 hover:bg-blue-700"
    if (variant === 'purple') variantStyle = "text-white bg-purple-600 hover:bg-purple-700"
    if (variant === 'green') variantStyle = "text-white bg-emerald-600 hover:bg-emerald-700"
    if (size === 'sm') variantStyle = variantStyle + ' w-10 h-10'

    return (
        <button
            onClick={onClick}
            className={`${baseStyle} ${variantStyle}`}
            title={label}
            disabled={disabled}
        >
            <Icon className="h-5 w-5" />
        </button>
    )
}

const getStatusIcon = (status) => {
    const iconMap = {
        'new': <Clock className="h-4 w-4 text-gray-500" />,
        'in_progress': <Clock className="h-4 w-4 text-blue-500" />,
        'completed': <CheckCircle2 className="h-4 w-4 text-green-500" />,
        'approved': <Check className="h-4 w-4 text-emerald-500" />,
        'rejected': <XCircle className="h-4 w-4 text-red-500" />
    }
    return iconMap[status] || <Clock className="h-4 w-4 text-gray-500" />
}

const getStatusLabel = (status) => {
    const labels = {
        'new': 'Mới',
        'in_progress': 'Đang thực hiện',
        'completed': 'Hoàn thành',
        'approved': 'Đã duyệt',
        'rejected': 'Từ chối'
    }
    return labels[status] || 'Mới'
}

const getStatusColor = (status) => {
    const colors = {
        'new': 'bg-gray-100 text-gray-700 border-gray-300',
        'in_progress': 'bg-blue-100 text-blue-700 border-blue-300',
        'completed': 'bg-green-100 text-green-700 border-green-300',
        'approved': 'bg-emerald-100 text-emerald-700 border-emerald-300',
        'rejected': 'bg-red-100 text-red-700 border-red-300'
    }
    return colors[status] || colors['new']
}

export default function EvidenceTreeMain({
                                             treeData,
                                             loading,
                                             expandedNodes,
                                             onToggleNode,
                                             onExpandAll,
                                             onCollapseAll,
                                             onSelectEvidence,
                                             onDragStart,
                                             onDragOver,
                                             onDrop,
                                             userRole,
                                             canManageAll,
                                             canWriteReport,
                                             canEditEvidence,
                                             canDeleteEvidence,
                                             onAssignClick,
                                             onEditEvidence,
                                             onDeleteEvidence
                                         }) {
    const truncateName = (name) => {
        if (!name) return ''
        const maxChars = 80
        if (name.length > maxChars) {
            return name.substring(0, maxChars) + '...'
        }
        return name
    }

    const StandardNode = ({ standard, stdIdx }) => {
        const isExpanded = expandedNodes[`std-${stdIdx}`]

        return (
            <div key={standard.id} className="mb-4">
                <div
                    className={`flex items-center justify-between p-4 border-2 rounded-xl transition-all ${
                        standard.hasEvidence ? 'bg-blue-50 hover:bg-blue-100 border-blue-300' : 'bg-red-50 hover:bg-red-100 border-red-300'
                    }`}
                >
                    <div className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer" onClick={() => onToggleNode(`std-${stdIdx}`)}>
                        <div className="flex-shrink-0">
                            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        </div>
                        <div className="flex-shrink-0">
                            {isExpanded ? <FolderOpen className="h-6 w-6 text-blue-600" /> : <Folder className="h-6 w-6 text-blue-600" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="font-semibold text-gray-900 block overflow-hidden" style={{ maxHeight: '2.8em', lineHeight: '1.4em' }}>
                                TC {standard.code}: {truncateName(standard.name)}
                            </span>
                            <div className="text-xs text-gray-600 mt-1">
                                {standard.criteria?.length || 0} tiêu chí
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-2 ml-4 flex-shrink-0">
                        <ActionButton icon={Eye} label="Xem" onClick={(e) => { e.stopPropagation(); toast.success('Xem tiêu chuẩn'); }} />
                        {/*{canWriteReport('tdg') && (*/}
                        {/*    <ActionButton icon={FileTextIcon} label="Viết BC TĐG" onClick={(e) => { e.stopPropagation(); toast.success('Viết báo cáo TĐG'); }} variant="primary" />*/}
                        {/*)}*/}
                        {canWriteReport('standard') && (
                            <ActionButton icon={FileTextIcon} label="Viết báo cáo tiêu chuẩn" onClick={(e) => { e.stopPropagation(); toast.success('Viết báo cáo tiêu chuẩn'); }} variant="blue" />
                        )}
                        {(canManageAll || canWriteReport('tdg')) && (
                            <ActionButton icon={Users} label="Giao báo cáo tiêu chuẩn" onClick={(e) => { e.stopPropagation(); onAssignClick('standard', standard, 'standard'); }} variant="blue" />
                        )}
                    </div>
                </div>

                {isExpanded && standard.criteria && (
                    <div className="ml-8 mt-3 space-y-3">
                        {standard.criteria.map((criteria, critIdx) => (
                            <CriteriaNode
                                key={criteria.id}
                                criteria={criteria}
                                standard={standard}
                                stdIdx={stdIdx}
                                critIdx={critIdx}
                            />
                        ))}
                    </div>
                )}
            </div>
        )
    }

    const CriteriaNode = ({ criteria, standard, stdIdx, critIdx }) => {
        const criteriaNodeKey = `std-${stdIdx}-crit-${critIdx}`
        const isCriteriaExpanded = expandedNodes[criteriaNodeKey]

        return (
            <div
                key={criteria.id}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, standard.id, criteria.id)}
            >
                <div
                    className={`flex items-center justify-between p-3 border-2 rounded-xl transition-all ${
                        criteria.hasEvidence ? 'bg-indigo-50 hover:bg-indigo-100 border-indigo-300' : 'bg-orange-50 hover:bg-orange-100 border-orange-300'
                    }`}
                >
                    <div className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer" onClick={() => onToggleNode(criteriaNodeKey)}>
                        <div className="flex-shrink-0">
                            {isCriteriaExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                        <div className="flex-shrink-0">
                            {isCriteriaExpanded ? <FolderOpen className="h-5 w-5 text-indigo-600" /> : <Folder className="h-5 w-5 text-indigo-600" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="font-medium text-gray-900 block overflow-hidden" style={{ maxHeight: '2.8em', lineHeight: '1.4em' }}>
                                TC {standard.code}.{criteria.code}: {truncateName(criteria.name)}
                            </span>
                            <div className="text-xs text-gray-600 mt-1">
                                {criteria.evidences?.length || 0} minh chứng
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-2 ml-4 flex-shrink-0">
                        <ActionButton icon={Eye} label="Xem" onClick={(e) => { e.stopPropagation(); toast.success('Xem tiêu chí'); }} />
                        {canWriteReport('criteria') && (
                            <ActionButton icon={FileTextIcon} label="Viết báo cáo Tiêu chí" onClick={(e) => { e.stopPropagation(); toast.success('Viết báo cáo tiêu chí'); }} variant="blue" />
                        )}
                        {(canManageAll || canWriteReport('standard')) && (
                            <ActionButton icon={Users} label="Giao ba cáo Tiêu chí" onClick={(e) => { e.stopPropagation(); onAssignClick('criteria', {...criteria, standardId: standard.id}, 'criteria'); }} variant="blue" />
                        )}
                    </div>
                </div>

                {isCriteriaExpanded && criteria.evidences && criteria.evidences.length > 0 && (
                    <div className="ml-8 mt-2 space-y-2">
                        {criteria.evidences.map(evidence => (
                            <div
                                key={evidence.id}
                                draggable
                                onDragStart={(e) => onDragStart(e, evidence, standard.id, criteria.id)}
                                className="flex items-center justify-between p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl group transition-all cursor-move"
                            >
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <GripVertical className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className="text-sm font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex-shrink-0">
                                                {evidence.code}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded border font-medium inline-flex items-center ${getStatusColor(evidence.status)} flex-shrink-0`}>
                                                {getStatusIcon(evidence.status)}
                                                <span className="ml-1">{getStatusLabel(evidence.status)}</span>
                                            </span>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded flex-shrink-0">
                                                {evidence.fileCount || 0} files
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-900 truncate font-medium block overflow-hidden" style={{ maxHeight: '2.8em', lineHeight: '1.4em' }}>
                                            {truncateName(evidence.name)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex space-x-2 ml-4 flex-shrink-0">
                                    <ActionButton icon={Eye} label="Xem Minh chứng" onClick={(e) => { e.stopPropagation(); }} />
                                    {canEditEvidence() && (
                                        <ActionButton icon={Edit} label="Sửa Minh chứng" onClick={(e) => { e.stopPropagation(); onEditEvidence(evidence); }} />
                                    )}
                                    {canDeleteEvidence() && (
                                        <ActionButton icon={Trash2} label="Xóa Minh chứng" onClick={(e) => { e.stopPropagation(); onDeleteEvidence(evidence); }} />
                                    )}
                                    <ActionButton icon={Upload} label="Files" onClick={(e) => { e.stopPropagation(); onSelectEvidence(evidence); }} variant="blue" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <div className="flex space-x-3">
                    <button
                        onClick={onExpandAll}
                        disabled={treeData.length === 0}
                        className="inline-flex items-center px-4 py-2.5 text-sm border-2 border-gray-200 bg-white rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all font-medium"
                    >
                        <Maximize2 className="h-4 w-4 mr-2" />
                        Mở rộng
                    </button>
                    <button
                        onClick={onCollapseAll}
                        disabled={treeData.length === 0}
                        className="inline-flex items-center px-4 py-2.5 text-sm border-2 border-gray-200 bg-white rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all font-medium"
                    >
                        <Minimize2 className="h-4 w-4 mr-2" />
                        Thu gọn
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-16">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                        <p className="text-gray-600 font-medium">Đang tải...</p>
                    </div>
                ) : treeData.length === 0 ? (
                    <div className="p-16 text-center">
                        <Folder className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có dữ liệu</h3>
                        <p className="text-gray-500">Chọn Chương trình và Tổ chức để xem cây minh chứng</p>
                    </div>
                ) : (
                    <div className="p-6">
                        {treeData.map((standard, stdIdx) => (
                            <StandardNode key={standard.id} standard={standard} stdIdx={stdIdx} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}