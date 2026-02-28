import express from 'express';
import { db } from '../config/database.js';

const router = express.Router();

// GET /api/stadiums - Get all stadiums
router.get('/', async (req, res) => {
    try {
        const [stadiums] = await db.query('SELECT * FROM STADIUM ORDER BY stadium_name');

        res.json({
            success: true,
            data: stadiums
        });
    } catch (error) {
        console.error('Error fetching stadiums:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stadiums' });
    }
});

export default router;
