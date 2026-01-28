import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

async function installTriggers() {
    console.log('🔧 Installing Database Triggers...\n');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    try {
        // Read triggers SQL file
        const triggersPath = join(__dirname, '..', 'database', 'triggers.sql');
        let triggersSql = readFileSync(triggersPath, 'utf8');

        console.log('📄 Loading triggers from file...');

        // Remove DELIMITER commands
        triggersSql = triggersSql
            .replace(/DELIMITER\s+\/\//gi, '')
            .replace(/DELIMITER\s+;/gi, '');

        // Split by // which marks end of each trigger
        const parts = triggersSql.split('//');

        let successCount = 0;
        for (const part of parts) {
            const stmt = part.trim();
            if (stmt.length < 20) continue;

            // Skip comments
            if (stmt.startsWith('--')) continue;

            if (stmt.includes('DROP TRIGGER') || stmt.includes('CREATE TRIGGER')) {
                try {
                    await connection.query(stmt);
                    if (stmt.includes('CREATE TRIGGER')) {
                        const match = stmt.match(/CREATE TRIGGER\s+(\w+)/i);
                        if (match) {
                            console.log(`  ✅ ${match[1]}`);
                            successCount++;
                        }
                    }
                } catch (err) {
                    // Ignore "trigger doesn't exist" errors from DROP IF EXISTS
                    if (!err.message.includes("doesn't exist")) {
                        console.error(`  ❌ Error: ${err.message.substring(0, 100)}`);
                    }
                }
            }
        }

        console.log(`\n✅ Successfully installed ${successCount} triggers!\n`);

        // List installed triggers
        const [triggers] = await connection.query(`
            SELECT 
                TRIGGER_NAME as name,
                EVENT_MANIPULATION as event,
                EVENT_OBJECT_TABLE as table_name,
                ACTION_TIMING as timing
            FROM information_schema.TRIGGERS
            WHERE TRIGGER_SCHEMA = DATABASE()
            ORDER BY EVENT_OBJECT_TABLE, ACTION_TIMING, EVENT_MANIPULATION
        `);

        if (triggers.length > 0) {
            console.log('📋 Active Triggers:');
            console.log('─'.repeat(85));
            console.log('Trigger Name'.padEnd(38), 'Table'.padEnd(18), 'Event'.padEnd(10), 'Timing');
            console.log('─'.repeat(85));

            triggers.forEach(t => {
                console.log(
                    t.name.padEnd(38),
                    t.table_name.padEnd(18),
                    t.event.padEnd(10),
                    t.timing
                );
            });

            console.log('─'.repeat(85));
            console.log(`\n✅ Total active triggers: ${triggers.length}\n`);
        }

    } catch (error) {
        console.error('❌ Error installing triggers:', error.message);
    } finally {
        await connection.end();
    }
}

installTriggers().catch(console.error);
