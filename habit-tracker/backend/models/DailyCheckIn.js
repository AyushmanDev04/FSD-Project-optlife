const mongoose = require('mongoose');


const checkInSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true },
  sleep: { type: Number, required: true, min: 1, max: 10 },
  energy: { type: Number, required: true, min: 1, max: 10 },
  dayQuality: { type: Number, required: true, min: 1, max: 10 },
  readinessScore: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});


checkInSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyCheckIn', checkInSchema);
