import { useState } from 'react';
import { apiRequest } from '../services/api.js';
import { todayString } from '../services/helpers.js';

export default function Settings() {
  const notificationsSupported = 'Notification' in window;
  const [permission, setPermission] = useState(notificationsSupported ? Notification.permission : 'unsupported');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);

  function clearStatus() {
    setMessage('');
    setError('');
  }

  async function enableNotifications() {
    if (!notificationsSupported) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  async function exportData() {
    clearStatus();
    try {
      const data = await apiRequest('/api/data/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `habit-tracker-backup-${todayString()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage('Backup downloaded.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function importData(event) {
    clearStatus();
    const input = event.target;
    const file = input.files[0];
    if (!file) return;

    setWorking(true);
    try {
      const text = await file.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error('This file is not valid JSON.');
      }

      const data = await apiRequest('/api/data/import', { method: 'POST', body: parsed });
      const { routinesAdded, checkinsAdded, completionsAdded, routinesSkipped, checkinsSkipped, completionsSkipped } = data.result;
      const duplicates = routinesSkipped + checkinsSkipped + completionsSkipped;
      setMessage(
        `Import complete: ${routinesAdded} routines, ${checkinsAdded} check-ins and ${completionsAdded} completions added. ${duplicates} duplicate entries skipped.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      input.value = '';
      setWorking(false);
    }
  }

  async function runDemo(confirmed) {
    const data = await apiRequest('/api/data/demo', { method: 'POST', body: { confirmed } });
    setMessage(data.message);
  }

  async function loadDemoData() {
    clearStatus();
    setWorking(true);
    try {
      await runDemo(false);
    } catch (err) {
      if (err.status === 409 && err.data?.requiresConfirmation) {
        if (window.confirm(err.data.message)) {
          try {
            await runDemo(true);
          } catch (retryError) {
            setError(retryError.message);
          }
        }
      } else {
        setError(err.message);
      }
    } finally {
      setWorking(false);
    }
  }

  const permissionText = {
    granted: 'Enabled. Reminders appear as browser notifications.',
    denied: 'Blocked in your browser. Reminders will show inside the app instead.',
    default: 'Not yet allowed. Reminders will show inside the app until you allow notifications.',
    unsupported: 'This browser does not support notifications. Reminders will show inside the app.'
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="muted">Notifications, backups and sample data.</p>
        </div>
      </div>

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      <section className="grid-two">
        <div className="card">
          <h3>Browser notifications</h3>
          <p className="muted">{permissionText[permission] || permissionText.default}</p>
          {permission === 'default' && (
            <button className="btn btn-primary" onClick={enableNotifications}>Allow notifications</button>
          )}
        </div>

        <div className="card">
          <h3>Backup and restore</h3>
          <p className="muted">Download your routines, check-ins and completions as a JSON file. Importing skips anything that already exists.</p>
          <div className="btn-row">
            <button className="btn btn-primary" onClick={exportData}>Export data</button>
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              Import JSON
              <input type="file" accept="application/json,.json" onChange={importData} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        <div className="card">
          <h3>Demo data</h3>
          <p className="muted">Adds sample routines, 14 days of check-ins and completion history so you can explore the charts.</p>
          <button className="btn btn-secondary" onClick={loadDemoData} disabled={working}>
            {working ? 'Working...' : 'Load Demo Data'}
          </button>
        </div>
      </section>
    </div>
  );
}
