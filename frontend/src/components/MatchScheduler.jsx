import { useState, useEffect } from 'react';
import api from '../api';

function MatchScheduler() {
    const [seasons, setSeasons] = useState([]);
    const [stadiums, setStadiums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [createdMatches, setCreatedMatches] = useState([]);

    const [formData, setFormData] = useState({
        season_id: '',
        start_date: '',
        end_date: '',
        stadium_id: ''
    });

    useEffect(() => {
        fetchSeasons();
        fetchStadiums();
    }, []);

    const fetchSeasons = async () => {
        try {
            const response = await api.get('/matches/seasons/all');
            if (response.data.success) {
                setSeasons(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching seasons:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStadiums = async () => {
        try {
            const response = await api.get('/stadiums');
            if (response.data.success) {
                setStadiums(response.data.data);
                if (response.data.data.length > 0) {
                    setFormData(prev => ({ ...prev, stadium_id: response.data.data[0].stadium_id }));
                }
            }
        } catch (error) {
            console.error('Error fetching stadiums:', error);
        }
    };

    const handleSchedule = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setCreatedMatches([]);

        try {
            const response = await api.post('/matches/schedule', formData);
            if (response.data.success) {
                alert(response.data.message);
                setCreatedMatches(response.data.data.matches);
            }
        } catch (error) {
            console.error('Scheduling error:', error);
            alert(error.response?.data?.message || 'Failed to schedule matches');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="card">
            <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                📅 Match Schedule Generator
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Automatically generate a round-robin schedule (home & away) for all clubs in a season.
            </p>

            <form onSubmit={handleSchedule}>
                <div className="grid grid-2">
                    <div className="form-group">
                        <label>Select Season</label>
                        <select
                            className="form-control"
                            value={formData.season_id}
                            onChange={(e) => setFormData({ ...formData, season_id: e.target.value })}
                            required
                        >
                            <option value="">-- Choose Season --</option>
                            {seasons.map(season => (
                                <option key={season.season_id} value={season.season_id}>
                                    {season.season_name} ({new Date(season.start_date).getFullYear()})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Default Venue (Stadium)</label>
                        <select
                            className="form-control"
                            value={formData.stadium_id}
                            onChange={(e) => setFormData({ ...formData, stadium_id: e.target.value })}
                            required
                        >
                            <option value="">-- Choose Stadium --</option>
                            {stadiums.map(stadium => (
                                <option key={stadium.stadium_id} value={stadium.stadium_id}>
                                    {stadium.stadium_name} {stadium.city ? `(${stadium.city})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-2">
                    <div className="form-group">
                        <label>Schedule Start Date</label>
                        <input
                            type="date"
                            className="form-control"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Schedule End Date</label>
                        <input
                            type="date"
                            className="form-control"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="btn btn-warning"
                    style={{ width: '100%', marginTop: '1rem', padding: '0.8rem', fontWeight: 'bold' }}
                    disabled={submitting}
                >
                    {submitting ? 'Generating Schedule...' : '⚡ Generate Fixtures'}
                </button>
            </form>

            {createdMatches.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--status-success)' }}>
                        ✅ Schedule Preview (First {createdMatches.length} Matches)
                    </h3>
                    <div style={{ maxHeight: '300px', overflowY: 'auto', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                        {createdMatches.map((match, index) => (
                            <div key={index} style={{ padding: '0.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: '500' }}>{match.home_team} vs {match.away_team}</span>
                                <span style={{ color: 'var(--text-muted)' }}>{match.date}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default MatchScheduler;
