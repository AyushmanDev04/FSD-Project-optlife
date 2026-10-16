import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="navbar">
      <div className="brand">Habit Tracker</div>

      <nav className="nav-links">
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/routines">Routines</NavLink>
        <NavLink to="/analytics">Analytics</NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </nav>

      <div className="nav-actions">
        <button className="btn btn-small btn-secondary" onClick={toggleTheme}>
          {theme === 'light' ? 'Dark mode' : 'Light mode'}
        </button>
        <span className="muted" style={{ alignSelf: 'center' }}>{user?.name}</span>
        <button className="btn btn-small btn-danger" onClick={logout}>Logout</button>
      </div>
    </header>
  );
}
