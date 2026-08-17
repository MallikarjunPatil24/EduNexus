import mongoose from 'mongoose';
import { CLASSES, SECTIONS } from '../utils/constants.js';

const classSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true,
    enum: CLASSES,
  },
  section: {
    type: String,
    required: true,
    enum: SECTIONS,
    default: 'A'
  },
  sclassName: {
    type: String,
    unique: true
  },
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
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

classSchema.index({ className: 1, section: 1 }, { unique: true });

// Auto-generate unified class section name
classSchema.pre('save', function(next) {
  this.sclassName = `${this.className} - Section ${this.section}`;
  next();
});

const Class = mongoose.model('Class', classSchema);
export default Class;
