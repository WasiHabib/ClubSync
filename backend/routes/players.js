import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { db } from '../config/database.js';

const router = express.Router();

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

// GET /api/players - List all players with optional filtering
router.get('/',
    query('position').optional().isString(),
    query('club_id').optional().isInt(),
    query('nationality').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    async (req, res) => {
        try {
            const { position, club_id, nationality, limit = 50, offset = 0 } = req.query;

            let query = `
        SELECT 
          p.*,
          c.club_name,
          c.city as club_city
        FROM PLAYER p
        LEFT JOIN CLUB c ON p.current_club_id = c.club_id
        WHERE p.is_active = TRUE
      `;
            const params = [];

            if (position) {
                query += ' AND p.position = ?';
                params.push(position);
            }
            if (club_id) {
                query += ' AND p.current_club_id = ?';
                params.push(club_id);
            }
            if (nationality) {
                query += ' AND p.nationality LIKE ?';
                params.push(`%${nationality}%`);
            }

            query += ' ORDER BY p.player_name LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const [players] = await db.query(query, params);

            // Parse JSON attributes
            const playersWithParsedAttrs = players.map(player => ({
                ...player,
                attributes: player.attributes ? JSON.parse(player.attributes) : null
            }));

            res.json({
                success: true,
                count: players.length,
                data: playersWithParsedAttrs
            });
        } catch (error) {
            console.error('Error fetching players:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch players' });
        }
    }
);

// GET /api/players/search - Advanced search
router.get('/search',
    query('q').notEmpty().withMessage('Search query is required'),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { q } = req.query;

            const query = `
        SELECT 
          p.*,
          c.club_name,
          c.city as club_city
        FROM PLAYER p
        LEFT JOIN CLUB c ON p.current_club_id = c.club_id
        WHERE p.is_active = TRUE 
          AND (p.player_name LIKE ? OR c.club_name LIKE ?)
        ORDER BY p.player_name
        LIMIT 20
      `;

            const searchTerm = `%${q}%`;
            const [players] = await db.query(query, [searchTerm, searchTerm]);

            const playersWithParsedAttrs = players.map(player => ({
                ...player,
                attributes: player.attributes ? JSON.parse(player.attributes) : null
            }));

            res.json({
                success: true,
                count: players.length,
                data: playersWithParsedAttrs
            });
        } catch (error) {
            console.error('Error searching players:', error);
            res.status(500).json({ success: false, message: 'Search failed' });
        }
    }
);

// GET /api/players/:id - Get single player
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
      SELECT 
        p.*,
        c.club_name,
        c.city as club_city,
        c.stadium_name
      FROM PLAYER p
      LEFT JOIN CLUB c ON p.current_club_id = c.club_id
      WHERE p.player_id = ?
    `;

        const [players] = await db.query(query, [id]);

        if (players.length === 0) {
            return res.status(404).json({ success: false, message: 'Player not found' });
        }

        const player = {
            ...players[0],
            attributes: players[0].attributes ? JSON.parse(players[0].attributes) : null
        };

        // Get player contracts
        const [contracts] = await db.query(
            `SELECT con.*, c.club_name 
       FROM CONTRACTS con
       JOIN CLUB c ON con.club_id = c.club_id
       WHERE con.player_id = ?
       ORDER BY con.start_date DESC`,
            [id]
        );

        // Get player stats (goals, assists)
        const [stats] = await db.query(
            `SELECT 
        COUNT(CASE WHEN event_type IN ('GOAL', 'PENALTY') THEN 1 END) as total_goals,
        COUNT(CASE WHEN event_type = 'ASSIST' THEN 1 END) as total_assists,
        COUNT(CASE WHEN event_type = 'YELLOW_CARD' THEN 1 END) as yellow_cards,
        COUNT(CASE WHEN event_type = 'RED_CARD' THEN 1 END) as red_cards
       FROM EVENTS
       WHERE player_id = ?`,
            [id]
        );

        res.json({
            success: true,
            data: {
                ...player,
                contracts,
                stats: stats[0]
            }
        });
    } catch (error) {
        console.error('Error fetching player:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch player' });
    }
});

// POST /api/players - Add new player
router.post('/',
    [
        body('player_name').notEmpty().withMessage('Player name is required'),
        body('date_of_birth').isDate().withMessage('Valid date of birth is required'),
        body('nationality').notEmpty().withMessage('Nationality is required'),
        body('position').isIn(['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST']).withMessage('Invalid position'),
        body('current_club_id').optional().isInt(),
        body('jersey_number').optional().isInt({ min: 1, max: 99 }),
        body('height_cm').optional().isInt(),
        body('weight_kg').optional().isInt(),
        body('preferred_foot').optional().isIn(['Left', 'Right', 'Both']),
        body('attributes').optional().isObject(),
        body('contract').optional().isObject()
    ],
    handleValidationErrors,
    async (req, res) => {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const {
                player_name,
                date_of_birth,
                nationality,
                position,
                height_cm,
                weight_kg,
                preferred_foot,
                jersey_number,
                current_club_id,
                player_photo_url,
                attributes,
                contract
            } = req.body;

            // Insert player
            const [result] = await connection.query(
                `INSERT INTO PLAYER 
         (player_name, date_of_birth, nationality, position, height_cm, weight_kg, 
          preferred_foot, jersey_number, current_club_id, player_photo_url, attributes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    player_name,
                    date_of_birth,
                    nationality,
                    position,
                    height_cm || null,
                    weight_kg || null,
                    preferred_foot || null,
                    jersey_number || null,
                    current_club_id || null,
                    player_photo_url || null,
                    attributes ? JSON.stringify(attributes) : null
                ]
            );

            const playerId = result.insertId;

            // Create contract if provided
            if (contract && current_club_id) {
                await connection.query(
                    `INSERT INTO CONTRACTS 
           (contract_type, player_id, club_id, start_date, end_date, salary_amount, salary_currency, contract_terms)
           VALUES ('PLAYER', ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        playerId,
                        current_club_id,
                        contract.start_date,
                        contract.end_date,
                        contract.salary_amount || 0,
                        contract.salary_currency || 'BDT',
                        contract.contract_terms || null
                    ]
                );
            }

            await connection.commit();

            res.status(201).json({
                success: true,
                message: 'Player added successfully',
                data: { player_id: playerId }
            });
        } catch (error) {
            await connection.rollback();
            console.error('Error adding player:', error);
            res.status(500).json({ success: false, message: 'Failed to add player' });
        } finally {
            connection.release();
        }
    }
);

// PUT /api/players/:id - Update player
router.put('/:id',
    [
        body('player_name').optional().notEmpty(),
        body('position').optional().isIn(['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST']),
        body('current_club_id').optional().isInt(),
        body('attributes').optional().isObject()
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Build dynamic update query
            const fields = [];
            const values = [];

            Object.keys(updates).forEach(key => {
                if (key === 'attributes') {
                    fields.push(`${key} = ?`);
                    values.push(JSON.stringify(updates[key]));
                } else {
                    fields.push(`${key} = ?`);
                    values.push(updates[key]);
                }
            });

            if (fields.length === 0) {
                return res.status(400).json({ success: false, message: 'No fields to update' });
            }

            values.push(id);

            const [result] = await db.query(
                `UPDATE PLAYER SET ${fields.join(', ')} WHERE player_id = ?`,
                values
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Player not found' });
            }

            res.json({
                success: true,
                message: 'Player updated successfully'
            });
        } catch (error) {
            console.error('Error updating player:', error);
            res.status(500).json({ success: false, message: 'Failed to update player' });
        }
    }
);

// DELETE /api/players/:id - Soft delete player
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            'UPDATE PLAYER SET is_active = FALSE WHERE player_id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Player not found' });
        }

        res.json({
            success: true,
            message: 'Player deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting player:', error);
        res.status(500).json({ success: false, message: 'Failed to delete player' });
    }
});

export default router;
