const express = require('express');
const app = express();
const PORT = 3000;
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        server: "Backend-1",
        port: PORT,
        message: "Response from server 1",
        timestamp: new Date().toISOString()
    });
});

app.get("/health", (req, res) => {
    res.json({status: "OK", server: "Backend-1", port: PORT});
});

app.listen(PORT, () => {
    console.log(`Backend-1 started on port ${PORT}`);
});