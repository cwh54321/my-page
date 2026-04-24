async function checkAuth() {
    const res = await fetch('/api/check-auth');
    const data = await res.json();
 
    const loginLink = document.getElementById('login-link');
 
    if (data.isLoggedIn) {
        if (loginLink) loginLink.innerHTML = `<a href="#" onclick="handleLogout()">Logout</a>`;
        if (data.isAdmin) {
            const writeBtn = document.getElementById('write-btn');
            const adminControls = document.getElementById('admin-controls');
            if (writeBtn) writeBtn.style.display = 'block';
            if (adminControls) adminControls.style.display = 'flex';
        }
    }
}
 
async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    location.reload();
}
 
checkAuth();
 