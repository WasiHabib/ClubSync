import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import api from '../api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function StatsCenter() {
    const [seasons, setSeasons] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState(null);
    const [leagueTable, setLeagueTable] = useState([]);
    const [topScorers, setTopScorers] = useState([]);
    const [seasonSummary, setSeasonSummary] = useState(null);
    const [clubs, setClubs] = useState([]);
    const [selectedClub, setSelectedClub] = useState('');
    const [clubStats, setClubStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newSeason, setNewSeason] = useState({
        season_name: '',
        start_date: '',
        end_date: '',
        description: '',
        is_active: false
    });

    useEffect(() => {
        fetchSeasons();
        fetchClubs();
    }, []);

    const fetchClubs = async () => {
        try {
            const response = await api.get('/clubs');
            if (response.data.success) {
                setClubs(response.data.data);
            }
        } catch (error) { }
    };

    useEffect(() => {
        if (selectedSeason) {
            fetchLeagueTable();
            fetchTopScorers();
            fetchSeasonSummary();
        }
    }, [selectedSeason]);

    const fetchSeasonSummary = async () => {
        try {
            const response = await api.get(`/analytics/season-summary/${selectedSeason}`);
            if (response.data.success) {
                setSeasonSummary(response.data.data);
            }
        } catch (error) { }
    };

    useEffect(() => {
        if (selectedClub && selectedSeason) {
            fetchClubStats();
        } else {
            setClubStats(null);
        }
    }, [selectedClub, selectedSeason]);

    const fetchClubStats = async () => {
        try {
            const response = await api.get(`/analytics/club-stats/${selectedClub}?seasonId=${selectedSeason}`);
            if (response.data.success) {
                setClubStats(response.data.data);
            }
        } catch (error) { }
    };

    const fetchSeasons = async () => {
        try {
            const response = await api.get('/matches/seasons/all');
            if (response.data.success && response.data.data.length > 0) {
                setSeasons(response.data.data);
                setSelectedSeason(response.data.data[0].season_id);
            }
        } catch (error) {
            console.error('Error fetching seasons:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLeagueTable = async () => {
        try {
            const response = await api.get(`/analytics/league-table/${selectedSeason}`);
            if (response.data.success) {
                setLeagueTable(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching league table:', error);
        }
    };

    const fetchTopScorers = async () => {
        try {
            const response = await api.get(`/analytics/top-scorers/${selectedSeason}?limit=10`);
            if (response.data.success) {
                setTopScorers(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching top scorers:', error);
        }
    };

    const handleCreateSeason = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/matches/seasons', newSeason);
            if (response.data.success) {
                alert('Tournament created successfully!');
                setShowCreateModal(false);
                setNewSeason({ season_name: '', start_date: '', end_date: '', description: '', is_active: false });
                fetchSeasons(); // Refresh list
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to create tournament');
        }
    };

    const chartData = {
        labels: topScorers.map(s => s.player_name),
        datasets: [
            {
                label: 'Goals',
                data: topScorers.map(s => s.goals),
                backgroundColor: 'rgba(232, 214, 255, 0.6)',
                borderColor: 'rgba(232, 214, 255, 1)',
                borderWidth: 2,
                borderRadius: 4
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: 'Top Scorers',
                color: '#ffffff',
                font: { size: 16 }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { color: '#a0aec0' },
                grid: { color: 'rgba(255,255,255,0.05)' }
            },
            x: {
                ticks: { color: '#a0aec0' },
                grid: { display: false }
            }
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1>📊 Stats Center</h1>
                        <p style={{ margin: 0 }}>Live league tables and player statistics</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', alignItems: 'center', justifyContent: 'space-between' }}>
                    {seasons.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <label style={{ fontWeight: '600' }}>Select Season:</label>
                            <select
                                className="form-control"
                                value={selectedSeason}
                                onChange={(e) => setSelectedSeason(e.target.value)}
                                style={{ width: '250px' }}
                            >
                                {seasons.map(season => (
                                    <option key={season.season_id} value={season.season_id}>
                                        {season.season_name} ({new Date(season.start_date).getFullYear()})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn btn-primary"
                        style={{ padding: '0.6rem 1.2rem' }}
                    >
                        + Create New Tournament
                    </button>
                </div>

                {showCreateModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>Create New Tournament</h2>
                                <button className="close-btn" onClick={() => setShowCreateModal(false)}>&times;</button>
                            </div>
                            <form onSubmit={handleCreateSeason}>
                                <div className="form-group">
                                    <label>Tournament Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newSeason.season_name}
                                        onChange={(e) => setNewSeason({ ...newSeason, season_name: e.target.value })}
                                        placeholder="e.g. Bangladesh Premier League 2025"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Start Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={newSeason.start_date}
                                        onChange={(e) => setNewSeason({ ...newSeason, start_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>End Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={newSeason.end_date}
                                        onChange={(e) => setNewSeason({ ...newSeason, end_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        className="form-control"
                                        value={newSeason.description}
                                        onChange={(e) => setNewSeason({ ...newSeason, description: e.target.value })}
                                        placeholder="Optional description"
                                        rows="2"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={newSeason.is_active}
                                            onChange={(e) => setNewSeason({ ...newSeason, is_active: e.target.checked })}
                                            style={{ marginRight: '0.5rem' }}
                                        />
                                        Set as Active Season
                                    </label>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
                                    <button type="submit" className="btn btn-success">Create Tournament</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {seasonSummary && seasonSummary.matches && (
                    <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
                        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Total Matches</h3>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--status-info)' }}>{seasonSummary.matches.total_matches}</div>
                        </div>
                        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Total Goals</h3>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--status-success)' }}>{seasonSummary.matches.total_goals || 0}</div>
                        </div>
                        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Avg Goals/Match</h3>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--status-warning)' }}>{Number(seasonSummary.matches.avg_goals_per_match || 0).toFixed(2)}</div>
                        </div>
                        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Players Used</h3>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-cool)' }}>{seasonSummary.players?.total_players || 0}</div>
                        </div>
                    </div>
                )}

                <div className="grid grid-2" style={{ alignItems: 'flex-start' }}>
                    {/* League Table */}
                    <div className="card">
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>🏆 League Standings</h2>
                        {leagueTable.length === 0 ? (
                            <p style={{ textAlign: 'center' }}>No matches played yet</p>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Club</th>
                                            <th>P</th>
                                            <th>W</th>
                                            <th>D</th>
                                            <th>L</th>
                                            <th>GD</th>
                                            <th>Pts</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leagueTable.map((team, index) => (
                                            <tr
                                                key={team.club_id}
                                                style={{
                                                    background: index < 3 ? 'rgba(232, 214, 255, 0.05)' : 'transparent'
                                                }}
                                            >
                                                <td style={{ fontWeight: '700', color: index < 3 ? 'var(--status-success)' : 'inherit' }}>
                                                    {index + 1}
                                                </td>
                                                <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                                    {team.club_name}
                                                </td>
                                                <td>{team.matches_played || 0}</td>
                                                <td>{team.wins || 0}</td>
                                                <td>{team.draws || 0}</td>
                                                <td>{team.losses || 0}</td>
                                                <td style={{ color: team.goal_difference > 0 ? 'var(--status-success)' : team.goal_difference < 0 ? 'var(--status-danger)' : 'inherit' }}>
                                                    {team.goal_difference > 0 ? '+' : ''}{team.goal_difference || 0}
                                                </td>
                                                <td style={{ fontWeight: '700', color: 'var(--status-success)' }}>
                                                    {team.points || 0}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Top Scorers */}
                    <div className="card">
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>⚽ Top Scorers</h2>
                        {topScorers.length === 0 ? (
                            <p style={{ textAlign: 'center' }}>No goals scored yet</p>
                        ) : (
                            <>
                                <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Player</th>
                                                <th>Club</th>
                                                <th>Goals</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topScorers.map((scorer, index) => (
                                                <tr key={scorer.player_id}>
                                                    <td style={{ fontWeight: '700', color: index === 0 ? 'var(--status-warning)' : 'inherit' }}>
                                                        {index + 1}
                                                    </td>
                                                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                                        {scorer.player_name}
                                                    </td>
                                                    <td>{scorer.club_name || 'Free Agent'}</td>
                                                    <td style={{ fontWeight: '700', color: 'var(--status-success)' }}>
                                                        {scorer.goals}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                                    <Bar data={chartData} options={chartOptions} />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Club Specific Stats */}
                <div className="card" style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>🛡️ Club Performance Tracker</h2>
                        <select
                            className="form-control"
                            style={{ width: '250px' }}
                            value={selectedClub}
                            onChange={(e) => setSelectedClub(e.target.value)}
                        >
                            <option value="">Select a Club...</option>
                            {clubs.map(club => (
                                <option key={club.club_id} value={club.club_id}>{club.club_name}</option>
                            ))}
                        </select>
                    </div>

                    {!selectedClub ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Select a club to view its specific performance in this season.</p>
                    ) : clubStats ? (
                        <div className="grid grid-3" style={{ gap: '1rem' }}>
                            <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Matches</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{clubStats.total_matches}</div>
                            </div>
                            <div style={{ padding: '1rem', background: 'rgba(0,255,100,0.1)', borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ color: 'var(--status-success)', marginBottom: '0.5rem' }}>Wins</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--status-success)' }}>{clubStats.wins || 0}</div>
                            </div>
                            <div style={{ padding: '1rem', background: 'rgba(255,200,0,0.1)', borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ color: 'var(--status-warning)', marginBottom: '0.5rem' }}>Draws</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--status-warning)' }}>{clubStats.draws || 0}</div>
                            </div>
                            <div style={{ padding: '1rem', background: 'rgba(255,0,0,0.1)', borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ color: 'var(--status-danger)', marginBottom: '0.5rem' }}>Losses</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--status-danger)' }}>{clubStats.losses || 0}</div>
                            </div>
                            <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Goals For</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{clubStats.goals_for || 0}</div>
                            </div>
                            <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Goals Against</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{clubStats.goals_against || 0}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="spinner" style={{ margin: '2rem auto' }}></div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StatsCenter;
