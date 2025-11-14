import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import {
    Send,
    MessageSquare,
    Upload,
    FileText,
    Trash2,
    RefreshCw,
    Loader2,
    Bot,
    File,
    Database,
    Search,
    Download,
    AlertCircle,
    CheckCircle,
    Clock,
    X,
    BookOpen,
    Save
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'
import { v4 as uuidv4 } from 'uuid';

function KnowledgeManagementModal({ isOpen, onClose, knowledgeData, setKnowledgeData, onSaveAndReindex }) {
    if (!isOpen) return null;

    const handleAddChunk = () => {
        const newChunk = { id: `chunk_${uuidv4()}`, source: 'Nguồn mới', text: 'Nội dung mới...' };
        setKnowledgeData(prev => [...prev, newChunk]);
    };

    const handleRemoveChunk = (id) => {
        if (!confirm('Bạn có chắc muốn xóa chunk này?')) return;
        setKnowledgeData(prev => prev.filter(chunk => chunk.id !== id));
    };

    const handleDataChange = (id, field, value) => {
        setKnowledgeData(prev =>
            prev.map(chunk => (chunk.id === id ? { ...chunk, [field]: value } : chunk))
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold flex items-center">
                        <BookOpen className="mr-2" /> Quản lý Kiến thức Hệ thống
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
                        <X />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {knowledgeData.map(chunk => (
                        <div key={chunk.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 relative">
                            <button
                                onClick={() => handleRemoveChunk(chunk.id)}
                                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-full"
                                title="Xóa chunk"
                            >
                                <Trash2 size={16} />
                            </button>
                            <div className="space-y-2">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Nguồn (Source)</label>
                                    <input
                                        type="text"
                                        value={chunk.source}
                                        onChange={(e) => handleDataChange(chunk.id, 'source', e.target.value)}
                                        className="w-full mt-1 p-2 border rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Nội dung (Text)</label>
                                    <textarea
                                        value={chunk.text}
                                        onChange={(e) => handleDataChange(chunk.id, 'text', e.target.value)}
                                        className="w-full mt-1 p-2 border rounded-md"
                                        rows={4}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={handleAddChunk}
                        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-100 hover:border-gray-400"
                    >
                        + Thêm Chunk mới
                    </button>
                </div>
                <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
                    <button
                        onClick={onSaveAndReindex}
                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center"
                    >
                        <Save className="mr-2" /> Lưu và Re-index
                    </button>
                </div>
            </div>
        </div>
    );
}


export default function ChatbotPage() {
    const { user, isLoading } = useAuth()

    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [chatLoading, setChatLoading] = useState(false)
    const [sessionId, setSessionId] = useState(null)
    const [searchType, setSearchType] = useState('knowledge')

    const [uploadedFiles, setUploadedFiles] = useState([])
    const [filesLoading, setFilesLoading] = useState(false)
    
    const [isKnowledgeModalOpen, setKnowledgeModalOpen] = useState(false);
    const [knowledgeData, setKnowledgeData] = useState([]);
    const [knowledgeLoading, setKnowledgeLoading] = useState(false);


    const messagesEndRef = useRef(null)
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedSessionId = localStorage.getItem('chatbotSessionId')
            if (storedSessionId) {
                setSessionId(storedSessionId)
            } else {
                const newId = `session-${Date.now()}`
                setSessionId(newId)
                localStorage.setItem('chatbotSessionId', newId)
            }
        }

        loadUploadedFiles()
    }, [])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const breadcrumbItems = [
        { name: 'Trang chủ', href: '/' },
        { name: 'AI Chatbot', icon: Bot }
    ]

    const loadUploadedFiles = async (showSuccessToast = false) => {
        setFilesLoading(true)
        try {
            const response = await apiMethods.aiChat.getFileVectors()
            if (response.data.success) {
                setUploadedFiles(response.data.vectors || [])
                if (showSuccessToast) {
                    toast.success('Đã tải lại danh sách files thành công.')
                }
            }
        } catch (error) {
            console.error('Error loading files:', error)
            toast.error('Lỗi khi tải danh sách files.')
        } finally {
            setFilesLoading(false)
        }
    }
    
    const loadKnowledge = async () => {
        setKnowledgeLoading(true);
        try {
            const response = await apiMethods.aiChat.getSystemKnowledge();
            if (response.data.success) {
                setKnowledgeData(response.data.data || []);
                setKnowledgeModalOpen(true);
            } else {
                toast.error('Không thể tải kiến thức hệ thống.');
            }
        } catch (error) {
            toast.error('Lỗi khi tải kiến thức hệ thống.');
            console.error('Error loading knowledge:', error);
        } finally {
            setKnowledgeLoading(false);
        }
    };

    const handleSaveAndReindex = async () => {
        if (!confirm('Hành động này sẽ ghi đè lên file kiến thức và bắt đầu quá trình re-index. Bạn có chắc chắn?')) return;

        const savePromise = apiMethods.aiChat.updateSystemKnowledge(knowledgeData);
        toast.promise(savePromise, {
            loading: 'Đang lưu file kiến thức...',
            success: 'Lưu file thành công!',
            error: 'Lỗi khi lưu file.'
        });

        try {
            await savePromise;
            
            const reindexPromise = apiMethods.aiChat.reindexKnowledge();
            toast.promise(reindexPromise, {
                loading: 'Đang gửi yêu cầu re-index...',
                success: (res) => res.data.message || 'Yêu cầu re-index thành công!',
                error: 'Lỗi khi gửi yêu cầu re-index.'
            });
            
            await reindexPromise;
            setKnowledgeModalOpen(false);

        } catch (error) {
            console.error('Save or reindex error:', error);
        }
    };


    const handleSendMessage = async (e) => {
        e.preventDefault()
        const userMessage = input.trim()
        if (!userMessage || !sessionId) return

        const newMessage = {
            role: 'user',
            content: userMessage,
            timestamp: new Date().toISOString(),
            searchType
        }
        setMessages(prev => [...prev, newMessage])
        setInput('')
        setChatLoading(true)

        try {
            const response = await axios.post('/api/ai-chat', {
                message: userMessage,
                session_id: sessionId,
                search_type: searchType
            })

            const botReply = response.data.reply || "Xin lỗi, tôi không nhận được phản hồi."
            const followupQuestions = response.data.followup_questions || []

            const botMessage = {
                role: 'bot',
                content: botReply,
                timestamp: new Date().toISOString(),
                followups: followupQuestions,
                searchType
            }
            setMessages(prev => [...prev, botMessage])

        } catch (error) {
            console.error("Lỗi khi gửi tin nhắn:", error)
            const errorMessage = error.response?.data?.reply || "Lỗi kết nối tới AI service."
            setMessages(prev => [...prev, {
                role: 'error',
                content: errorMessage,
                timestamp: new Date().toISOString()
            }])
        } finally {
            setChatLoading(false)
        }
    }

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return

        try {
            const uploadPromise = apiMethods.files.uploadMultiple(files, 'chatbot-files')

            await toast.promise(uploadPromise, {
                loading: 'Đang upload và xử lý file...',
                success: 'Upload và vector hóa thành công!',
                error: (err) => {
                    const errorMsg = err.response?.data?.message || 'Lỗi khi upload file';
                    console.error('Upload error detail:', err.response?.data?.results || err);
                    return errorMsg;
                }
            })

            // ĐIỀU CHỈNH: Tăng thời gian chờ và gọi loadUploadedFiles
            setTimeout(() => {
                // Tải lại danh sách sau khi quá trình vector hóa (Flask) có thể đã hoàn thành
                loadUploadedFiles(true)
            }, 10000) // Tăng lên 5 giây để đảm bảo Python đã ghi vào ChromaDB

        } catch (error) {
            console.error('Final upload error block:', error)
            // Lỗi đã được toast.promise xử lý, không cần toast lại ở đây
        }

        // Reset input
        e.target.value = ''
    }

    const handleDeleteVector = async (vectorId) => {
        if (!confirm('Bạn có chắc chắn muốn xóa vector này?')) return

        try {
            await apiMethods.aiChat.deleteVector(vectorId)
            toast.success('Đã xóa vector thành công')
            loadUploadedFiles()
        } catch (error) {
            toast.error('Lỗi khi xóa vector')
            console.error('Delete error:', error)
        }
    }

    const handleClearChat = () => {
        if (!confirm('Bạn có chắc chắn muốn xóa lịch sử chat?')) return
        setMessages([])
        toast.success('Đã xóa lịch sử chat')
    }

    const formatTime = (isoString) => {
        return new Date(isoString).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            </div>
        )
    }

    return (
        <Layout title="AI Chatbot - Quản lý kiến thức" breadcrumbItems={breadcrumbItems}>
            <KnowledgeManagementModal
                isOpen={isKnowledgeModalOpen}
                onClose={() => setKnowledgeModalOpen(false)}
                knowledgeData={knowledgeData}
                setKnowledgeData={setKnowledgeData}
                onSaveAndReindex={handleSaveAndReindex}
            />
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-3">
                                        <Bot className="h-8 w-8" />
                                        <div>
                                            <h2 className="text-xl font-bold">AI Assistant</h2>
                                            <p className="text-sm text-blue-100">
                                                Đang tìm kiếm trong: {searchType === 'files' ? 'Files đã upload' : 'Kiến thức hệ thống'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <select
                                            value={searchType}
                                            onChange={(e) => setSearchType(e.target.value)}
                                            className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-white border border-white/30"
                                        >
                                            <option value="knowledge">📚 Kiến thức hệ thống</option>
                                            <option value="files">📁 Files đã upload</option>
                                        </select>
                                        <button
                                            onClick={handleClearChat}
                                            className="p-2 hover:bg-white/20 rounded-lg transition"
                                            title="Xóa lịch sử"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="h-[500px] overflow-y-auto p-4 bg-gray-50">
                                {messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                        <MessageSquare className="h-16 w-16 mb-4 text-gray-300" />
                                        <p className="text-lg font-medium mb-2">Chào bạn! 👋</p>
                                        <p className="text-sm text-center max-w-md">
                                            Tôi có thể giúp bạn tìm kiếm thông tin từ hệ thống hoặc từ các file bạn đã upload.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {messages.map((msg, index) => (
                                            <div
                                                key={index}
                                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[80%] ${
                                                    msg.role === 'user'
                                                        ? 'bg-blue-600 text-white'
                                                        : msg.role === 'error'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-white border border-gray-200'
                                                } rounded-lg p-3 shadow-md`}>
                                                    {msg.role === 'bot' && (
                                                        <div className="flex items-center mb-2 text-gray-600">
                                                            <Bot className="h-4 w-4 mr-1" />
                                                            <span className="text-xs">
                                                                AI Assistant • {msg.searchType === 'files' ? 'Files' : 'Knowledge'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                                    <div className={`text-xs mt-1 ${
                                                        msg.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                                                    }`}>
                                                        {formatTime(msg.timestamp)}
                                                    </div>

                                                    {msg.followups && msg.followups.length > 0 && (
                                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                                            <p className="text-xs text-gray-600 mb-2">Gợi ý câu hỏi:</p>
                                                            <div className="space-y-1">
                                                                {msg.followups.map((followup, fIndex) => (
                                                                    <button
                                                                        key={fIndex}
                                                                        onClick={() => setInput(followup)}
                                                                        className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 rounded-full px-3 py-1 mr-2 transition"
                                                                    >
                                                                        {followup}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {chatLoading && (
                                            <div className="flex justify-start">
                                                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-md">
                                                    <div className="flex items-center space-x-2">
                                                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                                        <span className="text-sm text-gray-600">AI đang suy nghĩ...</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder={`Hỏi về ${searchType === 'files' ? 'nội dung files đã upload' : 'hệ thống'}...`}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={chatLoading}
                                    />
                                    <button
                                        type="submit"
                                        disabled={chatLoading || !input.trim()}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        <Send className="h-5 w-5" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-lg p-4">
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                                Quản lý Kiến thức Hệ thống
                            </h3>
                            <button
                                onClick={loadKnowledge}
                                disabled={knowledgeLoading}
                                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition flex items-center justify-center disabled:opacity-70"
                            >
                                {knowledgeLoading ? <Loader2 className="h-5 w-5 mr-2 animate-spin"/> : <BookOpen className="h-5 w-5 mr-2" />}
                                Mở Trình quản lý
                            </button>
                             <p className="text-xs text-gray-500 mt-2">
                                Chỉnh sửa, thêm, xóa các nguồn kiến thức gốc của AI.
                            </p>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-4">
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                <Upload className="h-5 w-5 mr-2 text-green-600" />
                                Upload Files để AI học (Tạm thời)
                            </h3>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                onChange={handleFileUpload}
                                accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition flex items-center justify-center"
                            >
                                <Upload className="h-5 w-5 mr-2" />
                                Chọn files để upload
                            </button>
                            <p className="text-xs text-gray-500 mt-2">
                                Hỗ trợ: PDF, Word, Excel, PowerPoint, Text
                            </p>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold flex items-center">
                                    <Database className="h-5 w-5 mr-2 text-purple-600" />
                                    Files đã vector hóa
                                </h3>
                                <button
                                    onClick={() => loadUploadedFiles(true)}
                                    className="p-1 hover:bg-gray-100 rounded-lg transition"
                                    title="Làm mới"
                                >
                                    <RefreshCw className={`h-4 w-4 ${filesLoading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>

                            {filesLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                </div>
                            ) : uploadedFiles.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">Chưa có file nào được upload</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {uploadedFiles.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                                        >
                                            <div className="flex items-center flex-1 min-w-0">
                                                <FileText className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {file.filename}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {file.chunks_count} chunks
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteVector(file.file_id)}
                                                className="p-1 hover:bg-red-100 rounded text-red-600 transition ml-2"
                                                title="Xóa"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}