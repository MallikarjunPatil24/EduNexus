import User from '../models/User.js';
import Student from '../models/Student.js';
import Parent from '../models/Parent.js';
import Attendance from '../models/Attendance.js';
import Result from '../models/Result.js';
import FeeRecord from '../models/FeeRecord.js';
import Class from '../models/Class.js';
import { generateReceiptPDF } from '../utils/pdf.js';

// Get Linked children info
export const getParentDashboard = async (req, res, next) => {
  try {
    const parentProfile = await Parent.findOne({ user: req.user._id })
      .populate('children', 'name email phone avatar');

    if (!parentProfile) {
      res.status(404);
      return next(new Error('Parent profile not found'));
    }

    const childrenData = [];
    for (const childUser of parentProfile.children) {
      const studentInfo = await Student.findOne({ user: childUser._id }).populate('class');
      
      // Calculate attendance rate
      const totalSessions = await Attendance.countDocuments({ student: childUser._id });
      const presentCount = await Attendance.countDocuments({
        student: childUser._id,
        status: { $in: ['Present', 'Late'] }
      });
      const attendanceRate = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 100;

      // Fees due
      const pendingFees = await FeeRecord.find({ student: childUser._id, status: { $ne: 'Paid' } });

      childrenData.push({
        childUser,
        studentInfo,
        attendanceRate,
        pendingFeesCount: pendingFees.length
      });
    }

    res.json({
      children: childrenData
    });
  } catch (error) {
    next(error);
  }
};

// Get specific child's details
export const getChildAcademicReport = async (req, res, next) => {
  const { childId } = req.params;
  try {
    // Verify parent relationship
    const parentProfile = await Parent.findOne({ user: req.user._id });
    if (!parentProfile || !parentProfile.children.includes(childId)) {
      res.status(403);
      return next(new Error('Unauthorized to view this student data'));
    }

    const studentInfo = await Student.findOne({ user: childId }).populate('class');
    const attendance = await Attendance.find({ student: childId }).sort({ date: -1 });
    const results = await Result.find({ student: childId })
      .populate({
        path: 'exam',
        populate: { path: 'subject' }
      });
    const feeRecords = await FeeRecord.find({ student: childId }).populate('class');

    res.json({
      studentInfo,
      attendance,
      results,
      feeRecords
    });
  } catch (error) {
    next(error);
  }
};

// Simulate Payment Process
export const payFeeBill = async (req, res, next) => {
  const { billId } = req.params;
  const { paymentMethod } = req.body; // e.g. Card, NetBanking

  try {
    const feeRecord = await FeeRecord.findById(billId).populate('class');
    if (!feeRecord) {
      res.status(404);
      return next(new Error('Fee invoice not found'));
    }

    const studentUser = await User.findById(feeRecord.student);
    if (!studentUser) {
      res.status(404);
      return next(new Error('Student user not found'));
    }

    // Set as Paid
    feeRecord.amountPaid = feeRecord.amountDue;
    feeRecord.amountDue = 0;
    feeRecord.status = 'Paid';
    feeRecord.paymentMethod = paymentMethod || 'Simulator';
    feeRecord.paymentDate = new Date();
    feeRecord.transactionId = `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;

    // Generate simulated receipt
    const receiptPath = generateReceiptPDF(feeRecord, studentUser, feeRecord.class);
    feeRecord.receiptUrl = receiptPath;

    await feeRecord.save();

    res.json({
      message: 'Payment completed successfully (Simulated)',
      receiptUrl: receiptPath,
      feeRecord
    });
  } catch (error) {
    next(error);
  }
};
