import express from 'express';
import axios from 'axios';
const router = express.Router();

// Proxy API chat
router.post('/', async (req, res) => {
    try {
        const { message } = req.body;
        const response = await axios.post('http://localhost:8000/api/ai-chat', { message });
        res.json(response.data);
    } catch (error) {
        console.error('AI Chat Error:', error.message);
        res.status(500).json({ reply: 'Lỗi kết nối tới AI service.' });
    }
});

export default router;
