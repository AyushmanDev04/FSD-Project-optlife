import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, ScatterChart, Scatter
} from 'recharts';
import { apiRequest } from '../services/api.js';
import { dayShortName, shortDate } from '../services/helpers.js';
import StatCard from '../components/StatCard.jsx';
import HeatmapCalendar from '../components/HeatmapCalendar.jsx';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/api/analytics')
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="page"><p className="error-text">{error}</p></div>;
  if (!data) return <div className="page"><p className="muted">Loading analytics...</p></div>;

  const { summary, history, routineStats, energyTrend, correlation } = data;

  // Data shaped for the charts
  const weekData = history.slice(-7).map((day) => ({
    label: dayShortName(day.date),
    completion: day.percentage ?? 0
  }));

  const monthData = history.slice(-30).map((day) => ({
    label: shortDate(day.date),
    completion: day.percentage ?? 0
  }));

  const energyData = energyTrend.map((item) => ({
    label: shortDate(item.date),
    energy: item.energy,
    sleep: item.sleep,
    dayQuality: item.dayQuality
  }));

  const routineData = routineStats
    .filter((stat) => stat.last30Percentage !== null)
    .map((stat) => ({ name: stat.name, completion: stat.last30Percentage }));

  const scatterData = correlation.points.map((point) => ({
    energy: point.x,
    completion: point.y
  }));

  const formatPercent = (value) => (value === null ? '--' : `${value}%`);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Analytics</h1>
          <p className="muted">Your completion patterns over time.</p>
        </div>
      </div>

      {/* A. Completion statistics */}
      <section className="stats-grid">
        <StatCard label="Daily completion" value={formatPercent(summary.daily)} />
        <StatCard label="Weekly completion" value={formatPercent(summary.weekly)} />
        <StatCard label="Monthly completion" value={formatPercent(summary.monthly)} />
        <StatCard label="Total completed routines" value={summary.totalCompletions} />
      </section>

      {/* B. Charts */}
      <section className="grid-two">
        <div className="card">
          <h3>Weekly habit completion</h3>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="label" />
                <YAxis domain={[0, 100]} unit="%" />
                <Tooltip />
                <Bar dataKey="completion" fill="#5b7fe0" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3>Monthly progress</h3>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="label" hide />
                <YAxis domain={[0, 100]} unit="%" />
                <Tooltip />
                <Line type="monotone" dataKey="completion" stroke="#5b7fe0" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3>Energy level over time</h3>
          {energyData.length === 0 ? (
            <p className="muted">Save a few daily check-ins to see your energy trend.</p>
          ) : (
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={energyData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="label" hide />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="energy" stroke="#2e9e6a" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="dayQuality" stroke="#e8a33d" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="muted" style={{ marginTop: 8 }}>Green: energy · Orange: day quality</p>
        </div>

        <div className="card">
          <h3>Routine-wise completion (last 30 days)</h3>
          {routineData.length === 0 ? (
            <p className="muted">No active routines yet.</p>
          ) : (
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={routineData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis type="category" dataKey="name" width={120} />
                  <Tooltip />
                  <Bar dataKey="completion" fill="#7b9cf0" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* C. Calendar heatmap */}
      <section className="card">
        <h3>Calendar heatmap (last 90 days)</h3>
        <HeatmapCalendar history={history} />
      </section>

      {/* D. Energy vs completion */}
      <section className="card">
        <h3>Energy vs completion</h3>
        {scatterData.length === 0 ? (
          <p className="muted">No days yet with both a check-in and a scheduled routine.</p>
        ) : (
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" dataKey="energy" name="Energy" domain={[0, 10]} label={{ value: 'Energy', position: 'insideBottom', offset: -4 }} />
                <YAxis type="number" dataKey="completion" name="Completion" domain={[0, 100]} unit="%" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={scatterData} fill="#5b7fe0" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="insight-box">
          <strong>Insight: </strong>{correlation.insight}
        </div>
      </section>

      {/* Per-routine streaks */}
      <section className="card">
        <h3>Streaks by routine</h3>
        {routineStats.length === 0 ? (
          <p className="muted">Create a routine to start tracking streaks.</p>
        ) : (
          <ul className="stack" style={{ gap: 10 }}>
            {routineStats.map((stat) => (
              <li key={stat.id} className="today-item">
                <div className="today-info">
                  <strong>{stat.name}{stat.isActive ? '' : ' (paused)'}</strong>
                  <span className="muted">Full: {stat.fullCount} · Small: {stat.smallCount} · Total days: {stat.totalDays}</span>
                </div>
                <div className="streak-row">
                  <span className="badge streak">Current: {stat.currentStreak}</span>
                  <span className="badge streak">Longest: {stat.longestStreak}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
