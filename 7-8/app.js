const express = require("express");
const {nanoid} = require("nanoid");
const bcrypt = require("bcrypt");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const jwt = require("jsonwebtoken");
const app = express();
const port = 3000;
const JWT_SECRET = "access_secret"
const ACCESS_EXPIRES_IN = "15m"
const REFRESH_SECRET = "refresh_secret"
const REFRESH_EXPIRES_IN = "7d";
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API AUTH + JWT',
            version: '1.0.0',
            description: 'Простое API для изучения авторизации и JWt-токена',
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Локальный сервер',
            },
        ],
    },
    apis: ['./app.js']
};
let users = []
let products = []
const refreshTokens = new Set();
function findProductOr404(id, res) {
    const product = products.find(p => p.id === id);
    if (!product) {
        res.status(404).json({ error: "product not found" });
        return null;
    }
    return product;
}

function findUserByEmail(email, res) {
    const user = users.find(u => u.email === email)
    if (!user) {
        res.status(404).json({ error: "user not found" });
        return null;
    }
    return user;
}

async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}
async function verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
}
function generateAccessToken(user) {
    return jwt.sign(
        {sub: user.id, email: user.email},
        JWT_SECRET,
        {expiresIn: ACCESS_EXPIRES_IN}
    );
}
function generateRefreshToken(user) {
    return jwt.sign(
        {sub: user.id, email: user.email},
        REFRESH_SECRET,
        {expiresIn: REFRESH_EXPIRES_IN}
    );
}
function authMiddleware(req, res, next) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: "missing or invalid authorization header" });
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload; //{sub, userId, email и тд}
        next();
    } catch (err){
        return res.status(401).json({ error: "invalid or expired token" });
    }
}
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.json());
app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            console.log(`Body: ${req.body}`)
        }
    });
    next();
});

//описание структур данных
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required: [email, first_name, last_name, password]
 *       properties:
 *         id: { type: string, description: "Уникальный ID" }
 *         email: { type: string, description: "Email (логин)" }
 *         first_name: { type: string }
 *         last_name: { type: string }
 *         hashedPassword: { type: string, description: "Хеш пароля" }
 *       example:
 *         id: "abc123"
 *         email: "user@example.com"
 *         first_name: "Ivan"
 *         last_name: "Ivanov"
 *         hashedPassword: "$2b$10$..."
 *     Product:
 *       type: object
 *       required: [title, price]
 *       properties:
 *         id: { type: string }
 *         title: { type: string }
 *         category: { type: string }
 *         description: { type: string }
 *         price: { type: number }
 *       example:
 *         id: "xyz789"
 *         title: "Ноутбук"
 *         category: "Электроника"
 *         description: "Мощный"
 *         price: 75000
 *     AuthResponse:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *           description: JWT токен доступа
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */

//роуты для auth
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, first_name, last_name, password]
 *             properties:
 *               email: { type: string, example: "user@example.com" }
 *               first_name: { type: string, example: "Ivan" }
 *               last_name: { type: string, example: "Ivanov" }
 *               password: { type: string, example: "qwerty123" }
 *     responses:
 *       201:
 *         description: Пользователь создан
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       400: { description: "Некорректные данные" }
 *       409: { description: "Email уже занят" }
 */

app.post('/api/auth/register', async (req, res) => {
    const {email, first_name, last_name, password} = req.body;
    if (!email || !first_name || !last_name || !password) {
        return res.status(400).json({ error: "email, name, last name and password are required" });
    }
    if (users.find(u => u.email === email)) {
        return res.status(409).json({ error: "email already exists" });
    }
    const newUser = {
        id: nanoid(6),
        email, first_name, last_name,
        hashedPassword: await hashPassword(password)
    };
    users.push(newUser);
    res.status(201).json(newUser);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему + получение пары токенов
 *     description: Аутентифицирует пользователя по email и паролю, возвращает access- и refresh-токены
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email пользователя (используется как логин)
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Пароль пользователя
 *                 example: qwerty123
 *     responses:
 *       200:
 *         description: Успешный вход, возвращена пара токенов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: JWT access-токен (срок жизни: 15 минут)
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmMxMjMiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE3MDk4MTIzNDUsImV4cCI6MTcwOTgxMzI0NX0.abc123"
 *                 refreshToken:
 *                   type: string
 *                   description: JWT refresh-токен (срок жизни: 7 дней)
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmMxMjMiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE3MDk4MTIzNDUsImV4cCI6MTcxMDQxNzE0NX0.xyz789"
 *       400:
 *         description: Отсутствуют обязательные поля в теле запроса
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "email and password are required"
 *       401:
 *         description: Неверные учетные данные (пользователь не найден или пароль не подходит)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid credentials"
 *       404:
 *         description: Пользователь с таким email не найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "user not found"
 */
app.post('/api/auth/login', async (req, res) => {
    const {email, password} = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "email, password are required" });
    }
    const user = findUserByEmail(email, res);
    if (!user) return;
    const isAuth = await verifyPassword(password, user.hashedPassword);
    if (isAuth) {
        //генерируем jwt токен
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        refreshTokens.add(refreshToken);
        res.status(200).json({accessToken, refreshToken})
    }
    else {
        res.status(401).json({error: "not authenticated"})
    }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить данные текущего пользователя (защищено)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные пользователя
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       401: { description: "Невалидный токен" }
 *       404: { description: "Пользователь не найден" }
 */
app.get('/api/auth/me', authMiddleware, (req, res) => {
    const userid = req.user.sub;
    const user = users.find(u => u.id === userid);
    if (!user) {
        return res.status(404).json({ error: "user not found" });
    }
    //не возвращаем хеш пароля
    const {hashedPassword, ...safeUser} = user;
    res.json(safeUser);
})

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновить пару токенов (по refresh-токену из заголовка)
 *     tags: [Auth]
 *     parameters:
 *       - in: header
 *         name: x-refresh-token
 *         schema: { type: string }
 *         required: true
 *         description: Refresh токен для получения новой пары
 *     responses:
 *       200:
 *         description: Новая пара токенов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *                 refreshToken: { type: string }
 *       400: { description: "Отсутствует x-refresh-token" }
 *       401: { description: "Невалидный токен" }
 */
app.post('/api/auth/refresh', (req, res) => {
    const refreshToken = req.headers['x-refresh-token'];
    if (!refreshToken) {
        return res.status(400).json({ error: "x-refresh-token header is required" });
    }
    if (!refreshTokens.has(refreshToken)) {
        return res.status(401).json({ error: "invalid refresh token" });
    }
    try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);
        const user = users.find(u => u.id === payload.sub);
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }
        refreshTokens.delete(refreshToken);
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        refreshTokens.add(newRefreshToken);
        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (err) {
        refreshTokens.delete(refreshToken);
        return res.status(401).json({ error: "invalid or expired refresh token" });
    }
})

//роуты продуктов

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать товар (публичный)
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, price]
 *             properties:
 *               title: { type: string }
 *               category: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *     responses:
 *       201:
 *         description: Товар создан
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       400: { description: "Некорректные данные" }
 */
app.post('/api/products', (req, res) => {
    const {title, category, description, price} = req.body;
    if (!title || price === undefined) {
        return res.status(400).json({ error: "title or price are required" });
    }
    const newProduct = {
        id: nanoid(6),
        title: title.trim(),
        category: category?.trim() || '',
        description: description?.trim() || '',
        price: Number(price)
    };
    products.push(newProduct);
    res.status(201).json(newProduct);
})

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список товаров (публичный)
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Product' }
 */

app.get('/api/products', (req, res) => {
    res.json(products);
})

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID (🔐 защищено)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: string }
 *         required: true
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Данные товара
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       401: { description: "Невалидный токен" }
 *       404: { description: "Товар не найден" }
 */
app.get('/api/products/:id', authMiddleware, (req, res) => {
    const product = findProductOr404(req.params.id, res);
    if (!product) return;
    res.json(product);
})

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновить товар (🔐 защищено)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: string }
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               category: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *     responses:
 *       200:
 *         description: Товар обновлен
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       400: { description: "Нет данных для обновления" }
 *       401: { description: "Невалидный токен" }
 *       404: { description: "Товар не найден" }
 */
app.put('/api/products/:id', authMiddleware, (req, res) => {
    const product = findProductOr404(req.params.id, res);
    if (!product) return;
    const {title, category, description, price} = req.body;
    if (title === undefined && category === undefined && description === undefined && price === undefined) {
        return res.status(400).json({ error: "нет данных для обновления"})
    }
    if ( title !== undefined) product.title = title.trim();
    if (category !== undefined) product.category = category.trim();
    if (description !== undefined) product.description = description.trim();
    if (price !== undefined) product.price = Number(price);
    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар (🔐 защищено)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: string }
 *         required: true
 *     responses:
 *       204: { description: "Товар удален" }
 *       401: { description: "Невалидный токен" }
 *       404: { description: "Товар не найден" }
 */
app.delete('/api/products/:id', authMiddleware, (req, res) => {
    const idx = products.findIndex(p => p.id === req.params.id);
    if (idx === -1) {
        return res.status(404).json({ error: "product not found" });
    }
    products.splice(idx, 1);
    res.status(204).send();
})

//404 для всех остальных маршрутов
app.use((req, res) => {
    res.status(404).json({ error: "not found" });
})

app.use((err, req, res, next) => {
    console.error("Unhandled error", err);
    res.status(500).json({ error: "internal server error" });
})

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`)
    console.log(`swagger UI доступен по адресу http://localhost:${port}/api-docs `);
});


