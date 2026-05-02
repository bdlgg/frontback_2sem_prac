const express = require('express');
const app = express();
const PORT = 3000;
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        server: "Backend-1",
    });
});



app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend-1 started on port ${PORT}`);
});