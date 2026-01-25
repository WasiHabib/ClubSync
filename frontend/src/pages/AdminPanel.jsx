import { useState, useEffect } from 'react';
import api from '../api';

function AdminPanel() {
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'users') {
                const response = await api.get('/admin/users');
                if (response.data.success) {
                    setUsers(response.data.data);
                }
            } else if (activeTab === 'audit') {
                const response = await api.get('/admin/audit-logs?limit=50');
                if (response.data.success) {
                    setAuditLogs(response.data.data);
                }
            } else if (activeTab === 'stats') {
                const response = await api.get('/admin/stats');
                if (response.data.success) {
                    setStats(response.data.data);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            await api.put(`/admin/users/${userId}`, { is_active: !currentStatus });
            alert('User status updated!');
            fetchData();
        } catch (error) {
            alert('Failed to update user status');
        }
    };

    return (
        <div className="container" style={{ padding: '3rem var(--spacing-lg)' }}>
            <div className="fade-in">
                <h1>🔐 Admin Panel</h1>
                <p style={{ marginBottom: '2rem' }}>System administration and monitoring</p>

                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '2rem',
                    borderBottom: '2px solid var(--border-color)'
                }}>
                    <button
                        onClick={() => setActiveTab('users')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: activeTab === 'users' ? 'var(--accent-green)' : 'transparent',
                            color: activeTab === 'users' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                            border: 'none',
                            borderBottom: activeTab === 'users' ? '3px solid var(--accent-green)' : '3px solid transparent',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all var(--transition-base)'
                        }}
                    >
                        Users
                    </button>
                    <button
                        onClick={() => setActiveTab('audit')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: activeTab === 'audit' ? 'var(--accent-green)' : 'transparent',
                            color: activeTab === 'audit' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                            border: 'none',
                            borderBottom: activeTab === 'audit' ? '3px solid var(--accent-green)' : '3px solid transparent',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all var(--transition-base)'
                        }}
                    >
                        Audit Logs
                    </button>
                    <button
                        onClick={() => setActiveTab('stats')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: activeTab === 'stats' ? 'var(--accent-green)' : 'transparent',
                            color: activeTab === 'stats' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                            border: 'none',
                            borderBottom: activeTab === 'stats' ? '3px solid var(--accent-green)' : '3px solid transparent',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all var(--transition-base)'
                        }}
                    >
                        Statistics
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <div className="spinner" style={{ margin: '0 auto' }}></div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'users' && (
                            <div className="card">
                                <h2 style={{ marginBottom: '1.5rem' }}>User Management</h2>
                                <div style={{ overflowX: 'auto' }}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Username</th>
                                                <th>Email</th>
                                                <th>Role</th>
                                                <th>Status</th>
                                                <th>Last Login</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(user => (
                                                <tr key={user.user_id}>
                                                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                                        {user.username}
                                                    </td>
                                                    <td>{user.email}</td>
                                                    <td>
                                                        <span className={`badge ${user.role === 'ADMIN' ? 'badge-danger' :
                                                                user.role === 'EDITOR' ? 'badge-warning' :
                                                                    'badge-info'
                                                            }`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                                                            {user.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                                                    </td>
                                                    <td>
                                                        <button
                                                            onClick={() => toggleUserStatus(user.user_id, user.is_active)}
                                                            className={`btn ${user.is_active ? 'btn-danger' : 'btn-success'}`}
                                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                                        >
                                                            {user.is_active ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'audit' && (
                            <div className="card">
                                <h2 style={{ marginBottom: '1.5rem' }}>Audit Trail</h2>
                                <div style={{ overflowX: 'auto' }}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Time</th>
                                                <th>User</th>
                                                <th>Action</th>
                                                <th>Table</th>
                                                <th>Record ID</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {auditLogs.map(log => (
                                                <tr key={log.log_id}>
                                                    <td>{new Date(log.created_at).toLocaleString()}</td>
                                                    <td>{log.username || 'System'}</td>
                                                    <td>
                                                        <span className={`badge ${log.action === 'INSERT' ? 'badge-success' :
                                                                log.action === 'UPDATE' ? 'badge-warning' :
                                                                    'badge-danger'
                                                            }`}>
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td>{log.table_name}</td>
                                                    <td>{log.record_id}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'stats' && stats && (
                            <div className="grid grid-3">
                                <div className="card" style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--accent-green)', marginBottom: '0.5rem' }}>
                                        {stats.total_players}
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Total Players</h3>
                                </div>
                                <div className="card" style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>
                                        {stats.total_clubs}
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Total Clubs</h3>
                                </div>
                                <div className="card" style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--accent-orange)', marginBottom: '0.5rem' }}>
                                        {stats.total_matches}
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Total Matches</h3>
                                </div>
                                <div className="card" style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--accent-yellow)', marginBottom: '0.5rem' }}>
                                        {stats.total_events}
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Total Events</h3>
                                </div>
                                <div className="card" style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>
                                        {stats.total_users}
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Total Users</h3>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default AdminPanel;
