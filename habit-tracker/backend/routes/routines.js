const express = require('express');
const Routine = require('../models/Routine');
const Completion = require('../models/Completion');
const requireAuth = require('../middleware/auth');
const { validateRoutineInput } = require('../utils/helpers');

const router = express.Router();
router.use(requireAuth);


router.get('/', async (req, res, next) => {
  try {
    const routines = await Routine.find({ userId: req.userId }).sort({ createdAt: 1 });
    res.json({ routines });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { error, data } = validateRoutineInput(req.body);
    if (error) return res.status(400).json({ message: error });

    const routine = await Routine.create({ ...data, userId: req.userId });
    res.status(201).json({ routine });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { error, data } = validateRoutineInput(req.body);
    if (error) return res.status(400).json({ message: error });

    const routine = await Routine.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      data,
      { new: true, runValidators: true }
    );
    if (!routine) return res.status(404).json({ message: 'Routine not found' });

    res.json({ routine });
  } catch (error) {
    next(error);
  }
});


router.delete('/:id', async (req, res, next) => {
  try {
    const routine = await Routine.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!routine) return res.status(404).json({ message: 'Routine not found' });

    await Completion.deleteMany({ routineId: req.params.id, userId: req.userId });
    res.json({ message: 'Routine deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
