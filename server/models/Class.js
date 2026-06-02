import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true,
    enum: [
      '1st Standard', '2nd Standard', '3rd Standard', '4th Standard', '5th Standard',
      '6th Standard', '7th Standard', '8th Standard', '9th Standard', '10th Standard'
    ]
  },
  section: {
    type: String,
    required: true,
    enum: ['A', 'B'],
    default: 'A'
  },
  sclassName: {
    type: String,
    unique: true
  },
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  maxStudents: {
    type: Number,
    required: true,
    default: 40
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }]
}, {
  timestamps: true
});

// Auto-generate unified class section name
classSchema.pre('save', function(next) {
  this.sclassName = `${this.className} - Section ${this.section}`;
  next();
});

const Class = mongoose.model('Class', classSchema);
export default Class;
