
복사

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
 
const app = express();
 
const JWT_SECRET = "wonhyeok_secret_key_999";
const ADMIN_ID = "cwh12345";
const dbURI = process.env.MONGODB_URI;
 
mongoose.connect(dbURI).then(() => console.log("DB 연결 성공")).catch(err => console.log("DB 연결 실패", err));
 
app.use(express.json({ limit: '10mb' })); // base64 이미지를 위해 limit 증가
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
 
// ── 모델 ──────────────────────────────────────────────
const Study = mongoose.models.Study || mongoose.model('Study', new mongoose.Schema({
    title: String,
    category: String,
    content: String,       // 마크다운 텍스트
    imageBase64: String,   // base64 이미지 (multer 대신)
    date: { type: Date, default: Date.now }
}));
 
const Post = mongoose.models.Post || mongoose.model('Post', new mongoose.Schema({
    nickname: String,
    content: String,
    date: { type: Date, default: Date.now }
}));
 
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}));
 
// ── 미들웨어 ──────────────────────────────────────────
const isLogined = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ ok: false, message: "로그인이 필요합니다." });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        res.status(401).json({ ok: false, message: "인증이 만료되었습니다." });
    }
};
 
const isAdmin = (req, res, next) => {
    isLogined(req, res, () => {
        if (req.user.userId === ADMIN_ID) next();
        else res.status(403).json({ ok: false, message: "관리자만 접근 가능합니다." });
    });
};
 
// ── 페이지 라우트 ──────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/study', (req, res) => res.sendFile(path.join(__dirname, 'public', 'study.html')));
app.get('/study/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'detail.html')));
app.get('/write', (req, res) => res.sendFile(path.join(__dirname, 'public', 'write.html')));
app.get('/guestbook', (req, res) => res.sendFile(path.join(__dirname, 'public', 'guestbook.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
 
// ── API: 인증 ──────────────────────────────────────────
app.get('/api/check-auth', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.json({ isLoggedIn: false });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ isLoggedIn: true, userId: decoded.userId, isAdmin: decoded.userId === ADMIN_ID });
    } catch (err) {
        res.json({ isLoggedIn: false });
    }
});
 
app.post('/api/register', async (req, res) => {
    const { userId, password } = req.body;
    if (!userId || !password) return res.status(400).json({ ok: false, message: "아이디와 비밀번호를 입력해주세요." });
    if (userId.length < 4) return res.status(400).json({ ok: false, message: "아이디는 4자 이상이어야 합니다." });
    if (password.length < 6) return res.status(400).json({ ok: false, message: "비밀번호는 6자 이상이어야 합니다." });
    
    const exists = await User.findOne({ userId });
    if (exists) return res.status(409).json({ ok: false, message: "이미 사용 중인 아이디입니다." });
    
    const hashed = await bcrypt.hash(password, 10);
    await new User({ userId, password: hashed }).save();
    res.status(201).json({ ok: true, message: "회원가입 성공!" });
});
 
app.post('/api/login', async (req, res) => {
    const { userId, password } = req.body;
    const user = await User.findOne({ userId });
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
        return res.json({ ok: true });
    }
    res.status(401).json({ ok: false, message: "아이디 또는 비밀번호가 틀렸습니다." });
});
 
app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ ok: true });
});
 
// ── API: 공부기록 (관리자 전용 작성/삭제) ──────────────
app.get('/studies', async (req, res) => {
    const studies = await Study.find().sort({ date: -1 }).select('-imageBase64'); // 목록엔 이미지 제외
    res.json(studies);
});
 
app.get('/api/study/:id', async (req, res) => {
    const s = await Study.findById(req.params.id);
    res.json(s);
});
 
app.post('/add-study', isAdmin, async (req, res) => {
    const { title, category, content, imageBase64 } = req.body;
    await new Study({ title, category, content, imageBase64 }).save();
    res.status(201).json({ ok: true });
});
 
app.put('/api/study/:id', isAdmin, async (req, res) => {
    const { title, category, content, imageBase64 } = req.body;
    const update = { title, category, content };
    if (imageBase64) update.imageBase64 = imageBase64;
    await Study.findByIdAndUpdate(req.params.id, update);
    res.json({ ok: true });
});
 
app.delete('/api/study/:id', isAdmin, async (req, res) => {
    await Study.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
});
 
// ── API: 방명록 (로그인 유저 작성, 본인+관리자 삭제/수정) ──
app.get('/posts', async (req, res) => {
    res.json(await Post.find().sort({ date: -1 }));
});
 
app.post('/add-post', isLogined, async (req, res) => {
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ ok: false, message: "내용을 입력해주세요." });
    await new Post({ content: content.trim(), nickname: req.user.userId }).save();
    res.status(201).json({ ok: true });
});
 
app.put('/api/post/:id', isLogined, async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ ok: false });
    if (post.nickname !== req.user.userId && req.user.userId !== ADMIN_ID) {
        return res.status(403).json({ ok: false, message: "권한이 없습니다." });
    }
    await Post.findByIdAndUpdate(req.params.id, { content: req.body.content });
    res.json({ ok: true });
});
 
app.delete('/api/post/:id', isLogined, async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ ok: false });
    if (post.nickname !== req.user.userId && req.user.userId !== ADMIN_ID) {
        return res.status(403).json({ ok: false, message: "권한이 없습니다." });
    }
    await Post.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
});
 
module.exports = app;