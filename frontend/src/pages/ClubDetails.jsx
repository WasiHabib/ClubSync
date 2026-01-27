import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

function ClubDetails({ user }) {
    const { id } = useParams();
    const [club, setClub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        club_name: '',
        city: '',
        founded_year: '',
        stadium_name: '',
        stadium_capacity: ''
    });

    const [showManagerModal, setShowManagerModal] = useState(false);
    const [managerData, setManagerData] = useState({
        manager_name: '',
        nationality: 'Bangladesh',
        specialization: 'Balanced'
    });

    useEffect(() => {
        fetchClubDetails();
    }, [id]);

    const fetchClubDetails = async () => {
        try {
            const response = await api.get(`/clubs/${id}`);
            if (response.data.success) {
                setClub(response.data.data);
                // Pre-fill form data
                setFormData({
                    club_name: response.data.data.club_name,
                    city: response.data.data.city,
                    founded_year: response.data.data.founded_year,
                    stadium_name: response.data.data.stadium_name,
                    stadium_capacity: response.data.data.stadium_capacity
                });

                if (response.data.data.manager) {
                    setManagerData({
                        manager_name: response.data.data.manager.manager_name,
                        nationality: response.data.data.manager.nationality,
                        specialization: response.data.data.manager.specialization || 'Balanced'
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching club details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put(`/clubs/${id}`, formData);
            if (response.data.success) {
                alert('Club updated successfully!');
                setShowModal(false);
                fetchClubDetails(); // Refresh data
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update club');
        }
    };

    const handleManagerUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put(`/clubs/${id}/manager`, managerData);
            if (response.data.success) {
                alert('Manager updated successfully!');
                setShowManagerModal(false);
                fetchClubDetails();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update manager');
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: '3rem var(--spacing-lg)', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
            </div>
        );
    }

    if (!club) {
        return (
            <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>
                <h1>Club not found</h1>
                <Link to="/clubs" className="btn btn-secondary">Back to Clubs</Link>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '3rem var(--spacing-lg)' }}>
            <div className="fade-in">
                {/* Header Section */}
                <div className="card" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem',
                        fontWeight: '800',
                        color: 'var(--text-muted)'
                    }}>
                        {club.club_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <h1 style={{ marginBottom: '0.5rem', fontSize: '2.5rem' }}>{club.club_name}</h1>
                            {user && user.role === 'ADMIN' && (
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                                >
                                    ✏️ Edit
                                </button>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)' }}>
                            <span>📍 {club.city}</span>
                            <span>📅 Est. {club.founded_year}</span>
                        </div>
                    </div>
                </div>

                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>Edit Club Details</h2>
                                <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
                            </div>
                            <form onSubmit={handleUpdate}>
                                <div className="form-group">
                                    <label>Club Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.club_name}
                                        onChange={(e) => setFormData({ ...formData, club_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>City</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Founded Year</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={formData.founded_year}
                                        onChange={(e) => setFormData({ ...formData, founded_year: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Stadium Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.stadium_name}
                                        onChange={(e) => setFormData({ ...formData, stadium_name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Stadium Capacity</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={formData.stadium_capacity}
                                        onChange={(e) => setFormData({ ...formData, stadium_capacity: e.target.value })}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="grid grid-2">
                    {/* Club Into */}
                    <div className="card">
                        <h2 style={{ fontSize: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>Club Information</h2>
                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Stadium</span>
                                <span style={{ fontWeight: '600' }}>{club.stadium_name || 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Capacity</span>
                                <span style={{ fontWeight: '600' }}>{club.stadium_capacity ? club.stadium_capacity.toLocaleString() : 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Head Coach</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: '600', color: 'var(--status-success)' }}>
                                        {club.manager ? club.manager.manager_name : 'Vacant'}
                                    </span>
                                    {user && user.role === 'ADMIN' && (
                                        <button
                                            onClick={() => setShowManagerModal(true)}
                                            className="btn btn-secondary"
                                            style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}
                                        >
                                            ✏️
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-primary)', marginBottom: '1rem' }}>🏆 Trophy Cabinet</h3>
                            {club.trophies && club.trophies.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {club.trophies.map(trophy => (
                                        <div key={trophy.trophy_id} style={{
                                            padding: '0.5rem 1rem',
                                            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%)',
                                            border: '1px solid rgba(255, 215, 0, 0.3)',
                                            borderRadius: 'var(--radius-md)',
                                            color: '#FFD700',
                                            fontSize: '0.9rem'
                                        }}>
                                            <strong>{trophy.season_won}</strong> {trophy.trophy_name}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No major titles yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Squad List */}
                    <div className="card">
                        <h2 style={{ fontSize: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Current Squad
                            <span className="badge badge-info">{club.players?.length || 0}</span>
                        </h2>
                        <div style={{ marginTop: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '0.5rem' }}>#</th>
                                        <th style={{ padding: '0.5rem' }}>Pos</th>
                                        <th style={{ padding: '0.5rem' }}>Player</th>
                                        <th style={{ padding: '0.5rem' }}>Nat</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {club.players && club.players.map(player => (
                                        <tr key={player.player_id}>
                                            <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{player.jersey_number}</td>
                                            <td style={{ padding: '0.5rem' }}>
                                                <span className={`position-badge position-${player.position}`} style={{ width: '24px', height: '24px', fontSize: '0.6rem' }}>
                                                    {player.position}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.5rem', fontWeight: '500' }}>
                                                <Link
                                                    to={`/players?query=${encodeURIComponent(player.player_name)}`}
                                                    style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
                                                    onMouseOver={(e) => e.target.style.color = 'var(--status-success)'}
                                                    onMouseOut={(e) => e.target.style.color = 'var(--text-primary)'}
                                                >
                                                    {player.player_name}
                                                </Link>
                                            </td>
                                            <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{player.nationality}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {(!club.players || club.players.length === 0) && (
                                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No active players.</p>
                            )}
                        </div>
                    </div>
                </div>
                {showManagerModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>{club.manager ? 'Edit Manager' : 'Appoint Manager'}</h2>
                                <button className="close-btn" onClick={() => setShowManagerModal(false)}>&times;</button>
                            </div>
                            <form onSubmit={handleManagerUpdate}>
                                <div className="form-group">
                                    <label>Manager Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={managerData.manager_name}
                                        onChange={(e) => setManagerData({ ...managerData, manager_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Nationality</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={managerData.nationality}
                                        onChange={(e) => setManagerData({ ...managerData, nationality: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Specialization</label>
                                    <select
                                        className="form-control"
                                        value={managerData.specialization}
                                        onChange={(e) => setManagerData({ ...managerData, specialization: e.target.value })}
                                    >
                                        <option value="Balanced">Balanced</option>
                                        <option value="Offensive">Offensive</option>
                                        <option value="Defensive">Defensive</option>
                                        <option value="Youth Development">Youth Development</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="button" onClick={() => setShowManagerModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ClubDetails;
