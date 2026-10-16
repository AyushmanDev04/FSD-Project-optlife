const mongoose = require('mongoose');


const completionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  routineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Routine', required: true, index: true },
  date: { type: String, required: true },
  completionType: { type: String, enum: ['full', 'small'], required: true },
  completedAt: { type: Date, default: Date.now }
});


completionSchema.index({ userId: 1, routineId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Completion', completionSchema);
