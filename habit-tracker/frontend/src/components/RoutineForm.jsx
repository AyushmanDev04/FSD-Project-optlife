import { useState } from 'react';

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const LEAD_OPTIONS = [5, 10, 15, 30];

const TEMPLATES = {
  morning: {
    label: 'Morning routine',
    name: 'Morning routine',
    description: 'Start the day with a calm sequence.',
    trigger: 'After I wake up',
    fullVersion: 'Make bed and drink a glass of water',
    smallVersion: 'Drink a glass of water',
    selectedDays: ALL_DAYS,
    preferredTime: '07:00'
  },
  reading: {
    label: 'Reading routine',
    name: 'Reading routine',
    description: 'Read a little every day.',
    trigger: 'After having breakfast',
    fullVersion: 'Read for 30 minutes',
    smallVersion: 'Read for 5 minutes',
    selectedDays: ALL_DAYS,
    preferredTime: '07:30'
  },
  exercise: {
    label: 'Exercise routine',
    name: 'Exercise routine',
    description: 'Keep the body active.',
    trigger: 'After finishing work',
    fullVersion: 'Exercise for 45 minutes',
    smallVersion: 'Do 10 minutes of stretching',
    selectedDays: ['Mon', 'Wed', 'Fri'],
    preferredTime: '18:30'
  },
  study: {
    label: 'Study routine',
    name: 'Study routine',
    description: 'Steady study time on weekdays.',
    trigger: 'After my evening tea',
    fullVersion: 'Study for 60 minutes',
    smallVersion: 'Review notes for 10 minutes',
    selectedDays: WEEKDAYS,
    preferredTime: '19:30'
  },
  sleep: {
    label: 'Sleep routine',
    name: 'Sleep routine',
    description: 'Wind down before bed.',
    trigger: 'At 10:00 PM',
    fullVersion: 'Phone off and lights out',
    smallVersion: 'Put phone on charger outside the bedroom',
    selectedDays: ALL_DAYS,
    preferredTime: '22:00'
  },
  meditation: {
    label: 'Meditation routine',
    name: 'Meditation routine',
    description: 'A short sit to begin the day.',
    trigger: 'Before getting out of bed',
    fullVersion: 'Meditate for 20 minutes',
    smallVersion: 'Take 5 slow breaths',
    selectedDays: ALL_DAYS,
    preferredTime: '06:00'
  }
};

const EMPTY_FORM = {
  name: '',
  description: '',
  trigger: '',
  fullVersion: '',
  smallVersion: '',
  selectedDays: WEEKDAYS,
  preferredTime: '07:00',
  reminderEnabled: false,
  leadMinutes: 10,
  isActive: true
};

export default function RoutineForm({ initialRoutine, onSave, onCancel }) {
  const [form, setForm] = useState(() => {
    if (!initialRoutine) return EMPTY_FORM;
    return {
      name: initialRoutine.name,
      description: initialRoutine.description || '',
      trigger: initialRoutine.trigger,
      fullVersion: initialRoutine.fullVersion,
      smallVersion: initialRoutine.smallVersion,
      selectedDays: initialRoutine.selectedDays,
      preferredTime: initialRoutine.preferredTime,
      reminderEnabled: initialRoutine.reminderSettings?.enabled || false,
      leadMinutes: initialRoutine.reminderSettings?.leadMinutes || 10,
      isActive: initialRoutine.isActive
    };
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function updateField(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function toggleDay(day) {
    setForm((previous) => ({
      ...previous,
      selectedDays: previous.selectedDays.includes(day)
        ? previous.selectedDays.filter((d) => d !== day)
        : [...previous.selectedDays, day]
    }));
  }

  function applyTemplate(template) {
    setForm((previous) => ({
      ...previous,
      name: template.name,
      description: template.description,
      trigger: template.trigger,
      fullVersion: template.fullVersion,
      smallVersion: template.smallVersion,
      selectedDays: template.selectedDays,
      preferredTime: template.preferredTime
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      name: form.name,
      description: form.description,
      trigger: form.trigger,
      fullVersion: form.fullVersion,
      smallVersion: form.smallVersion,
      selectedDays: form.selectedDays,
      preferredTime: form.preferredTime,
      reminderSettings: {
        enabled: form.reminderEnabled,
        leadMinutes: Number(form.leadMinutes)
      },
      isActive: form.isActive
    };

    try {
      await onSave(payload);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h3>{initialRoutine ? 'Edit routine' : 'New routine'}</h3>

      {!initialRoutine && (
        <>
          <p className="muted">Start from a template (optional):</p>
          <div className="template-row">
            {Object.entries(TEMPLATES).map(([key, template]) => (
              <button type="button" key={key} className="btn btn-small btn-secondary" onClick={() => applyTemplate(template)}>
                {template.label}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="name">Routine name</label>
          <input id="name" type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
        </div>
        <div className="form-field">
          <label htmlFor="preferredTime">Preferred time</label>
          <input id="preferredTime" type="time" value={form.preferredTime} onChange={(e) => updateField('preferredTime', e.target.value)} required />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="description">Description</label>
        <textarea id="description" value={form.description} onChange={(e) => updateField('description', e.target.value)} />
      </div>

      <div className="form-field">
        <label htmlFor="trigger">IF (trigger or situation)</label>
        <input id="trigger" type="text" placeholder="e.g. After having breakfast" value={form.trigger} onChange={(e) => updateField('trigger', e.target.value)} required />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="fullVersion">THEN (full version)</label>
          <input id="fullVersion" type="text" placeholder="e.g. Read for 30 minutes" value={form.fullVersion} onChange={(e) => updateField('fullVersion', e.target.value)} required />
        </div>
        <div className="form-field">
          <label htmlFor="smallVersion">Small version</label>
          <input id="smallVersion" type="text" placeholder="e.g. Read for 5 minutes" value={form.smallVersion} onChange={(e) => updateField('smallVersion', e.target.value)} required />
        </div>
      </div>

      <div className="form-field">
        <label>Days of the week</label>
        <div className="day-picker">
          {ALL_DAYS.map((day) => (
            <button
              type="button"
              key={day}
              className={`day-chip ${form.selectedDays.includes(day) ? 'selected' : ''}`}
              onClick={() => toggleDay(day)}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="leadMinutes">Reminder lead time</label>
          <select id="leadMinutes" value={form.leadMinutes} onChange={(e) => updateField('leadMinutes', Number(e.target.value))}>
            {LEAD_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>{minutes} minutes before</option>
            ))}
          </select>
        </div>
        <div className="form-field" style={{ justifyContent: 'flex-end' }}>
          <label className="checkbox-row">
            <input type="checkbox" checked={form.reminderEnabled} onChange={(e) => updateField('reminderEnabled', e.target.checked)} />
            Enable reminder
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={form.isActive} onChange={(e) => updateField('isActive', e.target.checked)} />
            Routine is active
          </label>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="btn-row">
        <button className="btn btn-primary" disabled={saving || form.selectedDays.length === 0}>
          {saving ? 'Saving...' : 'Save routine'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
