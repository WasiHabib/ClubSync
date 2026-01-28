import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

async function addTrophyTable() {
    console.log('🏆 Adding TROPHY table to database...\n');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
        multipleStatements: true
    });

    try {
        const sqlPath = join(__dirname, '..', 'database', 'add-trophy-table.sql');
        const sql = readFileSync(sqlPath, 'utf8');

        await connection.query(sql);

        console.log('✅ TROPHY table created successfully!');
        console.log('✅ Sample trophies added!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

addTrophyTable().catch(console.error);
