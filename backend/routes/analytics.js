import express from 'express';
import { db } from '../config/database.js';

const router = express.Router();

// GET /api/analytics/league-table/:seasonId - Get league standings
router.get('/league-table/:seasonId', async (req, res) => {
    try {
        const { seasonId } = req.params;

        // Call stored procedure for league table calculation
        const [standings] = await db.query('CALL sp_calculate_league_table(?)', [seasonId]);

        res.json({
            success: true,
            data: standings[0] // First result set from stored procedure
        });
    } catch (error) {
        console.error('Error fetching league table:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch league table' });
    }
});

// GET /api/analytics/top-scorers/:seasonId - Get top scorers
router.get('/top-scorers/:seasonId', async (req, res) => {
    try {
        const { seasonId } = req.params;
        const { limit = 10 } = req.query;

        // Call stored procedure for top scorers
        const [scorers] = await db.query('CALL sp_get_top_scorers(?, ?)', [seasonId, parseInt(limit)]);

        res.json({
            success: true,
            data: scorers[0] // First result set from stored procedure
        });
    } catch (error) {
        console.error('Error fetching top scorers:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch top scorers' });
    }
});

// GET /api/analytics/season-summary/:seasonId - Get season statistics
router.get('/season-summary/:seasonId', async (req, res) => {
    try {
        const { seasonId } = req.params;

        // Get total matches
        const [matchStats] = await db.query(`
      SELECT 
        COUNT(*) as total_matches,
        SUM(CASE WHEN match_status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_matches,
        SUM(home_score + away_score) as total_goals,
        AVG(home_score + away_score) as avg_goals_per_match
      FROM MATCH_TABLE
      WHERE season_id = ?
    `, [seasonId]);

        // Get total players participating
        const [playerStats] = await db.query(`
      SELECT COUNT(DISTINCT player_id) as total_players
      FROM EVENTS e
      JOIN MATCH_TABLE m ON e.match_id = m.match_id
      WHERE m.season_id = ?
    `, [seasonId]);

        // Get event breakdown
        const [eventStats] = await db.query(`
      SELECT 
        event_type,
        COUNT(*) as count
      FROM EVENTS e
      JOIN MATCH_TABLE m ON e.match_id = m.match_id
      WHERE m.season_id = ?
      GROUP BY event_type
    `, [seasonId]);

        // Get top clubs
        const [topClubs] = await db.query(`
      SELECT 
        c.club_name,
        COUNT(DISTINCT m.match_id) as matches_played,
        SUM(CASE 
          WHEN (m.home_club_id = c.club_id AND m.home_score > m.away_score) OR 
               (m.away_club_id = c.club_id AND m.away_score > m.home_score) 
          THEN 1 ELSE 0 
        END) as wins
      FROM CLUB c
      LEFT JOIN MATCH_TABLE m ON (c.club_id = m.home_club_id OR c.club_id = m.away_club_id)
        AND m.season_id = ? AND m.match_status = 'COMPLETED'
      GROUP BY c.club_id, c.club_name
      ORDER BY wins DESC
      LIMIT 5
    `, [seasonId]);

        res.json({
            success: true,
            data: {
                matches: matchStats[0],
                players: playerStats[0],
                events: eventStats,
                topClubs
            }
        });
    } catch (error) {
        console.error('Error fetching season summary:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch season summary' });
    }
});

// GET /api/analytics/player-stats/:playerId - Get player statistics
router.get('/player-stats/:playerId', async (req, res) => {
    try {
        const { playerId } = req.params;
        const { seasonId } = req.query;

        let query = `
      SELECT 
        p.player_name,
        c.club_name,
        COUNT(DISTINCT m.match_id) as matches_played,
        SUM(CASE WHEN e.event_type IN ('GOAL', 'PENALTY') THEN 1 ELSE 0 END) as goals,
        SUM(CASE WHEN e.event_type = 'ASSIST' THEN 1 ELSE 0 END) as assists,
        SUM(CASE WHEN e.event_type = 'YELLOW_CARD' THEN 1 ELSE 0 END) as yellow_cards,
        SUM(CASE WHEN e.event_type = 'RED_CARD' THEN 1 ELSE 0 END) as red_cards
      FROM PLAYER p
      LEFT JOIN CLUB c ON p.current_club_id = c.club_id
      LEFT JOIN EVENTS e ON p.player_id = e.player_id
      LEFT JOIN MATCH_TABLE m ON e.match_id = m.match_id
      WHERE p.player_id = ?
    `;

        const params = [playerId];

        if (seasonId) {
            query += ' AND m.season_id = ?';
            params.push(seasonId);
        }

        query += ' GROUP BY p.player_id, p.player_name, c.club_name';

        const [stats] = await db.query(query, params);

        if (stats.length === 0) {
            return res.status(404).json({ success: false, message: 'Player not found' });
        }

        res.json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        console.error('Error fetching player stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch player stats' });
    }
});

// GET /api/analytics/club-stats/:clubId - Get club statistics
router.get('/club-stats/:clubId', async (req, res) => {
    try {
        const { clubId } = req.params;
        const { seasonId } = req.query;

        let matchQuery = `
      SELECT 
        COUNT(*) as total_matches,
        SUM(CASE WHEN (home_club_id = ? AND home_score > away_score) OR (away_club_id = ? AND away_score > home_score) THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN home_score = away_score THEN 1 ELSE 0 END) as draws,
        SUM(CASE WHEN (home_club_id = ? AND home_score < away_score) OR (away_club_id = ? AND away_score < home_score) THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN home_club_id = ? THEN home_score ELSE away_score END) as goals_for,
        SUM(CASE WHEN home_club_id = ? THEN away_score ELSE home_score END) as goals_against
      FROM MATCH_TABLE
      WHERE (home_club_id = ? OR away_club_id = ?)
        AND match_status = 'COMPLETED'
    `;

        const params = [clubId, clubId, clubId, clubId, clubId, clubId, clubId, clubId];

        if (seasonId) {
            matchQuery += ' AND season_id = ?';
            params.push(seasonId);
        }

        const [clubStats] = await db.query(matchQuery, params);

        res.json({
            success: true,
            data: clubStats[0]
        });
    } catch (error) {
        console.error('Error fetching club stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch club stats' });
    }
});

export default router;
