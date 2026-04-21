// public/auth.js
async function checkAuth() {
    const res = await fetch('/api/check-auth');
    const data = await res.json();
    
    const loginLink = document.getElementById('login-link');
    const writeBtn = document.getElementById('write-btn');
    const adminControls = document.getElementById('admin-controls');

    if (data.isLoggedIn) {
        if(loginLink) loginLink.innerHTML = `<a href="#" onclick="handleLogout()">Logout</a>`;
        // 원혁님 아이디일 때만 관리자 버튼 노출
        if(data.userId === "wonhyeok_admin") { // 본인 아이디로 수정
            if(writeBtn) writeBtn.style.display = 'block';
            if(adminControls) adminControls.style.display = 'flex';
        }
    }
}

async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    location.reload();
}

checkAuth();