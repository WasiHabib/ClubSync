import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

/**
 * Creates an admin user if it doesn't already exist.
 * @param {mysql.Connection} [existingConnection] - Optional existing database connection.
 * @returns {Promise<void>}
 */
export const createAdmin = async (existingConnection = null) => {
    let connection = existingConnection;
    let shouldCloseConnection = false;

    try {
        if (!connection) {
            console.log('👤 Connecting to database to create admin...');
            connection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME || 'clubsync',
            });
            shouldCloseConnection = true;
        }

        console.log('👤 Creating admin user...');
        const passwordHash = await bcrypt.hash('admin123', 10);
        const [existingUser] = await connection.query('SELECT user_id FROM APP_USER WHERE username = ?', ['admin']);

        if (existingUser.length === 0) {
            await connection.query(`
                INSERT INTO APP_USER (username, email, password_hash, full_name, role, is_active)
                VALUES ('admin', 'admin@clubsync.bd', ?, 'System Administrator', 'ADMIN', TRUE)
            `, [passwordHash]);
            console.log('   ✓ Admin user created (username: admin, password: admin123)\n');
        } else {
            await connection.query(`
                UPDATE APP_USER SET password_hash = ?, is_active = TRUE WHERE username = 'admin'
            `, [passwordHash]);
            console.log('   ✓ Admin user already exists - Password reset to admin123\n');
        }

    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
        throw error;
    } finally {
        if (shouldCloseConnection && connection) {
            await connection.end();
            console.log('👤 Database connection closed.');
        }
    }
};

// Run if called directly
if (process.argv[1] === __filename) {
    createAdmin()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
