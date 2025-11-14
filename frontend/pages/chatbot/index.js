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
    X
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function ChatbotPage() {
    const { user, isLoading } = useAuth()

    // States cho chat
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [chatLoading, setChatLoading] = useState(false)
    const [sessionId, setSessionId] = useState(null)
    const [searchType, setSearchType] = useState('knowledge') // knowledge hoặc files

    // States cho file management
    const [uploadedFiles, setUploadedFiles] = useState([])
    const [filesLoading, setFilesLoading] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState([])

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

        // loadUploadedFiles()
    }, [])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const breadcrumbItems = [
        { name: 'Trang chủ', href: '/' },
        { name: 'AI Chatbot', icon: Bot }
    ]

    // const loadUploadedFiles = async () => {
    //     setFilesLoading(true)
    //     try {
    //         const response = await axios.get('/api/get-file-vectors')
    //         if (response.data.success) {
    //             setUploadedFiles(response.data.vectors || [])
    //         }
    //     } catch (error) {
    //         console.error('Error loading files:', error)
    //     } finally {
    //         setFilesLoading(false)
    //     }
    // }

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

    // const handleFileUpload = async (e) => {
    //     const files = Array.from(e.target.files)
    //     if (files.length === 0) return

    //     const formData = new FormData()
    //     files.forEach(file => {
    //         formData.append('files', file)
    //     })
    //     formData.append('evidenceId', 'chatbot-files') // ID giả cho chatbot

    //     try {
    //         const uploadPromise = axios.post('/api/files/upload/chatbot-files', formData, {
    //             headers: {
    //                 'Content-Type': 'multipart/form-data'
    //             }
    //         })

    //         await toast.promise(uploadPromise, {
    //             loading: 'Đang upload và xử lý file...',
    //             success: 'Upload và vector hóa thành công!',
    //             error: 'Lỗi khi upload file'
    //         })

    //         // Reload danh sách files
    //         setTimeout(() => {
    //             loadUploadedFiles()
    //         }, 2000)

    //     } catch (error) {
    //         console.error('Upload error:', error)
    //     }

    //     // Reset input
    //     e.target.value = ''
    // }

    // const handleDeleteVector = async (vectorId) => {
    //     if (!confirm('Bạn có chắc chắn muốn xóa vector này?')) return

    //     try {
    //         await axios.delete(`/api/delete-vector/${vectorId}`)
    //         toast.success('Đã xóa vector thành công')
    //         loadUploadedFiles()
    //     } catch (error) {
    //         toast.error('Lỗi khi xóa vector')
    //         console.error('Delete error:', error)
    //     }
    // }

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
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Chat Area */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            {/* Chat Header */}
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

                            {/* Messages Area */}
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

                                                    {/* Follow-up questions */}
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

                            {/* Input Area */}
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

                    {/* Sidebar - File Management (Temporarily Disabled) */}
                    {/* <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-lg p-4">
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                <Upload className="h-5 w-5 mr-2 text-green-600" />
                                Upload Files để AI học
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
                                    onClick={loadUploadedFiles}
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

                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                            <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                                <AlertCircle className="h-5 w-5 mr-2" />
                                Hướng dẫn sử dụng
                            </h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Upload file để AI học nội dung</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Chọn "Files đã upload" để hỏi về nội dung file</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Chọn "Kiến thức hệ thống" để hỏi về hệ thống</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>AI sẽ tự động tóm tắt và lưu trữ nội dung</span>
                                </li>
                            </ul>
                        </div>
                    </div> */}
                </div>
            </div>
        </Layout>
    )
}