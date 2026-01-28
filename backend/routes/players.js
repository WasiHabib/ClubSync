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

            // Parse JSON attributes if they're strings
            const playersWithParsedAttrs = players.map(player => ({
                ...player,
                attributes: typeof player.attributes === 'string' ? JSON.parse(player.attributes) : player.attributes
            }));

            res.json({
                success: true,
                count: players.length,
                data: playersWithParsedAttrs
            });
        } catch (error) {
            console.error('Error fetching players:', error);
            res.status(500).json({ success: false, message: error.message, stack: error.stack });
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

// GET /api/players/:id/stats/:seasonId - Get player stats for a specific season
router.get('/:id/stats/:seasonId', async (req, res) => {
    try {
        const { id, seasonId } = req.params;

        // Get player basic info
        const [players] = await db.query(
            'SELECT player_id, player_name, position FROM PLAYER WHERE player_id = ?',
            [id]
        );

        if (players.length === 0) {
            return res.status(404).json({ success: false, message: 'Player not found' });
        }

        // Get season stats
        const [stats] = await db.query(`
            SELECT 
                COUNT(DISTINCT m.match_id) as matches_played,
                COUNT(CASE WHEN e.event_type IN ('GOAL', 'PENALTY') THEN 1 END) as goals,
                COUNT(CASE WHEN e.event_type = 'ASSIST' THEN 1 END) as assists,
                COUNT(CASE WHEN e.event_type = 'YELLOW_CARD' THEN 1 END) as yellow_cards,
                COUNT(CASE WHEN e.event_type = 'RED_CARD' THEN 1 END) as red_cards
            FROM EVENTS e
            JOIN MATCH_TABLE m ON e.match_id = m.match_id
            WHERE e.player_id = ? AND m.season_id = ? AND m.match_status = 'COMPLETED'
        `, [id, seasonId]);

        res.json({
            success: true,
            data: {
                ...players[0],
                season_id: parseInt(seasonId),
                stats: stats[0]
            }
        });
    } catch (error) {
        console.error('Error fetching player stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch player stats' });
    }
});

// POST /api/players/search-by-attributes - Search players by JSON attributes
router.post('/search-by-attributes', async (req, res) => {
    try {
        const { minPace, maxPace, minShooting, maxShooting, minPassing, maxPassing,
            minDribbling, maxDribbling, minDefending, maxDefending, minPhysical, maxPhysical,
            position, nationality, club_id } = req.body;

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

        // Position filter
        if (position) {
            query += ' AND p.position = ?';
            params.push(position);
        }

        // Nationality filter
        if (nationality) {
            query += ' AND p.nationality LIKE ?';
            params.push(`%${nationality}%`);
        }

        // Club filter
        if (club_id) {
            query += ' AND p.current_club_id = ?';
            params.push(club_id);
        }

        // Attribute filters (using JSON functions)
        if (minPace !== undefined || maxPace !== undefined) {
            if (minPace !== undefined) {
                query += ' AND JSON_EXTRACT(p.attributes, "$.pace") >= ?';
                params.push(minPace);
            }
            if (maxPace !== undefined) {
                query += ' AND JSON_EXTRACT(p.attributes, "$.pace") <= ?';
                params.push(maxPace);
            }
        }

        if (minShooting !== undefined || maxShooting !== undefined) {
            if (minShooting !== undefined) {
                query += ' AND JSON_EXTRACT(p.attributes, "$.shooting") >= ?';
                params.push(minShooting);
            }
            if (maxShooting !== undefined) {
                query += ' AND JSON_EXTRACT(p.attributes, "$.shooting") <= ?';
                params.push(maxShooting);
            }
        }

        if (minPassing !== undefined || maxPassing !== undefined) {
            if (minPassing !== undefined) {
                query += ' AND JSON_EXTRACT(p.attributes, "$.passing") >= ?';
                params.push(minPassing);
            }
            if (maxPassing !== undefined) {
                query += ' AND JSON_EXTRACT(p.attributes, "$.passing") <= ?';
                params.push(maxPassing);
            }
        }

        if (minDribbling !== undefined || maxDribbling !== undefined) {
            if (minDribbling !== undefined) {
                query += ' AND JSON_EXTRACT(p.attributes, "$.dribbling") >= ?';
                params.push(minDribbling);
            }
            if (maxDribbling !== undefined) {
                query += ' AND JSON_EXTRACT(p.attributes, "$.dribbling") <= ?';
                params.push(maxDribbling);
            }
        }

        if (minDefending !== undefined || maxDefending !== undefined) {
            if (minDefending !== undefined) {
                query += ' AND JSON_EXTRACT(p.attributes, "$.defending") >= ?';
                params.push(minDefending);
            }
            if (maxDefending !== undefined) {
                query += ' AND JSON_EXTRACT(p.attributes, "$.defending") <= ?';
                params.push(maxDefending);
            }
        }

        if (minPhysical !== undefined || maxPhysical !== undefined) {
            if (minPhysical !== undefined) {
                query += ' AND JSON_EXTRACT(p.attributes, "$.physical") >= ?';
                params.push(minPhysical);
            }
            if (maxPhysical !== undefined) {
                query += ' AND JSON_EXTRACT(p.attributes, "$.physical") <= ?';
                params.push(maxPhysical);
            }
        }

        query += ' ORDER BY p.player_name LIMIT 100';

        const [players] = await db.query(query, params);

        // Parse JSON attributes
        const playersWithParsedAttrs = players.map(player => ({
            ...player,
            attributes: typeof player.attributes === 'string' ? JSON.parse(player.attributes) : player.attributes
        }));

        res.json({
            success: true,
            count: players.length,
            data: playersWithParsedAttrs
        });
    } catch (error) {
        console.error('Error searching players by attributes:', error);
        res.status(500).json({ success: false, message: 'Failed to search players' });
    }
});

// POST /api/players/:id/transfer - Transfer player to another club
router.post('/:id/transfer',
    [
        body('to_club_id').isInt().withMessage('Valid destination club ID is required'),
        body('transfer_fee').optional().isNumeric(),
        body('new_contract').isObject().withMessage('New contract details required'),
        body('new_contract.start_date').isDate(),
        body('new_contract.end_date').isDate(),
        body('new_contract.salary_amount').isNumeric()
    ],
    async (req, res) => {
        const connection = await db.getConnection();

        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { id } = req.params;
            const { to_club_id, transfer_fee = 0, new_contract } = req.body;

            await connection.beginTransaction();

            // Get current player details
            const [players] = await connection.query(
                'SELECT player_name, current_club_id FROM PLAYER WHERE player_id = ? AND is_active = TRUE',
                [id]
            );

            if (players.length === 0) {
                await connection.rollback();
                return res.status(404).json({ success: false, message: 'Player not found' });
            }

            const player = players[0];
            const from_club_id = player.current_club_id;

            // Validate different clubs
            if (from_club_id === to_club_id) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: 'Player is already at this club' });
            }

            // End current contract if exists
            if (from_club_id) {
                await connection.query(
                    `UPDATE CONTRACTS 
                     SET is_active = FALSE, end_date = CURDATE() 
                     WHERE player_id = ? AND club_id = ? AND is_active = TRUE`,
                    [id, from_club_id]
                );
            }

            // Update player's club
            await connection.query(
                'UPDATE PLAYER SET current_club_id = ? WHERE player_id = ?',
                [to_club_id, id]
            );

            // 4. Create new contract
            const [contractResult] = await connection.query(
                `INSERT INTO CONTRACTS
                 (contract_type, player_id, club_id, start_date, end_date, salary_amount, salary_currency, contract_terms, is_active)
                 VALUES ('PLAYER', ?, ?, ?, ?, ?, ?, ?, TRUE)`,
                [
                    id,
                    to_club_id,
                    new_contract.start_date,
                    new_contract.end_date,
                    new_contract.salary_amount,
                    new_contract.salary_currency || 'BDT',
                    JSON.stringify({ transfer_fee: transfer_fee })
                ]
            );

            // 5. Record in Transfer History
            await connection.query(
                `INSERT INTO TRANSFER_HISTORY
                 (player_id, from_club_id, to_club_id, transfer_fee, transfer_date, contract_id)
                 VALUES (?, ?, ?, ?, CURDATE(), ?)`,
                [id, currentPlayer.current_club_id || null, to_club_id, transfer_fee, contractResult.insertId]
            );

            await connection.commit();

            // Get club names for response
            const [fromClub] = from_club_id ?
                await db.query('SELECT club_name FROM CLUB WHERE club_id = ?', [from_club_id]) :
                [[{ club_name: 'Free Agent' }]];
            const [toClub] = await db.query('SELECT club_name FROM CLUB WHERE club_id = ?', [to_club_id]);

            res.json({
                success: true,
                message: `${player.player_name} transferred from ${fromClub[0].club_name} to ${toClub[0].club_name}`,
                data: {
                    player_id: id,
                    from_club: fromClub[0].club_name,
                    to_club: toClub[0].club_name,
                    transfer_fee
                }
            });
        } catch (error) {
            await connection.rollback();
            console.error('Error transferring player:', error);
            res.status(500).json({ success: false, message: 'Failed to transfer player' });
        } finally {
            connection.release();
        }
    }
);

export default router;
