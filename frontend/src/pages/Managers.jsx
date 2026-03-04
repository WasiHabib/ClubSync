import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';

function Managers({ user }) {
    const [managers, setManagers] = useState([]);
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');

    useEffect(() => {
        const query = searchParams.get('query');
        if (query) {
            setSearchQuery(query);
        }
    }, [searchParams]);

    const [formData, setFormData] = useState({
        manager_name: '',
        date_of_birth: '',
        nationality: 'Bangladesh',
        specialization: 'Balanced',
        licenses: '',
        club_id: ''
    });

    useEffect(() => {
        fetchManagers();
        fetchClubs();
    }, []);

    const fetchManagers = async () => {
        try {
            const response = await api.get('/managers');
            if (response.data.success) {
                setManagers(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching managers:', error);
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
            const response = await api.post('/managers', formData);
            if (response.data.success) alert('Manager added successfully!');
            setShowModal(false);
            fetchManagers();
            resetForm();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to add manager');
        }
    };

    const resetForm = () => {
        setFormData({
            manager_name: '',
            date_of_birth: '',
            nationality: 'Bangladesh',
            specialization: 'Balanced',
            licenses: '',
            club_id: ''
        });
    };

    const handleDelete = async (manager) => {
        if (!confirm(`Deactivate manager "${manager.manager_name}"? This is a soft delete — historical records will be preserved.`)) return;
        try {
            const response = await api.delete(`/managers/${manager.manager_id}`);
            if (response.data.success) {
                alert(response.data.message);
                fetchManagers();
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to delete manager';
            alert(msg);
        }
    };

    const filteredManagers = managers.filter(manager => {
        const query = searchQuery.toLowerCase();
        return (
            (manager.manager_name && manager.manager_name.toLowerCase().includes(query)) ||
            (manager.club_name && manager.club_name.toLowerCase().includes(query)) ||
            (manager.nationality && manager.nationality.toLowerCase().includes(query))
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
                        <h1>Manager List</h1>
                        <p style={{ margin: 0 }}>View and manage coaching staff</p>
                    </div>
                    {user && user.role === 'ADMIN' && (
                        <button onClick={() => setShowModal(true)} className="btn btn-success">
                            + Add Manager
                        </button>
                    )}
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <input
                        type="text"
                        placeholder="🔍 Search managers by name or club..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ maxWidth: '400px' }}
                    />
                </div>

                {filteredManagers.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <p style={{ fontSize: '1.2rem' }}>No managers found</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Manager Name</th>
                                    <th>Club</th>
                                    <th>Nationality</th>
                                    <th>Specialization</th>
                                    <th>Age</th>
                                    {user && user.role === 'ADMIN' && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredManagers.map(manager => {
                                    // Calculate age
                                    const dob = new Date(manager.date_of_birth);
                                    const ageDifMs = Date.now() - dob.getTime();
                                    const ageDate = new Date(ageDifMs);
                                    const age = Math.abs(ageDate.getUTCFullYear() - 1970);

                                    return (
                                        <tr key={manager.manager_id}>
                                            <td style={{ fontWeight: '600', color: 'var(--primary-color)' }}>
                                                {manager.manager_name}
                                            </td>
                                            <td>{manager.club_name || 'Free Agent'}</td>
                                            <td>{manager.nationality}</td>
                                            <td>
                                                <span className={`badge ${manager.specialization === 'Offensive' ? 'badge-danger' :
                                                    manager.specialization === 'Defensive' ? 'badge-info' :
                                                        manager.specialization === 'Youth Development' ? 'badge-success' :
                                                            'badge-warning'
                                                    }`}>
                                                    {manager.specialization}
                                                </span>
                                            </td>
                                            <td>{age}</td>
                                            {user && user.role === 'ADMIN' && (
                                                <td>
                                                    <button
                                                        onClick={() => handleDelete(manager)}
                                                        className="btn btn-danger"
                                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                                    >
                                                        Deactivate
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 style={{ margin: 0 }}>Add New Manager</h2>
                            <button onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="grid grid-2">
                                    <div className="form-group">
                                        <label>Manager Name *</label>
                                        <input
                                            type="text"
                                            value={formData.manager_name}
                                            onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
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
                                        <label>Nationality *</label>
                                        <input
                                            type="text"
                                            value={formData.nationality}
                                            onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Specialization *</label>
                                        <select
                                            value={formData.specialization}
                                            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                        >
                                            <option value="Balanced">Balanced</option>
                                            <option value="Offensive">Offensive</option>
                                            <option value="Defensive">Defensive</option>
                                            <option value="Youth Development">Youth Development</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Licenses</label>
                                        <input
                                            type="text"
                                            value={formData.licenses}
                                            onChange={(e) => setFormData({ ...formData, licenses: e.target.value })}
                                            placeholder="e.g. UEFA Pro"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Initial Club (Optional)</label>
                                        <select
                                            value={formData.club_id}
                                            onChange={(e) => setFormData({ ...formData, club_id: e.target.value })}
                                        >
                                            <option value="">Free Agent</option>
                                            {clubs.map(club => (
                                                <option key={club.club_id} value={club.club_id}>
                                                    {club.club_name}
                                                </option>
                                            ))}
                                        </select>
                                        {formData.club_id && (
                                            <small style={{ color: 'var(--status-warning)' }}>
                                                Note: This will replace the club's current manager and create a default contract of 50,000 BDT.
                                            </small>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-success">
                                    Add Manager
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Managers;
