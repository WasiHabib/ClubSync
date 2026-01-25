import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkData() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'clubsync',
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log('🔍 Checking database data...\n');
        
        // Check players
        const [players] = await connection.query('SELECT COUNT(*) as count FROM PLAYER');
        console.log(`📊 Total Players: ${players[0].count}`);
        
        // Check clubs
        const [clubs] = await connection.query('SELECT COUNT(*) as count FROM CLUB');
        console.log(`🏆 Total Clubs: ${clubs[0].count}`);
        
        // Check active players
        const [activePlayers] = await connection.query('SELECT COUNT(*) as count FROM PLAYER WHERE is_active = TRUE');
        console.log(`✅ Active Players: ${activePlayers[0].count}`);
        
        // Show some players
        const [playerList] = await connection.query('SELECT player_id, player_name, position, is_active FROM PLAYER LIMIT 10');
        console.log('\n📋 Sample Players:');
        playerList.forEach(p => {
            console.log(`   - ${p.player_name} (${p.position}) - Active: ${p.is_active ? 'Yes' : 'No'}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkData();
