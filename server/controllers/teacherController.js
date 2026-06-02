import User from '../models/User.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Attendance from '../models/Attendance.js';
import Exam from '../models/Exam.js';
import Result from '../models/Result.js';
import Assignment from '../models/Assignment.js';
import Notification from '../models/Notification.js';
import { sendNotificationToUser } from '../socket/socket.js';
import { sendEmail } from '../utils/nodemailer.js';
import { generateReportCardPDF } from '../utils/pdf.js';

// Get classes and subjects assigned to the teacher
export const getTeacherProfileDetails = async (req, res, next) => {
  try {
    const teacherProfile = await Teacher.findOne({ user: req.user._id })
      .populate({
        path: 'classes',
        select: 'className section sclassName maxStudents'
      })
      .populate({
        path: 'subjects',
        select: 'subName subCode class',
        populate: { path: 'class', select: 'sclassName' }
      });
      
    if (!teacherProfile) {
      res.status(404);
      return next(new Error('Teacher profile not found'));
    }
    res.json(teacherProfile);
  } catch (error) {
    next(error);
  }
};

// Get student list for a class
export const getClassStudents = async (req, res, next) => {
  const { classId } = req.params;
  try {
    const students = await Student.find({ class: classId }).populate('user', 'name email phone avatar');
    res.json(students);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ATTENDANCE MARKING
// ==========================================

export const markAttendance = async (req, res, next) => {
  const { classId, date, attendanceRecords } = req.body; // Records: [{ studentId, status: 'Present'|'Absent'|'Late' }]

  try {
    const classObj = await Class.findById(classId);
    if (!classObj) {
      res.status(404);
      return next(new Error('Class not found'));
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const savedRecords = [];
    for (const record of attendanceRecords) {
      const { studentId, status } = record;

      // Upsert record
      const attendanceDoc = await Attendance.findOneAndUpdate(
        { student: studentId, date: attendanceDate, class: classId },
        { status, markedBy: req.user._id },
        { upsert: true, new: true }
      );
      savedRecords.push(attendanceDoc);

      // Perform <75% attendance checking if marked absent
      if (status === 'Absent') {
        const studentProfile = await Student.findOne({ user: studentId }).populate('user', 'name email');
        
        // Calculate attendance rate
        const totalSessions = await Attendance.countDocuments({ student: studentId, class: classId });
        const presentCount = await Attendance.countDocuments({
          student: studentId,
          class: classId,
          status: { $in: ['Present', 'Late'] }
        });

        const rate = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 100;

        if (rate < 75) {
          // Trigger Notification to Student and Parent
          const studentName = studentProfile.user.name;
          const parentUser = studentProfile.parent ? await User.findById(studentProfile.parent) : null;

          const alertContent = `Attendance Alert: ${studentName}'s attendance in ${classObj.sclassName} has fallen below 75% (Current rate: ${rate.toFixed(1)}%).`;

          // Notify student
          const alert = await Notification.create({
            user: studentId,
            title: 'Attendance Alert (<75%)',
            content: alertContent,
            type: 'attendance'
          });
          sendNotificationToUser(studentId, alert);

          // Notify parent
          if (parentUser) {
            const parentAlert = await Notification.create({
              user: parentUser._id,
              title: `Attendance Alert for ${studentName}`,
              content: alertContent,
              type: 'attendance'
            });
            sendNotificationToUser(parentUser._id, parentAlert);

            // Send Email to Parent
            await sendEmail({
              to: parentUser.email,
              subject: `EduNexus: Low Attendance Alert - ${studentName}`,
              text: alertContent,
              html: `<h3>EduNexus Attendance Warning</h3><p>${alertContent}</p>`
            });
          }
        }
      }
    }

    res.json({
      message: 'Attendance saved successfully',
      recordsCount: savedRecords.length
    });
  } catch (error) {
    next(error);
  }
};

export const getClassAttendance = async (req, res, next) => {
  const { classId } = req.params;
  const { date } = req.query; // Expect yyyy-mm-dd
  try {
    const filterDate = date ? new Date(date) : new Date();
    filterDate.setHours(0, 0, 0, 0);

    const records = await Attendance.find({ class: classId, date: filterDate })
      .populate({ path: 'student', select: 'name email phone' });
    res.json(records);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// EXAMS & RESULTS GRADING
// ==========================================

export const createExam = async (req, res, next) => {
  const { name, classId, subjectId, date, totalMarks, passingMarks } = req.body;
  try {
    const exam = await Exam.create({
      name,
      class: classId,
      subject: subjectId,
      date: new Date(date),
      totalMarks: totalMarks || 100,
      passingMarks: passingMarks || 35
    });
    res.status(201).json(exam);
  } catch (error) {
    next(error);
  }
};

export const getExams = async (req, res, next) => {
  try {
    const exams = await Exam.find({})
      .populate('class')
      .populate('subject');
    res.json(exams);
  } catch (error) {
    next(error);
  }
};

export const submitResult = async (req, res, next) => {
  const { examId, results } = req.body; // Results: [{ studentId, marksObtained, remarks }]
  try {
    const exam = await Exam.findById(examId).populate('class');
    if (!exam) {
      res.status(404);
      return next(new Error('Exam not found'));
    }

    const savedResults = [];
    for (const r of results) {
      const { studentId, marksObtained, remarks } = r;

      if (marksObtained > exam.totalMarks) {
        res.status(400);
        return next(new Error(`Marks obtained (${marksObtained}) cannot exceed total marks (${exam.totalMarks})`));
      }

      // Upsert student result
      const resultDoc = await Result.findOneAndUpdate(
        { exam: examId, student: studentId },
        { marksObtained, remarks },
        { upsert: true, new: true }
      );
      savedResults.push(resultDoc);

      // Notify student
      const userObj = await User.findById(studentId);
      const studentAlert = await Notification.create({
        user: studentId,
        title: 'New Exam Result Released',
        content: `Your result for ${exam.name} has been published. Marks: ${marksObtained}/${exam.totalMarks} (Grade: ${resultDoc.grade}).`,
        type: 'grade'
      });
      sendNotificationToUser(studentId, studentAlert);

      // Notify parent
      const studentProf = await Student.findOne({ user: studentId });
      if (studentProf && studentProf.parent) {
        const parentAlert = await Notification.create({
          user: studentProf.parent,
          title: `Exam Result for ${userObj ? userObj.name : 'Child'}`,
          content: `${userObj ? userObj.name : 'Your child'}'s result for ${exam.name} is published. Marks: ${marksObtained}/${exam.totalMarks} (Grade: ${resultDoc.grade}).`,
          type: 'grade'
        });
        sendNotificationToUser(studentProf.parent, parentAlert);
      }
    }

    res.json({
      message: 'Results uploaded successfully',
      resultsCount: savedResults.length
    });
  } catch (error) {
    next(error);
  }
};

// Download E-Report Card PDF Simulation
export const generateReportCard = async (req, res, next) => {
  const { studentId, examName } = req.body;
  try {
    const student = await User.findById(studentId);
    const studentProf = await Student.findOne({ user: studentId }).populate('class');
    
    if (!studentProf) {
      res.status(404);
      return next(new Error('Student profile not found'));
    }

    // Find all results of this student
    const exams = await Exam.find({ class: studentProf.class._id });
    const examIds = exams.map(e => e._id);
    const results = await Result.find({ student: studentId, exam: { $in: examIds } })
      .populate({ path: 'exam', populate: { path: 'subject' } });

    const formattedResults = results.map(r => ({
      subjectName: r.exam.subject.subName,
      marksObtained: r.marksObtained,
      grade: r.grade
    }));

    const pathUrl = generateReportCardPDF(
      student,
      studentProf.class,
      examName || 'Annual Evaluation',
      formattedResults
    );

    res.json({
      message: 'Report card compiled successfully',
      downloadUrl: pathUrl
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ASSIGNMENT MANAGEMENT
// ==========================================

export const createAssignment = async (req, res, next) => {
  const { title, description, classId, subjectId, deadline } = req.body;
  let fileUrl = '';

  if (req.file) {
    fileUrl = `/uploads/${req.file.filename}`;
  }

  try {
    const assignment = await Assignment.create({
      title,
      description,
      class: classId,
      subject: subjectId,
      teacher: req.user._id,
      deadline: new Date(deadline),
      fileUrl
    });

    // Notify all students in this class
    const students = await Student.find({ class: classId });
    for (const student of students) {
      const alert = await Notification.create({
        user: student.user,
        title: 'New Homework Assigned',
        content: `A new assignment "${title}" has been uploaded. Deadline: ${new Date(deadline).toLocaleDateString()}`,
        type: 'alert'
      });
      sendNotificationToUser(student.user, alert);
    }

    res.status(201).json(assignment);
  } catch (error) {
    next(error);
  }
};
