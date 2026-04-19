const mongoose = require('mongoose');
const express = require('express');
const {now} = require("mongoose");
const app = express();

mongoose.connect('mongodb://YourMongoAdmin:1234@localhost:27017/admin')
.then(() => console.log('connected to mongodb'))
.catch(err => console.error(err));

app.use(express.json())

const userSchema = new mongoose.Schema({
    first_name: {type: String, required: true},
    last_name: {type: String, required: true},
    age: { type: Number, min: 0 },
    created_at: { type: Date, default: () => Math.floor(Date.now() / 1000) },
    updated_at: { type: Date, default: () => Math.floor(Date.now() / 1000) },
});
const User = mongoose.model('User', userSchema);

app.post('/api/users', async (req, res) => {
    try {
        const now = Math.floor(Date.now() / 1000);
        const user = new User({
            ...req.body,
            created_at: now,
            updated_at: now
        });
        await user.save();
        res.status(200).json(user);
    } catch (error) {
        res.status(400).json({error: error.message});
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({error: 'User not found'});
        res.json(user);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

app.patch('/api/users/:id', async (req, res) => {
    try {
        const updates = {...req.body, updated_at: Math.floor(Date.now() / 1000) };
        delete updates.updated_at;
        delete updates._id;
        const user = await User.findByIdAndUpdate(req.params.id, {$set: updates}, {new: true, runValidators: true});
        if (!user) return res.status(404).json({error: 'User not found'});
        res.json(user);
    } catch (error) {
        res.status(400).json({error: error.message});
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({error: 'User not found'});
        res.json(user);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});
app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
