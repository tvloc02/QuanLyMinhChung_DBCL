const express = require('express');
const app = express();

// Test route đơn giản
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'Route works!' });
});

// Import và test programs route
const programRoutes = require('./routes/evidence/programs');
app.use('/api/programs', programRoutes);

app.listen(5001, () => {
    console.log('Test server running on port 5001');
});