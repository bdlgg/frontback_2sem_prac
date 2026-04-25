const express = require('express');
const app = express();
const PORT = 3001;
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        server: "Backend-2",
        port: PORT,
        message: "Response from server 2",
        timestamp: new Date().toISOString()
    });
});

app.get("/health", (req, res) => {
    res.json({status: "OK", server: "Backend-2", port: PORT});
});

app.listen(PORT, () => {
    console.log(`Backend-2 started on port ${PORT}`);
});