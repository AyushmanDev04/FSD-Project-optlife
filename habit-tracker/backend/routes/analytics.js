const express = require('express');
const Routine = require('../models/Routine');
const Completion = require('../models/Completion');
const DailyCheckIn = require('../models/DailyCheckIn');
const requireAuth = require('../middleware/auth');
const { todayString, addDays, dayNameOf, calculateStreaks } = require('../utils/helpers');

const router = express.Router();
router.use(requireAuth);

function combinePeriod(days) {
  const scheduled = days.reduce((sum, day) => sum + day.scheduled, 0);
  const completed = days.reduce((sum, day) => sum + day.completed, 0);
  return {
    scheduled,
    completed,
    percentage: scheduled ? Math.round((completed / scheduled) * 100) : null
  };
}

function pearsonCorrelation(points) {
  const n = points.length;
  if (n < 2) return null;

  const meanX = points.reduce((sum, p) => sum + p.x, 0) / n;
  const meanY = points.reduce((sum, p) => sum + p.y, 0) / n;

  let numerator = 0;
  let spreadX = 0;
  let spreadY = 0;
  for (const p of points) {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    numerator += dx * dy;
    spreadX += dx * dx;
    spreadY += dy * dy;
  }

  if (spreadX === 0 || spreadY === 0) return null;
  return numerator / Math.sqrt(spreadX * spreadY);
}

function buildInsight(pointCount, correlation) {
  if (pointCount < 7) {
    return {
      enoughData: false,
      insight: 'Keep logging check-ins and routines for at least 7 days to see a pattern.'
    };
  }
  if (correlation === null || Math.abs(correlation) < 0.3) {
    return {
      enoughData: true,
      insight: 'There is no clear link between your energy and routine completion yet.'
    };
  }
  if (correlation > 0) {
    return {
      enoughData: true,
      insight: `Your routine completion tends to be higher on days when your energy level is higher. This is based on ${pointCount} days, so it is a pattern, not proof.`
    };
  }
  return {
    enoughData: true,
    insight: `Your routine completion tends to be lower on days when your energy level is higher. This is based on ${pointCount} days, so it is a pattern, not proof.`
  };
}

// GET /api/analytics - all statistics for the logged-in user
router.get('/', async (req, res, next) => {
  try {
    const userId = req.userId;
    const today = todayString();

    const [routines, completions, checkins] = await Promise.all([
      Routine.find({ userId }).lean(),
      Completion.find({ userId }).lean(),
      DailyCheckIn.find({ userId }).lean()
    ]);

    const completionsByDate = {};
    for (const completion of completions) {
      if (!completionsByDate[completion.date]) completionsByDate[completion.date] = [];
      completionsByDate[completion.date].push(String(completion.routineId));
    }

    const checkinByDate = {};
    for (const checkin of checkins) {
      checkinByDate[checkin.date] = checkin;
    }

    const history = [];
    for (let offset = 89; offset >= 0; offset -= 1) {
      const date = addDays(today, -offset);
      const dayName = dayNameOf(date);

      const scheduledIds = routines
        .filter((routine) => routine.isActive && routine.selectedDays.includes(dayName))
        .map((routine) => String(routine._id));
      const scheduledSet = new Set(scheduledIds);

      const completedIds = new Set(
        (completionsByDate[date] || []).filter((id) => scheduledSet.has(id))
      );

      const scheduled = scheduledIds.length;
      const completed = completedIds.size;
      const checkin = checkinByDate[date];

      history.push({
        date,
        scheduled,
        completed,
        percentage: scheduled ? Math.round((completed / scheduled) * 100) : null,
        energy: checkin ? checkin.energy : null,
        readinessScore: checkin ? checkin.readinessScore : null
      });
    }

    const last7 = history.slice(-7);
    const last30 = history.slice(-30);
    const todayEntry = history[history.length - 1];
    const overall = calculateStreaks(completions.map((c) => c.date), today);

   
    const routineStats = routines.map((routine) => {
      const routineId = String(routine._id);
      const routineCompletions = completions.filter((c) => String(c.routineId) === routineId);
      const streaks = calculateStreaks(routineCompletions.map((c) => c.date), today);

      const scheduledLast30 = last30.filter(
        (day) => routine.isActive && routine.selectedDays.includes(dayNameOf(day.date))
      ).length;

      const completedLast30 = routineCompletions.filter(
        (c) => last30.some((day) => day.date === c.date) && routine.selectedDays.includes(dayNameOf(c.date))
      ).length;

      return {
        id: routineId,
        name: routine.name,
        isActive: routine.isActive,
        currentStreak: streaks.currentStreak,
        longestStreak: streaks.longestStreak,
        totalDays: streaks.totalDays,
        fullCount: routineCompletions.filter((c) => c.completionType === 'full').length,
        smallCount: routineCompletions.filter((c) => c.completionType === 'small').length,
        last30Percentage: scheduledLast30 ? Math.min(100, Math.round((completedLast30 / scheduledLast30) * 100)) : null
      };
    });

    
    const energyTrend = checkins
      .filter((c) => c.date >= last30[0].date)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((c) => ({
        date: c.date,
        sleep: c.sleep,
        energy: c.energy,
        dayQuality: c.dayQuality,
        readinessScore: c.readinessScore
      }));


    const points = history
      .filter((day) => day.energy !== null && day.percentage !== null)
      .map((day) => ({ x: day.energy, y: day.percentage, date: day.date }));
    const correlation = pearsonCorrelation(points);

    res.json({
      summary: {
        daily: todayEntry.percentage,
        weekly: combinePeriod(last7).percentage,
        monthly: combinePeriod(last30).percentage,
        totalCompletions: completions.length,
        currentStreak: overall.currentStreak,
        longestStreak: overall.longestStreak
      },
      history,
      routineStats,
      energyTrend,
      correlation: {
        points,
        value: correlation,
        ...buildInsight(points.length, correlation)
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
