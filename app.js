const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path'); // 파일 경로를 안전하게 잡기 위해 필요합니다.
const app = express();

// 1. 몽고DB 연결 (Vercel 환경변수 또는 직접 입력한 주소 사용)
// 로컬 테스트 시에는 직접 주소를 넣어도 되지만, 배포 시에는 Vercel의 MONGODB_URI를 읽어옵니다.
const dbURI = process.env.MONGODB_URI || "mongodb://cwh12345:12345@ac-ktmkgxr-shard-00-00.vjcurbd.mongodb.net:27017,ac-ktmkgxr-shard-00-01.vjcurbd.mongodb.net:27017,ac-ktmkgxr-shard-00-02.vjcurbd.mongodb.net:27017/?ssl=true&replicaSet=atlas-vct7y2-shard-0&authSource=admin&appName=Cluster0";

mongoose.connect(dbURI)
    .then(() => console.log("✅ 몽고DB 연결 성공! 데이터 저장 준비 완료."))
    .catch(err => console.log("❌ 몽고DB 연결 에러:", err));

// 2. 게시글 데이터 구조(Schema) 정의
const postSchema = new mongoose.Schema({
    nickname: String,
    content: String,
    date: { type: Date, default: Date.now }
});
const Post = mongoose.model('Post', postSchema);

// 3. 미들웨어 설정 (데이터 해석 및 정적 파일 연결)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // JSON 형식 데이터도 받을 수 있게 추가
app.use(express.static(path.join(__dirname, '.'))); // 현재 폴더의 파일들을 서버에 연결

// 4. 메인 페이지 접속 시 index.html 보여주기
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 5. 게시글 저장 API (C: Create)
app.post('/add-post', async (req, res) => {
    try {
        const { nickname, content } = req.body;
        const newPost = new Post({ nickname, content });
        await newPost.save();
        res.redirect('/'); // 저장 후 다시 메인으로!
    } catch (err) {
        res.status(500).send("데이터 저장 중 오류가 발생했습니다.");
    }
});

// 6. 게시글 불러오기 API (R: Read)
app.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 }); // 최신순 정렬
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: "데이터를 불러오지 못했습니다." });
    }
});

// 7. 서버 실행 (Vercel은 3000번 포트 외에도 환경에 맞는 포트를 사용함)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 서버 가동 중: http://localhost:${PORT}`));