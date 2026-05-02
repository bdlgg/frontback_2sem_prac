const express = require('express');
const app = express();
const PORT = 3000;
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        server: "Backend-2",
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend-2 started on port ${PORT}`);
});