import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  marksObtained: {
    type: Number,
    required: true
  },
  grade: {
    type: String
  },
  remarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Auto-calculate grade based on marks obtained and exam total marks
resultSchema.pre('save', async function(next) {
  try {
    const Exam = mongoose.model('Exam');
    const examObj = await Exam.findById(this.exam);
    if (!examObj) {
      throw new Error('Exam not found');
    }
    
    const percentage = (this.marksObtained / examObj.totalMarks) * 100;
    
    if (percentage >= 90) this.grade = 'A+';
    else if (percentage >= 80) this.grade = 'A';
    else if (percentage >= 70) this.grade = 'B';
    else if (percentage >= 60) this.grade = 'C';
    else if (percentage >= 50) this.grade = 'D';
    else if (percentage >= 35) this.grade = 'E';
    else this.grade = 'F';
    
    next();
  } catch (error) {
    next(error);
  }
});

const Result = mongoose.model('Result', resultSchema);
export default Result;
