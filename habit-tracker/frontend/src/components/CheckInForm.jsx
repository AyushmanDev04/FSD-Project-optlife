import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api.js';
import { todayString } from '../services/helpers.js';


const SLIDERS = [
  { key: 'sleep', label: 'Sleep quality' },
  { key: 'energy', label: 'Energy level' },
  { key: 'dayQuality', label: 'Overall day quality' }
];

export default function CheckInForm({ existingCheckIn, onSaved }) {
  const [values, setValues] = useState({ sleep: 5, energy: 5, dayQuality: 5 });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingCheckIn) {
      setValues({
        sleep: existingCheckIn.sleep,
        energy: existingCheckIn.energy,
        dayQuality: existingCheckIn.dayQuality
      });
    }
  }, [existingCheckIn]);

  const previewScore = Math.round(((values.sleep + values.energy + values.dayQuality) / 30) * 100);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (existingCheckIn) {
        await apiRequest(`/api/checkins/${existingCheckIn._id}`, { method: 'PUT', body: values });
        setMessage('Check-in updated.');
      } else {
        await apiRequest('/api/checkins', { method: 'POST', body: { ...values, date: todayString() } });
        setMessage('Check-in saved.');
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h3>{existingCheckIn ? "Today's check-in (editable)" : 'Daily check-in'}</h3>

      {SLIDERS.map((slider) => (
        <div className="slider-row" key={slider.key}>
          <label htmlFor={slider.key}>
            {slider.label}: <strong>{values[slider.key]}/10</strong>
          </label>
          <input
            id={slider.key}
            type="range"
            min="1"
            max="10"
            value={values[slider.key]}
            onChange={(event) => setValues({ ...values, [slider.key]: Number(event.target.value) })}
          />
        </div>
      ))}

      <p className="muted">Readiness preview: {previewScore}/100</p>

      {error && <p className="error-text">{error}</p>}
      {message && <p className="success-text">{message}</p>}

      <button className="btn btn-primary" disabled={saving}>
        {saving ? 'Saving...' : existingCheckIn ? 'Update check-in' : 'Save check-in'}
      </button>
    </form>
  );
}
