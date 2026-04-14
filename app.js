const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

const dbURI = process.env.MONGODB_URI;
mongoose.connect(dbURI).then(() => console.log("DB 연결 성공"));

// [모델] 방명록 & 스터디로그
const Post = mongoose.models.Post || mongoose.model('Post', new mongoose.Schema({
    nickname: String, content: String, date: { type: Date, default: Date.now }
}));
const Study = mongoose.models.Study || mongoose.model('Study', new mongoose.Schema({
    title: String, category: String, content: String, imageUrl: String, date: { type: Date, default: Date.now }
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// [라우팅] 페이지 연결
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/guestbook', (req, res) => res.sendFile(path.join(__dirname, 'public', 'guestbook.html')));
app.get('/study', (req, res) => res.sendFile(path.join(__dirname, 'public', 'study.html')));
app.get('/study/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'detail.html')));

// [API] 방명록
app.get('/posts', async (req, res) => res.json(await Post.find().sort({ date: -1 })));
app.post('/add-post', async (req, res) => { await new Post(req.body).save(); res.status(201).json({ok:true}); });
// [API] 방명록 수정 (PUT)
app.put('/update-post/:id', async (req, res) => {
    try {
        await Post.findByIdAndUpdate(req.params.id, { content: req.body.content });
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ ok: false });
    }
});

// [API] 방명록 삭제 (DELETE)
app.delete('/delete-post/:id', async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ ok: false });
    }
});

// [API] 스터디로그 (CRUD)
app.get('/studies', async (req, res) => res.json(await Study.find().sort({ date: -1 })));
app.get('/api/study/:id', async (req, res) => res.json(await Study.findById(req.params.id)));
app.post('/add-study', async (req, res) => { await new Study(req.body).save(); res.status(201).json({ok:true}); });
app.put('/api/study/:id', async (req, res) => { await Study.findByIdAndUpdate(req.params.id, req.body); res.json({ok:true}); });
app.delete('/api/study/:id', async (req, res) => { await Study.findByIdAndDelete(req.params.id); res.json({ok:true}); });

module.exports = app;