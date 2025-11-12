require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/evidence', require('./routes/evidenceRoutes'));
app.use('/api/files', require('./routes/fileRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/criteria', require('./routes/criteriaRoutes'));
app.use('/api/standards', require('./routes/standardRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Lỗi hệ thống',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('✅ Kết nối MongoDB thành công');
    
    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Server chạy tại port ${PORT}`);
        console.log(`📝 Environment: ${process.env.NODE_ENV}`);
    });
})
.catch(err => {
    console.error('❌ Lỗi kết nối MongoDB:', err);
    process.exit(1);
});

module.exports = app;
