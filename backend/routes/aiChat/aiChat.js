const express = require('express');
const axios = require('axios');
const router = express.Router();
const formData = require('form-data');
const { Readable } = require('stream');
const multer = require('multer');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/ai-chat';
const AI_BASE_URL = AI_SERVICE_URL.replace('/api/ai-chat', '');

const multerMemory = multer({ storage: multer.memoryStorage() });
const uploadMemory = multerMemory.array('files');

const proxyRequest = (path, method = 'get') => async (req, res) => {
    try {
        const url = `${AI_BASE_URL}${path.replace(':param', req.params.session_id || req.params.vector_id)}`;
        const config = {
            method: method,
            url: url,
            params: req.query,
            data: method === 'delete' ? req.body : undefined
        };
        const response = await axios(config);
        res.json(response.data);
    } catch (error) {
        console.error(`AI Proxy Error (${path}):`, error.message);
        const aiError = error.response ? error.response.data : null;
        res.status(error.response?.status || 500).json(aiError || { success: false, error: 'Lỗi kết nối tới AI service.' });
    }
};

router.post('/ai-chat', async (req, res) => {
    try {
        const response = await axios.post(AI_SERVICE_URL, req.body);
        res.json(response.data);
    } catch (error) {
        console.error('AI Chat Error:', error.message);
        const aiError = error.response ? error.response.data : null;
        res.status(500).json(aiError || { reply: 'Lỗi kết nối tới AI service.' });
    }
});

router.get('/get-file-vectors', proxyRequest('/api/get-file-vectors'));

router.delete('/delete-vector/:vector_id', proxyRequest('/api/delete-vector/:vector_id', 'delete'));

router.get('/chat-history/:session_id', proxyRequest('/api/chat-history/:session_id'));

router.delete('/chat-history/:session_id', proxyRequest('/api/clear-history/:session_id', 'delete'));

router.post('/files/upload/:evidenceId', async (req, res, next) => {
    const evidenceId = req.params.evidenceId;

    if (evidenceId !== 'chatbot-files') {
        return next();
    }

    uploadMemory(req, res, async (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ success: false, message: 'Lỗi upload Multer.' });
            }
            return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi upload file.' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'Không tìm thấy file nào được upload.' });
        }

        let allResults = [];
        let hasError = false;

        for (const file of req.files) {
            const fileId = `${evidenceId}_${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.]/g, '')}`;

            const form = new formData();
            const readableStream = new Readable();
            readableStream.push(file.buffer);
            readableStream.push(null);

            form.append('file', readableStream, {
                filename: file.originalname,
                contentType: file.mimetype,
                knownLength: file.buffer.length
            });
            form.append('file_id', fileId);

            try {
                const flaskResponse = await axios.post(
                    `${AI_BASE_URL}/api/process-file`,
                    form,
                    {
                        headers: { ...form.getHeaders() },
                        maxContentLength: Infinity,
                        maxBodyLength: Infinity
                    }
                );

                allResults.push({
                    success: true,
                    filename: file.originalname,
                    data: flaskResponse.data
                });

            } catch (error) {
                console.error(`Error processing file ${file.originalname} in Flask:`, error.message);
                hasError = true;
                allResults.push({
                    success: false,
                    filename: file.originalname,
                    error: error.response?.data?.error || 'Lỗi xử lý file tại AI Service.'
                });
            }
        }

        if (hasError) {
            return res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi vector hóa một hoặc nhiều file.',
                results: allResults
            });
        }

        res.status(200).json({
            success: true,
            message: 'Tất cả files đã được xử lý và vector hóa thành công.',
            results: allResults,
            data: {
                files: allResults.map(r => ({
                    _id: r.data.vector_id,
                    filename: r.filename,
                }))
            }
        });
    });
});

module.exports = router;