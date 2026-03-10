const token = localStorage.getItem('token');

document.addEventListener('DOMContentLoaded', () => {
    loadNotifications();
});

async function loadNotifications() {
    const notifList = document.getElementById('notifList');
    try {
        const res = await fetch('/api/users/notifications', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const requests = await res.json();
        
        if (requests.length === 0) {
            notifList.innerHTML = '<div class="empty-msg">NO_PENDING_REQUESTS.</div>';
            return;
        }

        notifList.innerHTML = requests.map(req => `
            <div class="friend-item">
                <img src="${req.sender.profilePic}" class="profile-pic">
                <div class="friend-info">
                    <div class="friend-name">${req.sender.name}</div>
                    <div class="friend-username">wants to connect</div>
                </div>
                <div class="notif-actions" style="margin-left: auto; display: flex; gap: 10px;">
                    <button class="neon-btn" onclick="respondRequest('${req._id}', 'accepted')" style="padding: 5px 10px; font-size: 0.6rem;">ACCEPT</button>
                    <button class="neon-btn" onclick="respondRequest('${req._id}', 'rejected')" style="padding: 5px 10px; font-size: 0.6rem; border-color: var(--error-color); color: var(--error-color);">REJECT</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        notifList.innerHTML = '<div class="error-msg">FAILED_TO_LOAD_NOTIFICATIONS.</div>';
    }
}

async function respondRequest(requestId, status) {
    try {
        const res = await fetch('/api/users/friend-request/respond', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ requestId, status })
        });
        if (res.ok) {
            loadNotifications();
        }
    } catch (err) {}
}
