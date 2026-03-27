const express = require('express');
const app = express();

app.get('/test', (req, res) => {
    res.send('Server is working!');
});

const PORT = 5000;  // Change to 5000
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});