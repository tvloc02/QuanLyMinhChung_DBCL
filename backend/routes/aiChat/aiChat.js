const express = require('express');
const axios = require('axios');
const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/ai-chat';
const AI_BASE_URL = AI_SERVICE_URL.replace('/api/ai-chat', '');

// API chat chính: POST /api/ai-chat
router.post('/ai-chat', async (req, res) => {
    try {
        const { message, session_id } = req.body;

        const response = await axios.post(AI_SERVICE_URL, {
            message: message,
            session_id: session_id || "default"
        });

        res.json(response.data);
    } catch (error) {
        console.error('AI Chat Error:', error.message);
        const aiError = error.response ? error.response.data : null;
        res.status(500).json(aiError || { reply: 'Lỗi kết nối tới AI service.' });
    }
});

// Lấy lịch sử chat: GET /api/chat-history/:session_id
router.get('/chat-history/:session_id', async (req, res) => {
    try {
        const { session_id } = req.params;

        const response = await axios.get(`${AI_BASE_URL}/api/chat-history/${session_id}`);
        res.json(response.data);
    } catch (error) {
        console.error('AI History Error:', error.message);
        res.status(500).json({ error: 'Lỗi khi lấy lịch sử chat.', reply: 'Lỗi hệ thống.' });
    }
});

// Xóa lịch sử chat: DELETE /api/chat-history/:session_id
router.delete('/chat-history/:session_id', async (req, res) => {
    try {
        const { session_id } = req.params;

        const response = await axios.delete(`${AI_BASE_URL}/api/clear-history/${session_id}`);
        res.json(response.data);
    } catch (error) {
        console.error('AI Clear History Error:', error.message);
        res.status(500).json({ error: 'Lỗi khi xóa lịch sử chat.', reply: 'Lỗi hệ thống.' });
    }
});

module.exports = router;