const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

document.addEventListener('DOMContentLoaded', () => {
    loadProfile();

    document.getElementById('profileForm').addEventListener('submit', updateProfile);
});

async function loadProfile() {
    try {
        const res = await fetch('/api/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        document.getElementById('profileName').value = data.name;
        document.getElementById('profileUsername').textContent = `@${data.username}`;
        document.getElementById('profilePicPreview').src = data.profilePic;
        document.getElementById('profilePicUrl').value = data.profilePic;
    } catch (err) {}
}

async function updateProfile(e) {
    e.preventDefault();
    const name = document.getElementById('profileName').value;
    const profilePic = document.getElementById('profilePicUrl').value;
    const password = document.getElementById('profilePassword').value;

    try {
        const res = await fetch('/api/users/update', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, profilePic, password })
        });
        if (res.ok) {
            alert('Identity Updated');
            loadProfile();
        }
    } catch (err) {
        alert('Update failed');
    }
}
