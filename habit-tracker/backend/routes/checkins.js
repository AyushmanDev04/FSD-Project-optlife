const express = require('express');
const DailyCheckIn = require('../models/DailyCheckIn');
const requireAuth = require('../middleware/auth');
const { todayString, isValidDate, validateScores, calculateReadiness } = require('../utils/helpers');

const router = express.Router();
router.use(requireAuth);


router.get('/', async (req, res, next) => {
  try {
    const filter = { userId: req.userId };
    if (req.query.date) filter.date = req.query.date;

    const checkins = await DailyCheckIn.find(filter).sort({ date: -1 });
    res.json({ checkins });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const date = req.body.date || todayString();
    if (!isValidDate(date)) return res.status(400).json({ message: 'Invalid date format' });

    const { error, data } = validateScores(req.body);
    if (error) return res.status(400).json({ message: error });

    const checkin = await DailyCheckIn.create({
      userId: req.userId,
      date,
      ...data,
      readinessScore: calculateReadiness(data.sleep, data.energy, data.dayQuality)
    });
    res.status(201).json({ checkin });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { error, data } = validateScores(req.body);
    if (error) return res.status(400).json({ message: error });

    const checkin = await DailyCheckIn.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...data, readinessScore: calculateReadiness(data.sleep, data.energy, data.dayQuality) },
      { new: true }
    );
    if (!checkin) return res.status(404).json({ message: 'Check-in not found' });

    res.json({ checkin });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
