import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const seed = async () => {
    try {
        console.log('Connecting to database...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            multipleStatements: true
        });

        console.log('Creating database if not exists...');
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'clubsync'}`);
        await connection.query(`USE ${process.env.DB_NAME || 'clubsync'}`);

        // Read schema file
        // Note: In a real scenario we'd read the file, but here we can just ensure the user exists
        // assuming the schema was imported. If not, we might need to import schema too.
        // Let's assume schema might not be there if they want us to "do these".

        // Let's rely on the user having imported schema or us needing to do it.
        // For now, let's just try to insert the user. If table doesn't exist, we know schema wasn't run.

        const passwordHash = await bcrypt.hash('admin123', 10);

        console.log('Checking/Creating admin user...');
        // Check if user exists
        const [users] = await connection.query('SELECT * FROM APP_USER WHERE username = ?', ['admin']);

        if (users.length === 0) {
            await connection.query(`
                INSERT INTO APP_USER (username, email, password_hash, full_name, role)
                VALUES ('admin', 'admin@clubsync.bd', ?, 'System Administrator', 'ADMIN')
            `, [passwordHash]);
            console.log('✅ Admin user created successfully');
        } else {
            console.log('ℹ️ Admin user already exists');
        }

        await connection.end();
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            console.error('❌ Error: Tables not found. You need to import the schema first.');
        } else {
            console.error('❌ Error:', error.message);
        }
        process.exit(1);
    }
};

seed();
