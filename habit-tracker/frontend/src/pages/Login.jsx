import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';

export default function Login() {
  const { user, saveSession } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const data = await apiRequest('/api/auth/login', { method: 'POST', body: form });
      saveSession(data);
      navigate('/');
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Habit Tracker</h1>
        <p className="muted">Log in to continue your routines.</p>

        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>

        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Log in'}
        </button>

        <p className="muted" style={{ marginTop: 16 }}>
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
