import express from 'express';
import Message from '../models/Message.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/:recipientId', authMiddleware, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.user.id, recipient: req.params.recipientId },
                { sender: req.params.recipientId, recipient: req.user.id }
            ]
        }).sort({ createdAt: 1 }).populate('sender', 'name username profilePic');
        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/group/:groupId', authMiddleware, async (req, res) => {
    try {
        const messages = await Message.find({ group: req.params.groupId })
            .sort({ createdAt: 1 })
            .populate('sender', 'name username profilePic');
        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
