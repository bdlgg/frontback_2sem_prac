const express = require('express');
const {nanoid} = require('nanoid');
const app = express();
const port = 3000;
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
let items = [
    {id: nanoid(6), name: "Iphone", price: 70000, description: "Прекрасный айфон", category: "Электроника", stock: 5},
    {id: nanoid(6), name: "Zphone", price: 100000, description: "Непрекрасный айфон", category: "Электроника", stock: 10},
    {id: nanoid(6), name: "Poco", price: 1000000, description: "Бомбовый телефон", category: "Электроника", stock: 10},
    {id: nanoid(6), name: "4K", price: 120000, description: "Пушечный монитор с феноменальны разрешением", category: "Электроника", stock: 7},
    {id: nanoid(6), name: "Iphone", price: 70000, description: "Прекрасный айфон", category: "Электроника", stock: 5},
    {id: nanoid(6), name: "Zphone", price: 100000, description: "Непрекрасный айфон", category: "Электроника", stock: 10},
    {id: nanoid(6), name: "Poco", price: 1000000, description: "Бомбовый телефон", category: "Электроника", stock: 10},
    {id: nanoid(6), name: "4K", price: 120000, description: "Пушечный монитор с феноменальны разрешением", category: "Электроника", stock: 7},
    {id: nanoid(6), name: "Iphone", price: 70000, description: "Прекрасный айфон", category: "Электроника", stock: 5},
    {id: nanoid(6), name: "Zphone", price: 100000, description: "Непрекрасный айфон", category: "Электроника", stock: 10},
]

//middleware для парсинга json
app.use(express.json());

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

//middleware для логирования запросов
app.use((req,res,next)=>{
    res.on('finish',()=>{
        console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            console.log('Body:', req.body);
        }
    });
    next();
});
//swagger definition
//описание основного api
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Api управления товарами',
            version: '1.0.0',
            description: 'простое API для управления товарами'
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Локальный хост'
            }
        ]
    },
    //путь к файлам в которых будем писать jsdoc-комментарий (текущий файл)
    apis: ['./app.js'],
}
const swaggerSpec = swaggerJsdoc(swaggerOptions);
//подключаем swagger ui по адресу /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
/**
 * @swagger
 * components:
 *   schemas:
 *     Item:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - stock
 *       properties:
 *         id:
 *           type: string
 *           description: Автоматически сгенерированный уникальный ID товара
 *         name:
 *           type: string
 *           description: Имя Товара
 *         price:
 *           type: integer
 *           description: Стоимость товара
 *         stock:
 *           type: integer
 *           description: Остаток на складе
 *         category:
 *           type: string
 *           description: Категория товара
 *         description:
 *           type: string
 *           description: Описание товара
 *       example:
 *         id: "abc123"
 *         name: "Maxphone"
 *         price: 1000
 *         stock: 1
 *         category: "Электроника"
 *         description: "Отличный товар"
 */

//функция помощник для получения пользователя из списка
function findItemOr404(id, res) {
    const item = items.find(i => i.id === id);
    if (!item) {
        res.status(404).json({
            error: 'Item not Found'
        })
        return null;
    }
    return item;
}

//CRUD
/**
 * @swagger
 * /api/items:
 *   post:
 *     summary: Создает новый товар
 *     tags: [Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - stock
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: integer
 *               stock:
 *                 type: integer
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       400:
 *         description: Ошибка в теле запроса
 */
app.post('/api/items', (req, res) => {
    const {name, category, description, price, stock} = req.body;
    if (!name || !price || stock === undefined){
        return res.status(400).json({
            error: "Имя или цена обязательные, остаток тоже, хоть 0"
        })
    }
    const newItem = {
        id: nanoid(6),
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        price: Number(price),
        stock: Number(stock)
    };
    items.push(newItem);
    res.status(201).json(newItem);
});

/**
 * @swagger
 * /api/items:
 *   get:
 *     summary: Возвращает список всех товаров
 *     tags: [Items]
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 */

app.get("/api/items", (req, res) => {
    res.json(items);
})

/**
 * @swagger
 * /api/items/{id}:
 *   get:
 *     summary: Получает товар по ID
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Данные товара
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       404:
 *         description: Товар не найден
 */
app.get("/api/items/:id", (req, res) => {
    const id = req.params.id;
    const item = findItemOr404(id, res);
    if (!item) return;
    res.json(item);
});


/**
 * @swagger
 * /api/items/{id}:
 *   patch:
 *     summary: Обновляет данные товара
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: integer
 *               stock:
 *                 type: integer
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Обновленный товар
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       400:
 *         description: Нет данных для обновления
 *       404:
 *         description: Товар не найден
 */
app.patch('/api/items/:id', (req, res) => {
    const id = req.params.id;
    const item = findItemOr404(id, res);
    if (!item) return;

    //Нельзя patch без полей
    if (req.body?.name === undefined && req.body?.price === undefined && req.body?.description === undefined && req.body?.category === undefined && req.body?.stock === undefined) {
        res.status(404).json({
            error: 'Обновить нечего, сори'
        })
    }
    const {name, description, category, stock, price,} = req.body;
    if (name !== undefined) item.name = name.trim();
    if (description !== undefined) item.description = description.trim();
    if (category !== undefined) item.category = category.trim();
    if (stock !== undefined) item.stock = Number(stock);
    if (price !== undefined) item.price = Number(price);
    res.json(item);
});

/**
 * @swagger
 * /api/items/{id}:
 *   delete:
 *     summary: Удаляет товар
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID Товара
 *     responses:
 *       204:
 *         description: Товар успешно удален (нет тела ответа)
 *       404:
 *         description: Товар не найден
 */
app.delete('/api/items/:id', (req, res) => {
    const id = req.params.id;
    const exists = items.some((i) => i.id === id);
    if (!exists) return res.status(404).json({
        error: "Item Not Found"
    });
    items = items.filter((i) => i.id !== id);
    res.status(204).send();
});

//404 для всех остальных маршрутов
app.use((req, res) => {
    res.status(404).json({error: 'Not Found'});
});

//Глобальный обработчик ошибок чтобы сервер не падал
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: 'Internal Server Error' });
});



app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
})