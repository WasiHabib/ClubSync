import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

async function setupDatabase() {
    console.log('🔧 Setting up database...');

    // Connect without database to create it
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 3306,
        multipleStatements: true
    });

    try {
        // Create database
        console.log('📦 Creating database...');
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log('✅ Database created successfully');

        // Use the database
        await connection.query(`USE ${process.env.DB_NAME}`);

        // Read and execute schema
        console.log('📄 Importing schema...');
        const schemaPath = join(__dirname, '..', 'database', 'schema.sql');
        let schema = readFileSync(schemaPath, 'utf8');

        // Remove the DROP DATABASE and CREATE DATABASE commands from schema
        schema = schema
            .replace(/DROP DATABASE IF EXISTS clubsync;/g, '')
            .replace(/CREATE DATABASE clubsync CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;/g, '')
            .replace(/USE clubsync;/g, '');

        // Split by DELIMITER to handle stored procedures
        const parts = schema.split(/DELIMITER\s+\/\//i);

        // Execute first part (tables, views, etc.)
        if (parts[0]) {
            const firstPart = parts[0].trim();
            if (firstPart) {
                await connection.query(firstPart);
                console.log('✅ Tables and views created');
            }
        }

        // Execute stored procedures if present
        if (parts.length > 1) {
            // Get the part between DELIMITER // and DELIMITER ;
            const procPart = parts[1].split(/DELIMITER\s+;/i)[0];
            if (procPart && procPart.trim()) {
                // Split by END // to get individual procedures
                const procedures = procPart.split(/END\s+\/\//gi);
                for (let proc of procedures) {
                    proc = proc.trim();
                    if (proc && proc.length > 10) {
                        // Add back the END
                        const fullProc = proc + '\nEND';
                        try {
                            await connection.query(fullProc);
                            console.log('✅ Stored procedure created');
                        } catch (err) {
                            if (!err.message.includes('already exists')) {
                                console.warn('⚠️  Warning creating procedure:', err.message);
                            }
                        }
                    }
                }
            }
        }

        await connection.query(schemaWithoutDB);
        console.log('✅ Schema imported successfully');

        console.log('\n🎉 Database setup completed successfully!');
        console.log(`📊 Database: ${process.env.DB_NAME}`);
        console.log(`🏠 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

setupDatabase().catch(console.error);
