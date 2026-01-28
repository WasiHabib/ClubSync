import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
});

console.log('🔐 Creating/Updating Admin User...\n');

try {
    // Check if admin exists
    const [users] = await db.query('SELECT user_id FROM APP_USER WHERE username = ?', ['admin']);

    const passwordHash = await bcrypt.hash('admin123', 10);

    if (users.length > 0) {
        // Update existing admin
        await db.query(
            'UPDATE APP_USER SET password_hash = ?, is_active = TRUE WHERE username = ?',
            [passwordHash, 'admin']
        );
        console.log('✅ Admin password updated successfully!\n');
    } else {
        // Create new admin
        await db.query(
            `INSERT INTO APP_USER (username, email, password_hash, full_name, role, is_active)
             VALUES (?, ?, ?, ?, ?, ?)`,
            ['admin', 'admin@clubsync.com', passwordHash, 'System Administrator', 'ADMIN', true]
        );
        console.log('✅ Admin user created successfully!\n');
    }

    console.log('📋 Login Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123\n');

} catch (error) {
    console.error('❌ Error:', error.message);
} finally {
    await db.end();
}
