import { Link, useLocation } from 'react-router-dom';

function Navbar({ user, onLogout }) {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <nav style={{
            position: 'sticky',
            top: 0,
            zIndex: 100
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
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        letterSpacing: '0.05em'
                    }}>
                        ⚽ CLUBSYNC
                    </Link>

                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <Link
                            to="/"
                            style={{
                                color: isActive('/') ? 'var(--status-success)' : 'var(--text-secondary)',
                                fontWeight: isActive('/') ? 700 : 400,
                                textDecoration: 'none',
                                transition: 'color 0.3s ease',
                                textTransform: 'uppercase',
                                fontSize: '0.9rem',
                                letterSpacing: '0.05em'
                            }}
                        >
                            Dashboard
                        </Link>
                        <Link
                            to="/players"
                            style={{
                                color: isActive('/players') ? 'var(--status-success)' : 'var(--text-secondary)',
                                fontWeight: isActive('/players') ? 700 : 400,
                                textDecoration: 'none',
                                transition: 'color 0.3s ease',
                                textTransform: 'uppercase',
                                fontSize: '0.9rem',
                                letterSpacing: '0.05em'
                            }}
                        >
                            Players
                        </Link>
                        <Link
                            to="/matches"
                            style={{
                                color: isActive('/matches') ? 'var(--status-success)' : 'var(--text-secondary)',
                                fontWeight: isActive('/matches') ? 700 : 400,
                                textDecoration: 'none',
                                transition: 'color 0.3s ease',
                                textTransform: 'uppercase',
                                fontSize: '0.9rem',
                                letterSpacing: '0.05em'
                            }}
                        >
                            Matches
                        </Link>
                        <Link
                            to="/stats"
                            style={{
                                color: isActive('/stats') ? 'var(--status-success)' : 'var(--text-secondary)',
                                fontWeight: isActive('/stats') ? 700 : 400,
                                textDecoration: 'none',
                                transition: 'color 0.3s ease',
                                textTransform: 'uppercase',
                                fontSize: '0.9rem',
                                letterSpacing: '0.05em'
                            }}
                        >
                            Stats Center
                        </Link>
                        {user.role === 'ADMIN' && (
                            <Link
                                to="/admin"
                                style={{
                                    color: isActive('/admin') ? 'var(--status-danger)' : 'var(--text-secondary)',
                                    fontWeight: isActive('/admin') ? 700 : 400,
                                    textDecoration: 'none',
                                    transition: 'color 0.3s ease',
                                    textTransform: 'uppercase',
                                    fontSize: '0.9rem',
                                    letterSpacing: '0.05em'
                                }}
                            >
                                Admin
                            </Link>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontFamily: 'var(--font-heading)' }}>
                        {user.username}
                        <span className="badge badge-info" style={{ marginLeft: '0.5rem' }}>
                            {user.role}
                        </span>
                    </span>
                    <button onClick={onLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1.5rem', fontSize: '0.8rem' }}>
                        LOGOUT
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
