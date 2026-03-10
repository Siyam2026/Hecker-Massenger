import express from 'express';
import Group from '../models/Group.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { name, members, image } = req.body;
        const group = new Group({
            name,
            admin: req.user.id,
            members: [...members, req.user.id],
            image
        });
        await group.save();
        res.status(201).json(group);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/my-groups', authMiddleware, async (req, res) => {
    try {
        const groups = await Group.find({ members: req.user.id });
        res.json(groups);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
