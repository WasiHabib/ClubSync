import { useState, useEffect } from 'react';
import api from '../api';

function TransferManager() {
    const [managers, setManagers] = useState([]);
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [selectedManager, setSelectedManager] = useState('');
    const [toClubId, setToClubId] = useState('');
    const [transferFee, setTransferFee] = useState('');
    const [contractStart, setContractStart] = useState('');
    const [contractEnd, setContractEnd] = useState('');
    const [salary, setSalary] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [managersRes, clubsRes] = await Promise.all([
                api.get('/managers'),
                api.get('/clubs')
            ]);

            if (managersRes.data.success && clubsRes.data.success) {
                // Filter only active managers
                const activeManagers = managersRes.data.data.filter(m => m.is_active);
                setManagers(activeManagers);
                setClubs(clubsRes.data.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Failed to load managers and clubs');
        } finally {
            setLoading(false);
        }
    };

    const handleTransfer = async (e) => {
        e.preventDefault();

        if (!selectedManager || !toClubId || !contractStart || !contractEnd || !salary) {
            alert('Please fill in all required fields');
            return;
        }

        // Validate manager is not already at target club
        const manager = managers.find(m => m.manager_id === parseInt(selectedManager));
        if (manager && manager.club_id === parseInt(toClubId)) {
            alert('Manager is already at this club!');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                to_club_id: parseInt(toClubId),
                transfer_fee: parseFloat(transferFee) || 0,
                new_contract: {
                    start_date: contractStart,
                    end_date: contractEnd,
                    salary_amount: parseFloat(salary),
                    salary_currency: 'BDT'
                }
            };

            const response = await api.post(`/managers/${selectedManager}/transfer`, payload);

            if (response.data.success) {
                alert(response.data.message);
                // Reset form
                setSelectedManager('');
                setToClubId('');
                setTransferFee('');
                setContractStart('');
                setContractEnd('');
                setSalary('');
                // Refresh data
                fetchData();
            }
        } catch (error) {
            console.error('Transfer error:', error);
            alert(error.response?.data?.message || 'Transfer failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="card" style={{ marginTop: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                👔 Manager Transfer Market
            </h2>

            <form onSubmit={handleTransfer}>
                <div className="grid grid-2">
                    <div className="form-group">
                        <label>Select Manager</label>
                        <select
                            className="form-control"
                            value={selectedManager}
                            onChange={(e) => setSelectedManager(e.target.value)}
                            required
                        >
                            <option value="">-- Choose Manager --</option>
                            {managers.map(manager => (
                                <option key={manager.manager_id} value={manager.manager_id}>
                                    {manager.manager_name} ({manager.specialization}) - {manager.club_name || 'Free Agent'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Destination Club (Fires Current Manager)</label>
                        <select
                            className="form-control"
                            value={toClubId}
                            onChange={(e) => setToClubId(e.target.value)}
                            required
                        >
                            <option value="">-- Choose Club --</option>
                            {clubs.map(club => (
                                <option key={club.club_id} value={club.club_id}>
                                    {club.club_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-3">
                    <div className="form-group">
                        <label>Compensation/Fee (BDT)</label>
                        <input
                            type="number"
                            className="form-control"
                            value={transferFee}
                            onChange={(e) => setTransferFee(e.target.value)}
                            placeholder="0"
                        />
                    </div>
                    <div className="form-group">
                        <label>Contract Start</label>
                        <input
                            type="date"
                            className="form-control"
                            value={contractStart}
                            onChange={(e) => setContractStart(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Contract End</label>
                        <input
                            type="date"
                            className="form-control"
                            value={contractEnd}
                            onChange={(e) => setContractEnd(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>New Salary (BDT)</label>
                    <input
                        type="number"
                        className="form-control"
                        value={salary}
                        onChange={(e) => setSalary(e.target.value)}
                        required
                        placeholder="Monthly Salary"
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                    style={{ width: '100%', marginTop: '1rem', padding: '1rem', fontSize: '1.1rem' }}
                >
                    {submitting ? 'Processing Transfer...' : 'Execute Manager Transfer'}
                </button>
            </form>
        </div>
    );
}

export default TransferManager;
