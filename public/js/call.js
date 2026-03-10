const socket = io();
const user = JSON.parse(localStorage.getItem('user'));
const urlParams = new URLSearchParams(window.location.search);
const isCaller = urlParams.get('caller') === 'true';
const targetId = urlParams.get('id');

let peer;
let stream;

socket.emit('join', user.id);

document.addEventListener('DOMContentLoaded', async () => {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    if (isCaller) {
        document.getElementById('callStatus').textContent = 'CALLING...';
        initiateCall();
    } else {
        const signal = JSON.parse(localStorage.getItem('pendingCallSignal'));
        document.getElementById('acceptCall').addEventListener('click', () => {
            acceptCall(signal);
        });
    }
});

function acceptCall(signal) {
    peer = new SimplePeer({ initiator: false, trickle: false, stream });

    peer.on('signal', (data) => {
        socket.emit('answerCall', { signal: data, to: targetId });
    });

    peer.on('stream', (remoteStream) => {
        const audio = document.createElement('audio');
        audio.srcObject = remoteStream;
        audio.play();
    });

    peer.signal(signal);
    document.getElementById('callStatus').textContent = 'CONNECTED';
}

function initiateCall() {
    peer = new SimplePeer({ initiator: true, trickle: false, stream });

    peer.on('signal', (data) => {
        socket.emit('callUser', {
            userToCall: targetId,
            signalData: data,
            from: user.id,
            name: user.name
        });
    });

    peer.on('stream', (remoteStream) => {
        const audio = document.createElement('audio');
        audio.srcObject = remoteStream;
        audio.play();
    });

    socket.on('callAccepted', (signal) => {
        peer.signal(signal);
        document.getElementById('callStatus').textContent = 'CONNECTED';
    });
}
