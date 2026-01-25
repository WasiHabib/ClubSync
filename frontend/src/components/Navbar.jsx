import { Link, useLocation } from 'react-router-dom';

function Navbar({ user, onLogout }) {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <nav style={{
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            backdropFilter: 'blur(10px)'
        }}>
            <div className="container" style={{
                padding: '1rem var(--spacing-lg)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <Link to="/" style={{
                        fontSize: '1.5rem',
                        fontWeight: '800',
                        background: 'var(--gradient-success)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textDecoration: 'none'
                    }}>
                        ⚽ CLUBSYNC
                    </Link>

                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <Link
                            to="/"
                            style={{
                                color: isActive('/') ? 'var(--accent-green)' : 'var(--text-secondary)',
                                fontWeight: isActive('/') ? 600 : 400,
                                textDecoration: 'none',
                                transition: 'color var(--transition-fast)'
                            }}
                        >
                            Dashboard
                        </Link>
                        <Link
                            to="/players"
                            style={{
                                color: isActive('/players') ? 'var(--accent-green)' : 'var(--text-secondary)',
                                fontWeight: isActive('/players') ? 600 : 400,
                                textDecoration: 'none',
                                transition: 'color var(--transition-fast)'
                            }}
                        >
                            Players
                        </Link>
                        <Link
                            to="/matches"
                            style={{
                                color: isActive('/matches') ? 'var(--accent-green)' : 'var(--text-secondary)',
                                fontWeight: isActive('/matches') ? 600 : 400,
                                textDecoration: 'none',
                                transition: 'color var(--transition-fast)'
                            }}
                        >
                            Matches
                        </Link>
                        <Link
                            to="/stats"
                            style={{
                                color: isActive('/stats') ? 'var(--accent-green)' : 'var(--text-secondary)',
                                fontWeight: isActive('/stats') ? 600 : 400,
                                textDecoration: 'none',
                                transition: 'color var(--transition-fast)'
                            }}
                        >
                            Stats Center
                        </Link>
                        {user.role === 'ADMIN' && (
                            <Link
                                to="/admin"
                                style={{
                                    color: isActive('/admin') ? 'var(--accent-green)' : 'var(--text-secondary)',
                                    fontWeight: isActive('/admin') ? 600 : 400,
                                    textDecoration: 'none',
                                    transition: 'color var(--transition-fast)'
                                }}
                            >
                                Admin
                            </Link>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {user.username}
                        <span className="badge badge-info" style={{ marginLeft: '0.5rem' }}>
                            {user.role}
                        </span>
                    </span>
                    <button onClick={onLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
