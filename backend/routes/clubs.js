import express from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../config/database.js';

const router = express.Router();

// GET /api/clubs - List all clubs
router.get('/', async (req, res) => {
    try {
        const [clubs] = await db.query(`
      SELECT 
        c.*,
        COUNT(DISTINCT p.player_id) as player_count,
        COUNT(DISTINCT m.manager_id) as manager_count
      FROM CLUB c
      LEFT JOIN PLAYER p ON c.club_id = p.current_club_id AND p.is_active = TRUE
      LEFT JOIN MANAGER m ON c.club_id = m.current_club_id AND m.is_active = TRUE
      GROUP BY c.club_id
      ORDER BY c.club_name
    `);

        res.json({
            success: true,
            count: clubs.length,
            data: clubs
        });
    } catch (error) {
        console.error('Error fetching clubs:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch clubs' });
    }
});

// GET /api/clubs/:id - Get single club with details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [clubs] = await db.query('SELECT * FROM CLUB WHERE club_id = ?', [id]);

        if (clubs.length === 0) {
            return res.status(404).json({ success: false, message: 'Club not found' });
        }

        // Get club players
        const [players] = await db.query(
            'SELECT * FROM PLAYER WHERE current_club_id = ? AND is_active = TRUE',
            [id]
        );

        // Get club manager
        const [managers] = await db.query(
            'SELECT * FROM MANAGER WHERE current_club_id = ? AND is_active = TRUE',
            [id]
        );

        // Get club trophies
        const [trophies] = await db.query(
            'SELECT * FROM TROPHY WHERE club_id = ? ORDER BY season_won DESC',
            [id]
        );

        res.json({
            success: true,
            data: {
                ...clubs[0],
                players,
                manager: managers[0] || null,
                trophies
            }
        });
    } catch (error) {
        console.error('Error fetching club:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch club' });
    }
});

// POST /api/clubs - Create new club
router.post('/',
    [
        body('club_name').notEmpty().withMessage('Club name is required'),
        body('city').optional().isString(),
        body('founded_year').optional().isInt({ min: 1800, max: new Date().getFullYear() }),
        body('stadium_name').optional().isString(),
        body('stadium_capacity').optional().isInt({ min: 0 })
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { club_name, city, founded_year, stadium_name, stadium_capacity, club_logo_url } = req.body;

            const [result] = await db.query(
                `INSERT INTO CLUB (club_name, city, founded_year, stadium_name, stadium_capacity, club_logo_url)
         VALUES (?, ?, ?, ?, ?, ?)`,
                [club_name, city || null, founded_year || null, stadium_name || null, stadium_capacity || null, club_logo_url || null]
            );

            res.status(201).json({
                success: true,
                message: 'Club created successfully',
                data: { club_id: result.insertId }
            });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: 'Club name already exists' });
            }
            console.error('Error creating club:', error);
            res.status(500).json({ success: false, message: 'Failed to create club' });
        }
    }
);

// PUT /api/clubs/:id - Update club
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const fields = [];
        const values = [];

        Object.keys(updates).forEach(key => {
            fields.push(`${key} = ?`);
            values.push(updates[key]);
        });

        if (fields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        values.push(id);

        const [result] = await db.query(
            `UPDATE CLUB SET ${fields.join(', ')} WHERE club_id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Club not found' });
        }

        res.json({
            success: true,
            message: 'Club updated successfully'
        });
    } catch (error) {
        console.error('Error updating club:', error);
        res.status(500).json({ success: false, message: 'Failed to update club' });
    }
});

export default router;
