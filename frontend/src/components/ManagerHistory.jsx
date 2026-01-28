import { useState, useEffect } from 'react';
import api from '../api';

function ManagerHistory({ clubId }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchManagerHistory();
    }, [clubId]);

    const fetchManagerHistory = async () => {
        try {
            const response = await api.get(`/clubs/${clubId}/manager-history`);
            if (response.data.success) {
                setHistory(response.data.data.manager_history);
            }
        } catch (error) {
            console.error('Error fetching manager history:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>;
    }

    if (history.length === 0) {
        return <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No manager history available.</p>;
    }

    return (
        <div style={{ marginTop: '1rem' }}>
            {history.map((manager, index) => (
                <div key={manager.contract_id} style={{
                    padding: '1rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                    borderLeft: manager.contract_active ? '4px solid var(--status-success)' : '4px solid var(--glass-border)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: manager.contract_active ? 'var(--status-success)' : 'var(--text-primary)' }}>
                                {manager.manager_name}
                                {manager.contract_active && <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }} className="badge badge-success">Current</span>}
                            </h3>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <div>🌍 {manager.nationality}</div>
                                <div>🎯 {manager.specialization}</div>
                                <div>📅 {new Date(manager.start_date).toLocaleDateString()} - {manager.end_date ? new Date(manager.end_date).toLocaleDateString() : 'Present'}</div>
                                <div>⏱️ Tenure: {Math.floor(manager.tenure_days / 365)} years, {Math.floor((manager.tenure_days % 365) / 30)} months</div>
                            </div>
                        </div>
                        {manager.salary_amount && (
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Salary</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--status-success)' }}>
                                    {manager.salary_currency} {manager.salary_amount.toLocaleString()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default ManagerHistory;
