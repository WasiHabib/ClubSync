import { db } from './config/database.js';

async function runMigration() {
    try {
        console.log('🏃 Running migration for TRANSFER_HISTORY table...');

        const createTableSql = `
            CREATE TABLE IF NOT EXISTS TRANSFER_HISTORY (
                transfer_id INT PRIMARY KEY AUTO_INCREMENT,
                player_id INT NOT NULL,
                from_club_id INT,
                to_club_id INT NOT NULL,
                transfer_fee DECIMAL(15, 2) DEFAULT 0,
                transfer_date DATE NOT NULL,
                contract_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (player_id) REFERENCES PLAYER(player_id),
                FOREIGN KEY (from_club_id) REFERENCES CLUB(club_id) ON DELETE SET NULL,
                FOREIGN KEY (to_club_id) REFERENCES CLUB(club_id) ON DELETE CASCADE,
                FOREIGN KEY (contract_id) REFERENCES CONTRACTS(contract_id) ON DELETE SET NULL
            ) ENGINE=InnoDB;
        `;

        await db.query(createTableSql);
        console.log('✅ Table TRANSFER_HISTORY created successfully.');

        try {
            await db.query('CREATE INDEX idx_transfer_date ON TRANSFER_HISTORY(transfer_date);');
            console.log('✅ Index idx_transfer_date created successfully.');
        } catch (idxError) {
            // Depending on MySQL version, CREATE INDEX IF NOT EXISTS might fail
            if (idxError.code === 'ER_DUP_KEYNAME') {
                console.log('ℹ Status: Index idx_transfer_date already exists.');
            } else {
                console.error('❌ Warning: Index creation failed:', idxError.message);
            }
        }

        console.log('🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        process.exit(0);
    }
}

runMigration();
