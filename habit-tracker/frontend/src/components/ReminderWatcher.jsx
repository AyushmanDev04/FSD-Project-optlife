import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import { todayString, todayDayName, formatTime } from '../services/helpers.js';

export default function ReminderWatcher() {
  const { user } = useAuth();
  const [routines, setRoutines] = useState([]);
  const [notice, setNotice] = useState('');
  const firedToday = useRef(new Set());

  useEffect(() => {
    if (!user) return undefined;

    async function loadRoutines() {
      try {
        const data = await apiRequest('/api/routines');
        setRoutines(data.routines);
      } catch {
       
      }
    }

    loadRoutines();
    const refreshTimer = setInterval(loadRoutines, 5 * 60 * 1000);
    return () => clearInterval(refreshTimer);
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;

    function showReminder(routine) {
      const body = `${routine.name} starts at ${formatTime(routine.preferredTime)}. IF ${routine.trigger}, THEN ${routine.fullVersion} (or ${routine.smallVersion}).`;

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Habit Tracker reminder', { body });
      } else {
        setNotice(body);
      }
    }

    function checkReminders() {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const today = todayString();
      const dayName = todayDayName();

      routines.forEach((routine) => {
        if (!routine.isActive || !routine.reminderSettings?.enabled) return;
        if (!routine.selectedDays.includes(dayName)) return;

        const [hour, minute] = routine.preferredTime.split(':').map(Number);
        const routineMinutes = hour * 60 + minute;
        const reminderMinutes = routineMinutes - routine.reminderSettings.leadMinutes;

        // Fire only once per routine per day, between the reminder time and the routine time
        const key = `${routine._id}-${today}`;
        if (nowMinutes >= reminderMinutes && nowMinutes < routineMinutes && !firedToday.current.has(key)) {
          firedToday.current.add(key);
          showReminder(routine);
        }
      });
    }

    checkReminders();
    const checkTimer = setInterval(checkReminders, 30 * 1000);
    return () => clearInterval(checkTimer);
  }, [user, routines]);

  if (!notice) return null;

  return (
    <div className="toast" role="status">
      <p>{notice}</p>
      <button className="btn btn-small btn-secondary" onClick={() => setNotice('')}>Dismiss</button>
    </div>
  );
}
