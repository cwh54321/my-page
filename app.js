const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');

const app = express();

// --- 설정 영역 ---
const JWT_SECRET = "wonhyeok_secret_key_999"; // 보안을 위해 길게 유지하세요
const ADMIN_ID = "cwh12345"; // ⭐ 여기에 원혁님의 실제 관리자 아이디를 적으세요!
const dbURI = process.env.MONGODB_URI;

mongoose.connect(dbURI).then(() => console.log("DB 연결 성공"));

// --- 미들웨어 설정 ---
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// --- 데이터 모델 정의 ---
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

// --- [보안 미들웨어 계층] ---

// 1단계: 로그인 여부 확인 (방명록용)
const isLogined = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ ok: false, message: "로그인이 필요합니다." });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // 다음 단계에서 사용할 수 있게 사용자 정보 저장
        next();
    } catch (err) {
        res.status(401).json({ ok: false, message: "유효하지 않은 토큰입니다." });
    }
};

// 2단계: 관리자 여부 확인 (공부 기록용)
const isAdmin = (req, res, next) => {
    // 먼저 로그인이 되어있는지 확인하고, 그 다음 아이디를 체크합니다.
    isLogined(req, res, () => {
        if (req.user.userId === ADMIN_ID) {
            next(); // 원혁님일 때만 통과
        } else {
            res.status(403).json({ ok: false, message: "관리자(원혁)만 권한이 있습니다." });
        }
    });
};

// --- [페이지 라우팅] ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/guestbook', (req, res) => res.sendFile(path.join(__dirname, 'public', 'guestbook.html')));
app.get('/study', (req, res) => res.sendFile(path.join(__dirname, 'public', 'study.html')));
app.get('/study/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'detail.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));

// --- [API - 인증] ---
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
        res.status(500).json({ ok: false, message: "가입 실패 (이미 있는 아이디일 수 있음)" });
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

// --- [API - 데이터 처리] ---

// 방명록 조회 (누구나)
app.get('/posts', async (req, res) => res.json(await Post.find().sort({ date: -1 })));

// 🟢 방명록 작성 (로그인한 유저 누구나 가능)
app.post('/add-post', isLogined, async (req, res) => { 
    // 작성자 닉네임을 로그인한 아이디로 고정하여 저장
    const postData = { ...req.body, nickname: req.user.userId };
    await new Post(postData).save(); 
    res.status(201).json({ok:true}); 
});

// 공부 기록 조회 (누구나)
app.get('/studies', async (req, res) => res.json(await Study.find().sort({ date: -1 })));
app.get('/api/study/:id', async (req, res) => res.json(await Study.findById(req.params.id)));

// 🔴 공부 기록 작성/수정/삭제 (오직 관리자 ADMIN_ID만 가능)
app.post('/add-study', isAdmin, async (req, res) => { 
    await new Study(req.body).save(); res.status(201).json({ok:true}); 
});
app.put('/api/study/:id', isAdmin, async (req, res) => { 
    await Study.findByIdAndUpdate(req.params.id, req.body); res.json({ok:true}); 
});
app.delete('/api/study/:id', isAdmin, async (req, res) => { 
    await Study.findByIdAndDelete(req.params.id); res.json({ok:true}); 
});

module.exports = app;