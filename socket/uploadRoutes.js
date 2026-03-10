import express from 'express';
import multer from 'multer';
import path from 'path';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

router.post('/upload', authMiddleware, upload.array('files'), (req, res) => {
    try {
        const files = req.files.map(f => ({
            url: `/uploads/${f.filename}`,
            name: f.originalname,
            type: f.mimetype
        }));
        res.json(files);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
