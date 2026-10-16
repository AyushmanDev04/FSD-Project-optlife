import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api.js';
import { formatTime } from '../services/helpers.js';
import RoutineForm from '../components/RoutineForm.jsx';
import ProgressBar from '../components/ProgressBar.jsx';

export default function Routines() {
  const [routines, setRoutines] = useState([]);
  const [statsById, setStatsById] = useState({});
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadData() {
    try {
      const [routineData, analyticsData] = await Promise.all([
        apiRequest('/api/routines'),
        apiRequest('/api/analytics')
      ]);
      setRoutines(routineData.routines);

      const map = {};
      analyticsData.routineStats.forEach((stat) => {
        map[stat.id] = stat;
      });
      setStatsById(map);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openNewForm() {
    setEditingRoutine(null);
    setShowForm(true);
    setMessage('');
    setError('');
  }

  function openEditForm(routine) {
    setEditingRoutine(routine);
    setShowForm(true);
    setMessage('');
    setError('');
  }

  function closeForm() {
    setShowForm(false);
    setEditingRoutine(null);
  }

  // Saves a new routine or updates the one being edited. Throws on failure so the form can show the error.
  async function saveRoutine(payload) {
    if (editingRoutine) {
      await apiRequest(`/api/routines/${editingRoutine._id}`, { method: 'PUT', body: payload });
      setMessage('Routine updated.');
    } else {
      await apiRequest('/api/routines', { method: 'POST', body: payload });
      setMessage('Routine created.');
    }
    closeForm();
    await loadData();
  }

  // Pause or activate a routine by sending the whole routine with isActive flipped
  async function togglePause(routine) {
    try {
      await apiRequest(`/api/routines/${routine._id}`, {
        method: 'PUT',
        body: { ...routine, isActive: !routine.isActive }
      });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteRoutine(routine) {
    if (!window.confirm(`Delete "${routine.name}"? Its completion history will be removed too.`)) return;

    try {
      await apiRequest(`/api/routines/${routine._id}`, { method: 'DELETE' });
      setMessage('Routine deleted.');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Routine management</h1>
          <p className="muted">Each routine follows the pattern: IF a situation happens, THEN do the habit.</p>
        </div>
        {!showForm && <button className="btn btn-primary" onClick={openNewForm}>Add routine</button>}
      </div>

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      {showForm && (
        <RoutineForm initialRoutine={editingRoutine} onSave={saveRoutine} onCancel={closeForm} />
      )}

      {routines.length === 0 && !showForm && (
        <div className="card">
          <p className="muted">You have no routines yet. Click "Add routine" or start from a template.</p>
        </div>
      )}

      <div className="grid-two">
        {routines.map((routine) => {
          const stats = statsById[routine._id] || {};

          return (
            <div className="card" key={routine._id}>
              <div className="routine-header">
                <h3>{routine.name}</h3>
                <span className={`badge ${routine.isActive ? '' : 'paused'}`}>
                  {routine.isActive ? 'Active' : 'Paused'}
                </span>
              </div>

              {routine.description && <p className="muted">{routine.description}</p>}

              <div className="routine-details">
                <span><strong>IF</strong> {routine.trigger}</span>
                <span><strong>THEN</strong> {routine.fullVersion}</span>
                <span><strong>Small version:</strong> {routine.smallVersion}</span>
                <span><strong>Days:</strong> {routine.selectedDays.join(', ')}</span>
                <span><strong>Time:</strong> {formatTime(routine.preferredTime)}</span>
                <span>
                  <strong>Reminder:</strong>{' '}
                  {routine.reminderSettings?.enabled
                    ? `${routine.reminderSettings.leadMinutes} minutes before`
                    : 'Off'}
                </span>
              </div>

              <div className="streak-row">
                <span className="badge streak">Current streak: {stats.currentStreak ?? 0}</span>
                <span className="badge streak">Longest: {stats.longestStreak ?? 0}</span>
                <span className="badge">Total days: {stats.totalDays ?? 0}</span>
                <span className="badge">Full: {stats.fullCount ?? 0} · Small: {stats.smallCount ?? 0}</span>
              </div>

              <p className="muted" style={{ marginTop: 10, marginBottom: 0 }}>
                Last 30 days: {stats.last30Percentage ?? 0}%
              </p>
              <ProgressBar value={stats.last30Percentage ?? 0} />

              <div className="btn-row" style={{ marginTop: 10 }}>
                <button className="btn btn-small btn-secondary" onClick={() => openEditForm(routine)}>Edit</button>
                <button className="btn btn-small btn-secondary" onClick={() => togglePause(routine)}>
                  {routine.isActive ? 'Pause' : 'Activate'}
                </button>
                <button className="btn btn-small btn-danger" onClick={() => deleteRoutine(routine)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
