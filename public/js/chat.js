const socket = io();
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));
const urlParams = new URLSearchParams(window.location.search);
const recipientId = urlParams.get('id');

if (!token || !recipientId) {
    window.location.href = '/index.html';
}

socket.emit('join', user.id);

document.addEventListener('DOMContentLoaded', () => {
    loadChatInfo();
    loadMessages();

    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');

    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    document.getElementById('emojiBtn').addEventListener('click', () => {
        messageInput.value += '💀'; // Simple hacker emoji
    });

    document.getElementById('fileInput').addEventListener('change', async (e) => {
        const files = e.target.files;
        if (!files.length) return;

        const formData = new FormData();
        for (let file of files) {
            formData.append('files', file);
        }

        try {
            const res = await fetch('/api/upload/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const uploadedFiles = await res.json();
            uploadedFiles.forEach(file => {
                socket.emit('sendMessage', {
                    senderId: user.id,
                    recipientId: recipientId,
                    content: `File: ${file.name}`,
                    type: file.type.startsWith('image/') ? 'image' : 'file',
                    fileUrl: file.url,
                    fileName: file.name
                });
            });
        } catch (err) {
            alert('Upload failed');
        }
    });

    socket.on('newMessage', (msg) => {
        if (msg.sender._id === recipientId) {
            appendMessage(msg);
        }
    });

    let mediaRecorder;
    let audioChunks = [];

    const voiceBtn = document.getElementById('voiceBtn');
    voiceBtn.addEventListener('mousedown', startRecording);
    voiceBtn.addEventListener('mouseup', stopRecording);
    voiceBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startRecording(); });
    voiceBtn.addEventListener('touchend', (e) => { e.preventDefault(); stopRecording(); });

    async function startRecording() {
        audioChunks = [];
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('files', audioBlob, 'voice.webm');
            
            const res = await fetch('/api/upload/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const uploadedFiles = await res.json();
            socket.emit('sendMessage', {
                senderId: user.id,
                recipientId: recipientId,
                type: 'voice',
                fileUrl: uploadedFiles[0].url
            });
        };
        mediaRecorder.start();
        voiceBtn.style.color = 'var(--error-color)';
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            voiceBtn.style.color = 'var(--neon-green)';
        }
    }

    document.getElementById('callBtn').addEventListener('click', () => {
        window.open(`/call.html?id=${recipientId}&caller=true`, 'Call', 'width=400,height=600');
    });

    socket.on('incomingCall', (data) => {
        if (confirm(`Incoming call from ${data.name}. Accept?`)) {
            window.open(`/call.html?id=${data.from}&caller=false`, 'Call', 'width=400,height=600');
            localStorage.setItem('pendingCallSignal', JSON.stringify(data.signal));
        }
    });

    socket.on('typingStatus', (data) => {
        if (data.senderId === recipientId) {
            document.getElementById('typingIndicator').style.display = data.isTyping ? 'block' : 'none';
        }
    });

    socket.on('messageDeleted', (messageId) => {
        loadMessages();
    });
});

async function loadChatInfo() {
    // In a real app, fetch user info by ID
    // For now, we'll assume we have it or fetch it
    try {
        const res = await fetch(`/api/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const friend = data.friends.find(f => f._id === recipientId);
        if (friend) {
            document.getElementById('chatUserName').textContent = friend.name;
            document.getElementById('chatUserPic').src = friend.profilePic;
            document.getElementById('chatUserStatus').textContent = friend.status.toUpperCase();
        }
    } catch (err) {}
}

async function loadMessages() {
    // To be implemented: fetch messages from API
    const messagesArea = document.getElementById('messagesArea');
    messagesArea.innerHTML = '<div class="loading">DECRYPTING_HISTORY...</div>';
    
    try {
        const res = await fetch(`/api/messages/${recipientId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const messages = await res.json();
        messagesArea.innerHTML = '';
        messages.forEach(appendMessage);
    } catch (err) {
        messagesArea.innerHTML = '';
    }
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    if (!content) return;

    const msgData = {
        senderId: user.id,
        recipientId: recipientId,
        content: content,
        type: 'text'
    };

    if (navigator.onLine) {
        socket.emit('sendMessage', msgData);
    } else {
        saveOfflineMessage(msgData);
        appendMessage({ ...msgData, sender: { _id: user.id }, status: 'sending' });
    }
    input.value = '';
    socket.emit('typing', { recipientId, isTyping: false });
}

socket.on('messageSent', (msg) => {
    appendMessage(msg);
});

function appendMessage(msg) {
    const messagesArea = document.getElementById('messagesArea');
    const isSent = msg.sender._id === user.id || msg.sender === user.id;
    
    const div = document.createElement('div');
    div.className = `message-bubble ${isSent ? 'message-sent' : 'message-received'}`;
    
    if (msg.type === 'image') {
        const img = document.createElement('img');
        img.src = msg.fileUrl;
        img.style.maxWidth = '100%';
        img.style.borderRadius = '5px';
        div.appendChild(img);
    } else if (msg.type === 'file') {
        const link = document.createElement('a');
        link.href = msg.fileUrl;
        link.textContent = `DOWNLOAD: ${msg.fileName}`;
        link.style.color = 'var(--neon-green)';
        link.target = '_blank';
        div.appendChild(link);
    } else if (msg.type === 'voice') {
        const audio = document.createElement('audio');
        audio.src = msg.fileUrl;
        audio.controls = true;
        audio.style.width = '200px';
        audio.onplay = () => div.classList.add('voice-playing');
        audio.onpause = () => div.classList.remove('voice-playing');
        audio.onended = () => div.classList.remove('voice-playing');
        div.appendChild(audio);
    } else {
        div.appendChild(document.createTextNode(msg.content || ''));
    }
    
    const status = document.createElement('div');
    status.style.fontSize = '0.5rem';
    status.style.textAlign = 'right';
    status.style.marginTop = '2px';
    status.textContent = msg.status === 'sending' ? 'SENDING...' : 'SENT';
    div.appendChild(status);
    
    div.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (isSent) {
            if (confirm('Delete message?')) {
                socket.emit('deleteMessage', msg._id);
            }
        }
    });

    messagesArea.appendChild(div);
    messagesArea.scrollTop = messagesArea.scrollHeight;
}
