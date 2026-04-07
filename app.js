const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

const dbURI = process.env.MONGODB_URI;
mongoose.connect(dbURI).then(() => console.log("DB OK")).catch(err => console.log(err));

const postSchema = new mongoose.Schema({
    nickname: String,
    content: String,
    date: { type: Date, default: Date.now }
});
const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.get('/posts', async (req, res) => {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
});

app.post('/add-post', async (req, res) => {
    const newPost = new Post(req.body);
    await newPost.save();
    res.redirect('/');
});

module.exports = app;