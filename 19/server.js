const { Pool } = require('pg');
const express = require('express');
const app = express();

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'mydatabase',
    port: 5432
});

app.use(express.json());

const createTableQuery = `
create table if not exists users (id serial primary key, first_name varchar(100) not null, last_name varchar(100) not null, age integer, created_at bigint default extract(epoch from now()), updated_at bigint default extract(epoch from now()));
`;

pool.query(createTableQuery)
    .then(() => console.log('Table users created'))
    .catch(err => console.error(err));

app.post('/api/users', async (req, res) => {
    const {first_name, last_name, age} = req.body;
    const createdAt = Math.floor(Date.now() / 1000);
    try {
        const result = await pool.query(
            `insert into users (first_name, last_name, age, created_at, updated_at) values ($1, $2, $3, $4, $5) returning *`,
            [first_name, last_name, age, createdAt, createdAt]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(400).json({error: err.message});
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query(`select * from users`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
})

app.get('/api/users/:id', async (req, res) => {
    const {id} = req.params;
    try {
        const result = await pool.query(`select * from users where id = $1`, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({error: 'user not found'});
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

app.patch('/api/users/:id', async (req, res) => {
    const {id} = req.params;
    const {first_name, last_name, age} = req.body;
    const updatedAt = Math.floor(Date.now() / 1000);
    try {
        const result = await pool.query(`update users set first_name = coalesce($1, first_name), last_name = coalesce($2, last_name), age = coalesce($3, age), updated_at = $4 where id = $5 returning *`, [first_name, last_name, age, updatedAt, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({error: 'user not found'});
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(400).json({error: err.message});
    }
});

app.delete('/api/users/:id', async (req, res) => {
    const {id} = req.params;
    try {
        const result = await pool.query(`delete from users where id = $1 returning *`, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({error: 'user not found'});
        }
        res.json({ message: 'user deleted', user: result.rows[0] });
    } catch (err) {
        res.status(500).json({error: err.message});
    }
})

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});