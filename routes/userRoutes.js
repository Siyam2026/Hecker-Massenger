import express from 'express';
import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('friends', 'name username profilePic status');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/search', authMiddleware, async (req, res) => {
    try {
        const { q } = req.query;
        const users = await User.find({ 
            username: new RegExp(q, 'i'),
            _id: { $ne: req.user.id }
        }).select('name username profilePic');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/friend-request', authMiddleware, async (req, res) => {
    try {
        const { recipientId } = req.body;
        const existing = await FriendRequest.findOne({ sender: req.user.id, recipient: recipientId, status: 'pending' });
        if (existing) return res.status(400).json({ message: 'Request already pending' });

        const request = new FriendRequest({ sender: req.user.id, recipient: recipientId });
        await request.save();
        res.json({ message: 'Friend request sent' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/notifications', authMiddleware, async (req, res) => {
    try {
        const requests = await FriendRequest.find({ recipient: req.user.id, status: 'pending' }).populate('sender', 'name username profilePic');
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/friend-request/respond', authMiddleware, async (req, res) => {
    try {
        const { requestId, status } = req.body;
        const request = await FriendRequest.findById(requestId);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        request.status = status;
        await request.save();

        if (status === 'accepted') {
            await User.findByIdAndUpdate(request.sender, { $addToSet: { friends: request.recipient } });
            await User.findByIdAndUpdate(request.recipient, { $addToSet: { friends: request.sender } });
        }

        res.json({ message: `Request ${status}` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/update', authMiddleware, async (req, res) => {
    try {
        const { name, profilePic, password } = req.body;
        const user = await User.findById(req.user.id);
        if (name) user.name = name;
        if (profilePic) user.profilePic = profilePic;
        if (password) user.password = password;
        await user.save();
        res.json({ message: 'Profile updated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
