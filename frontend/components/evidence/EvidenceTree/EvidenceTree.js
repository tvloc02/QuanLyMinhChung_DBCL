import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiMethods } from '../../../services/api'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import EvidenceTreeHeader from './EvidenceTreeHeader'
import EvidenceTreeStatistics from './EvidenceTreeStatistics'
import EvidenceTreeMain from './EvidenceTreeMain'
import EvidenceTreeTaskForm from './EvidenceTreeTaskForm'

export default function EvidenceTree() {
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [treeData, setTreeData] = useState([])
    const [expandedNodes, setExpandedNodes] = useState({})
    const [programs, setPrograms] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [selectedProgram, setSelectedProgram] = useState('')
    const [selectedOrganization, setSelectedOrganization] = useState('')
    const [statistics, setStatistics] = useState(null)
    const [selectedEvidence, setSelectedEvidence] = useState(null)
    const [userRole, setUserRole] = useState('')
    const [accessibleReportTypes, setAccessibleReportTypes] = useState([])
    const [userPermissions, setUserPermissions] = useState({
        canEditStandard: () => false,
        canEditCriteria: () => false,
        canUploadEvidence: () => false,
        canAssignReporters: () => false,
        canWriteTDGReport: false,
        canWriteStandardReport: false,
        canWriteCriteriaReport: false,
    })
    const [academicYearId, setAcademicYearId] = useState('')

    const [showAssignModal, setShowAssignModal] = useState(false)
    const [assignTarget, setAssignTarget] = useState(null)
    const [assignReportType, setAssignReportType] = useState('criteria')

    const [draggedEvidence, setDraggedEvidence] = useState(null)

    useEffect(() => {
        fetchUserInfo()
        fetchPrograms()
        fetchOrganizations()
    }, [])

    useEffect(() => {
        if (selectedProgram && selectedOrganization) {
            fetchTreeData()
        } else {
            setTreeData([])
            setStatistics(null)
        }
    }, [selectedProgram, selectedOrganization])

    const fetchUserInfo = async () => {
        try {
            const response = await apiMethods.users.getProfile()
            const userData = response.data.data
            setUserRole(userData?.role || '')
            const currentAcademicYearId = userData?.currentAcademicYearId
            setAcademicYearId(currentAcademicYearId)

            const reportTypes = userData?.accessibleReportTypes || []
            setAccessibleReportTypes(reportTypes)

            const canManageAll = userData?.role === 'admin' || userData?.role === 'manager'

            setUserPermissions({
                canWriteTDGReport: reportTypes.includes('overall_tdg') || canManageAll,
                canWriteStandardReport: reportTypes.includes('standard') || canManageAll,
                canWriteCriteriaReport: reportTypes.includes('criteria') || canManageAll,

                canEditStandard: async (standardId) => {
                    if (canManageAll) return true
                    const res = await apiMethods.permissions.canEditStandard(standardId, currentAcademicYearId)
                    return res.data?.data?.canEdit || false
                },
                canEditCriteria: async (criteriaId) => {
                    if (canManageAll) return true
                    const res = await apiMethods.permissions.canEditCriteria(criteriaId, currentAcademicYearId)
                    return res.data?.data?.canEdit || false
                },
                canUploadEvidence: async (criteriaId) => {
                    if (canManageAll) return true
                    const res = await apiMethods.permissions.canUploadEvidence(criteriaId, currentAcademicYearId)
                    return res.data?.data?.canUpload || false
                },
                canAssignReporters: async (standardId, criteriaId) => {
                    if (canManageAll) return true
                    const res = await apiMethods.permissions.canAssignReporters(standardId, criteriaId, currentAcademicYearId)
                    return res.data?.data?.canAssign || false
                },
            })
        } catch (error) {
            console.error('Fetch user info error:', error)
        }
    }

    const fetchPrograms = async () => {
        try {
            const response = await apiMethods.programs.getAll()
            const programsData = response.data.data.programs || response.data.data || []
            setPrograms(programsData)
            if (programsData.length > 0) {
                setSelectedProgram(programsData[0]._id)
            }
        } catch (error) {
            console.error('Fetch programs error:', error)
            toast.error('Lỗi khi tải danh sách chương trình')
        }
    }

    const fetchOrganizations = async () => {
        try {
            const response = await apiMethods.organizations.getAll()
            const organizationsData = response.data.data.organizations || response.data.data || []
            setOrganizations(organizationsData)
            if (organizationsData.length > 0) {
                setSelectedOrganization(organizationsData[0]._id)
            }
        } catch (error) {
            console.error('Fetch organizations error:', error)
            toast.error('Lỗi khi tải danh sách tổ chức')
        }
    }

    const fetchTreeData = async () => {
        try {
            setLoading(true)
            if (!selectedProgram || !selectedOrganization) {
                setTreeData([])
                setLoading(false)
                return
            }
            const response = await apiMethods.evidences.getFullTree(selectedProgram, selectedOrganization)
            setTreeData(response.data.data.tree || [])
            setStatistics(response.data.data.statistics || null)
        } catch (error) {
            console.error('Fetch tree data error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi tải cây minh chứng')
            setTreeData([])
            setStatistics(null)
        } finally {
            setLoading(false)
        }
    }

    const toggleNode = (nodeKey) => {
        setExpandedNodes(prev => ({
            ...prev,
            [nodeKey]: !prev[nodeKey]
        }))
    }

    const expandAll = () => {
        const allNodes = {}
        treeData.forEach((standard, stdIdx) => {
            allNodes[`std-${stdIdx}`] = true
            standard.criteria?.forEach((criteria, critIdx) => {
                allNodes[`std-${stdIdx}-crit-${critIdx}`] = true
            })
        })
        setExpandedNodes(allNodes)
    }

    const collapseAll = () => {
        setExpandedNodes({})
    }

    const handleDragStart = (e, evidence, standardId, criteriaId) => {
        setDraggedEvidence({ evidence, standardId, criteriaId })
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = async (e, targetStandardId, targetCriteriaId) => {
        e.preventDefault()
        if (!draggedEvidence) return
        if (draggedEvidence.standardId === targetStandardId &&
            draggedEvidence.criteriaId === targetCriteriaId) {
            toast.info('Minh chứng đã ở vị trí này')
            setDraggedEvidence(null)
            return
        }

        const standard = treeData.find(s => s.id === targetStandardId)
        const criteria = standard?.criteria.find(c => c.id === targetCriteriaId)
        if (!standard || !criteria) {
            toast.error('Không tìm thấy tiêu chuẩn/tiêu chí đích')
            setDraggedEvidence(null)
            return
        }

        const currentCode = draggedEvidence.evidence.code
        const currentCodeParts = currentCode.split('.')
        const prefixAndBox = currentCodeParts[0]
        const newStandardCode = String(standard.code).padStart(2, '0')
        const newCriteriaCode = String(criteria.code).padStart(2, '0')
        const sequenceNumber = currentCodeParts[3]
        const newCode = `${prefixAndBox}.${newStandardCode}.${newCriteriaCode}.${sequenceNumber}`

        if (!confirm(`Di chuyển "${draggedEvidence.evidence.name}" sang Tiêu chí ${criteria.code}?\nMã mới: ${newCode}`)) {
            setDraggedEvidence(null)
            return
        }

        try {
            await apiMethods.evidences.move(draggedEvidence.evidence.id, {
                targetStandardId,
                targetCriteriaId,
                newCode
            })
            toast.success('Di chuyển minh chứng thành công')
            await fetchTreeData()
            setSelectedEvidence(null)
        } catch (error) {
            console.error('Move evidence error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi di chuyển minh chứng')
        } finally {
            setDraggedEvidence(null)
        }
    }

    const downloadTemplate = () => {
        const templateData = [
            ['STT', 'Mã', 'Tên minh chứng'],
            ['1', 'A1.01.01.01', 'Quyết định công bố tầm nhìn']
        ]
        const ws = XLSX.utils.aoa_to_sheet(templateData)
        ws['!cols'] = [{ wch: 5 }, { wch: 15 }, { wch: 70 }]
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Minh chứng')
        XLSX.writeFile(wb, 'template-import-minh-chung.xlsx')
        toast.success('Đã tải file mẫu Excel')
    }

    const handleImport = async (file) => {
        if (!selectedProgram || !selectedOrganization) {
            toast.error('Vui lòng chọn Chương trình và Tổ chức')
            return
        }

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('programId', selectedProgram)
            formData.append('organizationId', selectedOrganization)
            formData.append('mode', 'create')

            const response = await apiMethods.evidences.import(formData)
            if (response.data.success) {
                const errors = response.data.data?.details?.errors || []
                let message = response.data.message || 'Import hoàn tất!'
                if (errors.length > 0) {
                    message += ` (${errors.length} lỗi)`
                    toast.error(message, { duration: 8000 })
                } else {
                    toast.success(message, { duration: 6000 })
                }
                setTimeout(() => fetchTreeData(), 500)
            } else {
                toast.error(response.data.message || 'Import thất bại')
            }
        } catch (error) {
            console.error('Import error:', error)
            toast.error('Lỗi khi import: ' + (error.response?.data?.message || error.message))
        }
    }

    const handleExport = async () => {
        try {
            if (!selectedProgram || !selectedOrganization) {
                toast.error('Vui lòng chọn Chương trình và Tổ chức')
                return
            }
            toast.loading('Đang xuất dữ liệu...')

            const response = await apiMethods.evidences.exportTree(selectedProgram, selectedOrganization)

            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `cay-minh-chung-${Date.now()}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            toast.dismiss()
            toast.success('Export thành công!')
        } catch (error) {
            console.error('Export error:', error)
            toast.dismiss()
            toast.error(error.response?.data?.message || 'Lỗi khi export')
        }
    }

    const canManageAll = userRole === 'admin' || userRole === 'manager'

    const canWriteReport = (reportType) => {
        if (canManageAll) return true
        if (reportType === 'tdg' && accessibleReportTypes.includes('overall_tdg')) return true
        if (reportType === 'standard' && accessibleReportTypes.includes('standard')) return true
        return reportType === 'criteria' && accessibleReportTypes.includes('criteria');
    }

    const hasWritePermission = accessibleReportTypes.length > 0

    const checkCanEditStandard = async (standardId) => {
        if (canManageAll) return true
        try {
            return userPermissions.canEditStandard(standardId);
        } catch (e) { return false }
    }

    const checkCanEditCriteria = async (criteriaId) => {
        if (canManageAll) return true
        try {
            return userPermissions.canEditCriteria(criteriaId);
        } catch (e) { return false }
    }

    const checkCanUploadEvidence = async (criteriaId) => {
        if (canManageAll) return true
        try {
            return userPermissions.canUploadEvidence(criteriaId);
        } catch (e) { return false }
    }

    const checkCanAssignReporters = async (standardId, criteriaId) => {
        if (canManageAll) return true
        try {
            return userPermissions.canAssignReporters(standardId, criteriaId);
        } catch (e) { return false }
    }

    const handleAssignClick = (type, node, reportType) => {
        const assignData = {
            type: type,
            id: node.id,
            code: node.code,
            name: node.name,
            programId: selectedProgram,
            organizationId: selectedOrganization,
            standardId: node.standardId,
            criteriaId: node.criteriaId
        }
        setAssignTarget(assignData)
        setAssignReportType(reportType)
        setShowAssignModal(true)
    }

    const handleAssignSubmit = async (data) => {
        try {
            await apiMethods.tasks.create(data)
            toast.success('Giao nhiệm vụ thành công')
            setShowAssignModal(false)
            setAssignTarget(null)
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Lỗi khi giao nhiệm vụ')
        }
    }

    const handleFileUpload = async (files) => {
        if (!selectedEvidence) return
        try {
            const formData = new FormData()
            files.forEach(file => {
                formData.append('files', file)
            })
            await apiMethods.files.uploadMultiple(formData, selectedEvidence.id)
            toast.success('Upload file thành công')
            fetchTreeData()
            setSelectedEvidence(null)
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Lỗi khi upload file')
        }
    }

    return (
        <div className="space-y-6">
            <EvidenceTreeHeader
                onBack={() => router.push('/evidence-management')}
                onDownloadTemplate={downloadTemplate}
                onImport={handleImport}
                onExport={handleExport}
                onAssignTDG={() => {
                    const firstStandard = treeData[0]

                    if (!firstStandard) {
                        toast.error('Không tìm thấy Tiêu chuẩn nào trong Chương trình hiện tại. Vui lòng tạo Tiêu chuẩn trước.')
                        return
                    }

                    handleAssignClick('tdg', {
                        id: selectedProgram,
                        code: 'TĐG',
                        name: 'Báo cáo Tự đánh giá',
                        standardId: firstStandard.id,
                        criteriaId: null
                    }, 'tdg')
                }}
                loading={loading}
                selectedProgram={selectedProgram}
                selectedOrganization={selectedOrganization}
                userRole={userRole}
                canManageAll={canManageAll}
                hasWritePermission={hasWritePermission}
            />

            <EvidenceTreeStatistics
                statistics={statistics}
                selectedProgram={selectedProgram}
                selectedOrganization={selectedOrganization}
                programs={programs}
                organizations={organizations}
                onProgramChange={setSelectedProgram}
                onOrgChange={setSelectedOrganization}
            />

            <div className="grid grid-cols-12 gap-6">
                <div className={`${selectedEvidence ? 'col-span-12 lg:col-span-7' : 'col-span-12'} transition-all duration-300`}>
                    <EvidenceTreeMain
                        treeData={treeData}
                        loading={loading}
                        expandedNodes={expandedNodes}
                        onToggleNode={toggleNode}
                        onExpandAll={expandAll}
                        onCollapseAll={collapseAll}
                        onSelectEvidence={setSelectedEvidence}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        userRole={userRole}
                        canManageAll={canManageAll}
                        canWriteReport={canWriteReport}
                        canEditStandard={checkCanEditStandard}
                        canEditCriteria={checkCanEditCriteria}
                        canUploadEvidence={checkCanUploadEvidence}
                        canAssignReporters={checkCanAssignReporters}
                        onAssignClick={handleAssignClick}
                        onEditEvidence={(evidence) => {
                            toast.info('Chức năng sửa minh chứng đang phát triển')
                        }}
                        onDeleteEvidence={(evidence) => {
                            if (confirm('Bạn chắc chắn muốn xóa?')) {
                                toast.success('Xóa minh chứng')
                            }
                        }}
                    />
                </div>

                {selectedEvidence && (
                    <div className="col-span-12 lg:col-span-5">
                        <EvidenceTreeTaskForm
                            showAssignModal={false}
                            assignTarget={null}
                            selectedEvidence={selectedEvidence}
                            onCloseFileManager={() => setSelectedEvidence(null)}
                            onFileUpload={handleFileUpload}
                            onClose={() => setShowAssignModal(false)}
                            onSubmit={handleAssignSubmit}
                        />
                    </div>
                )}
            </div>

            <EvidenceTreeTaskForm
                showAssignModal={showAssignModal}
                assignTarget={assignTarget}
                assignReportType={assignReportType}
                onClose={() => setShowAssignModal(false)}
                onSubmit={handleAssignSubmit}
                onCloseFileManager={() => setSelectedEvidence(null)}
            />
        </div>
    )
}