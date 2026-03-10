const socket = io();
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token) {
    window.location.href = '/login.html';
}

socket.emit('join', user.id);

document.addEventListener('DOMContentLoaded', () => {
    loadFriends();
    
    socket.on('userStatus', ({ userId, status }) => {
        const dot = document.querySelector(`.status-dot[data-user="${userId}"]`);
        if (dot) {
            dot.className = `status-dot status-${status}`;
        }
    });
});

async function loadFriends() {
    const friendList = document.getElementById('friendList');
    try {
        const res = await fetch('/api/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.friends.length === 0) {
            friendList.innerHTML = '<div class="empty-msg">NO_CONNECTIONS_FOUND. SEARCH_FOR_USERS.</div>';
            return;
        }

        friendList.innerHTML = data.friends.map(friend => `
            <div class="friend-item" onclick="openChat('${friend._id}')">
                <img src="${friend.profilePic}" class="profile-pic" alt="${friend.name}">
                <div class="friend-info">
                    <div class="friend-name">${friend.name}</div>
                    <div class="friend-username">@${friend.username}</div>
                </div>
                <div class="status-dot status-${friend.status}" data-user="${friend._id}"></div>
            </div>
        `).join('');
    } catch (err) {
        friendList.innerHTML = '<div class="error-msg">FAILED_TO_LOAD_NETWORK.</div>';
    }
}

function openChat(friendId) {
    window.location.href = `/chat.html?id=${friendId}`;
}
