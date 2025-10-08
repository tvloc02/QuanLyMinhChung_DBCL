const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            process.env.CLIENT_URL,
            process.env.ADMIN_URL
        ].filter(Boolean);

        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }

        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Không được phép bởi CORS policy'));
        }
    },

    credentials: true,

    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'Pragma'
    ],

    exposedHeaders: [
        'Content-Length',
        'Content-Type',
        'Content-Disposition'
    ],

    optionsSuccessStatus: 200,

    maxAge: 86400 // 24 hours
};

const devCorsOptions = {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['*'],
    exposedHeaders: ['*'],
    optionsSuccessStatus: 200
};

module.exports = {
    corsOptions,
    devCorsOptions
};