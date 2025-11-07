import { useState } from 'react'
import {
    FolderOpen, ArrowLeft, Download, Upload, FileDown, Shield
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function EvidenceTreeHeader({
                                               onBack,
                                               onDownloadTemplate,
                                               onImport,
                                               onExport,
                                               onAssignTDG,
                                               loading,
                                               selectedProgram,
                                               selectedOrganization,
                                               userRole,
                                               canManageAll,
                                               hasWritePermission = false,
                                           }) {

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            if (!selectedProgram || !selectedOrganization) {
                toast.error('Vui lòng chọn Chương trình và Tổ chức trước')
                e.target.value = ''
                return
            }

            onImport(file)
        }
    }

    // ⭐️ DEBUG LOG
    console.log('📊 EvidenceTreeHeader - Props:', {
        userRole,
        canManageAll,
        hasWritePermission,
        showImportButton: canManageAll || (userRole === 'reporter' && hasWritePermission)
    })

    // ⭐️ LOGIC HIỂN THỊ NÚT IMPORT
    const showImportButton = canManageAll || (userRole === 'reporter' && hasWritePermission)

    return (
        <div className="space-y-4">
            {/* HEADER */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                            <FolderOpen className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Cây Minh Chứng</h1>
                            <p className="text-blue-100">Quản lý minh chứng theo chương trình, tổ chức, tiêu chuẩn và tiêu chí</p>
                        </div>
                    </div>
                    <button
                        onClick={onBack}
                        className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl hover:bg-opacity-30 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Quay lại</span>
                    </button>
                </div>
            </div>

            {/* BUTTON BAR */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-end">
                <div className="flex items-center space-x-2">
                    {/* NÚT 1: Download Template - LUÔN HIỂN THỊ */}
                    <button
                        onClick={onDownloadTemplate}
                        className="inline-flex items-center px-3 py-2.5 md:px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm"
                    >
                        <FileDown className="h-5 w-5 md:mr-2" />
                        <span className="hidden md:inline-flex">File mẫu</span>
                    </button>

                    {/* NÚT 2: Import - CHỈ HIỂN THỊ KHI CÓ QUYỀN */}
                    {showImportButton ? (
                        <label className={`inline-flex items-center px-3 py-2.5 md:px-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm cursor-pointer ${
                            !selectedProgram || !selectedOrganization ? 'opacity-50 cursor-not-allowed' : ''
                        }`}>
                            <input
                                id="file-upload"
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileSelect}
                                disabled={!selectedProgram || !selectedOrganization}
                                className="hidden"
                            />
                            <Upload className="h-5 w-5 md:mr-2" />
                            <span className="hidden md:inline-flex">Import</span>
                        </label>
                    ) : null}

                    {/* NÚT 3: Export - LUÔN HIỂN THỊ */}
                    <button
                        onClick={onExport}
                        disabled={!selectedProgram || !selectedOrganization}
                        className="inline-flex items-center px-3 py-2.5 md:px-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-medium text-sm"
                    >
                        <Download className="h-5 w-5 md:mr-2" />
                        <span className="hidden md:inline-flex">Export</span>
                    </button>

                    {/* NÚT 4: Phân quyền BC Tổng hợp - CHỈ ADMIN/MANAGER */}
                    {canManageAll && (
                        <button
                            onClick={onAssignTDG}
                            disabled={!selectedProgram || !selectedOrganization}
                            className="inline-flex items-center px-3 py-2.5 md:px-4 bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-medium text-sm"
                        >
                            <Shield className="h-5 w-5 md:mr-2" />
                            <span className="hidden md:inline-flex">BC TĐG</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}