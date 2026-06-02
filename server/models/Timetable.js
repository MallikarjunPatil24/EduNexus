import mongoose from 'mongoose';

const timetableSlotSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  period: {
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timeSlot: {
    type: String,
    required: true // e.g. '09:00 AM - 09:45 AM'
  }
});

const timetableSchema = new mongoose.Schema({
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    unique: true
  },
  slots: [timetableSlotSchema]
}, {
  timestamps: true
});

const Timetable = mongoose.model('Timetable', timetableSchema);
export default Timetable;
