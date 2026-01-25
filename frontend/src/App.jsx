import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Players from './pages/Players';
import Matches from './pages/Matches';
import StatsCenter from './pages/StatsCenter';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ height: '100vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <Router>
            {user && <Navbar user={user} onLogout={handleLogout} />}
            <Routes>
                <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
                <Route path="/" element={user ? <Home user={user} /> : <Navigate to="/login" />} />
                <Route path="/players" element={user ? <Players /> : <Navigate to="/login" />} />
                <Route path="/matches" element={user ? <Matches /> : <Navigate to="/login" />} />
                <Route path="/stats" element={<StatsCenter />} />
                <Route path="/admin" element={user && user.role === 'ADMIN' ? <AdminPanel /> : <Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

export default App;
