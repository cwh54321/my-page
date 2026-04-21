const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');

const app = express(); // 1. app 선언을 맨 위로!

// 설정
const JWT_SECRET = "wonhyeok_secret_key_999";
const dbURI = process.env.MONGODB_URI;

mongoose.connect(dbURI).then(() => console.log("DB 연결 성공"));

// 미들웨어 설정
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// [모델 정의]
const Post = mongoose.models.Post || mongoose.model('Post', new mongoose.Schema({
    nickname: String, content: String, date: { type: Date, default: Date.now }
}));
const Study = mongoose.models.Study || mongoose.model('Study', new mongoose.Schema({
    title: String, category: String, content: String, imageUrl: String, date: { type: Date, default: Date.now }
}));
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}));

// [인증 미들웨어 정의] - 사용하기 전에 미리 정의해야 함!
const isLogined = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(403).json({ ok: false, message: "권한이 없습니다." });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ ok: false });
    }
};

// [페이지 라우팅]
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/guestbook', (req, res) => res.sendFile(path.join(__dirname, 'public', 'guestbook.html')));
app.get('/study', (req, res) => res.sendFile(path.join(__dirname, 'public', 'study.html')));
app.get('/study/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'detail.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));

// [API] 인증 관련
app.get('/api/check-auth', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.json({ isLoggedIn: false });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ isLoggedIn: true, userId: decoded.userId });
    } catch (err) {
        res.json({ isLoggedIn: false });
    }
});

app.post('/api/register', async (req, res) => {
    const { userId, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await new User({ userId, password: hashedPassword }).save();
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ ok: false, message: "이미 존재하는 아이디입니다." });
    }
});

app.post('/api/login', async (req, res) => {
    const { userId, password } = req.body;
    const user = await User.findOne({ userId });
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: '1d' });
        res.cookie('token', token, { httpOnly: true });
        return res.json({ ok: true });
    }
    res.status(401).json({ ok: false, message: "아이디 또는 비밀번호가 틀립니다." });
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ ok: true });
});

// [API] 방명록
app.get('/posts', async (req, res) => res.json(await Post.find().sort({ date: -1 })));
app.post('/add-post', async (req, res) => { await new Post(req.body).save(); res.status(201).json({ok:true}); });
app.put('/update-post/:id', async (req, res) => {
    await Post.findByIdAndUpdate(req.params.id, { content: req.body.content });
    res.json({ ok: true });
});
app.delete('/delete-post/:id', async (req, res) => {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
});

// [API] 스터디로그 - 보호 적용
app.get('/studies', async (req, res) => res.json(await Study.find().sort({ date: -1 })));
app.get('/api/study/:id', async (req, res) => res.json(await Study.findById(req.params.id)));
app.post('/add-study', isLogined, async (req, res) => { 
    await new Study(req.body).save(); res.status(201).json({ok:true}); 
});
app.put('/api/study/:id', isLogined, async (req, res) => { 
    await Study.findByIdAndUpdate(req.params.id, req.body); res.json({ok:true}); 
});
app.delete('/api/study/:id', isLogined, async (req, res) => { 
    await Study.findByIdAndDelete(req.params.id); res.json({ok:true}); 
});

module.exports = app; // 마지막에 수출!