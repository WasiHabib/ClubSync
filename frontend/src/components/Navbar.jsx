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
                            to="/clubs"
                            style={{
                                color: isActive('/clubs') ? 'var(--status-success)' : 'var(--text-secondary)',
                                fontWeight: isActive('/clubs') ? 700 : 400,
                                textDecoration: 'none',
                                transition: 'color 0.3s ease',
                                textTransform: 'uppercase',
                                fontSize: '0.9rem',
                                letterSpacing: '0.05em'
                            }}
                        >
                            Clubs
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
                            to="/managers"
                            style={{
                                color: isActive('/managers') ? 'var(--status-success)' : 'var(--text-secondary)',
                                fontWeight: isActive('/managers') ? 700 : 400,
                                textDecoration: 'none',
                                transition: 'color 0.3s ease',
                                textTransform: 'uppercase',
                                fontSize: '0.9rem',
                                letterSpacing: '0.05em'
                            }}
                        >
                            Managers
                        </Link>
                        <Link
                            to="/search"
                            style={{
                                color: isActive('/search') ? 'var(--status-success)' : 'var(--text-secondary)',
                                fontWeight: isActive('/search') ? 700 : 400,
                                textDecoration: 'none',
                                transition: 'color 0.3s ease',
                                textTransform: 'uppercase',
                                fontSize: '0.9rem',
                                letterSpacing: '0.05em'
                            }}
                        >
                            Search
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
                        {user && user.role === 'ADMIN' && (
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
                    {user ? (
                        <>
                            <Link to="/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontFamily: 'var(--font-heading)', transition: 'color 0.2s', ':hover': { color: 'var(--primary-color)' } }}>
                                    {user.username}
                                    <span className="badge badge-info" style={{ marginLeft: '0.5rem' }}>
                                        {user.role}
                                    </span>
                                </span>
                            </Link>
                            <button onClick={onLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1.5rem', fontSize: '0.8rem' }}>
                                LOGOUT
                            </button>
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Link to="/login" className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', fontSize: '0.8rem', textDecoration: 'none' }}>
                                LOGIN
                            </Link>
                            <Link to="/register" className="btn btn-secondary" style={{ padding: '0.5rem 1.5rem', fontSize: '0.8rem', textDecoration: 'none' }}>
                                REGISTER
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
