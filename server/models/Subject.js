import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  subName: {
    type: String,
    required: true,
    enum: [
      'English', 'Mathematics', 'Science', 'Social Studies', 'Computer Science',
      'General Knowledge', 'Hindi', 'Kannada', 'Telugu', 'Sanskrit', 'Physical Education', 'Art & Craft'
    ]
  },
  subCode: {
    type: String,
    required: true,
    trim: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;
