import mongoose from 'mongoose';

const feeStructureSchema = new mongoose.Schema({
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    unique: true
  },
  tuitionFee: {
    type: Number,
    required: true,
    default: 10000
  },
  examFee: {
    type: Number,
    required: true,
    default: 1500
  },
  otherFee: {
    type: Number,
    required: true,
    default: 500
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 12000
  }
}, {
  timestamps: true
});

feeStructureSchema.pre('save', function(next) {
  this.totalAmount = this.tuitionFee + this.examFee + this.otherFee;
  next();
});

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
export default FeeStructure;
