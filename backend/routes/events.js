import express from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../config/database.js';
import { logAudit } from '../utils/audit.js';

import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper function to generate event description
const generateEventDescription = (eventType, playerName, relatedPlayerName, minute, extraTime) => {
    const time = extraTime > 0 ? `${minute}+${extraTime}'` : `${minute}'`;

    switch (eventType) {
        case 'GOAL':
            return `⚽ Goal by ${playerName} at ${time}`;
        case 'PENALTY':
            return `⚽ Penalty scored by ${playerName} at ${time}`;
        case 'OWN_GOAL':
            return `Own Goal by ${playerName} at ${time}`;
        case 'ASSIST':
            return `🎯 Assist by ${playerName} at ${time}`;
        case 'YELLOW_CARD':
            return `🟨 Yellow card for ${playerName} at ${time}`;
        case 'RED_CARD':
            return `🟥 Red card for ${playerName} at ${time}`;
        case 'SUBSTITUTION':
            return `🔄 Substitution: ${relatedPlayerName} ➡️ ${playerName} at ${time}`;
        default:
            return `Event by ${playerName} at ${time}`;
    }
};

// POST /api/events - Log new match event
router.post('/', authenticate,
    [
        // ... validations ...
        body('match_id').isInt().withMessage('Valid match ID is required'),
        body('event_type').isIn(['GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION', 'PENALTY', 'OWN_GOAL'])
            .withMessage('Invalid event type'),
        body('player_id').isInt().withMessage('Valid player ID is required'),
        body('club_id').isInt().withMessage('Valid club ID is required'),
        body('minute').isInt({ min: 1, max: 120 }).withMessage('Valid minute is required'),
        body('extra_time').optional().isInt({ min: 0 }),
        body('related_player_id').optional().isInt()
    ],
    async (req, res) => {
        const connection = await db.getConnection();

        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            await connection.beginTransaction();

            const {
                match_id,
                event_type,
                player_id,
                related_player_id,
                club_id,
                minute,
                extra_time = 0,
                event_notes
            } = req.body;

            // ... (rest of logic: fetch names, generate description) ...

            // Get player names for description
            const [player] = await connection.query(
                'SELECT player_name FROM PLAYER WHERE player_id = ?',
                [player_id]
            );

            let relatedPlayerName = null;
            if (related_player_id) {
                const [relatedPlayer] = await connection.query(
                    'SELECT player_name FROM PLAYER WHERE player_id = ?',
                    [related_player_id]
                );
                relatedPlayerName = relatedPlayer[0]?.player_name;
            }

            const playerName = player[0]?.player_name || 'Unknown';

            // Generate auto-description
            const description = generateEventDescription(
                event_type,
                playerName,
                relatedPlayerName,
                minute,
                extra_time
            );

            // Insert event
            const [result] = await connection.query(
                `INSERT INTO EVENTS 
         (match_id, event_type, player_id, related_player_id, club_id, minute, extra_time, event_description, event_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [match_id, event_type, player_id, related_player_id || null, club_id, minute, extra_time, description, event_notes || null]
            );

            // Log Audit
            await logAudit(
                req.user?.user_id,
                'INSERT',
                'EVENTS',
                result.insertId,
                null,
                req.body,
                connection
            );

            // ... (rest of the logic: update match score) ...
            // Update match score if it's a goal
            if (event_type === 'GOAL' || event_type === 'PENALTY') {
                const [match] = await connection.query(
                    'SELECT home_club_id, away_club_id, home_score, away_score FROM MATCH_TABLE WHERE match_id = ?',
                    [match_id]
                );

                if (match.length > 0) {
                    const isHomeGoal = match[0].home_club_id === club_id;
                    const scoreField = isHomeGoal ? 'home_score' : 'away_score';

                    await connection.query(
                        `UPDATE MATCH_TABLE SET ${scoreField} = ${scoreField} + 1 WHERE match_id = ?`,
                        [match_id]
                    );
                }
            }

            // Handle own goals (subtract from the scoring team, add to opponent)
            if (event_type === 'OWN_GOAL') {
                const [match] = await connection.query(
                    'SELECT home_club_id, away_club_id FROM MATCH_TABLE WHERE match_id = ?',
                    [match_id]
                );

                if (match.length > 0) {
                    // Own goal benefits the opposing team
                    const isHomeOwnGoal = match[0].home_club_id === club_id;
                    const scoreField = isHomeOwnGoal ? 'away_score' : 'home_score';

                    await connection.query(
                        `UPDATE MATCH_TABLE SET ${scoreField} = ${scoreField} + 1 WHERE match_id = ?`,
                        [match_id]
                    );
                }
            }

            await connection.commit();

            res.status(201).json({
                success: true,
                message: 'Event logged successfully',
                data: {
                    event_id: result.insertId,
                    description
                }
            });
        } catch (error) {

            await connection.rollback();
            console.error('Error logging event:', error);
            res.status(500).json({ success: false, message: 'Failed to log event' });
        } finally {
            connection.release();
        }
    }
);

// GET /api/events/:matchId - Get all events for a match
router.get('/:matchId', async (req, res) => {
    try {
        const { matchId } = req.params;

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
      ORDER BY e.minute, e.extra_time, e.event_id
    `, [matchId]);

        res.json({
            success: true,
            count: events.length,
            data: events
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch events' });
    }
});

// DELETE /api/events/:id - Delete an event
router.delete('/:id', async (req, res) => {
    const connection = await db.getConnection();

    try {
        const { id } = req.params;

        await connection.beginTransaction();

        // Get event details before deleting
        const [events] = await connection.query(
            'SELECT match_id, event_type, club_id FROM EVENTS WHERE event_id = ?',
            [id]
        );

        if (events.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const event = events[0];

        // Delete the event
        await connection.query('DELETE FROM EVENTS WHERE event_id = ?', [id]);

        // Adjust match score if it was a goal
        if (event.event_type === 'GOAL' || event.event_type === 'PENALTY') {
            const [match] = await connection.query(
                'SELECT home_club_id FROM MATCH_TABLE WHERE match_id = ?',
                [event.match_id]
            );

            if (match.length > 0) {
                const isHomeGoal = match[0].home_club_id === event.club_id;
                const scoreField = isHomeGoal ? 'home_score' : 'away_score';

                await connection.query(
                    `UPDATE MATCH_TABLE SET ${scoreField} = GREATEST(0, ${scoreField} - 1) WHERE match_id = ?`,
                    [event.match_id]
                );
            }
        }

        await connection.commit();

        res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting event:', error);
        res.status(500).json({ success: false, message: 'Failed to delete event' });
    } finally {
        connection.release();
    }
});

export default router;
