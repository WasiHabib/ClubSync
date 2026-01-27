import { useState, useEffect } from 'react';
import api from '../api';

function Home({ user }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get('/admin/stats');
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: '3rem var(--spacing-lg)', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '3rem var(--spacing-lg)' }}>
            <div className="fade-in">
                <h1 style={{ marginBottom: '0.5rem' }}>Welcome to CLUBSYNC</h1>
                <p style={{ fontSize: '1.1rem', marginBottom: '3rem' }}>
                    Centralized football data management system for Bangladesh
                </p>

                <div className="grid grid-4" style={{ marginBottom: '3rem' }}>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: '3rem',
                            marginBottom: '0.5rem',
                            color: 'var(--status-success)',
                            fontWeight: '800',
                            fontFamily: 'var(--font-heading)'
                        }}>
                            {stats?.total_players || 0}
                        </div>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Total Players</h3>
                    </div>

                    <div className="card" style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: '3rem',
                            marginBottom: '0.5rem',
                            color: 'var(--status-success)',
                            fontWeight: '800',
                            fontFamily: 'var(--font-heading)'
                        }}>
                            {stats?.total_clubs || 0}
                        </div>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Total Clubs</h3>
                    </div>

                    <div className="card" style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: '3rem',
                            marginBottom: '0.5rem',
                            color: 'var(--status-warning)',
                            fontWeight: '800',
                            fontFamily: 'var(--font-heading)'
                        }}>
                            {stats?.total_matches || 0}
                        </div>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Total Matches</h3>
                    </div>

                    <div className="card" style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: '3rem',
                            marginBottom: '0.5rem',
                            color: 'var(--accent-primary)',
                            fontWeight: '800',
                            fontFamily: 'var(--font-heading)'
                        }}>
                            {stats?.total_events || 0}
                        </div>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Total Events</h3>
                    </div>
                </div>

                <div className="grid grid-2">
                    <div className="card">
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--bg-secondary)', paddingBottom: '1rem' }}>
                            🎯 Quick Actions
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <a href="/players" className="btn btn-primary" style={{ justifyContent: 'space-between' }}>
                                <span>Manage Players</span> <span>→</span>
                            </a>
                            <a href="/matches" className="btn btn-primary" style={{ justifyContent: 'space-between' }}>
                                <span>Manage Matches</span> <span>→</span>
                            </a>
                            <a href="/stats" className="btn btn-secondary" style={{ justifyContent: 'space-between' }}>
                                <span>View Statistics</span> <span>→</span>
                            </a>
                            {user.role === 'ADMIN' && (
                                <a href="/admin" className="btn btn-danger" style={{ justifyContent: 'space-between' }}>
                                    <span>Admin Panel</span> <span>🔐</span>
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--bg-secondary)', paddingBottom: '1rem' }}>
                            📰 System Info
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{
                                padding: '1rem',
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--bg-secondary)'
                            }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Your Role</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--status-success)' }}>
                                    {user.role}
                                </div>
                            </div>
                            <div style={{
                                padding: '1rem',
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--bg-secondary)'
                            }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Database</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>MySQL 8.0</div>
                            </div>
                            <div style={{
                                padding: '1rem',
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--bg-secondary)'
                            }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>System Status</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ display: 'block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-success)', boxShadow: '0 0 10px var(--status-success)' }}></span>
                                    Operational
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;
