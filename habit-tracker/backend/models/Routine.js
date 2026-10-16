const mongoose = require('mongoose');

// Reminder settings stored inside each routine
const reminderSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  leadMinutes: { type: Number, default: 10 }
}, { _id: false });

// An If/Then habit. Example: IF after breakfast, THEN read for 30 minutes.
const routineSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  trigger: { type: String, required: true, trim: true },
  fullVersion: { type: String, required: true, trim: true },
  smallVersion: { type: String, required: true, trim: true },
  selectedDays: { type: [String], default: [] },
  preferredTime: { type: String, default: '07:00' },
  reminderSettings: { type: reminderSchema, default: () => ({}) },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Routine', routineSchema);
