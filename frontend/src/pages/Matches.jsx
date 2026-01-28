import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function Matches({ user }) {
    const [matches, setMatches] = useState([]);
    const [seasons, setSeasons] = useState([]);
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [formData, setFormData] = useState({
        season_id: '',
        home_club_id: '',
        away_club_id: '',
        match_date: '',
        venue: ''
    });
    const [eventData, setEventData] = useState({
        event_type: 'GOAL',
        player_id: '',
        club_id: '',
        minute: '',
        extra_time: 0
    });
    const [matchPlayers, setMatchPlayers] = useState([]);

    useEffect(() => {
        fetchMatches();
        fetchSeasons();
        fetchClubs();
    }, []);

    const fetchMatches = async () => {
        try {
            const response = await api.get('/matches');
            if (response.data.success) {
                setMatches(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching matches:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSeasons = async () => {
        try {
            const response = await api.get('/matches/seasons/all');
            if (response.data.success) {
                setSeasons(response.data.data);
                if (response.data.data.length > 0) {
                    setFormData(prev => ({ ...prev, season_id: response.data.data[0].season_id }));
                }
            }
        } catch (error) {
            console.error('Error fetching seasons:', error);
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

    const fetchMatchPlayers = async (homeClubId, awayClubId) => {
        try {
            const [homeRes, awayRes] = await Promise.all([
                api.get(`/players?club_id=${homeClubId}&limit=100`),
                api.get(`/players?club_id=${awayClubId}&limit=100`)
            ]);

            let players = [];
            if (homeRes.data.success) players = [...players, ...homeRes.data.data];
            if (awayRes.data.success) players = [...players, ...awayRes.data.data];

            setMatchPlayers(players);
        } catch (error) {
            console.error('Error fetching match players:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/matches', formData);
            if (response.data.success) {
                alert('Match created successfully!');
                setShowModal(false);
                fetchMatches();
                resetForm();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to create match');
        }
    };

    const handleLogEvent = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/events', {
                ...eventData,
                match_id: selectedMatch.match_id
            });
            if (response.data.success) {
                alert(`Event logged: ${response.data.data.description}`);
                setShowEventModal(false);
                fetchMatches();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to log event');
        }
    };

    const resetForm = () => {
        setFormData({
            season_id: seasons[0]?.season_id || '',
            home_club_id: '',
            away_club_id: '',
            match_date: '',
            venue: ''
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            SCHEDULED: 'badge-info',
            LIVE: 'badge-success',
            COMPLETED: 'badge-secondary',
            POSTPONED: 'badge-warning',
            CANCELLED: 'badge-danger'
        };
        return badges[status] || 'badge-info';
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1>Match Management</h1>
                        <p style={{ margin: 0 }}>Schedule matches and log match events</p>
                    </div>
                    {user && user.role === 'ADMIN' && (
                        <button onClick={() => setShowModal(true)} className="btn btn-success">
                            + Create Match
                        </button>
                    )}
                </div>

                {matches.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <p style={{ fontSize: '1.2rem' }}>No matches scheduled</p>
                    </div>
                ) : (
                    <div className="grid" style={{ gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                        {matches.map(match => (
                            <Link
                                to={`/matches/${match.match_id}`}
                                key={match.match_id}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s', height: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div>
                                            <span className={`badge ${getStatusBadge(match.match_status)}`}>
                                                {match.match_status}
                                            </span>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                                {new Date(match.match_date).toLocaleString()}
                                            </div>
                                        </div>
                                        {user && user.role === 'ADMIN' && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setSelectedMatch(match);
                                                    fetchMatchPlayers(match.home_club_id, match.away_club_id);
                                                    setShowEventModal(true);
                                                    setEventData({
                                                        event_type: 'GOAL',
                                                        player_id: '',
                                                        club_id: match.home_club_id,
                                                        minute: '',
                                                        extra_time: 0
                                                    });
                                                }}
                                                className="btn btn-primary"
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                            >
                                                Log Event
                                            </button>
                                        )}
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        padding: '1.5rem 0',
                                        gap: '1rem'
                                    }}>
                                        <div style={{ flex: 1, textAlign: 'right' }}>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                                {match.home_club_name}
                                            </div>
                                        </div>

                                        <div style={{ padding: '0 0.5rem', textAlign: 'center' }}>
                                            <div style={{
                                                fontSize: '1.5rem',
                                                fontWeight: '800',
                                                color: 'var(--status-success)',
                                                whiteSpace: 'nowrap',
                                                minWidth: '60px'
                                            }}>
                                                {match.home_score} - {match.away_score}
                                            </div>
                                        </div>

                                        <div style={{ flex: 1, textAlign: 'left' }}>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                                {match.away_club_name}
                                            </div>
                                        </div>
                                    </div>

                                    {match.venue && (
                                        <div style={{
                                            fontSize: '0.9rem',
                                            color: 'var(--text-secondary)',
                                            textAlign: 'center',
                                            borderTop: '1px solid var(--border-color)',
                                            paddingTop: '1rem'
                                        }}>
                                            📍 {match.venue}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Match Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create New Match</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Season *</label>
                                <select
                                    value={formData.season_id}
                                    onChange={(e) => setFormData({ ...formData, season_id: e.target.value })}
                                    required
                                >
                                    {seasons.map(season => (
                                        <option key={season.season_id} value={season.season_id}>
                                            {season.season_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label>Home Club *</label>
                                    <select
                                        value={formData.home_club_id}
                                        onChange={(e) => setFormData({ ...formData, home_club_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Club</option>
                                        {clubs.map(club => (
                                            <option key={club.club_id} value={club.club_id}>
                                                {club.club_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Away Club *</label>
                                    <select
                                        value={formData.away_club_id}
                                        onChange={(e) => setFormData({ ...formData, away_club_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Club</option>
                                        {clubs.map(club => (
                                            <option key={club.club_id} value={club.club_id}>
                                                {club.club_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label>Match Date & Time *</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.match_date}
                                        onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Venue</label>
                                    <input
                                        type="text"
                                        value={formData.venue}
                                        onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                                        placeholder="Stadium name"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-success">
                                    Create Match
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Log Event Modal */}
            {showEventModal && selectedMatch && (
                <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Log Match Event</h2>
                            <button className="close-btn" onClick={() => setShowEventModal(false)}>
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleLogEvent}>
                            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>MATCH EVENT</div>
                                <div style={{ fontSize: '1.2rem' }}><strong>{selectedMatch.home_club_name}</strong> vs <strong>{selectedMatch.away_club_name}</strong></div>
                            </div>
                            <div className="form-group">
                                <label>Event Type *</label>
                                <select
                                    value={eventData.event_type}
                                    onChange={(e) => setEventData({ ...eventData, event_type: e.target.value })}
                                >
                                    <option value="GOAL">⚽ Goal</option>
                                    <option value="PENALTY">⚽ Penalty</option>
                                    <option value="OWN_GOAL">Own Goal</option>
                                    <option value="ASSIST">🎯 Assist</option>
                                    <option value="YELLOW_CARD">🟨 Yellow Card</option>
                                    <option value="RED_CARD">🟥 Red Card</option>
                                    <option value="SUBSTITUTION">🔄 Substitution</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Club *</label>
                                <select
                                    value={eventData.club_id}
                                    onChange={(e) => {
                                        setEventData({
                                            ...eventData,
                                            club_id: e.target.value,
                                            player_id: ''
                                        });
                                    }}
                                    required
                                >
                                    <option value={selectedMatch.home_club_id}>{selectedMatch.home_club_name}</option>
                                    <option value={selectedMatch.away_club_id}>{selectedMatch.away_club_name}</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Player *</label>
                                <select
                                    value={eventData.player_id}
                                    onChange={(e) => setEventData({ ...eventData, player_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select Player</option>
                                    {matchPlayers
                                        .filter(p => p.current_club_id == eventData.club_id)
                                        .map(player => (
                                            <option key={player.player_id} value={player.player_id}>
                                                {player.jersey_number ? `#${player.jersey_number} ` : ''}{player.player_name} ({player.position})
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label>Minute *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="120"
                                        value={eventData.minute}
                                        onChange={(e) => setEventData({ ...eventData, minute: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Extra Time</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="15"
                                        value={eventData.extra_time}
                                        onChange={(e) => setEventData({ ...eventData, extra_time: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowEventModal(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-success">
                                    Log Event
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Matches;
