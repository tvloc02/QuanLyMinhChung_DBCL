import { useState } from 'react'
import {
    Upload,
    File,
    CheckCircle,
    X,
    Download,
    AlertCircle,
    Folder,
    Plus,
    ChevronRight
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'

export default function EvidenceImport() {
    const [currentStep, setCurrentStep] = useState(1)
    const [selectedProgram, setSelectedProgram] = useState('')
    const [selectedOrganization, setSelectedOrganization] = useState('')
    const [treeFile, setTreeFile] = useState(null)
    const [evidenceFiles, setEvidenceFiles] = useState([])
    const [importProgress, setImportProgress] = useState(0)
    const [isImporting, setIsImporting] = useState(false)

    const steps = [
        { id: 1, name: 'Import cây thư mục', description: 'Tải lên file Excel chứa cây minh chứng' },
        { id: 2, name: 'Tổng hợp minh chứng', description: 'Tải lên các file/folder minh chứng' },
        { id: 3, name: 'Thêm minh chứng tự động', description: 'Hệ thống tự động tạo minh chứng' }
    ]

    // Tree file dropzone
    const {
        getRootProps: getTreeRootProps,
        getInputProps: getTreeInputProps,
        isDragActive: isTreeDragActive
    } = useDropzone({
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        multiple: false,
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                setTreeFile(acceptedFiles[0])
                toast.success('Đã tải lên file cây minh chứng')
            }
        },
        onDropRejected: () => {
            toast.error('Chỉ chấp nhận file Excel (.xlsx, .xls)')
        }
    })

    // Evidence files dropzone
    const {
        getRootProps: getEvidenceRootProps,
        getInputProps: getEvidenceInputProps,
        isDragActive: isEvidenceDragActive
    } = useDropzone({
        multiple: true,
        onDrop: (acceptedFiles) => {
            const newFiles = acceptedFiles.map(file => ({
                id: Math.random().toString(36).substr(2, 9),
                file,
                status: 'pending',
                matchedCode: null
            }))
            setEvidenceFiles(prev => [...prev, ...newFiles])
            toast.success(`Đã thêm ${acceptedFiles.length} file`)
        }
    })

    const handleProgramChange = (e) => {
        setSelectedProgram(e.target.value)
        setSelectedOrganization('')
    }

    const handleUploadTreeFile = async () => {
        if (!treeFile || !selectedProgram || !selectedOrganization) {
            toast.error('Vui lòng chọn chương trình, tổ chức và file cây minh chứng')
            return
        }

        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1000))
            toast.success('Tải lên file cây minh chứng thành công')
            setCurrentStep(2)
        } catch (error) {
            toast.error('Lỗi tải lên file cây minh chứng')
        }
    }

    const handleRemoveTreeFile = () => {
        setTreeFile(null)
    }

    const handleRemoveEvidenceFile = (fileId) => {
        setEvidenceFiles(prev => prev.filter(f => f.id !== fileId))
    }

    const handleStartImport = async () => {
        if (evidenceFiles.length === 0) {
            toast.error('Vui lòng tải lên ít nhất một file minh chứng')
            return
        }

        try {
            setIsImporting(true)
            setCurrentStep(3)

            // Simulate import progress
            for (let i = 0; i <= 100; i += 10) {
                await new Promise(resolve => setTimeout(resolve, 200))
                setImportProgress(i)
            }

            toast.success(`Import thành công ${evidenceFiles.length} minh chứng`)
        } catch (error) {
            toast.error('Lỗi import minh chứng')
        } finally {
            setIsImporting(false)
        }
    }

    const downloadSampleFile = () => {
        // Mock download sample file
        toast.success('Đang tải xuống file mẫu...')
    }

    const renderStepIndicator = () => (
        <div className="mb-8">
            <nav aria-label="Progress">
                <ol className="flex items-center">
                    {steps.map((step, stepIdx) => (
                        <li key={step.id} className={`${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} relative`}>
                            <div className="flex items-center">
                                <div className="flex items-center">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                                        step.id < currentStep
                                            ? 'border-green-500 bg-green-500'
                                            : step.id === currentStep
                                                ? 'border-blue-500 bg-blue-500'
                                                : 'border-gray-300 bg-white'
                                    }`}>
                                        {step.id < currentStep ? (
                                            <CheckCircle className="h-6 w-6 text-white" />
                                        ) : (
                                            <span className={`text-sm font-medium ${
                                                step.id === currentStep ? 'text-white' : 'text-gray-500'
                                            }`}>
                                                {step.id}
                                            </span>
                                        )}
                                    </div>
                                    <div className="ml-4 min-w-0 flex-1">
                                        <p className={`text-sm font-medium ${
                                            step.id <= currentStep ? 'text-gray-900' : 'text-gray-500'
                                        }`}>
                                            {step.name}
                                        </p>
                                        <p className={`text-sm ${
                                            step.id <= currentStep ? 'text-gray-600' : 'text-gray-400'
                                        }`}>
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                                {stepIdx !== steps.length - 1 && (
                                    <div className="absolute top-5 right-0 hidden h-0.5 w-8 bg-gray-300 sm:block sm:w-20" />
                                )}
                            </div>
                        </li>
                    ))}
                </ol>
            </nav>
        </div>
    )

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {renderStepIndicator()}

            {/* Step 1: Import Tree File */}
            {currentStep === 1 && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                        Bước 1: Import cây thư mục minh chứng
                    </h2>

                    {/* Program and Organization Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tên chương trình đánh giá *
                            </label>
                            <select
                                value={selectedProgram}
                                onChange={handleProgramChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Chọn chương trình</option>
                                <option value="prog1">Chương trình đánh giá chất lượng giáo dục</option>
                                <option value="prog2">Chương trình kiểm định chất lượng</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tổ chức - Cấp đánh giá *
                            </label>
                            <select
                                value={selectedOrganization}
                                onChange={(e) => setSelectedOrganization(e.target.value)}
                                disabled={!selectedProgram}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                required
                            >
                                <option value="">Chọn tổ chức</option>
                                <option value="org1">Trung tâm kiểm định chất lượng - VNUA</option>
                                <option value="org2">Ban đảm bảo chất lượng</option>
                            </select>
                        </div>
                    </div>

                    {/* Sample File Download */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            File mẫu
                        </label>
                        <button
                            onClick={downloadSampleFile}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Tải file mẫu
                        </button>
                        <p className="text-sm text-gray-500 mt-1">
                            Tải xuống file mẫu Excel để nhập cây minh chứng
                        </p>
                    </div>

                    {/* Tree File Upload */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chọn tệp tin *
                        </label>
                        <div
                            {...getTreeRootProps()}
                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                                isTreeDragActive
                                    ? 'border-blue-400 bg-blue-50'
                                    : 'border-gray-300 hover:border-gray-400'
                            }`}
                        >
                            <input {...getTreeInputProps()} />
                            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                            <p className="text-sm text-gray-600">
                                {isTreeDragActive
                                    ? 'Thả file vào đây...'
                                    : 'Kéo thả file Excel vào đây hoặc click để chọn file'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Chỉ chấp nhận file .xlsx, .xls
                            </p>
                        </div>

                        {treeFile && (
                            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <File className="h-5 w-5 text-green-600 mr-2" />
                                        <span className="text-sm font-medium text-green-800">
                                            {treeFile.name}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleRemoveTreeFile}
                                        className="text-green-600 hover:text-green-800"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleUploadTreeFile}
                            disabled={!treeFile || !selectedProgram || !selectedOrganization}
                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Tiếp tục
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Upload Evidence Files */}
            {currentStep === 2 && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                        Bước 2: Tổng hợp minh chứng
                    </h2>

                    <div className="mb-6">
                        <div
                            {...getEvidenceRootProps()}
                            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                                isEvidenceDragActive
                                    ? 'border-blue-400 bg-blue-50'
                                    : 'border-gray-300 hover:border-gray-400'
                            }`}
                        >
                            <input {...getEvidenceInputProps()} />
                            <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Tải lên file/folder minh chứng
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                {isEvidenceDragActive
                                    ? 'Thả file vào đây...'
                                    : 'Kéo thả nhiều file hoặc folder vào đây, hoặc click để chọn'}
                            </p>
                            <div className="text-xs text-gray-500">
                                <p>• File/Folder được lưu tên = Mã minh chứng - Tên minh chứng</p>
                                <p>• Mã minh chứng phải trùng với mã trong cây thư mục</p>
                                <p>• Hỗ trợ tất cả định dạng file</p>
                            </div>
                        </div>
                    </div>

                    {/* Uploaded Files List */}
                    {evidenceFiles.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Danh sách file đã tải lên ({evidenceFiles.length})
                            </h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {evidenceFiles.map(({ id, file, status, matchedCode }) => (
                                    <div key={id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center flex-1 min-w-0">
                                            <File className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                                    {matchedCode && ` • Khớp với: ${matchedCode}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {status === 'matched' && (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            )}
                                            {status === 'error' && (
                                                <AlertCircle className="h-4 w-4 text-red-500" />
                                            )}
                                            <button
                                                onClick={() => handleRemoveEvidenceFile(id)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between">
                        <button
                            onClick={() => setCurrentStep(1)}
                            className="btn-outline"
                        >
                            Quay lại
                        </button>
                        <button
                            onClick={handleStartImport}
                            disabled={evidenceFiles.length === 0}
                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Bắt đầu import
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Import Progress */}
            {currentStep === 3 && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                        Bước 3: Thêm minh chứng tự động
                    </h2>

                    <div className="text-center">
                        {isImporting ? (
                            <>
                                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Đang import minh chứng...
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Hệ thống đang tự động so sánh và tạo minh chứng
                                </p>
                                <div className="max-w-md mx-auto">
                                    <div className="bg-gray-200 rounded-full h-2 mb-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${importProgress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-sm text-gray-500">{importProgress}%</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Import thành công!
                                </h3>
                                <p className="text-sm text-gray-600 mb-6">
                                    Đã import thành công {evidenceFiles.length} minh chứng vào hệ thống
                                </p>
                                <div className="space-x-4">
                                    <button
                                        onClick={() => window.location.href = '/evidence-management'}
                                        className="btn-primary"
                                    >
                                        Xem danh sách minh chứng
                                    </button>
                                    <button
                                        onClick={() => {
                                            setCurrentStep(1)
                                            setTreeFile(null)
                                            setEvidenceFiles([])
                                            setImportProgress(0)
                                        }}
                                        className="btn-outline"
                                    >
                                        Import tiếp
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}