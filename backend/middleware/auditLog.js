import { db } from '../config/database.js';

// Audit logging middleware
export const auditLog = (action) => {
    return async (req, res, next) => {
        // Store original json function
        const originalJson = res.json.bind(res);

        // Override json function to log after successful response
        res.json = function (data) {
            // Only log on successful operations
            if (data.success) {
                const user_id = req.user?.user_id || null;
                const table_name = req.params.table || extractTableFromPath(req.path);
                const record_id = req.params.id || data.data?.player_id || data.data?.match_id || data.data?.club_id || 0;
                const ip_address = req.ip || req.connection.remoteAddress;
                const user_agent = req.get('user-agent') || '';

                // Determine action type
                let actionType = action;
                if (!actionType) {
                    if (req.method === 'POST') actionType = 'INSERT';
                    else if (req.method === 'PUT' || req.method === 'PATCH') actionType = 'UPDATE';
                    else if (req.method === 'DELETE') actionType = 'DELETE';
                    else actionType = 'SELECT';
                }

                // Only log modifications (INSERT, UPDATE, DELETE)
                if (['INSERT', 'UPDATE', 'DELETE'].includes(actionType)) {
                    db.query(
                        `INSERT INTO AUDIT_LOG (user_id, table_name, record_id, action, ip_address, user_agent, new_values)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [user_id, table_name, record_id, actionType, ip_address, user_agent, JSON.stringify(req.body || {})]
                    ).catch(err => console.error('Audit log error:', err));
                }
            }

            // Call original json function
            return originalJson(data);
        };

        next();
    };
};

// Helper function to extract table name from API path
function extractTableFromPath(path) {
    // /api/players/:id -> PLAYER
    // /api/clubs/:id -> CLUB
    // /api/matches/:id -> MATCH_TABLE

    if (path.includes('/players')) return 'PLAYER';
    if (path.includes('/clubs')) return 'CLUB';
    if (path.includes('/matches')) return 'MATCH_TABLE';
    if (path.includes('/events')) return 'EVENTS';

    return 'UNKNOWN';
}

export default auditLog;
