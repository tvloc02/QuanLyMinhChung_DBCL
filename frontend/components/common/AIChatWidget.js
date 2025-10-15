import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, MessageSquare, X, RefreshCw, Loader } from 'lucide-react';

const API_BASE_URL = '/api/ai-chat';
const HISTORY_API_BASE_URL = '/api/chat-history';

const AIChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [sessionId, setSessionId] = useState(null);

    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedSessionId = localStorage.getItem('chatSessionId');
            if (storedSessionId) {
                setSessionId(storedSessionId);
            } else {
                const newId = `session-${Date.now()}`;
                setSessionId(newId);
                localStorage.setItem('chatSessionId', newId);
            }
        }
    }, []);

    useEffect(() => {
        if (sessionId && typeof window !== 'undefined') {
            localStorage.setItem('chatSessionId', sessionId);
        }
    }, [sessionId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    const loadHistory = async () => {
        if (!sessionId) return;

        try {
            const response = await axios.get(`${HISTORY_API_BASE_URL}/${sessionId}`);
            const history = response.data.history.map(item => [
                { role: 'user', content: item.user_message, timestamp: item.timestamp },
                { role: 'bot', content: item.bot_reply, timestamp: item.timestamp }
            ]).flat();
            setMessages(history);
        } catch (error) {
            console.error("Lỗi khi tải lịch sử chat:", error);
        }
    };

    const handleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen && sessionId) {
            loadHistory();
        }
    };

    const handleClearHistory = async () => {
        if (!sessionId || typeof window === 'undefined' || !window.confirm("Bạn có chắc chắn muốn xóa lịch sử chat này không?")) return;

        try {
            await axios.delete(`${HISTORY_API_BASE_URL}/${sessionId}`);
            setMessages([]);

            const newId = `session-${Date.now()}`;
            setSessionId(newId);
            localStorage.setItem('chatSessionId', newId);

            alert("Lịch sử đã được xóa.");
        } catch (error) {
            console.error("Lỗi khi xóa lịch sử:", error);
            alert("Xóa lịch sử thất bại.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const userMessage = input.trim();
        if (!userMessage || !sessionId) return;

        const newMessage = { role: 'user', content: userMessage, timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, newMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await axios.post(API_BASE_URL, {
                message: userMessage,
                session_id: sessionId
            });

            const botReply = response.data.reply || "Xin lỗi, tôi không nhận được phản hồi.";
            const followupQuestions = response.data.followup_questions || [];

            const botMessage = {
                role: 'bot',
                content: botReply,
                timestamp: new Date().toISOString(),
                followups: followupQuestions
            };
            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error("Lỗi khi gửi tin nhắn:", error);
            const errorMessage = error.response?.data?.reply || "Lỗi kết nối tới AI service. Vui lòng thử lại.";
            setMessages(prev => [...prev, {
                role: 'error',
                content: errorMessage,
                timestamp: new Date().toISOString()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (isoString) => {
        return new Date(isoString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    if (!sessionId) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <button
                onClick={handleOpen}
                className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition duration-300"
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </button>

            {isOpen && (
                <div className="bg-white border border-blue-200 rounded-lg shadow-xl w-80 h-[450px] absolute bottom-20 right-0 flex flex-col">
                    <div className="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between items-center">
                        <h3 className="font-semibold">Trợ lý Minh Chứng AI</h3>
                        <div className="flex space-x-2">
                            <button onClick={handleClearHistory} title="Xóa lịch sử" className="p-1 hover:bg-blue-700 rounded-full transition">
                                <RefreshCw size={16} />
                            </button>
                            <button onClick={() => setIsOpen(false)} title="Đóng" className="p-1 hover:bg-blue-700 rounded-full transition">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-grow p-3 overflow-y-auto space-y-3">
                        {messages.length === 0 && !isLoading && (
                            <div className="text-center text-gray-500 mt-10">
                                <p>Chào bạn, tôi là Trợ lý AI. Tôi có thể giúp gì cho bạn về hệ thống quản lý minh chứng?</p>
                            </div>
                        )}
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] p-2 rounded-lg text-sm shadow-md ${
                                    msg.role === 'user' ? 'bg-blue-500 text-white' :
                                        msg.role === 'error' ? 'bg-red-100 text-red-600' :
                                            'bg-gray-100 text-gray-800'
                                }`}>
                                    <p>{msg.content}</p>
                                    <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                                        {formatTime(msg.timestamp)}
                                    </div>

                                    {msg.role === 'bot' && msg.followups && msg.followups.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-300">
                                            <p className="font-semibold text-xs mb-1">Gợi ý:</p>
                                            {msg.followups.map((followup, fIndex) => (
                                                <button
                                                    key={fIndex}
                                                    onClick={() => setInput(followup)}
                                                    className="text-xs text-blue-600 hover:text-blue-800 bg-white border border-blue-600 rounded-full px-2 py-1 mr-1 mb-1 transition"
                                                >
                                                    {followup}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="max-w-[75%] p-2 rounded-lg text-sm bg-gray-100 text-gray-800 flex items-center shadow-md">
                                    <Loader size={16} className="animate-spin mr-2 text-blue-600" />
                                    AI đang trả lời...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200">
                        <div className="flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Nhập câu hỏi của bạn..."
                                className="flex-grow p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 text-white p-2 rounded-r-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50"
                                disabled={isLoading || !input.trim()}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AIChatWidget;