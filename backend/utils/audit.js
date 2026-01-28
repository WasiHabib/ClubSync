import { db } from '../config/database.js';

export const logAudit = async (userId, action, tableName, recordId, oldValues = null, newValues = null, connection = null) => {
    try {
        const query = `
            INSERT INTO AUDIT_LOG 
            (user_id, action, table_name, record_id, old_values, new_values)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const params = [
            userId || null,
            action,
            tableName,
            recordId,
            oldValues ? JSON.stringify(oldValues) : null,
            newValues ? JSON.stringify(newValues) : null
        ];

        if (connection) {
            await connection.query(query, params);
        } else {
            await db.query(query, params);
        }
    } catch (error) {
        console.error('Error logging audit:', error);
        // Don't throw error to avoid blocking main operation
    }
};
