import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { createAdmin } from './create-admin.js';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

// Helper to generate random date
const randomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper to generate random stats
const randomStats = (position) => {
    const base = {
        GK: { pace: 50, shooting: 40, passing: 60, dribbling: 45, defending: 70, physical: 75 },
        CB: { pace: 65, shooting: 45, passing: 60, dribbling: 55, defending: 82, physical: 80 },
        LB: { pace: 75, shooting: 50, passing: 68, dribbling: 70, defending: 74, physical: 70 },
        RB: { pace: 75, shooting: 50, passing: 68, dribbling: 70, defending: 74, physical: 70 },
        CDM: { pace: 65, shooting: 58, passing: 75, dribbling: 68, defending: 78, physical: 75 },
        CM: { pace: 70, shooting: 65, passing: 78, dribbling: 75, defending: 65, physical: 70 },
        CAM: { pace: 75, shooting: 75, passing: 82, dribbling: 82, defending: 50, physical: 65 },
        LW: { pace: 85, shooting: 75, passing: 75, dribbling: 85, defending: 40, physical: 65 },
        RW: { pace: 85, shooting: 75, passing: 75, dribbling: 85, defending: 40, physical: 65 },
        ST: { pace: 80, shooting: 82, passing: 65, dribbling: 78, defending: 40, physical: 78 }
    };

    const stats = base[position] || base['CM'];
    // Add variance
    return Object.fromEntries(
        Object.entries(stats).map(([k, v]) => [k, Math.max(30, Math.min(99, v + Math.floor(Math.random() * 20 - 10)))])
    );
};

const firstNames = ['Mueez', 'Shadab', 'Tahsan', 'Nafiz', 'Mirza', 'Subarno', 'Samiul', 'Mahmudul', 'Rad', 'Tanvir', 'Kazi', 'Isfak', 'Wasi', 'Hazma', 'Ariq'];
const lastNames = ['Musabbir', 'Habib', 'Lihan', 'Zia', 'Adnan', 'Neel', 'Islam', 'Hasan', 'Daiyan', 'Mahmud', 'Badrul', 'Iqbal', 'Habib', 'Chowdhury', 'Belal'];
const foreignFirstNames = ['Demba', 'Katim', 'Wirba', 'Ashraf', 'Bellou', 'Amadu', 'Sunjo', 'Carlos', 'Pedro', 'Antonio', 'Mamadou', 'Youssef'];
const foreignLastNames = ['Silva', 'Toppe', 'Gaye', 'Gonzalez', 'Martinez', 'Fernandez', 'Garcia', 'Lopez', 'Diarra', 'Toure', 'Keita', 'Cisse'];
const nationalities = ['Bangladesh', 'Brazil', 'Argentina', 'Mali', 'Senegal', 'Nigeria', 'Ghana', 'Colombia', 'Uruguay'];

const positions = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];

const seedFullData = async () => {
    let connection;
    try {
        console.log('🌱 Starting comprehensive database seeding...\n');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'clubsync',
            multipleStatements: true
        });

        // 1. Get clubs and stadiums
        console.log('📍 Fetching clubs and stadiums...');
        const [clubs] = await connection.query('SELECT club_id, club_name, stadium_id FROM CLUB');
        const [stadiums] = await connection.query('SELECT stadium_id FROM STADIUM');
        console.log(`   Found ${clubs.length} clubs and ${stadiums.length} stadiums\n`);

        if (clubs.length === 0 || stadiums.length === 0) {
            console.log('❌ No clubs or stadiums found. Schema not imported correctly.');
            process.exit(1);
        }

        // 2. Create admin user
        await createAdmin(connection);

        // 3. Create season
        console.log('📅 Creating season...');
        const [existingSeason] = await connection.query('SELECT season_id FROM SEASON WHERE season_name = ?', ['BPL 2024-25']);
        let seasonId;

        if (existingSeason.length === 0) {
            const [seasonRes] = await connection.query(`
                INSERT INTO SEASON (season_name, start_date, end_date, is_active)
                VALUES ('BPL 2024-25', '2024-08-01', '2025-05-31', TRUE)
            `);
            seasonId = seasonRes.insertId;
            console.log(`   ✓ Season created (ID: ${seasonId})\n`);
        } else {
            seasonId = existingSeason[0].season_id;
            console.log(`   ℹ Season already exists (ID: ${seasonId})\n`);
        }

        // 4. Generate players for each club
        console.log('👥 Generating players for each club...');
        const playerIds = {};

        for (const club of clubs) {
            console.log(`   Generating squad for ${club.club_name}...`);
            playerIds[club.club_id] = [];

            // Generate 25-30 players per club
            const squadSize = 25 + Math.floor(Math.random() * 6);
            const positionCounts = {
                GK: 3, CB: 6, LB: 2, RB: 2, CDM: 3, CM: 4, CAM: 2, LW: 2, RW: 2, ST: 3
            };

            let playerCount = 0;

            for (const [position, count] of Object.entries(positionCounts)) {
                for (let i = 0; i < count && playerCount < squadSize; i++) {
                    const isForeign = Math.random() > 0.7; // 30% foreign players
                    const firstName = isForeign
                        ? foreignFirstNames[Math.floor(Math.random() * foreignFirstNames.length)]
                        : firstNames[Math.floor(Math.random() * firstNames.length)];
                    const lastName = isForeign
                        ? foreignLastNames[Math.floor(Math.random() * foreignLastNames.length)]
                        : lastNames[Math.floor(Math.random() * lastNames.length)];

                    const playerName = `${firstName} ${lastName}`;
                    const nationality = isForeign
                        ? nationalities[1 + Math.floor(Math.random() * (nationalities.length - 1))]
                        : 'Bangladesh';

                    const dob = randomDate(new Date(1990, 0, 1), new Date(2003, 11, 31));
                    const jerseyNumber = Math.floor(Math.random() * 99) + 1;
                    const stats = randomStats(position);

                    try {
                        const [result] = await connection.query(`
                            INSERT INTO PLAYER (player_name, date_of_birth, nationality, position, jersey_number, current_club_id, attributes, is_active)
                            VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
                        `, [playerName, dob, nationality, position, jerseyNumber, club.club_id, JSON.stringify(stats)]);

                        playerIds[club.club_id].push(result.insertId);
                        playerCount++;
                    } catch (err) {
                        // Skip duplicate names
                    }
                }
            }
            console.log(`      ✓ Generated ${playerCount} players`);
        }
        console.log('   ✓ All players generated\n');

        // 5. Create managers
        console.log('👔 Creating managers...');
        const managerNames = ['John Smith', 'Carlos Rodriguez', 'Ahmed Hassan', 'David Johnson', 'Paulo Santos'];

        for (let i = 0; i < clubs.length && i < managerNames.length; i++) {
            const [existing] = await connection.query('SELECT manager_id FROM MANAGER WHERE manager_name = ?', [managerNames[i]]);

            if (existing.length === 0) {
                await connection.query(`
                    INSERT INTO MANAGER (manager_name, nationality, date_of_birth)
                    VALUES (?, ?, '1975-05-15')
                `, [managerNames[i], i === 0 ? 'England' : i === 1 ? 'Spain' : i === 2 ? 'Egypt' : i === 3 ? 'USA' : 'Brazil']);
            }
        }
        console.log('   ✓ Managers created\n');

        // 6. Generate matches
        console.log('⚽ Generating matches...');
        let matchCount = 0;
        const eventTypes = ['GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION'];

        // Generate round-robin matches
        for (let i = 0; i < clubs.length; i++) {
            for (let j = i + 1; j < clubs.length; j++) {
                const homeClub = clubs[i];
                const awayClub = clubs[j];

                // Check if match exists
                const [existing] = await connection.query(
                    'SELECT match_id FROM MATCH_TABLE WHERE season_id = ? AND home_club_id = ? AND away_club_id = ?',
                    [seasonId, homeClub.club_id, awayClub.club_id]
                );

                if (existing.length === 0) {
                    const matchDate = randomDate(new Date(2024, 7, 1), new Date(2025, 4, 31));
                    const homeScore = Math.floor(Math.random() * 5);
                    const awayScore = Math.floor(Math.random() * 4);
                    const status = Math.random() > 0.3 ? 'COMPLETED' : 'SCHEDULED';

                    // Assign home club's stadium, or pick a random one if not set
                    const stadium_id = homeClub.stadium_id || stadiums[Math.floor(Math.random() * stadiums.length)].stadium_id;

                    const [matchResult] = await connection.query(`
                        INSERT INTO MATCH_TABLE (season_id, home_club_id, away_club_id, match_date, home_score, away_score, match_status, stadium_id)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `, [seasonId, homeClub.club_id, awayClub.club_id, matchDate, homeScore, awayScore, status, stadium_id]);

                    const matchId = matchResult.insertId;
                    matchCount++;

                    // Generate events for completed matches
                    if (status === 'COMPLETED') {
                        const totalGoals = homeScore + awayScore;
                        const homePlayers = playerIds[homeClub.club_id] || [];
                        const awayPlayers = playerIds[awayClub.club_id] || [];

                        // Add goal events
                        for (let g = 0; g < homeScore && homePlayers.length > 0; g++) {
                            const playerId = homePlayers[Math.floor(Math.random() * homePlayers.length)];
                            const minute = Math.floor(Math.random() * 90) + 1;

                            await connection.query(`
                                INSERT INTO EVENTS (match_id, event_type, player_id, club_id, minute, event_description)
                                VALUES (?, 'GOAL', ?, ?, ?, ?)
                            `, [matchId, playerId, homeClub.club_id, minute, `⚽ Goal scored at ${minute}'`]);
                        }

                        for (let g = 0; g < awayScore && awayPlayers.length > 0; g++) {
                            const playerId = awayPlayers[Math.floor(Math.random() * awayPlayers.length)];
                            const minute = Math.floor(Math.random() * 90) + 1;

                            await connection.query(`
                                INSERT INTO EVENTS (match_id, event_type, player_id, club_id, minute, event_description)
                                VALUES (?, 'GOAL', ?, ?, ?, ?)
                            `, [matchId, playerId, awayClub.club_id, minute, `⚽ Goal scored at ${minute}'`]);
                        }

                        // Add some cards
                        const numCards = Math.floor(Math.random() * 4);
                        for (let c = 0; c < numCards; c++) {
                            const isHome = Math.random() > 0.5;
                            const players = isHome ? homePlayers : awayPlayers;
                            const clubId = isHome ? homeClub.club_id : awayClub.club_id;

                            if (players.length > 0) {
                                const playerId = players[Math.floor(Math.random() * players.length)];
                                const cardType = Math.random() > 0.8 ? 'RED_CARD' : 'YELLOW_CARD';
                                const minute = Math.floor(Math.random() * 90) + 1;

                                await connection.query(`
                                    INSERT INTO EVENTS (match_id, event_type, player_id, club_id, minute, event_description)
                                    VALUES (?, ?, ?, ?, ?, ?)
                                `, [matchId, cardType, playerId, clubId, minute, `${cardType === 'RED_CARD' ? '🟥' : '🟨'} Card shown at ${minute}'`]);
                            }
                        }
                    }
                }
            }
        }
        console.log(`   ✓ Generated ${matchCount} matches with events\n`);

        // Summary
        const [playerCount] = await connection.query('SELECT COUNT(*) as count FROM PLAYER');
        const [matchCountQ] = await connection.query('SELECT COUNT(*) as count FROM MATCH_TABLE');
        const [eventCount] = await connection.query('SELECT COUNT(*) as count FROM EVENTS');

        console.log('✅ Seeding complete!\n');
        console.log('📊 Summary:');
        console.log(`   • Clubs: ${clubs.length}`);
        console.log(`   • Players: ${playerCount[0].count}`);
        console.log(`   • Matches: ${matchCountQ[0].count}`);
        console.log(`   • Events: ${eventCount[0].count}`);
        console.log(`   • Admin Login: username=admin, password=admin123\n`);

        await connection.end();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error during seeding:', error.message);
        if (connection) await connection.end();
        process.exit(1);
    }
};

seedFullData();
