import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Profile({ user }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchProfile();
    }, [user, navigate]);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/auth/me');
            if (response.data.success) {
                setProfile(response.data.data);
            }
        } catch (err) {
            setError('Failed to load profile details');
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

    if (error || !profile) {
        return (
            <div className="container" style={{ padding: '3rem var(--spacing-lg)', textAlign: 'center' }}>
                <div className="card">
                    <h2 style={{ color: 'var(--danger-color)' }}>Error</h2>
                    <p>{error || 'Profile not found'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '3rem var(--spacing-lg)', maxWidth: '800px' }}>
            <div className="fade-in">
                <h1 style={{ marginBottom: '2rem' }}>👤 My Profile</h1>

                <div className="card" style={{ padding: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '2rem' }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: 'var(--primary-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '3rem',
                            color: '#fff',
                            fontWeight: 'bold'
                        }}>
                            {profile.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{profile.username}</h2>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>{profile.email}</div>
                        </div>
                    </div>

                    <div className="grid grid-2" style={{ gap: '2rem' }}>
                        <div>
                            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Account Role</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className={`badge ${profile.role === 'ADMIN' ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: '1rem', padding: '0.4rem 0.8rem' }}>
                                    {profile.role}
                                </span>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Account Status</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className={`badge ${profile.is_active ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '1rem', padding: '0.4rem 0.8rem' }}>
                                    {profile.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Joined Date</h3>
                            <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                                {new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                        </div>

                        <div>
                            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Last Login</h3>
                            <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                                {profile.last_login ? new Date(profile.last_login).toLocaleString() : 'First Login'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
