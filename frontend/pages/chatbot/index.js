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
    Save,
    Sparkles,
    Brain,
    FolderOpen,
    Settings,
    ChevronDown,
    Eye,
    EyeOff,
    Zap,
    Target,
    Archive,
    Info
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'
import { v4 as uuidv4 } from 'uuid';

function KnowledgeManagementModal({ isOpen, onClose, knowledgeData, setKnowledgeData, onSaveAndReindex }) {
    if (!isOpen) return null;

    const handleAddChunk = () => {
        const newChunk = {
            id: `chunk_${uuidv4()}`,
            source: 'Nguồn kiến thức mới',
            text: 'Nội dung kiến thức...'
        };
        setKnowledgeData(prev => [...prev, newChunk]);
    };

    const handleRemoveChunk = (id) => {
        if (!confirm('Bạn có chắc muốn xóa kiến thức này?')) return;
        setKnowledgeData(prev => prev.filter(chunk => chunk.id !== id));
    };

    const handleDataChange = (id, field, value) => {
        setKnowledgeData(prev =>
            prev.map(chunk => (chunk.id === id ? { ...chunk, [field]: value } : chunk))
        );
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col animate-slideUp">
                <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-3xl">
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Brain className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Quản lý Kiến thức AI</h2>
                            <p className="text-sm text-white/80">Huấn luyện và tùy chỉnh kiến thức hệ thống</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                    {knowledgeData.map((chunk, index) => (
                        <div
                            key={chunk.id}
                            className="bg-white border-2 border-gray-200 rounded-2xl p-6 relative hover:shadow-lg transition-shadow group"
                        >
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleRemoveChunk(chunk.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                    title="Xóa kiến thức"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="flex items-center mb-4">
                                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full">
                                    Kiến thức #{index + 1}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                                        <FolderOpen className="h-4 w-4 mr-1" />
                                        Nguồn tham khảo
                                    </label>
                                    <input
                                        type="text"
                                        value={chunk.source}
                                        onChange={(e) => handleDataChange(chunk.id, 'source', e.target.value)}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                                        placeholder="VD: Hướng dẫn sử dụng hệ thống"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                                        <FileText className="h-4 w-4 mr-1" />
                                        Nội dung kiến thức
                                    </label>
                                    <textarea
                                        value={chunk.text}
                                        onChange={(e) => handleDataChange(chunk.id, 'text', e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all resize-none"
                                        rows={5}
                                        placeholder="Nhập nội dung kiến thức chi tiết..."
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={handleAddChunk}
                        className="w-full py-4 border-3 border-dashed border-gray-300 rounded-2xl text-gray-600 hover:bg-gray-100 hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center justify-center space-x-2"
                    >
                        <Sparkles className="h-5 w-5" />
                        <span className="font-semibold">Thêm kiến thức mới</span>
                    </button>
                </div>

                <div className="p-6 border-t bg-gray-100 rounded-b-3xl">
                    <button
                        onClick={onSaveAndReindex}
                        className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transform hover:scale-[1.02] transition-all flex items-center justify-center space-x-3"
                    >
                        <Zap className="h-5 w-5" />
                        <span>Lưu và Huấn luyện lại AI</span>
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
    const [showTypingIndicator, setShowTypingIndicator] = useState(false)

    const [uploadedFiles, setUploadedFiles] = useState([])
    const [filesLoading, setFilesLoading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    const [isKnowledgeModalOpen, setKnowledgeModalOpen] = useState(false)
    const [knowledgeData, setKnowledgeData] = useState([])
    const [knowledgeLoading, setKnowledgeLoading] = useState(false)

    const [quickActions] = useState([
        { icon: Search, text: 'Tìm kiếm minh chứng', query: 'Làm thế nào để tìm kiếm minh chứng?' },
        { icon: Upload, text: 'Upload tài liệu', query: 'Hướng dẫn upload tài liệu minh chứng' },
        { icon: FileText, text: 'Tạo báo cáo', query: 'Cách tạo báo cáo từ minh chứng' },
        { icon: Settings, text: 'Cấu hình hệ thống', query: 'Hướng dẫn cấu hình hệ thống' }
    ])

    const messagesEndRef = useRef(null)
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedSessionId = localStorage.getItem('chatbotSessionId')
            if (storedSessionId) {
                setSessionId(storedSessionId)
                loadChatHistory(storedSessionId)
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
        { name: 'AI Assistant', icon: Bot }
    ]

    const loadChatHistory = async (sessionId) => {
        try {
            const response = await apiMethods.aiChat.getChatHistory(sessionId)
            if (response.data.history && response.data.history.length > 0) {
                const formattedMessages = response.data.history.flatMap(item => [
                    { role: 'user', content: item.user_message, timestamp: item.timestamp },
                    { role: 'bot', content: item.bot_reply, timestamp: item.timestamp }
                ])
                setMessages(formattedMessages)
            }
        } catch (error) {
            console.error('Error loading chat history:', error)
        }
    }

    const loadUploadedFiles = async (showSuccessToast = false) => {
        setFilesLoading(true)
        try {
            const response = await apiMethods.aiChat.getFileVectors()
            if (response.data.success) {
                setUploadedFiles(response.data.vectors || [])
                if (showSuccessToast) {
                    toast.success('Đã tải lại danh sách files')
                }
            }
        } catch (error) {
            console.error('Error loading files:', error)
        } finally {
            setFilesLoading(false)
        }
    }

    const loadKnowledge = async () => {
        setKnowledgeLoading(true)
        try {
            const response = await apiMethods.aiChat.getSystemKnowledge()
            if (response.data.success) {
                setKnowledgeData(response.data.data || [])
                setKnowledgeModalOpen(true)
            } else {
                toast.error('Không thể tải kiến thức hệ thống')
            }
        } catch (error) {
            toast.error('Lỗi khi tải kiến thức hệ thống')
            console.error('Error loading knowledge:', error)
        } finally {
            setKnowledgeLoading(false)
        }
    }

    const handleSaveAndReindex = async () => {
        if (!confirm('Hành động này sẽ huấn luyện lại AI với kiến thức mới. Tiếp tục?')) return

        const savePromise = apiMethods.aiChat.updateSystemKnowledge(knowledgeData)
        toast.promise(savePromise, {
            loading: 'Đang lưu kiến thức...',
            success: 'Lưu thành công!',
            error: 'Lỗi khi lưu'
        })

        try {
            await savePromise

            const reindexPromise = apiMethods.aiChat.reindexKnowledge()
            toast.promise(reindexPromise, {
                loading: 'Đang huấn luyện lại AI...',
                success: 'Huấn luyện thành công! AI đã được cập nhật',
                error: 'Lỗi khi huấn luyện'
            })

            await reindexPromise
            setKnowledgeModalOpen(false)

        } catch (error) {
            console.error('Save or reindex error:', error)
        }
    }

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
        setShowTypingIndicator(true)

        try {
            const response = await axios.post('/api/ai-chat', {
                message: userMessage,
                session_id: sessionId,
                search_type: searchType
            })

            const botReply = response.data.reply || "Xin lỗi, tôi không nhận được phản hồi."
            const followupQuestions = response.data.followup_questions || []

            setTimeout(() => {
                const botMessage = {
                    role: 'bot',
                    content: botReply,
                    timestamp: new Date().toISOString(),
                    followups: followupQuestions,
                    searchType
                }
                setMessages(prev => [...prev, botMessage])
                setShowTypingIndicator(false)
            }, 500)

        } catch (error) {
            console.error("Lỗi khi gửi tin nhắn:", error)
            const errorMessage = error.response?.data?.reply || "Lỗi kết nối tới AI service."
            setMessages(prev => [...prev, {
                role: 'error',
                content: errorMessage,
                timestamp: new Date().toISOString()
            }])
            setShowTypingIndicator(false)
        } finally {
            setChatLoading(false)
        }
    }

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return

        setUploadProgress(0)
        const interval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90))
        }, 200)

        try {
            const uploadPromise = apiMethods.files.uploadMultiple(files, 'chatbot-files')

            await toast.promise(uploadPromise, {
                loading: 'Đang xử lý và vector hóa file...',
                success: 'Upload và huấn luyện AI thành công!',
                error: 'Lỗi khi xử lý file'
            })

            setUploadProgress(100)
            clearInterval(interval)

            setTimeout(() => {
                loadUploadedFiles(true)
                setUploadProgress(0)
            }, 2000)

        } catch (error) {
            console.error('Upload error:', error)
            clearInterval(interval)
            setUploadProgress(0)
        }

        e.target.value = ''
    }

    const handleDeleteVector = async (vectorId) => {
        if (!confirm('Xóa file này khỏi bộ nhớ AI?')) return

        try {
            await apiMethods.aiChat.deleteVector(vectorId)
            toast.success('Đã xóa file thành công')
            loadUploadedFiles()
        } catch (error) {
            toast.error('Lỗi khi xóa file')
            console.error('Delete error:', error)
        }
    }

    const handleClearChat = () => {
        if (!confirm('Xóa toàn bộ lịch sử chat?')) return
        setMessages([])
        toast.success('Đã xóa lịch sử chat')
    }

    const handleQuickAction = (query) => {
        setInput(query)
    }

    const formatTime = (isoString) => {
        return new Date(isoString).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Đang tải AI Assistant...</p>
                </div>
            </div>
        )
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <KnowledgeManagementModal
                isOpen={isKnowledgeModalOpen}
                onClose={() => setKnowledgeModalOpen(false)}
                knowledgeData={knowledgeData}
                setKnowledgeData={setKnowledgeData}
                onSaveAndReindex={handleSaveAndReindex}
            />

            <div className="space-y-6">
                <div className="mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <Brain className="h-10 w-10" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-2">AI Assistant</h1>
                                <p className="text-white/80">Trợ lý thông minh cho hệ thống quản lý minh chứng</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <p className="text-sm text-white/70">Chế độ tìm kiếm</p>
                                <p className="text-lg font-semibold">
                                    {searchType === 'files' ? '📁 Files Upload' : '📚 Kiến thức hệ thống'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-3">
                                        <select
                                            value={searchType}
                                            onChange={(e) => setSearchType(e.target.value)}
                                            className="px-4 py-2 bg-white rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                                        >
                                            <option value="knowledge">📚 Kiến thức hệ thống</option>
                                            <option value="files">📁 Files đã upload</option>
                                        </select>
                                        <span className="text-sm text-gray-500">
                                            {messages.length} tin nhắn
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleClearChat}
                                        className="p-2 hover:bg-red-50 text-red-600 rounded-xl transition-all"
                                        title="Xóa lịch sử"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="h-[600px] overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
                                {messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <div className="p-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl mb-6">
                                            <Bot className="h-20 w-20 text-indigo-600" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-800 mb-3">Xin chào! Tôi là AI Assistant</h3>
                                        <p className="text-gray-600 text-center max-w-md mb-8">
                                            Tôi có thể giúp bạn tìm kiếm thông tin về hệ thống quản lý minh chứng hoặc phân tích tài liệu bạn upload.
                                        </p>

                                        <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                                            {quickActions.map((action, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => handleQuickAction(action.query)}
                                                    className="flex items-center space-x-2 p-3 bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-md transition-all"
                                                >
                                                    <action.icon className="h-5 w-5 text-indigo-600" />
                                                    <span className="text-sm text-gray-700">{action.text}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {messages.map((msg, index) => (
                                            <div
                                                key={index}
                                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                                            >
                                                <div className={`max-w-[85%] ${
                                                    msg.role === 'user'
                                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                                                        : msg.role === 'error'
                                                            ? 'bg-red-100 text-red-800 border-2 border-red-200'
                                                            : 'bg-white border-2 border-gray-200'
                                                } rounded-2xl p-4 shadow-lg`}>

                                                    {msg.role === 'bot' && (
                                                        <div className="flex items-center mb-3 pb-2 border-b border-gray-100">
                                                            <div className="p-1.5 bg-indigo-100 rounded-lg mr-2">
                                                                <Bot className="h-4 w-4 text-indigo-600" />
                                                            </div>
                                                            <span className="text-xs text-gray-600 font-medium">
                                                                AI Assistant • {msg.searchType === 'files' ? 'Files' : 'Knowledge'}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                                                    <div className={`text-xs mt-2 ${
                                                        msg.role === 'user' ? 'text-white/70' : 'text-gray-500'
                                                    }`}>
                                                        <Clock className="inline h-3 w-3 mr-1" />
                                                        {formatTime(msg.timestamp)}
                                                    </div>

                                                    {msg.followups && msg.followups.length > 0 && (
                                                        <div className="mt-4 pt-3 border-t border-gray-100">
                                                            <p className="text-xs text-gray-600 mb-2 font-semibold">💡 Gợi ý câu hỏi:</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {msg.followups.map((followup, fIndex) => (
                                                                    <button
                                                                        key={fIndex}
                                                                        onClick={() => setInput(followup)}
                                                                        className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors"
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

                                        {showTypingIndicator && (
                                            <div className="flex justify-start animate-fadeIn">
                                                <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-lg">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="flex space-x-1">
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                                                        </div>
                                                        <span className="text-sm text-gray-600">AI đang suy nghĩ...</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
                                <div className="flex space-x-3">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder={`Hỏi về ${searchType === 'files' ? 'nội dung files đã upload' : 'hệ thống quản lý minh chứng'}...`}
                                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                                        disabled={chatLoading}
                                    />
                                    <button
                                        type="submit"
                                        disabled={chatLoading || !input.trim()}
                                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all"
                                    >
                                        <Send className="h-5 w-5" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center">
                                <Brain className="h-5 w-5 mr-2 text-indigo-600" />
                                Huấn luyện AI
                            </h3>
                            <button
                                onClick={loadKnowledge}
                                disabled={knowledgeLoading}
                                className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all flex items-center justify-center disabled:opacity-70"
                            >
                                {knowledgeLoading ? (
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                ) : (
                                    <Settings className="h-5 w-5 mr-2" />
                                )}
                                Quản lý kiến thức
                            </button>
                            <p className="text-xs text-gray-500 mt-3">
                                Thêm, sửa, xóa kiến thức để AI học và trả lời chính xác hơn
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center">
                                <Upload className="h-5 w-5 mr-2 text-green-600" />
                                Upload tài liệu
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
                                className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all flex items-center justify-center"
                            >
                                <FolderOpen className="h-5 w-5 mr-2" />
                                Chọn files
                            </button>

                            {uploadProgress > 0 && (
                                <div className="mt-3">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1 text-center">
                                        Đang xử lý: {uploadProgress}%
                                    </p>
                                </div>
                            )}

                            <p className="text-xs text-gray-500 mt-3">
                                PDF, Word, Excel, PowerPoint, Text (Max: 50MB)
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold flex items-center">
                                    <Archive className="h-5 w-5 mr-2 text-purple-600" />
                                    Files đã học
                                </h3>
                                <button
                                    onClick={() => loadUploadedFiles(true)}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                                    title="Làm mới"
                                >
                                    <RefreshCw className={`h-4 w-4 text-gray-600 ${filesLoading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>

                            {filesLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                </div>
                            ) : uploadedFiles.length === 0 ? (
                                <div className="text-center py-12">
                                    <FileText className="h-16 w-16 mx-auto mb-3 text-gray-300" />
                                    <p className="text-gray-500">Chưa có file nào</p>
                                    <p className="text-xs text-gray-400 mt-1">Upload file để AI học nội dung</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {uploadedFiles.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-all group"
                                        >
                                            <div className="flex items-center flex-1 min-w-0">
                                                <div className="p-2 bg-white rounded-lg mr-3">
                                                    <FileText className="h-5 w-5 text-indigo-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-800 truncate">
                                                        {file.filename}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {file.chunks_count} phần • Đã vector hóa
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteVector(file.file_id)}
                                                className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg text-red-600 transition-all ml-2"
                                                title="Xóa"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border-2 border-blue-200">
                            <div className="flex items-start space-x-3">
                                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-blue-900 mb-1">Mẹo sử dụng</p>
                                    <ul className="text-xs text-blue-700 space-y-1">
                                        <li>• Upload tài liệu để AI học nội dung cụ thể</li>
                                        <li>• Chọn chế độ tìm kiếm phù hợp với câu hỏi</li>
                                        <li>• Sử dụng gợi ý câu hỏi để khám phá thêm</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                .animate-slideUp {
                    animation: slideUp 0.4s ease-out;
                }
            `}</style>
        </Layout>
    )
}