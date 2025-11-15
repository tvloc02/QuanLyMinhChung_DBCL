const express = require('express');
const axios = require('axios');
const router = express.Router();
const formData = require('form-data');
const { Readable } = require('stream');
const multer = require('multer');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/ai-chat';
const AI_BASE_URL = AI_SERVICE_URL.replace('/api/ai-chat', '');

const multerMemory = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024,
        files: 10
    }
});
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

router.get('/file-vectors', proxyRequest('/api/file-vectors'));

router.delete('/delete-vector/:vector_id', proxyRequest('/api/delete-vector/:param', 'delete'));

router.get('/ai-chat/history/:session_id', proxyRequest('/api/ai-chat/history/:param'));

router.delete('/ai-chat/history/:session_id', proxyRequest('/api/ai-chat/history/:param', 'delete'));

router.get('/system-knowledge', proxyRequest('/api/system-knowledge'));

router.post('/system-knowledge', async (req, res) => {
    try {
        const response = await axios.post(`${AI_BASE_URL}/api/system-knowledge`, req.body);
        res.json(response.data);
    } catch (error) {
        console.error('System Knowledge Error:', error.message);
        res.status(500).json({ success: false, error: 'Lỗi cập nhật kiến thức.' });
    }
});

router.post('/reindex-knowledge', async (req, res) => {
    try {
        const response = await axios.post(`${AI_BASE_URL}/api/reindex-knowledge`);
        res.json(response.data);
    } catch (error) {
        console.error('Reindex Error:', error.message);
        res.status(500).json({ success: false, error: 'Lỗi reindex.' });
    }
});

router.post('/process-file', uploadMemory, async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'Không có file được upload.' });
    }

    const results = [];
    let hasError = false;

    for (const file of req.files) {
        const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
            const response = await axios.post(
                `${AI_BASE_URL}/api/process-file`,
                form,
                {
                    headers: { ...form.getHeaders() },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                    timeout: 30000
                }
            );

            results.push({
                success: true,
                filename: file.originalname,
                data: response.data
            });

        } catch (error) {
            console.error(`Error processing ${file.originalname}:`, error.message);
            hasError = true;
            results.push({
                success: false,
                filename: file.originalname,
                error: error.response?.data?.error || 'Lỗi xử lý file'
            });
        }
    }

    res.status(hasError ? 207 : 200).json({
        success: !hasError,
        message: hasError ? 'Một số file gặp lỗi' : 'Tất cả file đã được xử lý',
        results: results
    });
});

router.post('/files/upload/:evidenceId', uploadMemory, async (req, res, next) => {
    const evidenceId = req.params.evidenceId;

    if (evidenceId !== 'chatbot-files') {
        return next();
    }

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'Không có file được upload.' });
    }

    const allResults = [];
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
            console.error(`Error processing file ${file.originalname}:`, error.message);
            hasError = true;
            allResults.push({
                success: false,
                filename: file.originalname,
                error: error.response?.data?.error || 'Lỗi xử lý file'
            });
        }
    }

    res.status(hasError ? 207 : 200).json({
        success: !hasError,
        message: hasError ? 'Một số file gặp lỗi' : 'Tất cả file đã được xử lý thành công',
        results: allResults,
        data: {
            files: allResults.filter(r => r.success).map(r => ({
                _id: r.data.vector_id,
                filename: r.filename,
            }))
        }
    });
});

module.exports = router;