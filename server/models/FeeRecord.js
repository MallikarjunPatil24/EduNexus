import mongoose from 'mongoose';

const feeRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  amountPaid: {
    type: Number,
    required: true,
    default: 0
  },
  amountDue: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Paid', 'Unpaid', 'Partial'],
    default: 'Unpaid'
  },
  paymentMethod: {
    type: String,
    default: 'Simulator'
  },
  transactionId: {
    type: String,
    default: ''
  },
  paymentDate: {
    type: Date
  },
  receiptUrl: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const FeeRecord = mongoose.model('FeeRecord', feeRecordSchema);
export default FeeRecord;
