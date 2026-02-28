import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

function PlayerDetails({ user }) {
    const { id } = useParams();
    const [player, setPlayer] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [clubs, setClubs] = useState([]);

    const [formData, setFormData] = useState({
        player_name: '',
        position: '',
        current_club_id: '',
        attributes: {}
    });

    useEffect(() => {
        fetchData();
        fetchClubs();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [playerRes, statsRes] = await Promise.all([
                api.get(`/players/${id}`),
                api.get(`/analytics/player-stats/${id}`).catch(() => ({ data: { data: null } }))
            ]);

            if (playerRes.data.success) {
                const playerData = playerRes.data.data;
                setPlayer(playerData);
                setFormData({
                    player_name: playerData.player_name,
                    position: playerData.position,
                    current_club_id: playerData.current_club_id || '',
                    attributes: playerData.attributes || {}
                });
            }
            if (statsRes.data?.data) {
                setAnalytics(statsRes.data.data);
            }
        } catch (error) {
            console.error('Error fetching player details:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClubs = async () => {
        try {
            const res = await api.get('/clubs');
            if (res.data.success) setClubs(res.data.data);
        } catch (error) { }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put(`/players/${id}`, formData);
            if (res.data.success) {
                alert('Player updated successfully');
                setShowEditModal(false);
                fetchData();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update player');
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
            </div>
        );
    }

    if (!player) {
        return (
            <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>
                <h2>Player not found</h2>
                <Link to="/players" className="btn btn-primary">Back to Players</Link>
            </div>
        );
    }

    const { attributes } = player;

    return (
        <div className="container" style={{ padding: '3rem var(--spacing-lg)' }}>
            <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Link to="/players" className="btn btn-secondary">← Back</Link>
                        <h1 style={{ margin: 0 }}>{player.player_name}</h1>
                        <span className={`position-badge position-${player.position}`}>{player.position}</span>
                    </div>
                    {user && user.role === 'ADMIN' && (
                        <button className="btn btn-primary" onClick={() => setShowEditModal(true)}>
                            Edit Player
                        </button>
                    )}
                </div>

                <div className="grid grid-2" style={{ gap: '2rem' }}>
                    {/* Basic Info Card */}
                    <div className="card">
                        <h2>Personal Information</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Current Club</p>
                                <p style={{ fontWeight: '600' }}>
                                    {player.club_name ? (
                                        <Link to={`/clubs/${player.current_club_id}`} style={{ color: 'var(--primary-color)' }}>
                                            {player.club_name}
                                        </Link>
                                    ) : 'Free Agent'}
                                </p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Nationality</p>
                                <p style={{ fontWeight: '600' }}>{player.nationality}</p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Date of Birth</p>
                                <p style={{ fontWeight: '600' }}>{new Date(player.date_of_birth).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Jersey Number</p>
                                <p style={{ fontWeight: '600' }}>{player.jersey_number || 'N/A'}</p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Preferred Foot</p>
                                <p style={{ fontWeight: '600' }}>{player.preferred_foot}</p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Height / Weight</p>
                                <p style={{ fontWeight: '600' }}>{player.height_cm} cm / {player.weight_kg} kg</p>
                            </div>
                        </div>
                    </div>

                    {/* Attributes Card */}
                    <div className="card">
                        <h2>Physical Attributes</h2>
                        {attributes ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                {Object.entries(attributes).map(([key, value]) => (
                                    <div key={key}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                                            <span>{key}</span>
                                            <span style={{ fontWeight: '600' }}>{value} / 99</span>
                                        </div>
                                        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${(value / 99) * 100}%`,
                                                height: '100%',
                                                backgroundColor: value > 80 ? 'var(--success-color)' : value > 60 ? 'var(--primary-color)' : 'var(--danger-color)'
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>No attribute data available.</p>
                        )}
                    </div>

                    {/* Analytics Card */}
                    <div className="card">
                        <h2>Career Statistics</h2>
                        {analytics ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
                                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>Matches</h3>
                                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{analytics.matches_played}</p>
                                </div>
                                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>Goals</h3>
                                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{analytics.goals}</p>
                                </div>
                                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>Assists</h3>
                                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{analytics.assists}</p>
                                </div>
                                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>Yellows</h3>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#f59e0b' }}>{analytics.yellow_cards}</p>
                                </div>
                                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>Reds</h3>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: 'var(--danger-color)' }}>{analytics.red_cards}</p>
                                </div>
                            </div>
                        ) : (
                            <p>No analytical data recorded yet.</p>
                        )}
                    </div>

                    {/* Contracts Card */}
                    <div className="card">
                        <h2>Contract History</h2>
                        {player.contracts && player.contracts.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Club</th>
                                            <th>From</th>
                                            <th>To</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {player.contracts.map(c => (
                                            <tr key={c.contract_id}>
                                                <td>{c.club_name}</td>
                                                <td>{new Date(c.start_date).toLocaleDateString()}</td>
                                                <td>{new Date(c.end_date).toLocaleDateString()}</td>
                                                <td>
                                                    <span className={`status-badge ${c.is_active ? 'status-active' : 'status-inactive'}`}>
                                                        {c.is_active ? 'Active' : 'Expired'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p>No contract history found.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 style={{ margin: 0 }}>Edit Player</h2>
                            <button onClick={() => setShowEditModal(false)} className="btn btn-secondary" style={{ padding: '0.5rem' }}>✕</button>
                        </div>
                        <form onSubmit={handleUpdate}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Player Name *</label>
                                    <input
                                        type="text"
                                        value={formData.player_name}
                                        onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Position *</label>
                                    <select
                                        value={formData.position}
                                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    >
                                        <option value="GK">Goalkeeper (GK)</option>
                                        <option value="CB">Center Back (CB)</option>
                                        <option value="LB">Left Back (LB)</option>
                                        <option value="RB">Right Back (RB)</option>
                                        <option value="CDM">Defensive Mid (CDM)</option>
                                        <option value="CM">Central Mid (CM)</option>
                                        <option value="CAM">Attacking Mid (CAM)</option>
                                        <option value="LW">Left Wing (LW)</option>
                                        <option value="RW">Right Wing (RW)</option>
                                        <option value="ST">Striker (ST)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Current Club</label>
                                    <select
                                        value={formData.current_club_id || ''}
                                        onChange={(e) => setFormData({ ...formData, current_club_id: e.target.value })}
                                    >
                                        <option value="">Free Agent</option>
                                        {clubs.map(c => (
                                            <option key={c.club_id} value={c.club_id}>{c.club_name}</option>
                                        ))}
                                    </select>
                                    <small style={{ color: 'var(--text-secondary)' }}>Note: For transfers, use the Transfer tool in the players list.</small>
                                </div>

                                <h4>Attributes</h4>
                                <div className="grid grid-2">
                                    {['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'].map(attr => (
                                        <div className="form-group" key={attr}>
                                            <label style={{ textTransform: 'capitalize' }}>{attr}</label>
                                            <input
                                                type="number"
                                                min="1" max="99"
                                                value={formData.attributes[attr] || 0}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    attributes: {
                                                        ...formData.attributes,
                                                        [attr]: parseInt(e.target.value) || 0
                                                    }
                                                })}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-success">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PlayerDetails;
