const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/database');
const app = require('./app');

connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log('=====================================');
    console.log('🚀 EVIDENCE MANAGEMENT SYSTEM API');
    console.log('=====================================');
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📊 Test Endpoint: http://localhost:${PORT}/api/test`);
    console.log('=====================================');
});

process.on('unhandledRejection', (err, promise) => {
    console.error('❌ Unhandled Promise Rejection:', err.message);
    server.close(() => {
        process.exit(1);
    });
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message);
    console.error(err.stack);
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('💤 Process terminated');
        mongoose.connection.close();
    });
});

process.on('SIGINT', () => {
    console.log('👋 SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('💤 Process terminated');
        mongoose.connection.close();
        process.exit(0);
    });
});