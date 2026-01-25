import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const samplePlayers = [
    {
        name: 'Jamal Bhuyan',
        nationality: 'Bangladesh',
        position: 'CDM',
        jersey: 6,
        club: 'Dhaka Abahani', // Will map to club_id
        stats: { pace: 65, shooting: 60, passing: 82, dribbling: 70, defending: 75, physical: 72 }
    },
    {
        name: 'Tariq Kazi',
        nationality: 'Bangladesh',
        position: 'RB',
        jersey: 4,
        club: 'Bashundhara Kings',
        stats: { pace: 78, shooting: 55, passing: 68, dribbling: 72, defending: 76, physical: 78 }
    },
    {
        name: 'Robinho',
        nationality: 'Brazil',
        position: 'LW',
        jersey: 10,
        club: 'Bashundhara Kings',
        stats: { pace: 88, shooting: 82, passing: 84, dribbling: 90, defending: 40, physical: 65 }
    },
    {
        name: 'Dorielton',
        nationality: 'Brazil',
        position: 'ST',
        jersey: 9,
        club: 'Bashundhara Kings',
        stats: { pace: 82, shooting: 86, passing: 65, dribbling: 78, defending: 45, physical: 85 }
    },
    {
        name: 'Soleiman Diabate',
        nationality: 'Mali',
        position: 'ST',
        jersey: 10,
        club: 'Mohammedan SC',
        stats: { pace: 79, shooting: 84, passing: 68, dribbling: 76, defending: 42, physical: 80 }
    }
];

const seedData = async () => {
    try {
        console.log('🌱 Starting database seeding...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'clubsync',
            multipleStatements: true
        });

        // 1. Get Club IDs
        console.log('📍 Fetching clubs...');
        const [clubs] = await connection.query('SELECT club_id, club_name FROM CLUB');
        const clubMap = {};
        clubs.forEach(c => clubMap[c.club_name] = c.club_id);

        if (clubs.length === 0) {
            console.log('❌ No clubs found. Make sure schema.sql was imported.');
            process.exit(1);
        }

        // 2. Insert Players
        console.log('👤 Inserting sample players...');
        for (const p of samplePlayers) {
            const clubId = clubMap[p.club] || clubs[0].club_id;

            // Check if exists
            const [exists] = await connection.query('SELECT player_id FROM PLAYER WHERE player_name = ?', [p.name]);

            if (exists.length === 0) {
                const [res] = await connection.query(`
                    INSERT INTO PLAYER (player_name, date_of_birth, nationality, position, jersey_number, current_club_id, attributes)
                    VALUES (?, '1995-01-01', ?, ?, ?, ?, ?)
                `, [p.name, p.nationality, p.position, p.jersey, clubId, JSON.stringify(p.stats)]);
                console.log(`   + Added ${p.name}`);
            }
        }

        // 3. Get Season
        console.log('📅 Fetching season...');
        const [seasons] = await connection.query('SELECT season_id FROM SEASON LIMIT 1');
        let seasonId = seasons.length > 0 ? seasons[0].season_id : null;

        if (!seasonId) {
            console.log('   + Creating season...');
            const [res] = await connection.query(`INSERT INTO SEASON (season_name, start_date, end_date, is_active) VALUES ('BPL 2024', '2024-01-01', '2024-12-31', 1)`);
            seasonId = res.insertId;
        }

        // 4. Insert Matches
        console.log('⚽ Inserting sample matches...');
        const homeClub = clubs.find(c => c.club_name === 'Bashundhara Kings') || clubs[0];
        const awayClub = clubs.find(c => c.club_name === 'Mohammedan SC') || clubs[1];

        if (homeClub && awayClub) {
            const [matchExists] = await connection.query('SELECT match_id FROM MATCH_TABLE WHERE home_club_id = ? AND away_club_id = ?', [homeClub.club_id, awayClub.club_id]);

            if (matchExists.length === 0) {
                const [matchRes] = await connection.query(`
                    INSERT INTO MATCH_TABLE (season_id, home_club_id, away_club_id, match_date, home_score, away_score, match_status, venue)
                    VALUES (?, ?, ?, NOW() - INTERVAL 2 DAY, 2, 1, 'COMPLETED', 'Kings Arena')
                `, [seasonId, homeClub.club_id, awayClub.club_id]);

                const matchId = matchRes.insertId;
                console.log(`   + Added match: ${homeClub.club_name} vs ${awayClub.club_name}`);

                // 5. Insert Events (Goals)
                // Get player IDs
                const [p1] = await connection.query('SELECT player_id FROM PLAYER WHERE player_name = ?', ['Robinho']);
                const [p2] = await connection.query('SELECT player_id FROM PLAYER WHERE player_name = ?', ['Soleiman Diabate']);

                if (p1.length > 0) {
                    await connection.query(`
                        INSERT INTO EVENTS (match_id, event_type, player_id, club_id, minute, event_description)
                        VALUES (?, 'GOAL', ?, ?, 23, '⚽ Goal by Robinho at 23\\'')
                    `, [matchId, p1[0].player_id, homeClub.club_id]);
                }
                if (p2.length > 0) {
                    await connection.query(`
                        INSERT INTO EVENTS (match_id, event_type, player_id, club_id, minute, event_description)
                        VALUES (?, 'GOAL', ?, ?, 45, '⚽ Goal by Soleiman Diabate at 45\\'')
                    `, [matchId, p2[0].player_id, awayClub.club_id]);
                }
            }
        }

        console.log('✅ Seeding complete! You should now see data in the app.');
        await connection.end();

    } catch (error) {
        console.error('❌ Error during seeding:', error.message);
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('   -> Check your DB_PASSWORD in .env file');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('   -> Database "clubsync" does not exist. Run schema import first.');
        }
    }
};

seedData();
