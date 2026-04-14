const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

const dbURI = process.env.MONGODB_URI;
mongoose.connect(dbURI).then(() => console.log("DB 연결 성공"));

const Post = mongoose.models.Post || mongoose.model('Post', new mongoose.Schema({
    nickname: String, content: String, date: { type: Date, default: Date.now }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.get('/posts', async (req, res) => {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
});

// 등록 API (JSON 방식)
app.post('/add-post', async (req, res) => {
    const newPost = new Post(req.body);
    await newPost.save();
    res.status(201).json(newPost);
});

// 수정 API 추가
app.put('/update-post/:id', async (req, res) => {
    await Post.findByIdAndUpdate(req.params.id, { content: req.body.content });
    res.json({ success: true });
});

// [추가] 삭제 API
app.delete('/delete-post/:id', async (req, res) => {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

module.exports = app;