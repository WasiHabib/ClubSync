import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

function MatchDetails() {
    const { id } = useParams();
    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMatchDetails();
    }, [id]);

    const fetchMatchDetails = async () => {
        try {
            const response = await api.get(`/matches/${id}`);
            if (response.data.success) {
                setMatch(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching match details:', error);
        } finally {
            setLoading(false);
        }
    };

    const getGoalEvents = (clubId) => {
        if (!match?.events) return [];
        return match.events.filter(e =>
            (e.event_type === 'GOAL' || e.event_type === 'PENALTY') && e.club_id === clubId
        );
    };

    const getCardEvents = (clubId, cardType) => {
        if (!match?.events) return [];
        return match.events.filter(e =>
            e.event_type === cardType && e.club_id === clubId
        );
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

    const homeGoals = getGoalEvents(match.home_club_id);
    const awayGoals = getGoalEvents(match.away_club_id);
    const homeYellowCards = getCardEvents(match.home_club_id, 'YELLOW_CARD');
    const awayYellowCards = getCardEvents(match.away_club_id, 'YELLOW_CARD');
    const homeRedCards = getCardEvents(match.home_club_id, 'RED_CARD');
    const awayRedCards = getCardEvents(match.away_club_id, 'RED_CARD');

    return (
        <div className="container" style={{ padding: '3rem var(--spacing-lg)' }}>
            <div className="fade-in">
                <Link to="/matches" style={{
                    display: 'inline-block',
                    marginBottom: '1rem',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none'
                }}>
                    ← Back to Matches
                </Link>

                {/* Match Header */}
                <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, var(--card-bg) 0%, rgba(0,200,100,0.1) 100%)' }}>
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            {match.season_name} • {new Date(match.match_date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '3rem',
                            marginTop: '1.5rem'
                        }}>
                            <div style={{ textAlign: 'center', flex: 1 }}>
                                <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{match.home_club_name}</h2>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Home</div>
                            </div>

                            <div style={{
                                fontSize: '3rem',
                                fontWeight: '700',
                                padding: '0 2rem',
                                color: match.match_status === 'COMPLETED' ? 'var(--status-success)' : 'var(--text-muted)'
                            }}>
                                {match.home_score !== null ? match.home_score : '-'} : {match.away_score !== null ? match.away_score : '-'}
                            </div>

                            <div style={{ textAlign: 'center', flex: 1 }}>
                                <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{match.away_club_name}</h2>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Away</div>
                            </div>
                        </div>
                        <div style={{
                            marginTop: '1.5rem',
                            padding: '0.5rem 1rem',
                            background: match.match_status === 'COMPLETED' ? 'var(--status-success)' : 'var(--status-warning)',
                            borderRadius: '4px',
                            display: 'inline-block',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                        }}>
                            {match.match_status}
                        </div>
                        {match.venue && (
                            <div style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
                                📍 {match.venue}
                            </div>
                        )}
                    </div>
                </div>

                {match.match_status === 'COMPLETED' && (
                    <div className="grid grid-2">
                        {/* Home Team Events */}
                        <div className="card">
                            <h3 style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                {match.home_club_name}
                            </h3>

                            {/* Goals */}
                            {homeGoals.length > 0 && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>⚽ GOALS</h4>
                                    {homeGoals.map((goal, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '0.75rem',
                                            background: 'rgba(0,200,100,0.1)',
                                            borderRadius: '4px',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: '600' }}>{goal.player_name}</div>
                                                {goal.related_player_name && (
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                        Assist: {goal.related_player_name}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ fontWeight: '700', color: 'var(--status-success)' }}>
                                                {goal.minute}'{goal.extra_time ? `+${goal.extra_time}` : ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Yellow Cards */}
                            {homeYellowCards.length > 0 && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>🟨 YELLOW CARDS</h4>
                                    {homeYellowCards.map((card, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '0.75rem',
                                            background: 'rgba(255,200,0,0.1)',
                                            borderRadius: '4px',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <div style={{ fontWeight: '600' }}>{card.player_name}</div>
                                            <div style={{ fontWeight: '700', color: '#ffc107' }}>
                                                {card.minute}'{card.extra_time ? `+${card.extra_time}` : ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Red Cards */}
                            {homeRedCards.length > 0 && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>🟥 RED CARDS</h4>
                                    {homeRedCards.map((card, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '0.75rem',
                                            background: 'rgba(255,0,0,0.1)',
                                            borderRadius: '4px',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <div style={{ fontWeight: '600' }}>{card.player_name}</div>
                                            <div style={{ fontWeight: '700', color: '#dc3545' }}>
                                                {card.minute}'{card.extra_time ? `+${card.extra_time}` : ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {homeGoals.length === 0 && homeYellowCards.length === 0 && homeRedCards.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    No events recorded
                                </div>
                            )}
                        </div>

                        {/* Away Team Events */}
                        <div className="card">
                            <h3 style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                {match.away_club_name}
                            </h3>

                            {/* Goals */}
                            {awayGoals.length > 0 && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>⚽ GOALS</h4>
                                    {awayGoals.map((goal, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '0.75rem',
                                            background: 'rgba(0,200,100,0.1)',
                                            borderRadius: '4px',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: '600' }}>{goal.player_name}</div>
                                                {goal.related_player_name && (
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                        Assist: {goal.related_player_name}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ fontWeight: '700', color: 'var(--status-success)' }}>
                                                {goal.minute}'{goal.extra_time ? `+${goal.extra_time}` : ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Yellow Cards */}
                            {awayYellowCards.length > 0 && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>🟨 YELLOW CARDS</h4>
                                    {awayYellowCards.map((card, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '0.75rem',
                                            background: 'rgba(255,200,0,0.1)',
                                            borderRadius: '4px',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <div style={{ fontWeight: '600' }}>{card.player_name}</div>
                                            <div style={{ fontWeight: '700', color: '#ffc107' }}>
                                                {card.minute}'{card.extra_time ? `+${card.extra_time}` : ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Red Cards */}
                            {awayRedCards.length > 0 && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>🟥 RED CARDS</h4>
                                    {awayRedCards.map((card, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '0.75rem',
                                            background: 'rgba(255,0,0,0.1)',
                                            borderRadius: '4px',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <div style={{ fontWeight: '600' }}>{card.player_name}</div>
                                            <div style={{ fontWeight: '700', color: '#dc3545' }}>
                                                {card.minute}'{card.extra_time ? `+${card.extra_time}` : ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {awayGoals.length === 0 && awayYellowCards.length === 0 && awayRedCards.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    No events recorded
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {match.match_status !== 'COMPLETED' && (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <h3>Match Details</h3>
                        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
                            This match has not been completed yet. Check back later for the match summary.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MatchDetails;
