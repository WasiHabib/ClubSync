import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Connect as root to grant TRIGGER privilege
const rootConn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: 'root',
    password: '',  // root usually has no password on local dev
    database: process.env.DB_NAME || 'clubsync',
    multipleStatements: true
});

const drops = `
DROP TRIGGER IF EXISTS audit_player_insert;
DROP TRIGGER IF EXISTS audit_player_update;
DROP TRIGGER IF EXISTS audit_player_delete;
DROP TRIGGER IF EXISTS audit_club_insert;
DROP TRIGGER IF EXISTS audit_club_update;
DROP TRIGGER IF EXISTS audit_club_delete;
DROP TRIGGER IF EXISTS audit_manager_insert;
DROP TRIGGER IF EXISTS audit_manager_update;
DROP TRIGGER IF EXISTS audit_manager_delete;
`;

const creates = [
    `CREATE TRIGGER audit_player_insert AFTER INSERT ON PLAYER FOR EACH ROW INSERT INTO AUDIT_LOG (user_id, table_name, record_id, action, new_values) VALUES (@admin_user_id, 'PLAYER', NEW.player_id, 'INSERT', JSON_OBJECT('name', NEW.player_name, 'position', NEW.position, 'club_id', NEW.current_club_id, 'is_active', NEW.is_active))`,

    `CREATE TRIGGER audit_player_delete AFTER DELETE ON PLAYER FOR EACH ROW INSERT INTO AUDIT_LOG (user_id, table_name, record_id, action, old_values) VALUES (@admin_user_id, 'PLAYER', OLD.player_id, 'DELETE', JSON_OBJECT('name', OLD.player_name, 'position', OLD.position, 'club_id', OLD.current_club_id, 'is_active', OLD.is_active))`,

    `CREATE TRIGGER audit_club_insert AFTER INSERT ON CLUB FOR EACH ROW INSERT INTO AUDIT_LOG (user_id, table_name, record_id, action, new_values) VALUES (@admin_user_id, 'CLUB', NEW.club_id, 'INSERT', JSON_OBJECT('name', NEW.club_name, 'city', NEW.city))`,

    `CREATE TRIGGER audit_club_update AFTER UPDATE ON CLUB FOR EACH ROW INSERT INTO AUDIT_LOG (user_id, table_name, record_id, action, old_values, new_values) VALUES (@admin_user_id, 'CLUB', NEW.club_id, 'UPDATE', JSON_OBJECT('name', OLD.club_name, 'city', OLD.city), JSON_OBJECT('name', NEW.club_name, 'city', NEW.city))`,

    `CREATE TRIGGER audit_club_delete AFTER DELETE ON CLUB FOR EACH ROW INSERT INTO AUDIT_LOG (user_id, table_name, record_id, action, old_values) VALUES (@admin_user_id, 'CLUB', OLD.club_id, 'DELETE', JSON_OBJECT('name', OLD.club_name, 'city', OLD.city))`,

    `CREATE TRIGGER audit_manager_insert AFTER INSERT ON MANAGER FOR EACH ROW INSERT INTO AUDIT_LOG (user_id, table_name, record_id, action, new_values) VALUES (@admin_user_id, 'MANAGER', NEW.manager_id, 'INSERT', JSON_OBJECT('name', NEW.manager_name, 'specialization', NEW.specialization, 'club_id', NEW.current_club_id, 'is_active', NEW.is_active))`,

    `CREATE TRIGGER audit_manager_delete AFTER DELETE ON MANAGER FOR EACH ROW INSERT INTO AUDIT_LOG (user_id, table_name, record_id, action, old_values) VALUES (@admin_user_id, 'MANAGER', OLD.manager_id, 'DELETE', JSON_OBJECT('name', OLD.manager_name, 'specialization', OLD.specialization, 'club_id', OLD.current_club_id, 'is_active', OLD.is_active))`,
];

// Multi-statement triggers (require BEGIN...END) — need SUPER  
const multiStmtSql = `
CREATE TRIGGER audit_player_update AFTER UPDATE ON PLAYER FOR EACH ROW BEGIN DECLARE action_type VARCHAR(10) DEFAULT 'UPDATE'; IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN SET action_type = 'DELETE'; END IF; INSERT INTO AUDIT_LOG (user_id, table_name, record_id, action, old_values, new_values) VALUES (@admin_user_id, 'PLAYER', NEW.player_id, action_type, JSON_OBJECT('name', OLD.player_name, 'position', OLD.position, 'club_id', OLD.current_club_id, 'is_active', OLD.is_active), JSON_OBJECT('name', NEW.player_name, 'position', NEW.position, 'club_id', NEW.current_club_id, 'is_active', NEW.is_active)); END;
CREATE TRIGGER audit_manager_update AFTER UPDATE ON MANAGER FOR EACH ROW BEGIN DECLARE action_type VARCHAR(10) DEFAULT 'UPDATE'; IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN SET action_type = 'DELETE'; END IF; INSERT INTO AUDIT_LOG (user_id, table_name, record_id, action, old_values, new_values) VALUES (@admin_user_id, 'MANAGER', NEW.manager_id, action_type, JSON_OBJECT('name', OLD.manager_name, 'specialization', OLD.specialization, 'club_id', OLD.current_club_id, 'is_active', OLD.is_active), JSON_OBJECT('name', NEW.manager_name, 'specialization', NEW.specialization, 'club_id', NEW.current_club_id, 'is_active', NEW.is_active)); END;
`;

async function run() {
    try {
        console.log('🏃 Running audit trigger migration as root...');
        await rootConn.query(drops);
        console.log('✅ Old triggers dropped.');

        for (const sql of creates) {
            try {
                await rootConn.query(sql);
                console.log(`✅ Trigger created: ${sql.match(/CREATE TRIGGER (\w+)/)[1]}`);
            } catch (e) {
                console.error(`❌ Trigger failed: ${e.message.substring(0, 100)}`);
            }
        }

        try {
            await rootConn.query(multiStmtSql);
            console.log('✅ Multi-statement triggers created.');
        } catch (e) {
            console.error(`❌ Multi-statement triggers failed: ${e.message}`);
        }

        console.log('🎉 Migration complete!');
    } catch (err) {
        console.error('❌ Fatal:', err.message);
    } finally {
        await rootConn.end();
        process.exit(0);
    }
}

run();
