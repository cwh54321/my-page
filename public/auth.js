// public/auth.js
async function checkAuth() {
    const res = await fetch('/api/check-auth');
    const data = await res.json();
    
    const loginLink = document.getElementById('login-link');
    const writeBtn = document.getElementById('write-btn');
    const adminControls = document.getElementById('admin-controls');

    if (data.isLoggedIn) {
        if(loginLink) loginLink.innerHTML = `<a href="#" onclick="handleLogout()">Logout</a>`;
        
        // ⭐ 관리자 아이디 체크
        if(data.userId === "cwh12345") { 
            if(document.getElementById('write-btn')) 
                document.getElementById('write-btn').style.display = 'block';
            if(document.getElementById('admin-controls')) 
                document.getElementById('admin-controls').style.display = 'flex';
        }
    }
}

async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    location.reload();
}

checkAuth();