import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

// Controller imports
import { 
  loginUser, 
  getUserProfile, 
  logoutUser,
  registerPublicUser
} from '../controllers/authController.js';

import {
  registerUser,
  getUsersByRole,
  deleteUser,
  createClass,
  getClasses,
  updateClass,
  createSubject,
  createOrUpdateTimetable,
  getTimetableForClass,
  createOrUpdateFeeStructure,
  getFeeStructures,
  createFeeBill,
  getFeeRecords
} from '../controllers/adminController.js';

import {
  getTeacherProfileDetails,
  getClassStudents,
  markAttendance,
  getClassAttendance,
  createExam,
  getExams,
  submitResult,
  generateReportCard,
  createAssignment
} from '../controllers/teacherController.js';

import {
  getStudentDashboard,
  askAIDoubtSolver,
  submitAssignment,
  getLibraryMaterials,
  getStudentAssignments
} from '../controllers/studentController.js';

import {
  getParentDashboard,
  getChildAcademicReport,
  payFeeBill
} from '../controllers/parentController.js';

import {
  sendChatMessage,
  getChatHistory,
  getChatContacts
} from '../controllers/chatController.js';

import {
  createAnnouncement,
  getAnnouncements
} from '../controllers/announcementController.js';

import {
  uploadLibraryMaterial,
  deleteLibraryMaterial
} from '../controllers/libraryController.js';

const router = express.Router();

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================
router.post('/auth/login', loginUser);
router.post('/auth/register', registerPublicUser);
router.get('/auth/profile', protect, getUserProfile);
router.post('/auth/logout', protect, logoutUser);

// ==========================================
// 2. ADMIN / MANAGEMENT ROUTES
// ==========================================
router.post('/admin/register', protect, authorize('admin'), registerUser);
router.get('/admin/users/:role', protect, authorize('admin'), getUsersByRole);
router.delete('/admin/users/:id', protect, authorize('admin'), deleteUser);

router.post('/admin/classes', protect, authorize('admin'), createClass);
router.get('/admin/classes', protect, getClasses);
router.put('/admin/classes/:id', protect, authorize('admin'), updateClass);

router.post('/admin/subjects', protect, authorize('admin'), createSubject);

router.post('/admin/timetable', protect, authorize('admin'), createOrUpdateTimetable);
router.get('/admin/timetable/:classId', protect, getTimetableForClass);

router.post('/admin/fee-structure', protect, authorize('admin'), createOrUpdateFeeStructure);
router.get('/admin/fee-structure', protect, getFeeStructures);
router.post('/admin/fee-bills', protect, authorize('admin'), createFeeBill);
router.get('/admin/fee-records', protect, authorize('admin'), getFeeRecords);

// ==========================================
// 3. TEACHER ROUTES
// ==========================================
router.get('/teacher/profile', protect, authorize('teacher'), getTeacherProfileDetails);
router.get('/teacher/class-students/:classId', protect, authorize('teacher'), getClassStudents);
router.post('/teacher/attendance', protect, authorize('teacher'), markAttendance);
router.get('/teacher/attendance/:classId', protect, authorize('teacher'), getClassAttendance);

router.post('/teacher/exams', protect, authorize('teacher'), createExam);
router.get('/teacher/exams', protect, getExams);
router.post('/teacher/results', protect, authorize('teacher'), submitResult);
router.post('/teacher/results/reportcard', protect, authorize('teacher', 'admin'), generateReportCard);

router.post('/teacher/assignments', protect, authorize('teacher'), upload.single('file'), createAssignment);

// ==========================================
// 4. STUDENT ROUTES
// ==========================================
router.get('/student/dashboard', protect, authorize('student'), getStudentDashboard);
router.post('/student/ask-ai', protect, authorize('student'), askAIDoubtSolver);
router.post('/student/submit-assignment/:assignmentId', protect, authorize('student'), upload.single('file'), submitAssignment);
router.get('/student/library', protect, authorize('student'), getLibraryMaterials);
router.get('/student/assignments', protect, authorize('student'), getStudentAssignments);

// ==========================================
// 5. PARENT ROUTES
// ==========================================
router.get('/parent/dashboard', protect, authorize('parent'), getParentDashboard);
router.get('/parent/child-report/:childId', protect, authorize('parent'), getChildAcademicReport);
router.post('/parent/pay-fee/:billId', protect, authorize('parent'), payFeeBill);

// ==========================================
// 6. MESSAGING / CHAT ROUTES
// ==========================================
router.post('/chat/send', protect, authorize('parent', 'teacher', 'admin'), sendChatMessage);
router.get('/chat/history/:peerId', protect, authorize('parent', 'teacher', 'admin'), getChatHistory);
router.get('/chat/contacts', protect, authorize('parent', 'teacher', 'admin'), getChatContacts);

// ==========================================
// 7. ANNOUNCEMENT ROUTES
// ==========================================
router.post('/announcements', protect, authorize('admin'), createAnnouncement);
router.get('/announcements', protect, getAnnouncements);

// ==========================================
// 8. LIBRARY MATERIAL ROUTES
// ==========================================
router.post('/library/upload', protect, authorize('admin', 'teacher'), upload.single('file'), uploadLibraryMaterial);
router.delete('/library/:id', protect, authorize('admin', 'teacher'), deleteLibraryMaterial);

export default router;
