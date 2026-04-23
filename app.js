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

mongoose.connect(dbURI).then(() => console.log("DB 연결 성공"));

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// [모델 정의]
const Post = mongoose.models.Post || mongoose.model('Post', new mongoose.Schema({
    nickname: String, content: String, date: { type: Date, default: Date.now }
}));
const Study = mongoose.models.Study || mongoose.model('Study', new mongoose.Schema({
    title: String, category: String, content: String, date: { type: Date, default: Date.now }
}));
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}));

// [권한 미들웨어]
const isLogined = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ ok: false });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) { res.status(401).json({ ok: false }); }
};

const isAdmin = (req, res, next) => {
    isLogined(req, res, () => {
        if (req.user.userId === ADMIN_ID) next();
        else res.status(403).json({ ok: false });
    });
};

// [페이지 라우팅 - 여기가 중요!]
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/study', (req, res) => res.sendFile(path.join(__dirname, 'public', 'study.html')));
app.get('/guestbook', (req, res) => res.sendFile(path.join(__dirname, 'public', 'guestbook.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/write', (req, res) => res.sendFile(path.join(__dirname, 'public', 'write.html')));

// [API]
app.get('/api/check-auth', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.json({ isLoggedIn: false });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ isLoggedIn: true, userId: decoded.userId });
    } catch (err) { res.json({ isLoggedIn: false }); }
});

app.post('/api/login', async (req, res) => {
    const { userId, password } = req.body;
    const user = await User.findOne({ userId });
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: '1d' });
        res.cookie('token', token, { httpOnly: true });
        return res.json({ ok: true });
    }
    res.status(401).json({ ok: false });
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ ok: true });
});

app.get('/studies', async (req, res) => res.json(await Study.find().sort({ date: -1 })));
app.post('/add-study', isAdmin, async (req, res) => {
    await new Study(req.body).save();
    res.status(201).json({ ok: true });
});

app.get('/posts', async (req, res) => res.json(await Post.find().sort({ date: -1 })));
app.post('/add-post', isLogined, async (req, res) => {
    await new Post({ ...req.body, nickname: req.user.userId }).save();
    res.status(201).json({ ok: true });
});

module.exports = app;