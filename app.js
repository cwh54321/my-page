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

// 2. 스키마 및 모델 정의 (중요: 서버리스 중복 생성 방지 로직)
const postSchema = new mongoose.Schema({
    nickname: String,
    content: String,
    date: { type: Date, default: Date.now }
});

// 이 줄이 핵심입니다! 이미 있으면 쓰고 없으면 만듭니다.
const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

// 3. 미들웨어 및 정적 파일 경로 설정
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
// public 폴더를 기준으로 파일을 찾게 합니다.
app.use(express.static(path.join(__dirname, 'public')));

// 4. API 경로들
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/add-post', async (req, res) => {
    try {
        const { nickname, content } = req.body;
        const newPost = new Post({ nickname, content });
        await newPost.save();
        res.redirect('/');
    } catch (err) {
        res.status(500).send("저장 실패");
    }
});

app.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: "불러오기 실패" });
    }
});

module.exports = app; // Vercel 배포를 위해 추가