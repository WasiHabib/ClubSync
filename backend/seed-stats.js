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

console.log('🎯 Populating comprehensive statistics...\n');

// Helper function to get random item from array
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

try {
    // Get all clubs
    const [clubs] = await db.query('SELECT club_id, club_name FROM CLUB');
    console.log(`📍 Found ${clubs.length} clubs`);

    // Get or create active season
    let [seasons] = await db.query('SELECT season_id FROM SEASON WHERE is_active = TRUE LIMIT 1');
    let seasonId;

    if (seasons.length === 0) {
        const [result] = await db.query(
            `INSERT INTO SEASON (season_name, start_date, end_date, is_active, description) 
             VALUES ('Bangladesh Premier League 2024', '2024-01-01', '2024-12-31', TRUE, 'Full season with statistics')`
        );
        seasonId = result.insertId;
        console.log(`✓ Created new season (ID: ${seasonId})`);
    } else {
        seasonId = seasons[0].season_id;
        console.log(`✓ Using existing season (ID: ${seasonId})`);
    }

    // Get all players grouped by club
    const [players] = await db.query(`
        SELECT player_id, player_name, position, current_club_id 
        FROM PLAYER 
        WHERE is_active = TRUE AND current_club_id IS NOT NULL
        ORDER BY current_club_id, position
    `);
    console.log(`👥 Found ${players.length} players\n`);

    // Group players by club
    const playersByClub = {};
    players.forEach(p => {
        if (!playersByClub[p.current_club_id]) {
            playersByClub[p.current_club_id] = [];
        }
        playersByClub[p.current_club_id].push(p);
    });

    // Generate round-robin matches (each team plays each other twice - home and away)
    console.log('⚽ Generating comprehensive match schedule...');
    let matchCount = 0;
    let eventCount = 0;

    for (let i = 0; i < clubs.length; i++) {
        for (let j = 0; j < clubs.length; j++) {
            if (i === j) continue; // Teams don't play themselves

            const homeClub = clubs[i];
            const awayClub = clubs[j];
            const homePlayers = playersByClub[homeClub.club_id] || [];
            const awayPlayers = playersByClub[awayClub.club_id] || [];

            if (homePlayers.length === 0 || awayPlayers.length === 0) continue;

            // Generate match with realistic score
            const homeScore = randomInt(0, 4);
            const awayScore = randomInt(0, 4);
            const matchDate = new Date(2024, randomInt(0, 11), randomInt(1, 28));

            const [matchResult] = await db.query(
                `INSERT INTO MATCH_TABLE 
                 (season_id, home_club_id, away_club_id, match_date, home_score, away_score, 
                  match_status, attendance, referee_name) 
                 VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?)`,
                [
                    seasonId,
                    homeClub.club_id,
                    awayClub.club_id,
                    matchDate,
                    homeScore,
                    awayScore,
                    randomInt(5000, 35000),
                    `Referee ${randomInt(1, 20)}`
                ]
            );

            const matchId = matchResult.insertId;
            matchCount++;

            // Generate match events for goals
            const totalGoals = homeScore + awayScore;
            let homeGoalsRecorded = 0;
            let awayGoalsRecorded = 0;

            for (let g = 0; g < totalGoals; g++) {
                const isHomeGoal = (homeGoalsRecorded < homeScore && awayGoalsRecorded >= awayScore) ||
                    (homeGoalsRecorded < homeScore && Math.random() > 0.5);

                const scoringClub = isHomeGoal ? homeClub : awayClub;
                const scoringPlayers = isHomeGoal ? homePlayers : awayPlayers;

                // Pick a forward or midfielder to score
                const scorers = scoringPlayers.filter(p =>
                    ['ST', 'LW', 'RW', 'CAM', 'CM'].includes(p.position)
                );
                const scorer = scorers.length > 0 ? random(scorers) : random(scoringPlayers);

                // Possibly add an assist
                const assistPlayer = Math.random() > 0.4 ? random(scoringPlayers.filter(p => p.player_id !== scorer.player_id)) : null;

                const minute = randomInt(1, 90);

                // Goal event
                await db.query(
                    `INSERT INTO EVENTS 
                     (match_id, event_type, player_id, club_id, minute, event_description) 
                     VALUES (?, 'GOAL', ?, ?, ?, ?)`,
                    [
                        matchId,
                        scorer.player_id,
                        scoringClub.club_id,
                        minute,
                        `⚽ GOAL! ${scorer.player_name} scores for ${scoringClub.club_name} at ${minute}'`
                    ]
                );
                eventCount++;

                // Assist event
                if (assistPlayer) {
                    await db.query(
                        `INSERT INTO EVENTS 
                         (match_id, event_type, player_id, related_player_id, club_id, minute, event_description) 
                         VALUES (?, 'ASSIST', ?, ?, ?, ?, ?)`,
                        [
                            matchId,
                            assistPlayer.player_id,
                            scorer.player_id,
                            scoringClub.club_id,
                            minute,
                            `🎯 ${assistPlayer.player_name} assists ${scorer.player_name}`
                        ]
                    );
                    eventCount++;
                }

                if (isHomeGoal) homeGoalsRecorded++;
                else awayGoalsRecorded++;
            }

            // Add some yellow/red cards randomly
            const cardCount = randomInt(0, 3);
            for (let c = 0; c < cardCount; c++) {
                const isHomeCard = Math.random() > 0.5;
                const cardClub = isHomeCard ? homeClub : awayClub;
                const cardPlayers = isHomeCard ? homePlayers : awayPlayers;
                const cardPlayer = random(cardPlayers);
                const cardType = Math.random() > 0.9 ? 'RED_CARD' : 'YELLOW_CARD';
                const cardMinute = randomInt(10, 90);

                await db.query(
                    `INSERT INTO EVENTS 
                     (match_id, event_type, player_id, club_id, minute, event_description) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        matchId,
                        cardType,
                        cardPlayer.player_id,
                        cardClub.club_id,
                        cardMinute,
                        `${cardType === 'RED_CARD' ? '🟥' : '🟨'} ${cardPlayer.player_name} receives a ${cardType.replace('_', ' ').toLowerCase()}`
                    ]
                );
                eventCount++;
            }

            if (matchCount % 5 === 0) {
                process.stdout.write(`   Generated ${matchCount} matches with ${eventCount} events...\r`);
            }
        }
    }

    console.log(`\n✓ Generated ${matchCount} matches with ${eventCount} events\n`);

    // Calculate and display statistics
    console.log('📊 Calculating statistics...\n');

    // Top scorers
    const [topScorers] = await db.query(`
        SELECT 
            p.player_name,
            c.club_name,
            COUNT(e.event_id) as goals
        FROM PLAYER p
        JOIN EVENTS e ON p.player_id = e.player_id
        JOIN MATCH_TABLE m ON e.match_id = m.match_id
        LEFT JOIN CLUB c ON p.current_club_id = c.club_id
        WHERE m.season_id = ? 
            AND e.event_type IN ('GOAL', 'PENALTY')
            AND m.match_status = 'COMPLETED'
        GROUP BY p.player_id, p.player_name, c.club_name
        ORDER BY goals DESC
        LIMIT 10
    `, [seasonId]);

    console.log('🏆 Top Scorers:');
    topScorers.forEach((scorer, idx) => {
        console.log(`   ${idx + 1}. ${scorer.player_name} (${scorer.club_name}) - ${scorer.goals} goals`);
    });

    // League table
    const [standings] = await db.query(`CALL sp_calculate_league_table(?)`, [seasonId]);

    console.log('\n📋 League Table:');
    console.log('   Pos | Team                    | P  | W  | D  | L  | GF | GA | GD  | Pts');
    console.log('   ----|-------------------------|----|----|----|----|----|----|-----|----');
    standings[0].forEach((team, idx) => {
        const pos = (idx + 1).toString().padEnd(3);
        const name = team.club_name.padEnd(23);
        const played = team.matches_played.toString().padEnd(2);
        const wins = team.wins.toString().padEnd(2);
        const draws = team.draws.toString().padEnd(2);
        const losses = team.losses.toString().padEnd(2);
        const gf = team.goals_for.toString().padEnd(2);
        const ga = team.goals_against.toString().padEnd(2);
        const gd = team.goal_difference.toString().padStart(3);
        const pts = team.points.toString().padEnd(3);
        console.log(`   ${pos} | ${name} | ${played} | ${wins} | ${draws} | ${losses} | ${gf} | ${ga} | ${gd} | ${pts}`);
    });

    console.log('\n✅ Statistics population complete!\n');
    console.log('📈 Summary:');
    console.log(`   • Total Matches: ${matchCount}`);
    console.log(`   • Total Events: ${eventCount}`);
    console.log(`   • Total Players: ${players.length}`);
    console.log(`   • Active Season: ${seasonId}`);
    console.log('\n🌐 You can now view statistics at:');
    console.log('   • Backend API: http://localhost:5000/api/analytics/league-table/' + seasonId);
    console.log('   • Frontend: http://localhost:5173/stats');

} catch (error) {
    console.error('❌ Error:', error);
} finally {
    await db.end();
}
