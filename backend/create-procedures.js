import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
});

console.log('🔧 Creating stored procedures...\n');

try {
    // Drop existing procedures if they exist
    await db.query('DROP PROCEDURE IF EXISTS sp_calculate_league_table');
    await db.query('DROP PROCEDURE IF EXISTS sp_get_top_scorers');

    // Create league table procedure
    const leagueTableProc = `
        CREATE PROCEDURE sp_calculate_league_table(IN p_season_id INT)
        BEGIN
            SELECT 
                c.club_id,
                c.club_name,
                COUNT(DISTINCT m.match_id) AS matches_played,
                SUM(CASE 
                    WHEN (m.home_club_id = c.club_id AND m.home_score > m.away_score) OR 
                         (m.away_club_id = c.club_id AND m.away_score > m.home_score) 
                    THEN 1 ELSE 0 
                END) AS wins,
                SUM(CASE 
                    WHEN m.home_score = m.away_score 
                    THEN 1 ELSE 0 
                END) AS draws,
                SUM(CASE 
                    WHEN (m.home_club_id = c.club_id AND m.home_score < m.away_score) OR 
                         (m.away_club_id = c.club_id AND m.away_score < m.home_score) 
                    THEN 1 ELSE 0 
                END) AS losses,
                SUM(CASE 
                    WHEN m.home_club_id = c.club_id THEN m.home_score 
                    ELSE m.away_score 
                END) AS goals_for,
                SUM(CASE 
                    WHEN m.home_club_id = c.club_id THEN m.away_score 
                    ELSE m.home_score 
                END) AS goals_against,
                (SUM(CASE 
                    WHEN m.home_club_id = c.club_id THEN m.home_score 
                    ELSE m.away_score 
                END) - SUM(CASE 
                    WHEN m.home_club_id = c.club_id THEN m.away_score 
                    ELSE m.home_score 
                END)) AS goal_difference,
                (SUM(CASE 
                    WHEN (m.home_club_id = c.club_id AND m.home_score > m.away_score) OR 
                         (m.away_club_id = c.club_id AND m.away_score > m.home_score) 
                    THEN 3
                    WHEN m.home_score = m.away_score 
                    THEN 1 
                    ELSE 0 
                END)) AS points
            FROM CLUB c
            LEFT JOIN MATCH_TABLE m ON (c.club_id = m.home_club_id OR c.club_id = m.away_club_id)
                AND m.season_id = p_season_id 
                AND m.match_status = 'COMPLETED'
            GROUP BY c.club_id, c.club_name
            ORDER BY points DESC, goal_difference DESC, goals_for DESC;
        END
    `;

    await db.query(leagueTableProc);
    console.log('✓ Created sp_calculate_league_table');

    // Create top scorers procedure
    const topScorersProc = `
        CREATE PROCEDURE sp_get_top_scorers(IN p_season_id INT, IN p_limit INT)
        BEGIN
            SELECT 
                p.player_id,
                p.player_name,
                c.club_name,
                COUNT(e.event_id) AS goals,
                SUM(CASE WHEN e.event_type = 'ASSIST' THEN 1 ELSE 0 END) AS assists
            FROM PLAYER p
            JOIN EVENTS e ON p.player_id = e.player_id
            JOIN MATCH_TABLE m ON e.match_id = m.match_id
            LEFT JOIN CLUB c ON p.current_club_id = c.club_id
            WHERE m.season_id = p_season_id 
                AND (e.event_type = 'GOAL' OR e.event_type = 'PENALTY')
                AND m.match_status = 'COMPLETED'
            GROUP BY p.player_id, p.player_name, c.club_name
            ORDER BY goals DESC, assists DESC
            LIMIT p_limit;
        END
    `;

    await db.query(topScorersProc);
    console.log('✓ Created sp_get_top_scorers');

    console.log('\n✅ All stored procedures created successfully!\n');

} catch (error) {
    console.error('❌ Error:', error.message);
} finally {
    await db.end();
}
