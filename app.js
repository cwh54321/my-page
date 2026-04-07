const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();

// 1. DB 연결 (Vercel 환경변수 사용)
const dbURI = process.env.MONGODB_URI;

mongoose.connect(dbURI)
    .then(() => console.log("✅ 몽고DB 연결 성공!"))
    .catch(err => console.log("❌ DB 연결 에러:", err));

// 2. 스키마 및 모델 정의 (중복 생성 방지)
const postSchema = new mongoose.Schema({
    nickname: String,
    content: String,
    date: { type: Date, default: Date.now }
});
const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

// 3. 미들웨어 설정
app.use(bodyParser.json()); // JSON 데이터를 받기 위해 필수!
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 4. API 경로들
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 게시글 저장
app.post('/add-post', async (req, res) => {
    try {
        const { nickname, content } = req.body;
        const newPost = new Post({ nickname, content });
        await newPost.save();
        res.json({ success: true }); // 페이지 이동 대신 성공 신호만 보냄
    } catch (err) {
        res.status(500).json({ error: "저장 실패" });
    }
});

// 게시글 불러오기
app.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: "불러오기 실패" });
    }
});

// 게시글 수정 (새로 추가된 기능!)
app.put('/edit-post/:id', async (req, res) => {
    try {
        const { content } = req.body;
        await Post.findByIdAndUpdate(req.params.id, { content });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "수정 실패" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 서버 가동 중: http://localhost:${PORT}`));