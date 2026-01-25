import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const checkDb = async () => {
    try {
        console.log('🔍 Checking Database Content...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'clubsync'
        });

        // Check Players
        const [players] = await connection.query('SELECT player_id, player_name, is_active FROM PLAYER');
        console.log(`\n📊 Total Players in DB: ${players.length}`);
        if (players.length > 0) {
            console.log('First 5 players:');
            console.table(players.slice(0, 5));
        } else {
            console.log('❌ No players found in PLAYER table.');
        }

        // Check Clubs
        const [clubs] = await connection.query('SELECT club_id, club_name FROM CLUB');
        console.log(`\n📊 Total Clubs in DB: ${clubs.length}`);

        await connection.end();
    } catch (error) {
        console.error('❌ Database Error:', error.message);
    }
};

checkDb();
