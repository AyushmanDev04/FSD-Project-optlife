const express = require('express');
const Routine = require('../models/Routine');
const Completion = require('../models/Completion');
const DailyCheckIn = require('../models/DailyCheckIn');
const requireAuth = require('../middleware/auth');
const {
  todayString,
  isValidDate,
  addDays,
  dayNameOf,
  calculateReadiness,
  validateScores,
  validateRoutineInput
} = require('../utils/helpers');

const router = express.Router();
router.use(requireAuth);

const COMPLETION_TYPES = ['full', 'small'];


function buildDemoData(today) {
  const routines = [
    {
      name: 'Morning Reading',
      description: 'Build a calm reading habit before the day starts.',
      trigger: 'After having breakfast',
      fullVersion: 'Read for 30 minutes',
      smallVersion: 'Read for 5 minutes',
      selectedDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      preferredTime: '07:30',
      reminderSettings: { enabled: true, leadMinutes: 10 },
      isActive: true
    },
    {
      name: 'Morning Stretch',
      description: 'Wake up the body gently.',
      trigger: 'After brushing my teeth',
      fullVersion: 'Stretch for 15 minutes',
      smallVersion: 'Stretch for 2 minutes',
      selectedDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      preferredTime: '06:30',
      reminderSettings: { enabled: true, leadMinutes: 5 },
      isActive: true
    },
    {
      name: 'Evening Exercise',
      description: 'Move the body after work.',
      trigger: 'After finishing work',
      fullVersion: 'Exercise for 45 minutes',
      smallVersion: 'Walk for 10 minutes',
      selectedDays: ['Mon', 'Wed', 'Fri'],
      preferredTime: '18:30',
      reminderSettings: { enabled: true, leadMinutes: 15 },
      isActive: true
    },
    {
      name: 'Study Session',
      description: 'Steady study time on weekdays.',
      trigger: 'After my evening tea',
      fullVersion: 'Study for 60 minutes',
      smallVersion: 'Review notes for 10 minutes',
      selectedDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      preferredTime: '19:30',
      reminderSettings: { enabled: false, leadMinutes: 10 },
      isActive: true
    },
    {
      name: 'Meditation',
      description: 'A short sit before the day begins.',
      trigger: 'Before getting out of bed',
      fullVersion: 'Meditate for 20 minutes',
      smallVersion: 'Breathe deeply for 2 minutes',
      selectedDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      preferredTime: '06:00',
      reminderSettings: { enabled: true, leadMinutes: 5 },
      isActive: true
    },
    {
      name: 'Sleep Routine',
      description: 'Wind down before bed.',
      trigger: 'At 10:00 PM',
      fullVersion: 'Phone off and lights out by 10:30 PM',
      smallVersion: 'Phone off by 10:30 PM',
      selectedDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      preferredTime: '22:00',
      reminderSettings: { enabled: true, leadMinutes: 15 },
      isActive: true
    }
  ];

  const checkins = [];
  const completions = [];

  for (let offset = 0; offset < 14; offset += 1) {
    const date = addDays(today, -offset);

    checkins.push({
      date,
      sleep: 5 + ((offset * 3) % 5),
      energy: 4 + ((offset * 7) % 6),
      dayQuality: 5 + ((offset * 5) % 5)
    });

    routines.forEach((routine, index) => {
      if (!routine.selectedDays.includes(dayNameOf(date))) return;
    
      if ((offset * 3 + index) % 5 === 0) return;

      completions.push({
        routineName: routine.name,
        date,
        completionType: (offset + index) % 3 === 0 ? 'small' : 'full'
      });
    });
  }

  return { routines, checkins, completions };
}


async function importUserData(userId, data) {
  if (!data || typeof data !== 'object') {
    return { error: 'The file does not contain valid habit data' };
  }

  const routineList = Array.isArray(data.routines) ? data.routines : [];
  const checkinList = Array.isArray(data.checkins) ? data.checkins : [];
  const completionList = Array.isArray(data.completions) ? data.completions : [];

 
  const problems = [];
  const validRoutines = [];

  routineList.forEach((item, index) => {
    const check = validateRoutineInput(item);
    if (check.error) problems.push(`Routine ${index + 1}: ${check.error}`);
    else validRoutines.push(check.data);
  });

  checkinList.forEach((item, index) => {
    if (!isValidDate(item.date)) problems.push(`Check-in ${index + 1}: invalid date`);
    const scores = validateScores(item);
    if (scores.error) problems.push(`Check-in ${index + 1}: ${scores.error}`);
  });

  completionList.forEach((item, index) => {
    if (typeof item.routineName !== 'string') problems.push(`Completion ${index + 1}: missing routine name`);
    if (!isValidDate(item.date)) problems.push(`Completion ${index + 1}: invalid date`);
    if (!COMPLETION_TYPES.includes(item.completionType)) problems.push(`Completion ${index + 1}: invalid type`);
  });

  if (problems.length > 0) {
    return { error: `The file has ${problems.length} problem(s). ${problems.slice(0, 3).join('. ')}` };
  }

  
  const existingRoutines = await Routine.find({ userId });
  const seenRoutineKeys = new Set(existingRoutines.map((r) => `${r.name}|${r.trigger}`));
  const routinesToAdd = [];
  for (const routine of validRoutines) {
    const key = `${routine.name}|${routine.trigger}`;
    if (seenRoutineKeys.has(key)) continue;
    seenRoutineKeys.add(key);
    routinesToAdd.push(routine);
  }
  if (routinesToAdd.length > 0) {
    await Routine.insertMany(routinesToAdd.map((routine) => ({ ...routine, userId })));
  }

  const allRoutines = await Routine.find({ userId });
  const routineIdByName = {};
  for (const routine of allRoutines) {
    if (!routineIdByName[routine.name]) routineIdByName[routine.name] = routine._id;
  }


  const existingCheckins = await DailyCheckIn.find({ userId }).select('date');
  const seenDates = new Set(existingCheckins.map((c) => c.date));
  const checkinDocs = [];
  for (const item of checkinList) {
    if (seenDates.has(item.date)) continue;
    seenDates.add(item.date);
    const scores = validateScores(item).data;
    checkinDocs.push({
      userId,
      date: item.date,
      ...scores,
      readinessScore: calculateReadiness(scores.sleep, scores.energy, scores.dayQuality)
    });
  }
  if (checkinDocs.length > 0) {
    await DailyCheckIn.insertMany(checkinDocs);
  }


  const existingCompletions = await Completion.find({ userId }).select('routineId date');
  const seenCompletionKeys = new Set(existingCompletions.map((c) => `${c.routineId}|${c.date}`));
  const completionDocs = [];
  let skippedCompletions = 0;
  for (const item of completionList) {
    const routineId = routineIdByName[item.routineName];
    const key = `${routineId}|${item.date}`;
    if (!routineId || seenCompletionKeys.has(key)) {
      skippedCompletions += 1;
      continue;
    }
    seenCompletionKeys.add(key);
    completionDocs.push({
      userId,
      routineId,
      date: item.date,
      completionType: item.completionType,
      completedAt: new Date()
    });
  }
  if (completionDocs.length > 0) {
    await Completion.insertMany(completionDocs);
  }

  return {
    result: {
      routinesAdded: routinesToAdd.length,
      routinesSkipped: validRoutines.length - routinesToAdd.length,
      checkinsAdded: checkinDocs.length,
      checkinsSkipped: checkinList.length - checkinDocs.length,
      completionsAdded: completionDocs.length,
      completionsSkipped: skippedCompletions
    }
  };
}

router.get('/export', async (req, res, next) => {
  try {
    const userId = req.userId;
    const [routines, checkins, completions] = await Promise.all([
      Routine.find({ userId }).lean(),
      DailyCheckIn.find({ userId }).lean(),
      Completion.find({ userId }).lean()
    ]);

    const nameById = {};
    routines.forEach((routine) => {
      nameById[String(routine._id)] = routine.name;
    });

    res.json({
      app: 'habit-tracker',
      version: 1,
      exportedAt: new Date().toISOString(),
      routines: routines.map((r) => ({
        name: r.name,
        description: r.description,
        trigger: r.trigger,
        fullVersion: r.fullVersion,
        smallVersion: r.smallVersion,
        selectedDays: r.selectedDays,
        preferredTime: r.preferredTime,
        reminderSettings: {
          enabled: r.reminderSettings.enabled,
          leadMinutes: r.reminderSettings.leadMinutes
        },
        isActive: r.isActive
      })),
      checkins: checkins.map((c) => ({
        date: c.date,
        sleep: c.sleep,
        energy: c.energy,
        dayQuality: c.dayQuality
      })),
      completions: completions
        .map((c) => ({
          routineName: nameById[String(c.routineId)],
          date: c.date,
          completionType: c.completionType
        }))
        .filter((c) => c.routineName)
    });
  } catch (error) {
    next(error);
  }
});

router.post('/import', async (req, res, next) => {
  try {
    const outcome = await importUserData(req.userId, req.body);
    if (outcome.error) return res.status(400).json({ message: outcome.error });

    res.json({ message: 'Import complete. Duplicate entries were skipped.', result: outcome.result });
  } catch (error) {
    next(error);
  }
});

router.post('/demo', async (req, res, next) => {
  try {
    const userId = req.userId;
    const existingRoutines = await Routine.countDocuments({ userId });
    const existingCheckins = await DailyCheckIn.countDocuments({ userId });

    if ((existingRoutines > 0 || existingCheckins > 0) && req.body.confirmed !== true) {
      return res.status(409).json({
        requiresConfirmation: true,
        message: 'You already have habits or check-ins. Loading demo data adds sample entries and keeps your existing data. Do you want to continue?'
      });
    }

    const outcome = await importUserData(userId, buildDemoData(todayString()));
    if (outcome.error) return res.status(500).json({ message: 'Could not create demo data' });

    res.json({ message: 'Demo data loaded. Existing entries were kept and duplicates were skipped.', result: outcome.result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
