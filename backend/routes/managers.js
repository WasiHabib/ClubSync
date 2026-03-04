import express from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../config/database.js';

const router = express.Router();

// GET /api/managers - List all active managers
router.get('/', async (req, res) => {
    try {
        const [managers] = await db.query(`
            SELECT 
                m.manager_id, m.manager_name, m.date_of_birth, m.nationality, 
                m.specialization, m.licenses, m.is_active,
                c.club_id, c.club_name,
                con.contract_id, con.start_date, con.end_date, con.salary_amount
            FROM MANAGER m
            LEFT JOIN CLUB c ON m.current_club_id = c.club_id
            LEFT JOIN CONTRACTS con ON con.manager_id = m.manager_id AND con.is_active = TRUE
            WHERE m.is_active = TRUE
            ORDER BY m.manager_name ASC
        `);
        res.json({ success: true, count: managers.length, data: managers });
    } catch (error) {
        console.error('Error fetching managers:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch managers' });
    }
});

// POST /api/managers - Create a new manager
router.post('/', [
    body('manager_name').notEmpty().withMessage('Manager name is required'),
    body('date_of_birth').isDate().withMessage('Valid date of birth is required'),
    body('nationality').notEmpty().withMessage('Nationality is required'),
    body('specialization').optional().isIn(['Defensive', 'Offensive', 'Balanced', 'Youth Development']),
    body('licenses').optional().isString(),
    body('club_id').optional({ checkFalsy: true }).isInt()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { manager_name, date_of_birth, nationality, specialization, licenses, club_id } = req.body;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Unassign the existing manager of the club if adding directly to a club
            if (club_id) {
                await connection.query(
                    'UPDATE CONTRACTS SET end_date = CURDATE(), is_active = FALSE WHERE contract_type = "MANAGER" AND club_id = ? AND is_active = TRUE',
                    [club_id]
                );
                await connection.query(
                    'UPDATE MANAGER SET current_club_id = NULL WHERE current_club_id = ?',
                    [club_id]
                );
            }

            const [result] = await connection.query(
                `INSERT INTO MANAGER (manager_name, date_of_birth, nationality, specialization, licenses, current_club_id) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [manager_name, date_of_birth, nationality, specialization || 'Balanced', licenses || null, club_id || null]
            );

            const newManagerId = result.insertId;

            if (club_id) {
                await connection.query(
                    `INSERT INTO CONTRACTS (club_id, manager_id, contract_type, start_date, is_active, salary_amount) 
                     VALUES (?, ?, 'MANAGER', CURDATE(), TRUE, 50000)`,
                    [club_id, newManagerId]
                );
            }

            await connection.commit();
            res.status(201).json({ success: true, message: 'Manager created successfully', data: { manager_id: newManagerId } });
        } catch (txnError) {
            await connection.rollback();
            throw txnError;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error creating manager:', error);
        res.status(500).json({ success: false, message: 'Failed to create manager' });
    }
});

// POST /api/managers/:id/transfer - Transfer a manager to a new club
router.post('/:id/transfer', [
    body('to_club_id').notEmpty().isInt(),
    body('transfer_fee').optional().isNumeric(),
    body('new_contract').isObject(),
    body('new_contract.start_date').notEmpty().isDate(),
    body('new_contract.end_date').notEmpty().isDate(),
    body('new_contract.salary_amount').notEmpty().isNumeric()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const managerId = req.params.id;
        const { to_club_id, transfer_fee, new_contract } = req.body;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Verify manager exists
            const [managers] = await connection.query('SELECT * FROM MANAGER WHERE manager_id = ?', [managerId]);
            if (managers.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({ success: false, message: 'Manager not found' });
            }
            const manager = managers[0];
            const fromClubId = manager.current_club_id;

            if (fromClubId === parseInt(to_club_id)) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ success: false, message: 'Manager is already at this club' });
            }

            // Fire target club's existing manager
            await connection.query(
                'UPDATE CONTRACTS SET end_date = CURDATE(), is_active = FALSE WHERE contract_type = "MANAGER" AND club_id = ? AND is_active = TRUE',
                [to_club_id]
            );
            await connection.query(
                'UPDATE MANAGER SET current_club_id = NULL WHERE current_club_id = ?',
                [to_club_id]
            );

            // Terminate transferring manager's old contract
            let oldContractId = null;
            if (fromClubId) {
                const [oldContracts] = await connection.query(
                    'SELECT contract_id FROM CONTRACTS WHERE manager_id = ? AND is_active = TRUE',
                    [managerId]
                );
                if (oldContracts.length > 0) {
                    oldContractId = oldContracts[0].contract_id;
                    await connection.query(
                        'UPDATE CONTRACTS SET end_date = CURDATE(), is_active = FALSE WHERE contract_id = ?',
                        [oldContractId]
                    );
                }
            }

            // Update manager's club association
            await connection.query(
                'UPDATE MANAGER SET current_club_id = ? WHERE manager_id = ?',
                [to_club_id, managerId]
            );

            // Insert new contract
            const [newContractResult] = await connection.query(
                `INSERT INTO CONTRACTS (club_id, manager_id, contract_type, start_date, end_date, salary_amount, is_active) 
                 VALUES (?, ?, 'MANAGER', ?, ?, ?, TRUE)`,
                [to_club_id, managerId, new_contract.start_date, new_contract.end_date, new_contract.salary_amount]
            );

            // Log transfer to MANAGER_TRANSFER_HISTORY
            await connection.query(
                `INSERT INTO MANAGER_TRANSFER_HISTORY (manager_id, from_club_id, to_club_id, transfer_fee, transfer_date, contract_id) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [managerId, fromClubId || null, to_club_id, transfer_fee || 0, new_contract.start_date, newContractResult.insertId]
            );

            await connection.commit();
            res.json({ success: true, message: 'Manager transferred successfully' });
        } catch (txnError) {
            await connection.rollback();
            throw txnError;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Manager transfer error:', error);
        res.status(500).json({ success: false, message: 'Manager transfer failed' });
    }
});

export default router;
