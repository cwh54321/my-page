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
    title: String,
    category: String,
    content: String, // 여기에 마크다운 텍스트가 저장됨
    imageUrl: String, // 이미지 주소 저장
    date: { type: Date, default: Date.now }
}));


app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// [라우팅] 페이지 나누기
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html'))); // 메인
app.get('/guestbook', (req, res) => res.sendFile(path.join(__dirname, 'public', 'guestbook.html'))); // 방명록
app.get('/study', (req, res) => res.sendFile(path.join(__dirname, 'public', 'study.html'))); // 스터디로그

// [API] 방명록용
app.get('/posts', async (req, res) => res.json(await Post.find().sort({ date: -1 })));
app.post('/add-post', async (req, res) => { await new Post(req.body).save(); res.status(201).json({ok:true}); });

// [API] 스터디로그용
app.get('/studies', async (req, res) => res.json(await Study.find().sort({ date: -1 })));
app.post('/add-study', async (req, res) => { await new Study(req.body).save(); res.status(201).json({ok:true}); });

app.get('/study/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'detail.html'));
});

// 특정 ID의 스터디 데이터만 가져오는 API
app.get('/api/study/:id', async (req, res) => {
    const study = await Study.findById(req.params.id);
    res.json(study);
});

module.exports = app;