import express from 'express';
import { db } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('ADMIN'));

// GET /api/admin/users - Get all users
router.get('/users', async (req, res) => {
    try {
        const [users] = await db.query(`
      SELECT 
        user_id,
        username,
        email,
        full_name,
        role,
        is_active,
        last_login,
        created_at
      FROM APP_USER
      ORDER BY created_at DESC
    `);

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

// PUT /api/admin/users/:id - Update user
router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { role, is_active } = req.body;

        const updates = [];
        const values = [];

        if (role) {
            updates.push('role = ?');
            values.push(role);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(is_active);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        values.push(id);

        const [result] = await db.query(
            `UPDATE APP_USER SET ${updates.join(', ')} WHERE user_id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            message: 'User updated successfully'
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'Failed to update user' });
    }
});

// GET /api/admin/audit-logs - Get audit logs
router.get('/audit-logs', async (req, res) => {
    try {
        const { user_id, table_name, action, limit = 100, offset = 0 } = req.query;

        let query = `
      SELECT 
        a.*,
        u.username,
        u.email
      FROM AUDIT_LOG a
      LEFT JOIN APP_USER u ON a.user_id = u.user_id
      WHERE 1=1
    `;
        const params = [];

        if (user_id) {
            query += ' AND a.user_id = ?';
            params.push(user_id);
        }
        if (table_name) {
            query += ' AND a.table_name = ?';
            params.push(table_name);
        }
        if (action) {
            query += ' AND a.action = ?';
            params.push(action);
        }

        query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [logs] = await db.query(query, params);

        // Parse JSON fields
        const logsWithParsedJson = logs.map(log => ({
            ...log,
            old_values: log.old_values ? JSON.parse(log.old_values) : null,
            new_values: log.new_values ? JSON.parse(log.new_values) : null
        }));

        res.json({
            success: true,
            count: logs.length,
            data: logsWithParsedJson
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
    }
});

// GET /api/admin/contracts - Get all contracts with history
router.get('/contracts', async (req, res) => {
    try {
        const { is_active, contract_type } = req.query;

        let query = `
      SELECT 
        con.*,
        CASE 
          WHEN con.contract_type = 'PLAYER' THEN p.player_name
          WHEN con.contract_type = 'MANAGER' THEN m.manager_name
        END AS person_name,
        c.club_name,
        DATEDIFF(con.end_date, CURDATE()) AS days_remaining
      FROM CONTRACTS con
      LEFT JOIN PLAYER p ON con.player_id = p.player_id
      LEFT JOIN MANAGER m ON con.manager_id = m.manager_id
      JOIN CLUB c ON con.club_id = c.club_id
      WHERE 1=1
    `;
        const params = [];

        if (is_active !== undefined) {
            query += ' AND con.is_active = ?';
            params.push(is_active === 'true' ? 1 : 0);
        }
        if (contract_type) {
            query += ' AND con.contract_type = ?';
            params.push(contract_type);
        }

        query += ' ORDER BY con.created_at DESC';

        const [contracts] = await db.query(query, params);

        res.json({
            success: true,
            count: contracts.length,
            data: contracts
        });
    } catch (error) {
        console.error('Error fetching contracts:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch contracts' });
    }
});

// GET /api/admin/manager-history - Get manager history
router.get('/manager-history', async (req, res) => {
    try {
        const [history] = await db.query(`
      SELECT 
        m.manager_id,
        m.manager_name,
        m.nationality,
        m.specialization,
        c.club_name as current_club,
        COUNT(con.contract_id) as total_contracts
      FROM MANAGER m
      LEFT JOIN CLUB c ON m.current_club_id = c.club_id
      LEFT JOIN CONTRACTS con ON m.manager_id = con.manager_id
      GROUP BY m.manager_id
      ORDER BY m.manager_name
    `);

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('Error fetching manager history:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch manager history' });
    }
});

// GET /api/admin/stats - Get system statistics
router.get('/stats', async (req, res) => {
    try {
        const [playerCount] = await db.query('SELECT COUNT(*) as count FROM PLAYER WHERE is_active = TRUE');
        const [clubCount] = await db.query('SELECT COUNT(*) as count FROM CLUB');
        const [matchCount] = await db.query('SELECT COUNT(*) as count FROM MATCH_TABLE');
        const [userCount] = await db.query('SELECT COUNT(*) as count FROM APP_USER WHERE is_active = TRUE');
        const [eventCount] = await db.query('SELECT COUNT(*) as count FROM EVENTS');

        res.json({
            success: true,
            data: {
                total_players: playerCount[0].count,
                total_clubs: clubCount[0].count,
                total_matches: matchCount[0].count,
                total_users: userCount[0].count,
                total_events: eventCount[0].count
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
});

export default router;
