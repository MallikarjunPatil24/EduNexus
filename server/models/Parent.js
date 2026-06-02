import mongoose from 'mongoose';

const parentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Links to child User profile (or Student)
  }]
}, {
  timestamps: true
});

const Parent = mongoose.model('Parent', parentSchema);
export default Parent;
