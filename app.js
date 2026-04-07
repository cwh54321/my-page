const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// DB 연결
const dbURI = process.env.MONGODB_URI;
mongoose.connect(dbURI).then(() => console.log("DB OK")).catch(err => console.log(err));

// 모델 설정
const postSchema = new mongoose.Schema({ nickname: String, content: String, date: { type: Date, default: Date.now } });
const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

// 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/posts', async (req, res) => {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
});
app.post('/add-post', async (req, res) => {
    const newPost = new Post(req.body);
    await newPost.save();
    res.json({ success: true });
});
app.put('/edit-post/:id', async (req, res) => {
    await Post.findByIdAndUpdate(req.params.id, { content: req.body.content });
    res.json({ success: true });
});

module.exports = app;