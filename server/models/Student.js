import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  rollNum: {
    type: String,
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  attendanceStreak: {
    type: Number,
    default: 0
  },
  badges: [{
    title: { type: String, required: true },
    description: { type: String },
    icon: { type: String },
    dateEarned: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

const Student = mongoose.model('Student', studentSchema);
export default Student;
