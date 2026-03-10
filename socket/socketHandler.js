import User from '../models/User.js';
import Message from '../models/Message.js';

const users = new Map(); // userId -> socketId

export default function setupSocket(io) {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('join', (userId) => {
            users.set(userId, socket.id);
            socket.userId = userId;
            User.findByIdAndUpdate(userId, { status: 'online' }).exec();
            io.emit('userStatus', { userId, status: 'online' });
        });

        socket.on('sendMessage', async (data) => {
            const { senderId, recipientId, groupId, content, type, fileUrl, fileName, replyTo } = data;
            
            const message = new Message({
                sender: senderId,
                recipient: recipientId,
                group: groupId,
                content,
                type,
                fileUrl,
                fileName,
                replyTo
            });
            await message.save();
            const populatedMessage = await message.populate('sender', 'name username profilePic');

            if (recipientId) {
                const recipientSocketId = users.get(recipientId);
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit('newMessage', populatedMessage);
                }
            } else if (groupId) {
                socket.to(`group_${groupId}`).emit('newMessage', populatedMessage);
            }
            
            socket.emit('messageSent', populatedMessage);
        });

        socket.on('joinGroup', (groupId) => {
            socket.join(`group_${groupId}`);
        });

        socket.on('typing', (data) => {
            const { recipientId, groupId, isTyping } = data;
            if (recipientId) {
                const recipientSocketId = users.get(recipientId);
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit('typingStatus', { senderId: socket.userId, isTyping });
                }
            } else if (groupId) {
                socket.to(`group_${groupId}`).emit('typingStatus', { groupId, senderId: socket.userId, isTyping });
            }
        });

        socket.on('disconnect', () => {
            if (socket.userId) {
                users.delete(socket.userId);
                User.findByIdAndUpdate(socket.userId, { status: 'offline', lastSeen: new Date() }).exec();
                io.emit('userStatus', { userId: socket.userId, status: 'offline' });
            }
            console.log('User disconnected');
        });

        // WebRTC Signaling for Audio Calls
        socket.on('callUser', (data) => {
            const { userToCall, signalData, from, name } = data;
            const recipientSocketId = users.get(userToCall);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('incomingCall', { signal: signalData, from, name });
            }
        });

        socket.on('answerCall', (data) => {
            const recipientSocketId = users.get(data.to);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('callAccepted', data.signal);
            }
        });

        socket.on('deleteMessage', async (messageId) => {
            await Message.findByIdAndUpdate(messageId, { isDeleted: true, content: 'Message deleted' });
            io.emit('messageDeleted', messageId);
        });
    });
}
