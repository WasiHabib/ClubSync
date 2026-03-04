import express from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../config/database.js';

const router = express.Router();

// GET /api/clubs/stadiums/all - List all stadiums
router.get('/stadiums/all', async (req, res) => {
    try {
        const [stadiums] = await db.query('SELECT stadium_id, stadium_name, capacity FROM STADIUM ORDER BY stadium_name');
        res.json({ success: true, count: stadiums.length, data: stadiums });
    } catch (error) {
        console.error('Error fetching stadiums:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stadiums' });
    }
});// GET /api/clubs/seasons/all - List all seasons
router.get('/seasons/all', async (req, res) => {
    try {
        const [seasons] = await db.query('SELECT season_id, season_name FROM SEASON ORDER BY start_date DESC');
        res.json({ success: true, count: seasons.length, data: seasons });
    } catch (error) {
        console.error('Error fetching seasons:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch seasons' });
    }
});

// GET /api/clubs - List all clubs
router.get('/', async (req, res) => {
    try {
        const [clubs] = await db.query(`
      SELECT 
        c.*,
        COUNT(DISTINCT p.player_id) as player_count,
        COUNT(DISTINCT m.manager_id) as manager_count,
        st.stadium_name,
        st.capacity as stadium_capacity
      FROM CLUB c
      LEFT JOIN PLAYER p ON c.club_id = p.current_club_id AND p.is_active = TRUE
      LEFT JOIN MANAGER m ON c.club_id = m.current_club_id AND m.is_active = TRUE
      LEFT JOIN STADIUM st ON c.stadium_id = st.stadium_id
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

        const [clubs] = await db.query(`
          SELECT c.*, st.stadium_name, st.capacity as stadium_capacity 
          FROM CLUB c 
          LEFT JOIN STADIUM st ON c.stadium_id = st.stadium_id 
          WHERE c.club_id = ?
        `, [id]);

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
        body('stadium_id').optional().isInt()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { club_name, city, founded_year, stadium_id, club_logo_url } = req.body;

            const [result] = await db.query(
                `INSERT INTO CLUB (club_name, city, founded_year, stadium_id, club_logo_url)
         VALUES (?, ?, ?, ?, ?)`,
                [club_name, city || null, founded_year || null, stadium_id || null, club_logo_url || null]
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

        const allowedFields = ['club_name', 'city', 'founded_year', 'stadium_id', 'club_logo_url'];
        const fields = [];
        const values = [];

        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = ?`);
                values.push(updates[key] === '' ? null : updates[key]);
            }
        });

        if (fields.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields provided to update' });
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

// PUT /api/clubs/:id/manager - Update or Create Club Manager
router.put('/:id/manager', async (req, res) => {
    try {
        const { id } = req.params;
        const { manager_name, nationality, specialization } = req.body;

        // Check if club exists
        const [club] = await db.query('SELECT * FROM CLUB WHERE club_id = ?', [id]);
        if (club.length === 0) {
            return res.status(404).json({ success: false, message: 'Club not found' });
        }

        // Check if club already has a manager
        const [managers] = await db.query('SELECT * FROM MANAGER WHERE current_club_id = ? AND is_active = TRUE', [id]);

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            if (managers.length > 0) {
                const currentManager = managers[0];
                if (currentManager.manager_name !== manager_name) {
                    // It's a new person. Terminate old manager's contract.
                    await connection.query(
                        'UPDATE CONTRACTS SET end_date = CURDATE(), is_active = FALSE WHERE manager_id = ? AND club_id = ? AND is_active = TRUE',
                        [currentManager.manager_id, id]
                    );

                    // Deactivate old manager's club association
                    await connection.query(
                        'UPDATE MANAGER SET current_club_id = NULL WHERE manager_id = ?',
                        [currentManager.manager_id]
                    );

                    // Insert new manager
                    const [managerResult] = await connection.query(
                        `INSERT INTO MANAGER (manager_name, nationality, specialization, current_club_id, date_of_birth) 
                         VALUES (?, ?, ?, ?, CURDATE())`,
                        [manager_name, nationality, specialization || 'Balanced', id]
                    );

                    // Insert new contract
                    await connection.query(
                        `INSERT INTO CONTRACTS (club_id, manager_id, contract_type, start_date, is_active, salary_amount) 
                         VALUES (?, ?, 'MANAGER', CURDATE(), TRUE, 50000)`,
                        [id, managerResult.insertId]
                    );
                } else {
                    // Update existing manager details
                    await connection.query(
                        'UPDATE MANAGER SET nationality = ?, specialization = ? WHERE manager_id = ?',
                        [nationality, specialization || 'Balanced', currentManager.manager_id]
                    );
                }
            } else {
                // No existing manager, create new manager
                const [managerResult] = await connection.query(
                    `INSERT INTO MANAGER (manager_name, nationality, specialization, current_club_id, date_of_birth) 
                     VALUES (?, ?, ?, ?, CURDATE())`,
                    [manager_name, nationality, specialization || 'Balanced', id]
                );

                // Insert new contract
                await connection.query(
                    `INSERT INTO CONTRACTS (club_id, manager_id, contract_type, start_date, is_active, salary_amount) 
                     VALUES (?, ?, 'MANAGER', CURDATE(), TRUE, 50000)`,
                    [id, managerResult.insertId]
                );
            }

            await connection.commit();
            connection.release();

            res.json({
                success: true,
                message: 'Manager updated successfully'
            });
        } catch (txnError) {
            await connection.rollback();
            connection.release();
            throw txnError;
        }
    } catch (error) {
        console.error('Error updating manager:', error);
        res.status(500).json({ success: false, message: 'Failed to update manager' });
    }
});

// POST /api/clubs/:id/trophies - Add trophy to club
router.post('/:id/trophies',
    [
        body('trophy_name').notEmpty().withMessage('Trophy name is required'),
        body('season_won').notEmpty().withMessage('Season is required'),
        body('description').optional().isString()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { id } = req.params;
            const { trophy_name, season_won, description } = req.body;

            // Check if club exists
            const [club] = await db.query('SELECT * FROM CLUB WHERE club_id = ?', [id]);
            if (club.length === 0) {
                return res.status(404).json({ success: false, message: 'Club not found' });
            }

            // Insert trophy
            const [result] = await db.query(
                `INSERT INTO TROPHY (club_id, trophy_name, season_won, description)
                 VALUES (?, ?, ?, ?)`,
                [id, trophy_name, season_won, description || null]
            );

            res.status(201).json({
                success: true,
                message: 'Trophy added successfully',
                data: { trophy_id: result.insertId }
            });
        } catch (error) {
            console.error('Error adding trophy:', error);
            res.status(500).json({ success: false, message: 'Failed to add trophy' });
        }
    }
);

// GET /api/clubs/:id/manager-history - Get manager history for a club
router.get('/:id/manager-history', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if club exists
        const [club] = await db.query('SELECT club_id, club_name FROM CLUB WHERE club_id = ?', [id]);
        if (club.length === 0) {
            return res.status(404).json({ success: false, message: 'Club not found' });
        }

        // Get all contracts for managers at this club
        const [managerHistory] = await db.query(`
            SELECT 
                m.manager_id,
                m.manager_name,
                m.nationality,
                m.specialization,
                c.contract_id,
                c.start_date,
                c.end_date,
                c.salary_amount,
                c.salary_currency,
                c.is_active as contract_active,
                DATEDIFF(c.end_date, c.start_date) as tenure_days
            FROM CONTRACTS c
            JOIN MANAGER m ON c.manager_id = m.manager_id
            WHERE c.club_id = ? AND c.contract_type = 'MANAGER'
            ORDER BY c.start_date DESC
        `, [id]);

        res.json({
            success: true,
            data: {
                club: club[0],
                manager_history: managerHistory
            }
        });
    } catch (error) {
        console.error('Error fetching manager history:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch manager history' });
    }
});

// GET /api/clubs/:id/players - Get all players for a specific club
router.get('/:id/players', async (req, res) => {
    try {
        const { id } = req.params;

        const [players] = await db.query(`
            SELECT 
                p.*,
                c.club_name
            FROM PLAYER p
            JOIN CLUB c ON p.current_club_id = c.club_id
            WHERE p.current_club_id = ? AND p.is_active = TRUE
            ORDER BY p.position, p.player_name
        `, [id]);

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
        console.error('Error fetching club players:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch club players' });
    }
});

export default router;
