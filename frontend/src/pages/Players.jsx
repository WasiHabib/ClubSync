import { useState, useEffect } from 'react';
import api from '../api';

function Players({ user }) {
    const [players, setPlayers] = useState([]);
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        player_name: '',
        date_of_birth: '',
        nationality: 'Bangladesh',
        position: 'ST',
        height_cm: '',
        weight_kg: '',
        jersey_number: '',
        current_club_id: '',
        preferred_foot: 'Right',
        attributes: {
            pace: 70,
            shooting: 70,
            passing: 70,
            dribbling: 70,
            defending: 70,
            physical: 70
        }
    });

    useEffect(() => {
        fetchPlayers();
        fetchClubs();
    }, []);

    const fetchPlayers = async () => {
        try {
            const response = await api.get('/players');
            if (response.data.success) {
                setPlayers(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching players:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClubs = async () => {
        try {
            const response = await api.get('/clubs');
            if (response.data.success) {
                setClubs(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching clubs:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/players', formData);
            if (response.data.success) alert('Player added successfully!');
            setShowModal(false);
            fetchPlayers();
            resetForm();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to add player');
        }
    };

    const handleDelete = async (playerId) => {
        if (!confirm('Are you sure you want to delete this player?')) return;

        try {
            await api.delete(`/players/${playerId}`);
            alert('Player deleted successfully!');
            fetchPlayers();
        } catch (error) {
            alert('Failed to delete player');
        }
    };

    const resetForm = () => {
        setFormData({
            player_name: '',
            date_of_birth: '',
            nationality: 'Bangladesh',
            position: 'ST',
            height_cm: '',
            weight_kg: '',
            jersey_number: '',
            current_club_id: '',
            preferred_foot: 'Right',
            attributes: {
                pace: 70,
                shooting: 70,
                passing: 70,
                dribbling: 70,
                defending: 70,
                physical: 70
            }
        });
    };

    const filteredPlayers = players.filter(player => {
        const query = searchQuery.toLowerCase();
        return (
            (player.player_name && player.player_name.toLowerCase().includes(query)) ||
            (player.club_name && player.club_name.toLowerCase().includes(query)) ||
            (player.nationality && player.nationality.toLowerCase().includes(query))
        );
    });

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1>Player Management</h1>
                        <p style={{ margin: 0 }}>Manage player profiles, contracts, and statistics</p>
                    </div>
                    {user && user.role === 'ADMIN' && (
                        <button onClick={() => setShowModal(true)} className="btn btn-success">
                            + Add Player
                        </button>
                    )}
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <input
                        type="text"
                        placeholder="🔍 Search players by name or club..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ maxWidth: '400px' }}
                    />
                </div>

                {filteredPlayers.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <p style={{ fontSize: '1.2rem' }}>No players found</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Player</th>
                                    <th>Position</th>
                                    <th>Club</th>
                                    <th>Nationality</th>
                                    <th>Jersey</th>
                                    <th>DOB</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPlayers.map(player => (
                                    <tr key={player.player_id}>
                                        <td>
                                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                                {player.player_name}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`position-badge position-${player.position}`}>
                                                {player.position}
                                            </span>
                                        </td>
                                        <td>{player.club_name || 'Free Agent'}</td>
                                        <td>{player.nationality}</td>
                                        <td>{player.jersey_number || '-'}</td>
                                        <td>{new Date(player.date_of_birth).toLocaleDateString()}</td>
                                        <td>
                                            {user && user.role === 'ADMIN' && (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => handleDelete(player.player_id)}
                                                        className="btn btn-danger"
                                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 style={{ margin: 0 }}>Add New Player</h2>
                            <button onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="grid grid-2">
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
                                        <label>Date of Birth *</label>
                                        <input
                                            type="date"
                                            value={formData.date_of_birth}
                                            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
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
                                        <label>Nationality *</label>
                                        <input
                                            type="text"
                                            value={formData.nationality}
                                            onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Club</label>
                                        <select
                                            value={formData.current_club_id}
                                            onChange={(e) => setFormData({ ...formData, current_club_id: e.target.value })}
                                        >
                                            <option value="">Free Agent</option>
                                            {clubs.map(club => (
                                                <option key={club.club_id} value={club.club_id}>
                                                    {club.club_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Jersey Number</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="99"
                                            value={formData.jersey_number}
                                            onChange={(e) => setFormData({ ...formData, jersey_number: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Height (cm)</label>
                                        <input
                                            type="number"
                                            value={formData.height_cm}
                                            onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Weight (kg)</label>
                                        <input
                                            type="number"
                                            value={formData.weight_kg}
                                            onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-success">
                                    Add Player
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Players;
