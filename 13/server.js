const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const vapidKeys = {
    publicKey: 'BJRMR9OyvCmFkxWxi5QaB0nGJpD_ZuwN8-EElb6zy6s5Wv6CK7L_YJEa7damkSX7o38ZDBkWGZZlDmPCFp3JSj8',
    privateKey: 'RxNxuCuU94BohNsXJR9RWSX7oAzyUybwDw0IyiHeNfM'
};

webpush.setVapidDetails(
    'mailto:40akka@gmail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);
const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, './')))

let subscriptions = [];

const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"]}
});

io.on('connection', (socket) => {
    console.log("Клиент подключен:", socket.id);

    socket.on('newTask', (task) => {
        io.emit('taskAdded', task);
        const payload = JSON.stringify({
            title: 'Новая задача',
            body: task.text
        });
        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => console.error('Push error:', err));
        });
    });

    socket.on('disconnect', () => {
        console.log('Клиент отключен:', socket.id);
    });
});

app.post('/subscribe', (req, res) => {
    subscriptions.push(req.body);
    res.status(201).json({ message: 'Подписка сохранена'})
});

app.post('/unsubscribe', (req, res) => {
    const {endpoint} = req.body;
    subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
    res.status(200).json({ message: 'Подписка удалена'});
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});