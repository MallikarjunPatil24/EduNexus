import User from '../models/User.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import Timetable from '../models/Timetable.js';
import Result from '../models/Result.js';
import Assignment from '../models/Assignment.js';
import Library from '../models/Library.js';
import Attendance from '../models/Attendance.js';
import { getAIAnswer } from '../utils/ai.js';

// Get student metrics (Attendance %, badges, streaks)
export const getStudentDashboard = async (req, res, next) => {
  try {
    const studentProf = await Student.findOne({ user: req.user._id })
      .populate('class')
      .populate('parent', 'name email');

    if (!studentProf) {
      res.status(404);
      return next(new Error('Student profile not found'));
    }

    // 1. Calculate Attendance Percentage
    const totalSessions = await Attendance.countDocuments({ 
      student: req.user._id, 
      class: studentProf.class._id 
    });
    
    const presentSessions = await Attendance.countDocuments({
      student: req.user._id,
      class: studentProf.class._id,
      status: { $in: ['Present', 'Late'] }
    });

    const attendanceRate = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 100;

    // 2. Fetch Assignments due
    const assignmentsDueCount = await Assignment.countDocuments({
      class: studentProf.class._id,
      'submissions.student': { $ne: req.user._id }
    });

    // 3. Fetch recent Results
    const recentResults = await Result.find({ student: req.user._id })
      .populate({
        path: 'exam',
        populate: { path: 'subject' }
      })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      studentInfo: studentProf,
      attendanceRate,
      assignmentsDueCount,
      recentResults,
      badges: studentProf.badges,
      attendanceStreak: studentProf.attendanceStreak
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// AI DOUBT SOLVER
// ==========================================

export const askAIDoubtSolver = async (req, res, next) => {
  const { question, subject } = req.body;
  try {
    if (!question || !subject) {
      res.status(400);
      return next(new Error('Question and subject are required'));
    }

    const answer = await getAIAnswer(question, subject);
    res.json({
      question,
      subject,
      answer,
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ASSIGNMENT SUBMISSION
// ==========================================

export const submitAssignment = async (req, res, next) => {
  const { assignmentId } = req.params;
  
  if (!req.file) {
    res.status(400);
    return next(new Error('Please upload an assignment file'));
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  try {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      res.status(404);
      return next(new Error('Assignment not found'));
    }

    // Check if student already submitted
    const submissionIndex = assignment.submissions.findIndex(
      (sub) => sub.student.toString() === req.user._id.toString()
    );

    const isLate = new Date() > new Date(assignment.deadline);
    const status = isLate ? 'Late' : 'Submitted';

    const submissionData = {
      student: req.user._id,
      fileUrl,
      submittedAt: new Date(),
      status
    };

    if (submissionIndex > -1) {
      // Overwrite previous submission
      assignment.submissions[submissionIndex] = submissionData;
    } else {
      // Add new submission
      assignment.submissions.push(submissionData);
    }

    await assignment.save();

    // Unlock badge check for assignment submission streak or similar
    // For example, if student submitted 3 homeworks, grant a badge
    const studentProf = await Student.findOne({ user: req.user._id });
    if (studentProf) {
      const hasBadge = studentProf.badges.some(b => b.title === 'Homework Hero');
      if (!hasBadge) {
        studentProf.badges.push({
          title: 'Homework Hero',
          description: 'Successfully submitted your first assignment on EduNexus!',
          icon: 'shield-check'
        });
        await studentProf.save();
      }
    }

    res.json({
      message: 'Assignment submitted successfully',
      submission: submissionData
    });
  } catch (error) {
    next(error);
  }
};

// Fetch student's course subjects & library materials
export const getLibraryMaterials = async (req, res, next) => {
  try {
    const studentProf = await Student.findOne({ user: req.user._id });
    if (!studentProf) {
      res.status(404);
      return next(new Error('Student profile not found'));
    }

    const files = await Library.find({ class: studentProf.class })
      .populate('subject')
      .populate('uploadedBy', 'name');
    res.json(files);
  } catch (error) {
    next(error);
  }
};

// Get assignments for student class
export const getStudentAssignments = async (req, res, next) => {
  try {
    const studentProf = await Student.findOne({ user: req.user._id });
    if (!studentProf) {
      res.status(404);
      return next(new Error('Student profile not found'));
    }

    const assignments = await Assignment.find({ class: studentProf.class })
      .populate('subject')
      .populate('teacher', 'name email');
    res.json(assignments);
  } catch (error) {
    next(error);
  }
};
