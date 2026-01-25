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
                            fontSize: '2.5rem',
                            marginBottom: '1rem',
                            background: 'var(--gradient-success)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: '800'
                        }}>
                            {stats?.total_players || 0}
                        </div>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0 }}>Total Players</h3>
                    </div>

                    <div className="card" style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: '2.5rem',
                            marginBottom: '1rem',
                            background: 'var(--gradient-primary)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: '800'
                        }}>
                            {stats?.total_clubs || 0}
                        </div>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0 }}>Total Clubs</h3>
                    </div>

                    <div className="card" style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: '2.5rem',
                            marginBottom: '1rem',
                            color: 'var(--accent-orange)',
                            fontWeight: '800'
                        }}>
                            {stats?.total_matches || 0}
                        </div>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0 }}>Total Matches</h3>
                    </div>

                    <div className="card" style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: '2.5rem',
                            marginBottom: '1rem',
                            color: 'var(--accent-yellow)',
                            fontWeight: '800'
                        }}>
                            {stats?.total_events || 0}
                        </div>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0 }}>Total Events</h3>
                    </div>
                </div>

                <div className="grid grid-2">
                    <div className="card">
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🎯 Quick Actions</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <a href="/players" className="btn btn-primary">
                                👥 Manage Players
                            </a>
                            <a href="/matches" className="btn btn-primary">
                                ⚽ Manage Matches
                            </a>
                            <a href="/stats" className="btn btn-primary">
                                📊 View Statistics
                            </a>
                            {user.role === 'ADMIN' && (
                                <a href="/admin" className="btn btn-danger">
                                    🔐 Admin Panel
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>📰 System Info</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{
                                padding: '0.75rem',
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Your Role</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--accent-green)' }}>
                                    {user.role}
                                </div>
                            </div>
                            <div style={{
                                padding: '0.75rem',
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Database</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>MySQL</div>
                            </div>
                            <div style={{
                                padding: '0.75rem',
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--accent-green)' }}>
                                    ● Online
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
