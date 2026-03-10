const socket = io();
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));
const urlParams = new URLSearchParams(window.location.search);
const groupId = urlParams.get('id');

if (!token || !groupId) {
    window.location.href = '/index.html';
}

socket.emit('join', user.id);
socket.emit('joinGroup', groupId);

document.addEventListener('DOMContentLoaded', () => {
    loadGroupInfo();
    loadMessages();

    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');

    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    socket.on('newMessage', (msg) => {
        if (msg.group === groupId) {
            appendMessage(msg);
        }
    });
});

async function loadGroupInfo() {
    // Fetch group info from API
    try {
        const res = await fetch(`/api/groups/my-groups`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const groups = await res.json();
        const group = groups.find(g => g._id === groupId);
        if (group) {
            document.getElementById('groupName').textContent = group.name;
            document.getElementById('groupPic').src = group.image;
            document.getElementById('groupMembers').textContent = `MEMBERS: ${group.members.length}`;
        }
    } catch (err) {}
}

async function loadMessages() {
    const messagesArea = document.getElementById('messagesArea');
    try {
        const res = await fetch(`/api/messages/group/${groupId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const messages = await res.json();
        messagesArea.innerHTML = '';
        messages.forEach(appendMessage);
    } catch (err) {}
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    if (!content) return;

    const msgData = {
        senderId: user.id,
        groupId: groupId,
        content: content,
        type: 'text'
    };

    socket.emit('sendMessage', msgData);
    input.value = '';
}

function appendMessage(msg) {
    const messagesArea = document.getElementById('messagesArea');
    const isSent = msg.sender._id === user.id || msg.sender === user.id;
    
    const div = document.createElement('div');
    div.className = `message-bubble ${isSent ? 'message-sent' : 'message-received'}`;
    
    const senderName = document.createElement('div');
    senderName.style.fontSize = '0.6rem';
    senderName.style.opacity = '0.7';
    senderName.style.marginBottom = '5px';
    senderName.textContent = msg.sender.name || 'Unknown';
    
    div.appendChild(senderName);
    div.appendChild(document.createTextNode(msg.content));
    
    messagesArea.appendChild(div);
    messagesArea.scrollTop = messagesArea.scrollHeight;
}
