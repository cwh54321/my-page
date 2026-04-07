const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();

// 1. 여기에 원혁님의 주소를 넣었습니다.
// <db_password> 자리에 아까 정한 비밀번호를 꼭 입력하세요! (예: 1234)
const dbURI = "mongodb://cwh12345:12345@ac-ktmkgxr-shard-00-00.vjcurbd.mongodb.net:27017,ac-ktmkgxr-shard-00-01.vjcurbd.mongodb.net:27017,ac-ktmkgxr-shard-00-02.vjcurbd.mongodb.net:27017/?ssl=true&replicaSet=atlas-vct7y2-shard-0&authSource=admin&appName=Cluster0";

mongoose.connect(dbURI)
    .then(() => console.log("✅ 몽고DB 연결 성공! 이제 데이터가 저장됩니다."))
    .catch(err => console.log("❌ 연결 에러 발생:", err));

// 2. 게시글 구조 정의
const postSchema = new mongoose.Schema({
    nickname: String,
    content: String,
    date: { type: Date, default: Date.now }
});
const Post = mongoose.model('Post', postSchema);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.'));

// 3. 게시글 저장 API
app.post('/add-post', async (req, res) => {
    const { nickname, content } = req.body;
    const newPost = new Post({ nickname, content });
    await newPost.save();
    res.redirect('/'); // 저장 후 메인으로 이동
});

// 4. 게시글 불러오기 API
app.get('/posts', async (req, res) => {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
});

app.listen(3000, () => console.log("🚀 서버 가동 중: http://localhost:3000"));