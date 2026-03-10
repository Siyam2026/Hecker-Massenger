const token = localStorage.getItem('token');

document.getElementById('doSearch').addEventListener('click', performSearch);
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

async function performSearch() {
    const query = document.getElementById('searchInput').value;
    if (!query) return;

    const resultsArea = document.getElementById('searchResults');
    resultsArea.innerHTML = '<div class="loading">SCANNING_DATABASE...</div>';

    try {
        const res = await fetch(`/api/users/search?q=${query}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await res.json();

        if (users.length === 0) {
            resultsArea.innerHTML = '<div class="error-msg">USER_NOT_FOUND.</div>';
            return;
        }

        resultsArea.innerHTML = users.map(u => `
            <div class="friend-item">
                <img src="${u.profilePic}" class="profile-pic">
                <div class="friend-info">
                    <div class="friend-name">${u.name}</div>
                    <div class="friend-username">@${u.username}</div>
                </div>
                <button class="neon-btn" onclick="sendRequest('${u._id}')" style="margin-left: auto; width: auto; padding: 5px 15px; font-size: 0.7rem;">CONNECT</button>
            </div>
        `).join('');
    } catch (err) {
        resultsArea.innerHTML = '<div class="error-msg">SEARCH_INTERRUPTED.</div>';
    }
}

async function sendRequest(recipientId) {
    try {
        const res = await fetch('/api/users/friend-request', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ recipientId })
        });
        const data = await res.json();
        alert(data.message);
    } catch (err) {
        alert('Failed to send request');
    }
}
