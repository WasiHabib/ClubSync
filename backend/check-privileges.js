import { db } from './config/database.js';

async function checkPrivileges() {
    try {
        const [grants] = await db.query('SHOW GRANTS FOR CURRENT_USER()');
        console.log('Grants for current user:');
        grants.forEach(g => console.log(JSON.stringify(g)));

        // Also try to get the current user
        const [user] = await db.query('SELECT CURRENT_USER() as u');
        console.log('Current user:', user[0].u);

        // Try a simple trigger on a test
        try {
            await db.query(`DROP TRIGGER IF EXISTS _test_trigger`);
            await db.query(`CREATE TRIGGER _test_trigger AFTER INSERT ON AUDIT_LOG FOR EACH ROW SET @x = 1`);
            console.log('✅ Can create triggers!');
            await db.query(`DROP TRIGGER IF EXISTS _test_trigger`);
        } catch (e) {
            console.log('❌ Cannot create triggers:', e.message);
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        process.exit(0);
    }
}

checkPrivileges();
