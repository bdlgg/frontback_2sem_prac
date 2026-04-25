const express = require('express');
const app = express();
const PORT = 3002;
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        server: "Backend-3 (BACKUP)",
        port: PORT,
        message: "Response from backup server ",
        timestamp: new Date().toISOString()
    });
});

app.get("/health", (req, res) => {
    res.json({status: "OK", server: "Backend-3", port: PORT});
});

app.listen(PORT, () => {
    console.log(`Backend-3 (BACKUP) started on port ${PORT}`);
});