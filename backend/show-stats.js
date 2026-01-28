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

console.log('📊 Database Statistics Summary\n');
console.log('='.repeat(70) + '\n');

try {
    // Get season info
    const [seasons] = await db.query('SELECT * FROM SEASON WHERE is_active = TRUE LIMIT 1');
    const seasonId = seasons[0].season_id;

    console.log(`🏆 Season: ${seasons[0].season_name}`);
    console.log(`📅 Period: ${seasons[0].start_date.toISOString().split('T')[0]} to ${seasons[0].end_date.toISOString().split('T')[0]}\n`);

    // Overall stats
    const [clubCount] = await db.query('SELECT COUNT(*) as count FROM CLUB');
    const [playerCount] = await db.query('SELECT COUNT(*) as count FROM PLAYER WHERE is_active = TRUE');
    const [matchCount] = await db.query('SELECT COUNT(*) as count FROM MATCH_TABLE WHERE season_id = ? AND match_status = "COMPLETED"', [seasonId]);
    const [eventCount] = await db.query('SELECT COUNT(*) as count FROM EVENTS e JOIN MATCH_TABLE m ON e.match_id = m.match_id WHERE m.season_id = ?', [seasonId]);

    console.log('📈 Overall Statistics:');
    console.log(`   • Clubs: ${clubCount[0].count}`);
    console.log(`   • Active Players: ${playerCount[0].count}`);
    console.log(`   • Completed Matches: ${matchCount[0].count}`);
    console.log(`   • Total Events: ${eventCount[0].count}\n`);

    // Top scorers
    const [topScorers] = await db.query(`CALL sp_get_top_scorers(?, 10)`, [seasonId]);

    console.log('⚽ Top 10 Scorers:');
    console.log('   ' + '-'.repeat(66));
    console.log('   Rank | Player Name              | Club                    | Goals');
    console.log('   ' + '-'.repeat(66));
    topScorers[0].forEach((scorer, idx) => {
        const rank = (idx + 1).toString().padStart(4);
        const name = scorer.player_name.padEnd(24);
        const club = (scorer.club_name || 'Free Agent').padEnd(23);
        const goals = scorer.goals.toString().padStart(5);
        console.log(`   ${rank} | ${name} | ${club} | ${goals}`);
    });
    console.log('   ' + '-'.repeat(66) + '\n');

    // League table
    const [standings] = await db.query(`CALL sp_calculate_league_table(?)`, [seasonId]);

    console.log('🏆 League Standings:');
    console.log('   ' + '='.repeat(82));
    console.log('   Pos | Team                    | Played | W  | D  | L  | GF | GA | GD  | Points');
    console.log('   ' + '='.repeat(82));
    standings[0].forEach((team, idx) => {
        const pos = (idx + 1).toString().padStart(3);
        const name = team.club_name.padEnd(23);
        const played = team.matches_played.toString().padStart(6);
        const wins = team.wins.toString().padStart(2);
        const draws = team.draws.toString().padStart(2);
        const losses = team.losses.toString().padStart(2);
        const gf = team.goals_for.toString().padStart(2);
        const ga = team.goals_against.toString().padStart(2);
        const gd = (team.goal_difference >= 0 ? '+' : '') + team.goal_difference.toString().padStart(3);
        const pts = team.points.toString().padStart(6);

        // Add trophy emoji for 1st place
        const trophy = idx === 0 ? ' 🥇' : '';

        console.log(`   ${pos} | ${name} | ${played} | ${wins} | ${draws} | ${losses} | ${gf} | ${ga} | ${gd} | ${pts}${trophy}`);
    });
    console.log('   ' + '='.repeat(82) + '\n');

    // Recent matches
    const [recentMatches] = await db.query(`
        SELECT 
            m.match_id,
            h.club_name as home_team,
            a.club_name as away_team,
            m.home_score,
            m.away_score,
            m.match_date
        FROM MATCH_TABLE m
        JOIN CLUB h ON m.home_club_id = h.club_id
        JOIN CLUB a ON m.away_club_id = a.club_id
        WHERE m.season_id = ? AND m.match_status = 'COMPLETED'
        ORDER BY m.match_date DESC
        LIMIT 10
    `, [seasonId]);

    console.log('📅 Recent Matches:');
    console.log('   ' + '-'.repeat(70));
    recentMatches.forEach(match => {
        const date = match.match_date.toISOString().split('T')[0];
        const homeTeam = match.home_team.padEnd(25);
        const score = `${match.home_score} - ${match.away_score}`;
        const awayTeam = match.away_team.padStart(25);
        console.log(`   ${date} | ${homeTeam} ${score} ${awayTeam}`);
    });
    console.log('   ' + '-'.repeat(70) + '\n');

    // Event breakdown
    const [eventBreakdown] = await db.query(`
        SELECT 
            e.event_type,
            COUNT(*) as count
        FROM EVENTS e
        JOIN MATCH_TABLE m ON e.match_id = m.match_id
        WHERE m.season_id = ?
        GROUP BY e.event_type
        ORDER BY count DESC
    `, [seasonId]);

    console.log('📊 Event Breakdown:');
    eventBreakdown.forEach(evt => {
        const type = evt.event_type.padEnd(15);
        const count = evt.count.toString().padStart(3);
        const emoji = {
            'GOAL': '⚽',
            'ASSIST': '🎯',
            'YELLOW_CARD': '🟨',
            'RED_CARD': '🟥',
            'SUBSTITUTION': '🔄',
            'PENALTY': '🎯'
        }[evt.event_type] || '📌';
        console.log(`   ${emoji} ${type}: ${count}`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('✅ All statistics are ready!\n');
    console.log('🌐 Access via:');
    console.log(`   • League Table API: http://localhost:5000/api/analytics/league-table/${seasonId}`);
    console.log(`   • Top Scorers API: http://localhost:5000/api/analytics/top-scorers/${seasonId}`);
    console.log('   • Frontend Stats: http://localhost:5173/stats');
    console.log('   • Frontend Home: http://localhost:5173\n');

} catch (error) {
    console.error('❌ Error:', error);
} finally {
    await db.end();
}
