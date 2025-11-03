import { useState, useEffect } from 'react'
import {
    ChevronDown, ChevronRight, FileText, Folder, FolderOpen, Loader2,
    Eye, Edit, Trash2, Upload, Users, FileTextIcon, Maximize2, Minimize2,
    GripVertical, Clock, Check, CheckCircle2, XCircle, Shield
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const ActionButton = ({ icon: Icon, label, onClick, variant = 'secondary', size = 'sm', disabled = false, customColor = 'bg-gray-600 hover:bg-gray-700' }) => {
    const baseStyle = "flex items-center justify-center p-2 rounded-xl transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"

    let variantStyle = `text-white ${customColor}`;

    if (variant === 'secondary') variantStyle = "text-gray-700 bg-gray-100 border border-gray-300 hover:bg-gray-200"
    if (variant === 'danger') variantStyle = "text-white bg-red-600 hover:bg-red-700"

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
                                             canEditStandard,
                                             canEditCriteria,
                                             canUploadEvidence,
                                             canAssignReporters,
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

    const [standardPermissions, setStandardPermissions] = useState({});
    const [criteriaPermissions, setCriteriaPermissions] = useState({});
    const [isPermissionLoading, setIsPermissionLoading] = useState(true);

    useEffect(() => {
        const updatePermissions = async () => {
            if (treeData.length === 0) {
                setIsPermissionLoading(false);
                return;
            }

            setIsPermissionLoading(true);
            const newStandardPermissions = {};
            const newCriteriaPermissions = {};
            const standardPromises = [];
            const criteriaPromises = [];

            for (const standard of treeData) {
                const stdId = standard.id;

                standardPromises.push((async () => {
                    const canEdit = await canEditStandard(stdId);
                    const canAssign = await canAssignReporters(stdId, null);
                    return { stdId, canEdit, canAssign };
                })());

                for (const criteria of standard.criteria) {
                    const critId = criteria.id;
                    criteriaPromises.push((async () => {
                        const canEdit = await canEditCriteria(critId);
                        const canAssign = await canAssignReporters(standard.id, critId);
                        const canUpload = await canUploadEvidence(critId);
                        return { critId, canEdit, canAssign, canUpload };
                    })());
                }
            }

            const standardResults = await Promise.all(standardPromises);
            standardResults.forEach(res => {
                newStandardPermissions[res.stdId] = { canEdit: res.canEdit, canAssign: res.canAssign };
            });

            const criteriaResults = await Promise.all(criteriaPromises);
            criteriaResults.forEach(res => {
                newCriteriaPermissions[res.critId] = { canEdit: res.canEdit, canAssign: res.canAssign, canUpload: res.canUpload };
            });

            setStandardPermissions(newStandardPermissions);
            setCriteriaPermissions(newCriteriaPermissions);
            setIsPermissionLoading(false);
        };
        updatePermissions();
    }, [treeData, canEditStandard, canAssignReporters, canEditCriteria, canUploadEvidence]);


    const StandardNode = ({ standard, stdIdx }) => {
        const isExpanded = expandedNodes[`std-${stdIdx}`]

        const stdPerm = standardPermissions[standard.id] || {};
        const canEdit = stdPerm.canEdit || false;
        const canAssign = stdPerm.canAssign || false;
        const canWrite = canManageAll || canWriteReport('standard');

        const baseColor = standard.hasEvidence ? 'blue' : 'red';
        const bgColor = standard.hasEvidence ? `bg-blue-50 hover:bg-blue-100 border-blue-300` : `bg-red-50 hover:bg-red-100 border-red-300`;
        const iconColor = standard.hasEvidence ? `text-blue-600` : `text-red-600`;


        return (
            <div key={standard.id} className="mb-4">
                <div
                    className={`flex items-center justify-between p-4 border-2 rounded-xl transition-all ${bgColor}`}
                >
                    <div className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer" onClick={() => onToggleNode(`std-${stdIdx}`)}>
                        <div className="flex-shrink-0">
                            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        </div>
                        <div className="flex-shrink-0">
                            {isExpanded ? <FolderOpen className={`h-6 w-6 ${iconColor}`} /> : <Folder className={`h-6 w-6 ${iconColor}`} />}
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
                        <ActionButton icon={Eye} label="Xem" onClick={(e) => { e.stopPropagation(); toast.success('Xem tiêu chuẩn'); }} variant="secondary" />
                        {canEdit && (
                            <ActionButton icon={Edit} label="Sửa tiêu chuẩn" onClick={(e) => { e.stopPropagation(); toast.info('Sửa tiêu chuẩn'); }} customColor={`bg-blue-600 hover:bg-blue-700`} />
                        )}
                        {canWrite && (
                            <ActionButton icon={FileTextIcon} label="Viết báo cáo tiêu chuẩn" onClick={(e) => { e.stopPropagation(); toast.success('Viết báo cáo tiêu chuẩn'); }} customColor={`bg-blue-600 hover:bg-blue-700`} />
                        )}
                        {canAssign && (
                            <ActionButton
                                icon={Users}
                                label="Phân quyền viết báo cáo tiêu chuẩn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAssignClick('standard', {
                                        id: standard.id,
                                        code: standard.code,
                                        name: standard.name,
                                        standardId: standard.id,
                                        criteriaId: null
                                    }, 'standard');
                                }}
                                customColor={`bg-purple-600 hover:bg-purple-700`}
                            />
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

        const critPerm = criteriaPermissions[criteria.id] || {};
        const canEdit = critPerm.canEdit || false;
        const canAssign = critPerm.canAssign || false;
        const canWrite = canManageAll || canWriteReport('criteria');
        const canUpload = critPerm.canUpload || false;

        const baseColor = criteria.hasEvidence ? 'indigo' : 'orange';
        const bgColor = criteria.hasEvidence ? `bg-indigo-50 hover:bg-indigo-100 border-indigo-300` : `bg-orange-50 hover:bg-orange-100 border-orange-300`;
        const iconColor = criteria.hasEvidence ? `text-indigo-600` : `text-orange-600`;


        return (
            <div
                key={criteria.id}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, standard.id, criteria.id)}
            >
                <div
                    className={`flex items-center justify-between p-3 border-2 rounded-xl transition-all ${bgColor}`}
                >
                    <div className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer" onClick={() => onToggleNode(criteriaNodeKey)}>
                        <div className="flex-shrink-0">
                            {isCriteriaExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                        <div className="flex-shrink-0">
                            {isCriteriaExpanded ? <FolderOpen className={`h-5 w-5 ${iconColor}`} /> : <Folder className={`h-5 w-5 ${iconColor}`} />}
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
                        <ActionButton icon={Eye} label="Xem" onClick={(e) => { e.stopPropagation(); toast.success('Xem tiêu chí'); }} variant="secondary" />
                        {canEdit && (
                            <ActionButton icon={Edit} label="Sửa tiêu chí" onClick={(e) => { e.stopPropagation(); toast.info('Sửa tiêu chí'); }} customColor={`bg-${baseColor}-600 hover:bg-${baseColor}-700`} />
                        )}
                        {canWrite && (
                            <ActionButton icon={FileTextIcon} label="Viết báo cáo Tiêu chí" onClick={(e) => { e.stopPropagation(); toast.success('Viết báo cáo tiêu chí'); }} customColor={`bg-${baseColor}-600 hover:bg-${baseColor}-700`} />
                        )}
                        {canAssign && (
                            <ActionButton
                                icon={Users}
                                label="Phân quyền viết báo cáo Tiêu chí"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAssignClick('criteria', {
                                        id: criteria.id,
                                        code: criteria.code,
                                        name: criteria.name,
                                        standardId: standard.id,
                                        criteriaId: criteria.id
                                    }, 'criteria');
                                }}
                                customColor={`bg-purple-600 hover:bg-purple-700`}
                            />
                        )}
                    </div>
                </div>

                {isCriteriaExpanded && criteria.evidences && criteria.evidences.length > 0 && (
                    <div className="ml-8 mt-2 space-y-2">
                        {criteria.evidences.map(evidence => (
                            <div
                                key={evidence.id}
                                draggable={canManageAll}
                                onDragStart={(e) => canManageAll && onDragStart(e, evidence, standard.id, criteria.id)}
                                className="flex items-center justify-between p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl group transition-all"
                            >
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    {canManageAll && <GripVertical className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-move" />}
                                    {!canManageAll && <FileText className="h-4 w-4 text-gray-400" />}

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
                                    <ActionButton icon={Eye} label="Xem Minh chứng" onClick={(e) => { e.stopPropagation(); toast.success('Xem Minh chứng'); }} variant="secondary" />
                                    {canUpload && (
                                        <ActionButton
                                            icon={Edit}
                                            label="Sửa Metadata Minh chứng"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditEvidence(evidence);
                                            }}
                                            customColor={`bg-orange-600 hover:bg-orange-700`}
                                        />
                                    )}
                                    {canUpload && (
                                        <ActionButton
                                            icon={Upload}
                                            label="Upload Files"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectEvidence({
                                                    id: evidence.id,
                                                    code: evidence.code,
                                                    name: evidence.name,
                                                    standardId: standard.id,
                                                    criteriaId: criteria.id,
                                                    isEvidence: true,
                                                    evidenceData: evidence
                                                });
                                            }}
                                            customColor={`bg-yellow-600 hover:bg-yellow-700`}
                                        />
                                    )}
                                    {canManageAll && (
                                        <ActionButton icon={Trash2} label="Xóa Minh chứng" onClick={(e) => { e.stopPropagation(); onDeleteEvidence(evidence); }} variant="secondary" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    if (isPermissionLoading || loading) {
        return (
            <div className="flex flex-col justify-center items-center py-16">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Đang tải và kiểm tra quyền...</p>
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
                {treeData.length === 0 ? (
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