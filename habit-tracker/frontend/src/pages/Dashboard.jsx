import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import { todayString, todayDayName, currentTime, formatTime, subtractMinutes } from '../services/helpers.js';
import ProgressBar from '../components/ProgressBar.jsx';
import ReadinessCard from '../components/ReadinessCard.jsx';
import CheckInForm from '../components/CheckInForm.jsx';
import TodayRoutines from '../components/TodayRoutines.jsx';
import StatCard from '../components/StatCard.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [routines, setRoutines] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [checkin, setCheckin] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const today = todayString();

 
  async function loadDashboard() {
    try {
      const [routineData, completionData, checkinData, analyticsData] = await Promise.all([
        apiRequest('/api/routines'),
        apiRequest(`/api/completions?date=${today}`),
        apiRequest(`/api/checkins?date=${today}`),
        apiRequest('/api/analytics')
      ]);
      setRoutines(routineData.routines);
      setCompletions(completionData.completions);
      setCheckin(checkinData.checkins[0] || null);
      setSummary(analyticsData.summary);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

 
  const activeRoutines = routines.filter((r) => r.isActive);
  const scheduledToday = activeRoutines.filter((r) => r.selectedDays.includes(todayDayName()));

 
  const completionByRoutine = {};
  completions.forEach((completion) => {
    completionByRoutine[completion.routineId] = completion;
  });

  const completedCount = scheduledToday.filter((r) => completionByRoutine[r._id]).length;
  const progress = scheduledToday.length ? Math.round((completedCount / scheduledToday.length) * 100) : 0;
  const readiness = checkin ? checkin.readinessScore : null;
  const lowReadiness = readiness !== null && readiness < 50;


  const nowTime = currentTime();
  const upcomingReminders = scheduledToday
    .filter((r) => r.reminderSettings?.enabled && !completionByRoutine[r._id] && r.preferredTime >= nowTime)
    .map((r) => ({
      id: r._id,
      name: r.name,
      notifyAt: subtractMinutes(r.preferredTime, r.reminderSettings.leadMinutes),
      routineTime: r.preferredTime
    }))
    .sort((a, b) => a.notifyAt.localeCompare(b.notifyAt));

  const streak = summary?.currentStreak ?? 0;
  const streakMessage = streak >= 3
    ? `You've built a ${streak}-day streak. Keep your progress going!`
    : streak > 0
      ? "You've already made progress. Don't underestimate today's small effort."
      : 'Just 5 minutes can help you maintain your routine.';


  async function completeRoutine(routineId, completionType) {
    try {
      await apiRequest('/api/completions', {
        method: 'POST',
        body: { routineId, completionType, date: today }
      });
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  }

  async function undoCompletion(completionId) {
    try {
      await apiRequest(`/api/completions/${completionId}`, { method: 'DELETE' });
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="center-text">Loading your dashboard...</p>;

  const firstName = user?.name?.split(' ')[0] || 'there';
  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Welcome back, {firstName}</h1>
          <p className="muted">{dateLabel}</p>
        </div>
        <Link className="btn btn-secondary" to="/routines">Manage routines</Link>
      </div>

      {error && <p className="error-text">{error}</p>}

      <section className="stats-grid">
        <StatCard label="Total active routines" value={activeRoutines.length} />
        <StatCard label="Completed today" value={`${completedCount} of ${scheduledToday.length}`} />
        <StatCard label="Current streak" value={`${streak} day${streak === 1 ? '' : 's'}`} />
        <StatCard label="Today's progress" value={`${progress}%`}>
          <ProgressBar value={progress} />
        </StatCard>
      </section>

      <p className="muted">{streakMessage}</p>

      {lowReadiness && (
        <div className="notice-box">
          <strong>Readiness Score: {readiness}/100.</strong>{' '}
          Today might be a difficult day. Don't worry about completing everything. Try the small version of your routine and maintain your consistency.
        </div>
      )}

      <section className="two-column">
        <div className="stack">
          <CheckInForm existingCheckIn={checkin} onSaved={loadDashboard} />
          <ReadinessCard score={readiness} />
        </div>

        <div className="card">
          <h3>Upcoming reminders</h3>
          {upcomingReminders.length === 0 ? (
            <p className="muted">No upcoming reminders today.</p>
          ) : (
            <ul className="stack" style={{ marginTop: 10, gap: 10 }}>
              {upcomingReminders.map((item) => (
                <li key={item.id}>
                  <strong>{formatTime(item.notifyAt)}</strong> · {item.name}
                  <span className="muted"> (routine at {formatTime(item.routineTime)})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <TodayRoutines
        routines={scheduledToday}
        completionByRoutine={completionByRoutine}
        lowReadiness={lowReadiness}
        onComplete={completeRoutine}
        onUndo={undoCompletion}
      />
    </div>
  );
}
