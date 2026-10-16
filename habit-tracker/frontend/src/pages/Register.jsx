import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';

export default function Register() {
  const { user, saveSession } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: { name: form.name, email: form.email, password: form.password }
      });
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
        <h1>Create account</h1>
        <p className="muted">Start building consistent routines today.</p>

        <div className="form-field">
          <label htmlFor="name">Name</label>
          <input id="name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>

        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>

        <div className="form-field">
          <label htmlFor="password">Password (at least 6 characters)</label>
          <input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>

        <div className="form-field">
          <label htmlFor="confirmPassword">Confirm password</label>
          <input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </button>

        <p className="muted" style={{ marginTop: 16 }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
