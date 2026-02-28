import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

function MatchDetails({ user }) {
    const { id } = useParams();
    const [match, setMatch] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusUpdating, setStatusUpdating] = useState(false);

    // Event form state
    const [showEventModal, setShowEventModal] = useState(false);
    const [eventData, setEventData] = useState({
        event_type: 'GOAL',
        club_id: '',
        player_id: '',
        related_player_id: '',
        minute: '',
        extra_time: ''
    });

    const [homePlayers, setHomePlayers] = useState([]);
    const [awayPlayers, setAwayPlayers] = useState([]);

    useEffect(() => {
        fetchMatchDetails();
        fetchEvents();
    }, [id]);

    const fetchMatchDetails = async () => {
        try {
            const response = await api.get(`/matches/${id}`);
            if (response.data.success) {
                setMatch(response.data.data);
                if (user?.role === 'ADMIN') {
                    fetchPlayers(response.data.data.home_club_id, setHomePlayers);
                    fetchPlayers(response.data.data.away_club_id, setAwayPlayers);
                }
            }
        } catch (error) {
            console.error('Error fetching match details:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPlayers = async (clubId, setter) => {
        try {
            const res = await api.get(`/clubs/${clubId}/players`);
            if (res.data.success) {
                setter(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching players:', error);
        }
    };

    const fetchEvents = async () => {
        try {
            const res = await api.get(`/events/${id}`);
            if (res.data.success) {
                setEvents(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        setStatusUpdating(true);
        try {
            const res = await api.put(`/matches/${id}`, { match_status: newStatus });
            if (res.data.success) {
                setMatch({ ...match, match_status: newStatus });
            }
        } catch (error) {
            alert('Failed to update status');
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleAddEvent = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...eventData,
                match_id: id,
                minute: parseInt(eventData.minute),
                extra_time: eventData.extra_time ? parseInt(eventData.extra_time) : 0,
                club_id: parseInt(eventData.club_id),
                player_id: parseInt(eventData.player_id),
                related_player_id: eventData.related_player_id ? parseInt(eventData.related_player_id) : null
            };

            const res = await api.post('/events', payload);
            if (res.data.success) {
                setShowEventModal(false);
                setEventData({ event_type: 'GOAL', club_id: '', player_id: '', related_player_id: '', minute: '', extra_time: '' });
                fetchEvents();
                fetchMatchDetails(); // Refresh score if goal
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to add event');
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;
        try {
            const res = await api.delete(`/events/${eventId}`);
            if (res.data.success) {
                fetchEvents();
                fetchMatchDetails();
            }
        } catch (error) {
            alert('Failed to delete event');
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: '3rem var(--spacing-lg)', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
            </div>
        );
    }

    if (!match) {
        return (
            <div className="container" style={{ padding: '3rem var(--spacing-lg)' }}>
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <h2>Match not found</h2>
                    <Link to="/matches" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                        Back to Matches
                    </Link>
                </div>
            </div>
        );
    }

    // Determine current club's players based on selection
    const availablePlayers = eventData.club_id == match.home_club_id ? homePlayers :
        eventData.club_id == match.away_club_id ? awayPlayers : [];

    return (
        <div className="container" style={{ padding: '3rem var(--spacing-lg)' }}>
            <div className="fade-in">
                <Link to="/matches" style={{ display: 'inline-block', marginBottom: '1rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                    ← Back to Matches
                </Link>

                {/* Match Header */}
                <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, var(--card-bg) 0%, rgba(0,200,100,0.1) 100%)' }}>
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            {match.season_name} • {new Date(match.match_date).toLocaleDateString()}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3rem', marginTop: '1.5rem' }}>
                            <div style={{ textAlign: 'center', flex: 1 }}>
                                <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{match.home_club_name}</h2>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Home</div>
                            </div>

                            <div style={{ fontSize: '3rem', fontWeight: '700', padding: '0 2rem', color: match.match_status === 'COMPLETED' ? 'var(--status-success)' : 'var(--text-primary)' }}>
                                {match.home_score !== null ? match.home_score : '0'} : {match.away_score !== null ? match.away_score : '0'}
                            </div>

                            <div style={{ textAlign: 'center', flex: 1 }}>
                                <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{match.away_club_name}</h2>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Away</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                padding: '0.5rem 1rem',
                                background: match.match_status === 'COMPLETED' ? 'var(--status-success)' : match.match_status === 'LIVE' ? 'var(--status-warning)' : 'var(--bg-tertiary)',
                                borderRadius: '4px',
                                display: 'inline-block',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}>
                                {match.match_status}
                            </div>

                            {user?.role === 'ADMIN' && (
                                <select
                                    className="form-control"
                                    style={{ width: 'auto', display: 'inline-block' }}
                                    value={match.match_status}
                                    onChange={(e) => handleStatusUpdate(e.target.value)}
                                    disabled={statusUpdating}
                                >
                                    <option value="SCHEDULED">Set Scheduled</option>
                                    <option value="LIVE">Set Live</option>
                                    <option value="COMPLETED">Set Completed</option>
                                </select>
                            )}
                        </div>

                        {match.venue && (
                            <div style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>📍 {match.venue}</div>
                        )}
                    </div>
                </div>

                <div className="grid grid-2">
                    {/* Events Timeline */}
                    <div className="card" style={{ gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Match Timeline</h3>
                            {user?.role === 'ADMIN' && ['SCHEDULED', 'LIVE', 'COMPLETED'].includes(match.match_status) && (
                                <button className="btn btn-primary" onClick={() => setShowEventModal(true)}>
                                    + Add Event
                                </button>
                            )}
                        </div>

                        {events.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No events recorded for this match yet.</p>
                        ) : (
                            <div style={{ position: 'relative', padding: '1rem 0' }}>
                                {/* Center line */}
                                <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '2px', background: 'var(--border-color)', transform: 'translateX(-50%)' }}></div>

                                {events.map((evt) => {
                                    const isHome = evt.club_id === match.home_club_id;
                                    const timeStr = evt.extra_time > 0 ? `${evt.minute}+${evt.extra_time}'` : `${evt.minute}'`;

                                    let icon = '⏱️';
                                    let color = 'var(--bg-tertiary)';
                                    if (evt.event_type === 'GOAL' || evt.event_type === 'PENALTY') { icon = '⚽'; color = 'rgba(0,200,100,0.1)'; }
                                    if (evt.event_type === 'OWN_GOAL') { icon = '🤦'; color = 'rgba(200,0,0,0.1)'; }
                                    if (evt.event_type === 'YELLOW_CARD') { icon = '🟨'; color = 'rgba(255,200,0,0.1)'; }
                                    if (evt.event_type === 'RED_CARD') { icon = '🟥'; color = 'rgba(255,0,0,0.1)'; }
                                    if (evt.event_type === 'SUBSTITUTION') { icon = '🔄'; color = 'rgba(0,100,255,0.1)'; }

                                    return (
                                        <div key={evt.event_id} style={{
                                            display: 'flex',
                                            justifyContent: isHome ? 'flex-start' : 'flex-end',
                                            marginBottom: '1rem',
                                            position: 'relative',
                                            width: '100%'
                                        }}>
                                            <div style={{
                                                width: '45%',
                                                textAlign: isHome ? 'right' : 'left',
                                                padding: '1rem',
                                                background: color,
                                                borderRadius: '8px',
                                                position: 'relative'
                                            }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.2rem' }}>
                                                    {isHome ? <>{timeStr} {icon}</> : <>{icon} {timeStr}</>}
                                                </div>
                                                <div style={{ fontWeight: '600' }}>{evt.player_name}</div>
                                                {evt.related_player_name && (
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                        {evt.event_type === 'SUBSTITUTION' ? `In for ${evt.related_player_name}` : `Assist: ${evt.related_player_name}`}
                                                    </div>
                                                )}

                                                {user?.role === 'ADMIN' && (
                                                    <button
                                                        onClick={() => handleDeleteEvent(evt.event_id)}
                                                        style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', fontSize: '0.8rem', marginTop: '0.5rem' }}
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Add Event Modal */}
                {showEventModal && (
                    <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2 style={{ margin: 0 }}>Add Match Event</h2>
                                <button onClick={() => setShowEventModal(false)} className="btn btn-secondary" style={{ padding: '0.5rem' }}>✕</button>
                            </div>
                            <form onSubmit={handleAddEvent}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Event Type *</label>
                                        <select className="form-control" value={eventData.event_type} onChange={(e) => setEventData({ ...eventData, event_type: e.target.value })} required>
                                            <option value="GOAL">Goal</option>
                                            <option value="PENALTY">Penalty</option>
                                            <option value="OWN_GOAL">Own Goal</option>
                                            <option value="YELLOW_CARD">Yellow Card</option>
                                            <option value="RED_CARD">Red Card</option>
                                            <option value="SUBSTITUTION">Substitution</option>
                                            <option value="ASSIST">Assist (standalone)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Team *</label>
                                        <select className="form-control" value={eventData.club_id} onChange={(e) => setEventData({ ...eventData, club_id: e.target.value })} required>
                                            <option value="">Select Team</option>
                                            <option value={match.home_club_id}>{match.home_club_name} (Home)</option>
                                            <option value={match.away_club_id}>{match.away_club_name} (Away)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Player *</label>
                                        <select className="form-control" value={eventData.player_id} onChange={(e) => setEventData({ ...eventData, player_id: e.target.value })} required disabled={!eventData.club_id}>
                                            <option value="">Select Player</option>
                                            {availablePlayers.map(p => (
                                                <option key={p.player_id} value={p.player_id}>{p.player_name} ({p.position})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Related Player (Assist / Sub Out)</label>
                                        <select className="form-control" value={eventData.related_player_id} onChange={(e) => setEventData({ ...eventData, related_player_id: e.target.value })} disabled={!eventData.club_id}>
                                            <option value="">None</option>
                                            {availablePlayers.map(p => (
                                                <option key={p.player_id} value={p.player_id}>{p.player_name} ({p.position})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-2">
                                        <div className="form-group">
                                            <label>Minute *</label>
                                            <input type="number" min="1" max="130" className="form-control" value={eventData.minute} onChange={(e) => setEventData({ ...eventData, minute: e.target.value })} required />
                                        </div>
                                        <div className="form-group">
                                            <label>Extra Time</label>
                                            <input type="number" min="0" max="15" className="form-control" value={eventData.extra_time} onChange={(e) => setEventData({ ...eventData, extra_time: e.target.value })} placeholder="+mins" />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setShowEventModal(false)} className="btn btn-secondary">Cancel</button>
                                    <button type="submit" className="btn btn-success">Save Event</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MatchDetails;
