import { useState, useEffect } from 'react';
import api from '../api';
import TransferPlayer from '../components/TransferPlayer';
import TransferManager from '../components/TransferManager';

function AdminPanel() {
    const [activeTab, setActiveTab] = useState('transfer');
    const [users, setUsers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [transferHistory, setTransferHistory] = useState([]);
    const [managerTransferHistory, setManagerTransferHistory] = useState([]);
    const [contracts, setContracts] = useState([]);
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
                const [transferRes, managerTransferRes] = await Promise.all([
                    api.get('/admin/transfer-history'),
                    api.get('/admin/manager-transfer-history')
                ]);
                if (transferRes.data.success) {
                    setTransferHistory(transferRes.data.data);
                }
                if (managerTransferRes.data.success) {
                    setManagerTransferHistory(managerTransferRes.data.data);
                }
            } else if (activeTab === 'contracts') {
                const response = await api.get('/admin/contracts');
                if (response.data.success) {
                    setContracts(response.data.data);
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
                <div style={{ marginBottom: '2rem' }}>
                    <h1>🔐 Admin Panel</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>System administration and management console</p>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '2rem',
                    borderBottom: '2px solid var(--border-color)',
                    overflowX: 'auto',
                    paddingBottom: '0.5rem'
                }}>
                    {['transfer', 'contracts', 'stats', 'users', 'audit'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: activeTab === tab ? 'var(--status-success)' : 'transparent',
                                color: activeTab === tab ? '#000' : 'var(--text-secondary)',
                                border: 'none',
                                borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                                cursor: 'pointer',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {tab === 'transfer' ? 'Transfers & Market' :
                                tab === 'contracts' ? 'Contracts' :
                                    tab === 'stats' ? 'Transfer History' :
                                        tab === 'users' ? 'User Management' : 'System Logs'}
                        </button>
                    ))}
                </div>

                {loading && activeTab !== 'transfer' ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <div className="spinner" style={{ margin: '0 auto' }}></div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'transfer' && (
                            <>
                                <TransferPlayer />
                                <TransferManager />
                            </>
                        )}

                        {activeTab === 'contracts' && (
                            <div className="card">
                                <h2 style={{ marginBottom: '1.5rem', color: 'var(--status-info)' }}>📝 Contract Explorer</h2>
                                {contracts.length === 0 ? (
                                    <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No contracts found.</p>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Type</th>
                                                    <th>Entity Name</th>
                                                    <th>Club</th>
                                                    <th>Start Date</th>
                                                    <th>End Date</th>
                                                    <th>Salary (per week)</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {contracts.map((contract) => (
                                                    <tr key={contract.contract_id}>
                                                        <td>
                                                            <span className={`badge ${contract.contract_type === 'PLAYER' ? 'badge-info' : 'badge-warning'}`}>
                                                                {contract.contract_type}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontWeight: '600' }}>{contract.person_name || 'Unknown'}</td>
                                                        <td style={{ color: 'var(--text-muted)' }}>{contract.club_name}</td>
                                                        <td>{new Date(contract.start_date).toLocaleDateString()}</td>
                                                        <td>{new Date(contract.end_date).toLocaleDateString()}</td>
                                                        <td style={{ fontWeight: '600' }}>
                                                            {parseFloat(contract.salary_amount).toLocaleString()} {contract.salary_currency}
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${contract.is_active ? 'badge-success' : 'badge-danger'}`}>
                                                                {contract.is_active ? 'Active' : 'Expired'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'stats' && (
                            <div className="card">
                                <h2 style={{ marginBottom: '1.5rem', color: 'var(--status-success)' }}>📜 Player Transfer History</h2>
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
                                                {transferHistory.map((transfer, i) => (
                                                    <tr key={transfer.transfer_id}>
                                                        <td>{new Date(transfer.transfer_date).toLocaleDateString()}</td>
                                                        <td style={{ fontWeight: '600' }}>{transfer.player_name}</td>
                                                        <td style={{ color: 'var(--text-muted)' }}>{transfer.from_club_name || 'Free Agent'}</td>
                                                        <td style={{ color: 'var(--status-success)', fontWeight: '500' }}>{transfer.to_club_name}</td>
                                                        <td style={{ fontWeight: '600' }}>
                                                            {parseFloat(transfer.transfer_fee).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <h2 style={{ marginBottom: '1.5rem', marginTop: '3rem', color: 'var(--status-info)' }}>👔 Manager Transfer History</h2>
                                {managerTransferHistory.length === 0 ? (
                                    <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No manager transfers recorded yet.</p>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Manager</th>
                                                    <th>From</th>
                                                    <th>To</th>
                                                    <th>Compensation (BDT)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {managerTransferHistory.map((transfer, i) => (
                                                    <tr key={transfer.transfer_id}>
                                                        <td>{new Date(transfer.transfer_date).toLocaleDateString()}</td>
                                                        <td style={{ fontWeight: '600' }}>{transfer.manager_name}</td>
                                                        <td style={{ color: 'var(--text-muted)' }}>{transfer.from_club_name || 'Free Agent'}</td>
                                                        <td style={{ color: 'var(--status-success)', fontWeight: '500' }}>{transfer.to_club_name}</td>
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
                                <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent-cool)' }}>User Management</h2>
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
                                            {users.map((user, i) => (
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
                                <h2 style={{ marginBottom: '1.5rem', color: 'var(--status-warning)' }}>
                                    🔎 System Audit Trail
                                </h2>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                    Records all Create and Delete actions across Managers, Players, and Clubs. Logs are immutable.
                                </p>
                                <div style={{ overflowX: 'auto' }}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Timestamp</th>
                                                <th>Performed By</th>
                                                <th>Action</th>
                                                <th>Entity Type</th>
                                                <th>Entity ID</th>
                                                <th>Before → After</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {auditLogs.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                                        No audit logs found.
                                                    </td>
                                                </tr>
                                            ) : auditLogs.map((log) => {
                                                let oldVals = null;
                                                let newVals = null;
                                                try { oldVals = log.old_values ? (typeof log.old_values === 'string' ? JSON.parse(log.old_values) : log.old_values) : null; } catch (e) { }
                                                try { newVals = log.new_values ? (typeof log.new_values === 'string' ? JSON.parse(log.new_values) : log.new_values) : null; } catch (e) { }

                                                const primaryName = newVals?.name || oldVals?.name || '—';

                                                return (
                                                    <tr key={log.log_id}>
                                                        <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                                                        <td style={{ fontWeight: '600' }}>{log.username || <span style={{ color: 'var(--text-muted)' }}>System</span>}</td>
                                                        <td>
                                                            <span className={`badge ${log.action === 'INSERT' ? 'badge-success' :
                                                                    log.action === 'DELETE' ? 'badge-danger' :
                                                                        'badge-warning'
                                                                }`}>
                                                                {log.action}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="badge badge-info">{log.table_name}</span>
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>#{log.record_id}</td>
                                                        <td style={{ maxWidth: '300px' }}>
                                                            {(oldVals || newVals) ? (
                                                                <div style={{ fontSize: '0.8rem', lineHeight: '1.6' }}>
                                                                    {oldVals && (
                                                                        <div style={{ color: 'var(--status-danger)', opacity: 0.85 }}>
                                                                            <strong>Before:</strong> {Object.entries(oldVals).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                                        </div>
                                                                    )}
                                                                    {newVals && (
                                                                        <div style={{ color: 'var(--status-success)', opacity: 0.9 }}>
                                                                            <strong>After:</strong> {Object.entries(newVals).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : primaryName}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
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
