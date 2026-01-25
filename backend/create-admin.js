import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function createAdminUser() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'clubsync',
        port: process.env.DB_PORT || 3306
    });

    try {
        // Hash the password
        const passwordHash = await bcrypt.hash('admin123', 10);
        
        // Check if admin already exists
        const [existing] = await connection.query(
            'SELECT user_id FROM APP_USER WHERE username = ?',
            ['admin']
        );

        if (existing.length > 0) {
            // Update existing admin
            await connection.query(
                'UPDATE APP_USER SET password_hash = ?, role = ?, is_active = TRUE WHERE username = ?',
                [passwordHash, 'ADMIN', 'admin']
            );
            console.log('✅ Admin user updated successfully!');
        } else {
            // Insert new admin
            await connection.query(
                `INSERT INTO APP_USER (username, email, password_hash, full_name, role) 
                 VALUES (?, ?, ?, ?, ?)`,
                ['admin', 'admin@clubsync.bd', passwordHash, 'System Administrator', 'ADMIN']
            );
            console.log('✅ Admin user created successfully!');
        }

        console.log('\n📋 Login Credentials:');
        console.log('   Username: admin');
        console.log('   Password: admin123');
        console.log('\n');
    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
    } finally {
        await connection.end();
    }
}

createAdminUser();
