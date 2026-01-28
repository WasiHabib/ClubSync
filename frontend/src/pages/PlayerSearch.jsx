import { useState } from 'react';
import api from '../api';

function PlayerSearch() {
    const [filters, setFilters] = useState({
        minPace: '',
        maxPace: '',
        minShooting: '',
        maxShooting: '',
        minPassing: '',
        maxPassing: '',
        minDribbling: '',
        maxDribbling: '',
        minDefending: '',
        maxDefending: '',
        minPhysical: '',
        maxPhysical: '',
        position: '',
        nationality: ''
    });

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const positions = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSearched(true);

        try {
            const searchParams = {};
            Object.keys(filters).forEach(key => {
                if (filters[key] !== '') {
                    searchParams[key] = filters[key];
                }
            });

            const response = await api.post('/players/search-by-attributes', searchParams);
            if (response.data.success) {
                setResults(response.data.data);
            }
        } catch (error) {
            console.error('Error searching players:', error);
            alert('Failed to search players');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFilters({
            minPace: '',
            maxPace: '',
            minShooting: '',
            maxShooting: '',
            minPassing: '',
            maxPassing: '',
            minDribbling: '',
            maxDribbling: '',
            minDefending: '',
            maxDefending: '',
            minPhysical: '',
            maxPhysical: '',
            position: '',
            nationality: ''
        });
        setResults([]);
        setSearched(false);
    };

    const getPositionColor = (position) => {
        const colors = {
            GK: '#f59e0b',
            CB: '#3b82f6',
            LB: '#6366f1',
            RB: '#6366f1',
            CDM: '#8b5cf6',
            CM: '#ec4899',
            CAM: '#ef4444',
            LW: '#10b981',
            RW: '#10b981',
            ST: '#f59e0b'
        };
        return colors[position] || '#6b7280';
    };

    return (
        <div className="container" style={{ padding: '3rem var(--spacing-lg)' }}>
            <h1 style={{ marginBottom: '1rem' }}>🔍 Advanced Player Search</h1>
            <p style={{ fontSize: '1.1rem', marginBottom: '3rem', color: 'var(--text-muted)' }}>
                Search players by their attributes, position, and nationality
            </p>

            <form onSubmit={handleSearch}>
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}>Search Filters</h2>

                    <div className="grid grid-2" style={{ marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Position</label>
                            <select
                                className="input"
                                value={filters.position}
                                onChange={(e) => setFilters({ ...filters, position: e.target.value })}
                            >
                                <option value="">All Positions</option>
                                {positions.map(pos => (
                                    <option key={pos} value={pos}>{pos}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Nationality</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="e.g., Bangladesh"
                                value={filters.nationality}
                                onChange={(e) => setFilters({ ...filters, nationality: e.target.value })}
                            />
                        </div>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--bg-secondary)' }}>
                        Attribute Ranges (0-100)
                    </h3>

                    {[
                        { label: 'Pace', min: 'minPace', max: 'maxPace' },
                        { label: 'Shooting', min: 'minShooting', max: 'maxShooting' },
                        { label: 'Passing', min: 'minPassing', max: 'maxPassing' },
                        { label: 'Dribbling', min: 'minDribbling', max: 'maxDribbling' },
                        { label: 'Defending', min: 'minDefending', max: 'maxDefending' },
                        { label: 'Physical', min: 'minPhysical', max: 'maxPhysical' }
                    ].map(attr => (
                        <div key={attr.label} style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                {attr.label}
                            </label>
                            <div className="grid grid-2">
                                <input
                                    type="number"
                                    className="input"
                                    placeholder="Min"
                                    min="0"
                                    max="100"
                                    value={filters[attr.min]}
                                    onChange={(e) => setFilters({ ...filters, [attr.min]: e.target.value })}
                                />
                                <input
                                    type="number"
                                    className="input"
                                    placeholder="Max"
                                    min="0"
                                    max="100"
                                    value={filters[attr.max]}
                                    onChange={(e) => setFilters({ ...filters, [attr.max]: e.target.value })}
                                />
                            </div>
                        </div>
                    ))}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Searching...' : '🔍 Search Players'}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={handleReset}>
                            ↺ Reset Filters
                        </button>
                    </div>
                </div>
            </form>

            {loading && (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                </div>
            )}

            {!loading && searched && (
                <div className="card">
                    <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}>
                        Search Results ({results.length} players found)
                    </h2>

                    {results.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                            No players match your search criteria
                        </p>
                    ) : (
                        <div className="grid grid-3">
                            {results.map(player => (
                                <div key={player.player_id} className="card" style={{ background: 'var(--bg-secondary)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                                                {player.player_name}
                                            </h3>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {player.club_name || 'Free Agent'}
                                            </p>
                                        </div>
                                        <span
                                            className="badge"
                                            style={{
                                                background: getPositionColor(player.position),
                                                fontWeight: '700'
                                            }}
                                        >
                                            {player.position}
                                        </span>
                                    </div>

                                    <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                        🌍 {player.nationality}
                                    </p>

                                    {player.attributes && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '1rem', fontSize: '0.85rem' }}>
                                            <div>
                                                <span style={{ color: 'var(--text-muted)' }}>PAC:</span>{' '}
                                                <span style={{ fontWeight: '700' }}>{player.attributes.pace || 0}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--text-muted)' }}>SHO:</span>{' '}
                                                <span style={{ fontWeight: '700' }}>{player.attributes.shooting || 0}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--text-muted)' }}>PAS:</span>{' '}
                                                <span style={{ fontWeight: '700' }}>{player.attributes.passing || 0}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--text-muted)' }}>DRI:</span>{' '}
                                                <span style={{ fontWeight: '700' }}>{player.attributes.dribbling || 0}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--text-muted)' }}>DEF:</span>{' '}
                                                <span style={{ fontWeight: '700' }}>{player.attributes.defending || 0}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--text-muted)' }}>PHY:</span>{' '}
                                                <span style={{ fontWeight: '700' }}>{player.attributes.physical || 0}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default PlayerSearch;
