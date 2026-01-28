
import { useState, useEffect } from 'react';
import api from '../api';
import TransferPlayer from '../components/TransferPlayer';

function AdminPanel() {
    const [activeTab, setActiveTab] = useState('transfer');
    const [users, setUsers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [transferHistory, setTransferHistory] = useState([]);
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
                // Fetch transfer history for statistics
                const response = await api.get('/admin/transfer-history');
                if (response.data.success) {
                    setTransferHistory(response.data.data);
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
            await api.put(`/ admin / users / ${userId} `, { is_active: !currentStatus });
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
                <p style={{ marginBottom: '2rem' }}>System administration and management</p>

                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '2rem',
                    borderBottom: '2px solid var(--border-color)'
                }}>
                    <button
                        onClick={() => setActiveTab('transfer')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: activeTab === 'transfer' ? 'var(--accent-green)' : 'transparent',
                            color: activeTab === 'transfer' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                            border: 'none',
                            borderBottom: activeTab === 'transfer' ? '3px solid var(--accent-green)' : '3px solid transparent',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all var(--transition-base)'
                        }}
                    >
                        Transfers & Market
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
                        Statistics & History
                    </button>
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
                        System Logs
                    </button>
                </div>

                {loading && activeTab !== 'transfer' ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <div className="spinner" style={{ margin: '0 auto' }}></div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'transfer' && <TransferPlayer />}

                        {activeTab === 'stats' && (
                            <div className="card">
                                <h2 style={{ marginBottom: '1.5rem' }}>📜 Player Transfer History</h2>
                                {transferHistory.length === 0 ? (
                                    <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No transfers recorded yet.</p>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Player</th>
                                                    <th>From</th>
                                                    <th>To</th>
                                                    <th>Fee (BDT)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {transferHistory.map(transfer => (
                                                    <tr key={transfer.transfer_id}>
                                                        <td>{new Date(transfer.transfer_date).toLocaleDateString()}</td>
                                                        <td style={{ fontWeight: '600' }}>{transfer.player_name}</td>
                                                        <td style={{ color: 'var(--text-muted)' }}>{transfer.from_club_name || 'Free Agent'}</td>
                                                        <td style={{ color: 'var(--accent-green)', fontWeight: '500' }}>{transfer.to_club_name}</td>
                                                        <td style={{ fontWeight: '600' }}>
                                                            {parseFloat(transfer.transfer_fee).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

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
                                                            } `}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'} `}>
                                                            {user.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                                                    </td>
                                                    <td>
                                                        <button
                                                            onClick={() => toggleUserStatus(user.user_id, user.is_active)}
                                                            className={`btn ${user.is_active ? 'btn-danger' : 'btn-success'} `}
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
                                                            } `}>
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
                    </>
                )}
            </div>
        </div>
    );
}

export default AdminPanel;
