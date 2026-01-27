import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function Clubs({ user }) {
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        club_name: '',
        city: '',
        founded_year: '',
        stadium_name: '',
        stadium_capacity: ''
    });

    useEffect(() => {
        fetchClubs();
    }, []);

    const fetchClubs = async () => {
        try {
            const response = await api.get('/clubs');
            if (response.data.success) {
                setClubs(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching clubs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/clubs', formData);
            if (response.data.success) {
                alert('Club created successfully!');
                setShowModal(false);
                fetchClubs();
                setFormData({
                    club_name: '',
                    city: '',
                    founded_year: '',
                    stadium_name: '',
                    stadium_capacity: ''
                });
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to create club');
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
                        <h1>Football Clubs</h1>
                        <p style={{ margin: 0 }}>Browse all registered football clubs in the league</p>
                    </div>
                    {user && user.role === 'ADMIN' && (
                        <button onClick={() => setShowModal(true)} className="btn btn-success">
                            + Add Club
                        </button>
                    )}
                </div>

                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>Add New Club</h2>
                                <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
                            </div>
                            <form onSubmit={handleSubmit}>
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
                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Club</button>
                            </form>
                        </div>
                    </div>
                )}

                <div className="grid grid-3">
                    {clubs.map(club => (
                        <Link
                            to={`/clubs/${club.club_id}`}
                            key={club.club_id}
                            style={{ textDecoration: 'none' }}
                        >
                            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'transform 0.2s' }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: '50%',
                                    marginBottom: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: '800',
                                    fontSize: '1.5rem',
                                    color: 'var(--text-muted)'
                                }}>
                                    {club.club_name.substring(0, 2).toUpperCase()}
                                </div>
                                <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{club.club_name}</h3>

                                <div style={{ marginTop: 'auto', width: '100%' }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: '0.5rem 0',
                                        borderTop: '1px solid var(--glass-border)',
                                        fontSize: '0.85rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        <span>Since</span>
                                        <span style={{ fontWeight: '600' }}>{club.founded_year}</span>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: '0.5rem 0',
                                        borderTop: '1px solid var(--glass-border)',
                                        fontSize: '0.85rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        <span>City</span>
                                        <span style={{ fontWeight: '600' }}>{club.city}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Clubs;
