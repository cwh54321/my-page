const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// 1. DB 연결 (Vercel 환경변수 사용)
const dbURI = process.env.MONGODB_URI;
mongoose.connect(dbURI)
    .then(() => console.log("✅ DB 연결 성공"))
    .catch(err => console.log("❌ DB 에러:", err));

// 2. 모델 설정
const postSchema = new mongoose.Schema({ 
    nickname: String, 
    content: String, 
    date: { type: Date, default: Date.now } 
});
const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

// 3. 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 4. API 경로
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// 글 불러오기
app.get('/posts', async (req, res) => {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
});

// 글 저장 (성공 시 JSON 응답으로 변경해서 화면 유지 가능하게 함)
app.post('/add-post', async (req, res) => {
    const newPost = new Post(req.body);
    await newPost.save();
    res.json({ success: true });
});

// 글 수정 (추가된 기능)
app.put('/edit-post/:id', async (req, res) => {
    await Post.findByIdAndUpdate(req.params.id, { content: req.body.content });
    res.json({ success: true });
});

module.exports = app;