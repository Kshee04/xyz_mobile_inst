// test-server.js - Simple test server
const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('.'));

app.get('/test', (req, res) => {
    res.json({ message: 'Server is running!', success: true });
});

app.listen(3000, () => {
    console.log(' Test server running on http://localhost:3000');
    console.log('Test endpoint: http://localhost:3000/test');
});