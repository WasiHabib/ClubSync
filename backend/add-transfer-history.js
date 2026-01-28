import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

async function addTransferHistoryTable() {
    console.log('📝 Adding TRANSFER_HISTORY table...\n');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
        multipleStatements: true
    });

    try {
        const sqlPath = join(__dirname, '..', 'database', 'add-transfer-history.sql');
        const sql = readFileSync(sqlPath, 'utf8');

        await connection.query(sql);

        console.log('✅ TRANSFER_HISTORY table created successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

addTransferHistoryTable().catch(console.error);
