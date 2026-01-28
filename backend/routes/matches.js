import express from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../config/database.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

// GET /api/matches - List matches with filtering
router.get('/', async (req, res) => {
    try {
        // Auto-complete matches older than 100 minutes
        await db.query(`
            UPDATE MATCH_TABLE 
            SET match_status = 'COMPLETED' 
            WHERE match_status IN ('SCHEDULED', 'LIVE') 
            AND match_date < DATE_SUB(NOW(), INTERVAL 100 MINUTE)
        `);

        const { season_id, club_id, status, limit = 50, offset = 0 } = req.query;

        let query = `
      SELECT 
        m.*,
        s.season_name,
        hc.club_name as home_club_name,
        ac.club_name as away_club_name
      FROM MATCH_TABLE m
      JOIN SEASON s ON m.season_id = s.season_id
      JOIN CLUB hc ON m.home_club_id = hc.club_id
      JOIN CLUB ac ON m.away_club_id = ac.club_id
      WHERE 1=1
    `;
        const params = [];

        if (season_id) {
            query += ' AND m.season_id = ?';
            params.push(season_id);
        }
        if (club_id) {
            query += ' AND (m.home_club_id = ? OR m.away_club_id = ?)';
            params.push(club_id, club_id);
        }
        if (status) {
            query += ' AND m.match_status = ?';
            params.push(status);
        }

        query += ' ORDER BY m.match_date DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [matches] = await db.query(query, params);

        res.json({
            success: true,
            count: matches.length,
            data: matches
        });
    } catch (error) {
        console.error('Error fetching matches:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch matches' });
    }
});

// GET /api/matches/:id - Get single match with events
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [matches] = await db.query(`
      SELECT 
        m.*,
        s.season_name,
        hc.club_name as home_club_name,
        ac.club_name as away_club_name
      FROM MATCH_TABLE m
      JOIN SEASON s ON m.season_id = s.season_id
      JOIN CLUB hc ON m.home_club_id = hc.club_id
      JOIN CLUB ac ON m.away_club_id = ac.club_id
      WHERE m.match_id = ?
    `, [id]);

        if (matches.length === 0) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        // Get match events
        const [events] = await db.query(`
      SELECT 
        e.*,
        p.player_name,
        rp.player_name as related_player_name,
        c.club_name
      FROM EVENTS e
      LEFT JOIN PLAYER p ON e.player_id = p.player_id
      LEFT JOIN PLAYER rp ON e.related_player_id = rp.player_id
      JOIN CLUB c ON e.club_id = c.club_id
      WHERE e.match_id = ?
      ORDER BY e.minute, e.extra_time
    `, [id]);

        res.json({
            success: true,
            data: {
                ...matches[0],
                events
            }
        });
    } catch (error) {
        console.error('Error fetching match:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch match' });
    }
});

import { authenticate } from '../middleware/auth.js';

// ... (GET routes)

// POST /api/matches - Create new match
router.post('/', authenticate,
    [
        body('season_id').isInt().withMessage('Valid season ID is required'),
        body('home_club_id').isInt().withMessage('Valid home club ID is required'),
        body('away_club_id').isInt().withMessage('Valid away club ID is required'),
        body('match_date').isISO8601().withMessage('Valid match date is required'),
        body('venue').optional().isString()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const {
                season_id,
                home_club_id,
                away_club_id,
                match_date,
                venue,
                referee_name
            } = req.body;

            if (home_club_id === away_club_id) {
                return res.status(400).json({ success: false, message: 'Home and away clubs must be different' });
            }

            // Determine status based on date
            // If match date is in the past, mark as COMPLETED, else SCHEDULED
            const isPast = new Date(match_date) < new Date();
            const status = isPast ? 'COMPLETED' : 'SCHEDULED';

            const [result] = await db.query(
                `INSERT INTO MATCH_TABLE 
         (season_id, home_club_id, away_club_id, match_date, venue, referee_name, match_status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [season_id, home_club_id, away_club_id, match_date, venue || null, referee_name || null, status]
            );

            // Access user from request if available (via middleware)
            // Assuming req.user is set by auth middleware, if not present use null
            await logAudit(
                req.user?.user_id,
                'INSERT',
                'MATCH_TABLE',
                result.insertId,
                null,
                req.body
            );

            res.status(201).json({
                success: true,
                message: 'Match created successfully',
                data: { match_id: result.insertId, status }
            });
        } catch (error) {
            console.error('Error creating match:', error);
            res.status(500).json({ success: false, message: 'Failed to create match' });
        }
    }
);

// PUT /api/matches/:id - Update match
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
            `UPDATE MATCH_TABLE SET ${fields.join(', ')} WHERE match_id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        res.json({
            success: true,
            message: 'Match updated successfully'
        });
    } catch (error) {
        console.error('Error updating match:', error);
        res.status(500).json({ success: false, message: 'Failed to update match' });
    }
});

// GET /api/seasons - List all seasons
router.get('/seasons/all', async (req, res) => {
    try {
        const [seasons] = await db.query(`
      SELECT 
        s.*,
        COUNT(DISTINCT m.match_id) as total_matches
      FROM SEASON s
      LEFT JOIN MATCH_TABLE m ON s.season_id = m.season_id
      GROUP BY s.season_id
      ORDER BY s.start_date DESC
    `);

        res.json({
            success: true,
            data: seasons
        });
    } catch (error) {
        console.error('Error fetching seasons:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch seasons' });
    }
});

// POST /api/seasons - Create new season
router.post('/seasons',
    [
        body('season_name').notEmpty().withMessage('Season name is required'),
        body('start_date').isDate().withMessage('Valid start date is required'),
        body('end_date').isDate().withMessage('Valid end date is required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { season_name, start_date, end_date, description, is_active } = req.body;

            const [result] = await db.query(
                `INSERT INTO SEASON (season_name, start_date, end_date, description, is_active)
         VALUES (?, ?, ?, ?, ?)`,
                [season_name, start_date, end_date, description || null, is_active || false]
            );

            res.status(201).json({
                success: true,
                message: 'Season created successfully',
                data: { season_id: result.insertId }
            });
        } catch (error) {
            console.error('Error creating season:', error);
            res.status(500).json({ success: false, message: 'Failed to create season' });
        }
    }
);

// POST /api/matches/schedule - Create round-robin match schedule for a season
router.post('/schedule',
    [
        body('season_id').isInt().withMessage('Valid season ID is required'),
        body('start_date').isDate().withMessage('Valid start date is required'),
        body('end_date').isDate().withMessage('Valid end date is required'),
        body('venue').optional().isString()
    ],
    async (req, res) => {
        const connection = await db.getConnection();

        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { season_id, start_date, end_date, venue = 'Bangabandhu National Stadium' } = req.body;

            await connection.beginTransaction();

            // Get all clubs
            const [clubs] = await connection.query('SELECT club_id, club_name FROM CLUB ORDER BY club_id');

            if (clubs.length < 2) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: 'At least 2 clubs required for scheduling' });
            }

            // Calculate date distribution
            const start = new Date(start_date);
            const end = new Date(end_date);
            const totalMatches = clubs.length * (clubs.length - 1); // Each team plays all others twice
            const daysBetweenMatches = Math.floor((end - start) / (1000 * 60 * 60 * 24) / totalMatches);

            let matchCount = 0;
            let currentDate = new Date(start);
            const createdMatches = [];

            // Generate round-robin: each team plays each other twice (home and away)
            for (let i = 0; i < clubs.length; i++) {
                for (let j = 0; j < clubs.length; j++) {
                    if (i === j) continue;

                    const homeClub = clubs[i];
                    const awayClub = clubs[j];

                    // Create match
                    const [result] = await connection.query(
                        `INSERT INTO MATCH_TABLE 
                         (season_id, home_club_id, away_club_id, match_date, venue, match_status)
                         VALUES (?, ?, ?, ?, ?, 'SCHEDULED')`,
                        [season_id, homeClub.club_id, awayClub.club_id, currentDate.toISOString().split('T')[0], venue]
                    );

                    createdMatches.push({
                        match_id: result.insertId,
                        home_team: homeClub.club_name,
                        away_team: awayClub.club_name,
                        date: currentDate.toISOString().split('T')[0]
                    });

                    matchCount++;

                    // Increment date for next match
                    currentDate.setDate(currentDate.getDate() + Math.max(1, daysBetweenMatches));
                }
            }

            await connection.commit();

            res.status(201).json({
                success: true,
                message: `Created ${matchCount} matches for the season`,
                data: {
                    total_matches: matchCount,
                    season_id,
                    matches: createdMatches.slice(0, 10), // Return first 10 as preview
                    total_returned: Math.min(10, createdMatches.length)
                }
            });
        } catch (error) {
            await connection.rollback();
            console.error('Error creating match schedule:', error);
            res.status(500).json({ success: false, message: 'Failed to create match schedule' });
        } finally {
            connection.release();
        }
    }
);

export default router;
