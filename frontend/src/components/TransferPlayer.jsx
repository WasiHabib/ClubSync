import { useState, useEffect } from 'react';
import api from '../api';

function TransferPlayer() {
    const [players, setPlayers] = useState([]);
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [selectedPlayer, setSelectedPlayer] = useState('');
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
            const [playersRes, clubsRes] = await Promise.all([
                api.get('/players'),
                api.get('/clubs')
            ]);

            if (playersRes.data.success && clubsRes.data.success) {
                // Filter only active players
                const activePlayers = playersRes.data.data.filter(p => p.is_active);
                setPlayers(activePlayers);
                setClubs(clubsRes.data.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Failed to load players and clubs');
        } finally {
            setLoading(false);
        }
    };

    const handleTransfer = async (e) => {
        e.preventDefault();

        if (!selectedPlayer || !toClubId || !contractStart || !contractEnd || !salary) {
            alert('Please fill in all required fields');
            return;
        }

        // Validate player is not already at target club
        const player = players.find(p => p.player_id === parseInt(selectedPlayer));
        if (player && player.current_club_id === parseInt(toClubId)) {
            alert('Player is already at this club!');
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

            const response = await api.post(`/players/${selectedPlayer}/transfer`, payload);

            if (response.data.success) {
                alert(response.data.message);
                // Reset form
                setSelectedPlayer('');
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
        <div className="card">
            <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                🔄 Player Transfer Market
            </h2>

            <form onSubmit={handleTransfer}>
                <div className="grid grid-2">
                    <div className="form-group">
                        <label>Select Player</label>
                        <select
                            className="form-control"
                            value={selectedPlayer}
                            onChange={(e) => setSelectedPlayer(e.target.value)}
                            required
                        >
                            <option value="">-- Choose Player --</option>
                            {players.map(player => (
                                <option key={player.player_id} value={player.player_id}>
                                    {player.player_name} ({player.position}) - {player.club_name || 'Free Agent'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Destination Club</label>
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
                        <label>Transfer Fee (BDT)</label>
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
                    style={{ width: '100%', marginTop: '1rem', padding: '0.8rem' }}
                    disabled={submitting}
                >
                    {submitting ? 'Processing Transfer...' : 'Confirm Transfer 📝'}
                </button>
            </form>
        </div>
    );
}

export default TransferPlayer;
