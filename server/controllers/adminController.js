import User from '../models/User.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Parent from '../models/Parent.js';
import Timetable from '../models/Timetable.js';
import FeeStructure from '../models/FeeStructure.js';
import FeeRecord from '../models/FeeRecord.js';
import Notification from '../models/Notification.js';
import { sendNotificationToUser } from '../socket/socket.js';

// ==========================================
// USER CONFIGURATION (ADMIN, TEACHER, STUDENT, PARENT)
// ==========================================

export const registerUser = async (req, res, next) => {
  const { name, email, password, role, phone, avatar, ...roleDetails } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      return next(new Error('User already exists with this email'));
    }

    // Create Base User
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      avatar: avatar || ''
    });

    // Create profile based on role
    if (role === 'student') {
      const { rollNum, className, section, parentEmail } = roleDetails;
      
      // Find Class
      const classObj = await Class.findOne({ className, section });
      if (!classObj) {
        // Rollback base user
        await User.findByIdAndDelete(user._id);
        res.status(400);
        return next(new Error(`Class "${className} - Section ${section}" not found. Please create class first.`));
      }

      // Check Capacity
      const enrolledCount = await Student.countDocuments({ class: classObj._id });
      if (enrolledCount >= classObj.maxStudents) {
        await User.findByIdAndDelete(user._id);
        res.status(400);
        return next(new Error(`Class capacity of ${classObj.maxStudents} has been reached!`));
      }

      // Find Parent User if parentEmail provided
      let parentUser = null;
      if (parentEmail) {
        parentUser = await User.findOne({ email: parentEmail, role: 'parent' });
        if (!parentUser) {
          await User.findByIdAndDelete(user._id);
          res.status(400);
          return next(new Error(`Parent with email ${parentEmail} not found. Please register parent first.`));
        }
      }

      const studentProfile = await Student.create({
        user: user._id,
        rollNum,
        class: classObj._id,
        parent: parentUser ? parentUser._id : null
      });

      // If parent exists, add student to parent's children list
      if (parentUser) {
        await Parent.findOneAndUpdate(
          { user: parentUser._id },
          { $addToSet: { children: user._id } }
        );
      }
    } 
    else if (role === 'teacher') {
      await Teacher.create({
        user: user._id,
        classes: [],
        subjects: []
      });
    } 
    else if (role === 'parent') {
      const { childrenEmails } = roleDetails; // Array of emails
      const childrenIds = [];

      if (childrenEmails && Array.isArray(childrenEmails)) {
        for (const childEmail of childrenEmails) {
          const childUser = await User.findOne({ email: childEmail, role: 'student' });
          if (childUser) {
            childrenIds.push(childUser._id);
          }
        }
      }

      await Parent.create({
        user: user._id,
        children: childrenIds
      });

      // Update parent field on corresponding student profiles
      if (childrenIds.length > 0) {
        await Student.updateMany(
          { user: { $in: childrenIds } },
          { parent: user._id }
        );
      }
    }

    res.status(201).json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getUsersByRole = async (req, res, next) => {
  const { role } = req.params;
  try {
    const users = await User.find({ role }).select('-password');
    const populatedUsers = [];

    for (const u of users) {
      let profile = null;
      if (role === 'student') {
        profile = await Student.findOne({ user: u._id }).populate('class').populate('parent', 'name email phone');
      } else if (role === 'teacher') {
        profile = await Teacher.findOne({ user: u._id }).populate('classes').populate('subjects');
      } else if (role === 'parent') {
        profile = await Parent.findOne({ user: u._id }).populate('children', 'name email phone');
      }
      populatedUsers.push({
        ...u.toObject(),
        profile
      });
    }
    
    res.json(populatedUsers);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    if (user.role === 'student') {
      await Student.findOneAndDelete({ user: id });
      // Remove student from parent profiles
      await Parent.updateMany(
        { children: id },
        { $pull: { children: id } }
      );
    } else if (user.role === 'teacher') {
      await Teacher.findOneAndDelete({ user: id });
      // Unassign teacher from classes
      await Class.updateMany({ classTeacher: id }, { $unset: { classTeacher: "" } });
      // Unassign teacher from subjects
      await Subject.updateMany({ teacher: id }, { $unset: { teacher: "" } });
    } else if (user.role === 'parent') {
      await Parent.findOneAndDelete({ user: id });
      // Remove parent reference from student profiles
      await Student.updateMany({ parent: id }, { $unset: { parent: "" } });
    }

    await User.findByIdAndDelete(id);
    res.json({ message: 'User and profile removed successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CLASS & SUBJECT MANAGEMENT
// ==========================================

export const createClass = async (req, res, next) => {
  const { className, section, maxStudents, classTeacherId } = req.body;

  try {
    const classExists = await Class.findOne({ className, section });
    if (classExists) {
      res.status(400);
      return next(new Error(`Class "${className} - Section ${section}" already exists!`));
    }

    let classTeacher = null;
    if (classTeacherId) {
      classTeacher = await User.findOne({ _id: classTeacherId, role: 'teacher' });
      if (!classTeacher) {
        res.status(400);
        return next(new Error('Assigned teacher user not found'));
      }
    }

    const newClass = await Class.create({
      className,
      section,
      maxStudents: maxStudents || 40,
      classTeacher: classTeacher ? classTeacher._id : undefined
    });

    if (classTeacher) {
      await Teacher.findOneAndUpdate(
        { user: classTeacher._id },
        { $addToSet: { classes: newClass._id } }
      );
    }

    res.status(201).json(newClass);
  } catch (error) {
    next(error);
  }
};

export const getClasses = async (req, res, next) => {
  try {
    const classes = await Class.find({})
      .populate({ path: 'classTeacher', select: 'name email phone' })
      .populate('subjects');
    res.json(classes);
  } catch (error) {
    next(error);
  }
};

export const updateClass = async (req, res, next) => {
  const { id } = req.params;
  const { maxStudents, classTeacherId, subjects } = req.body;

  try {
    const classObj = await Class.findById(id);
    if (!classObj) {
      res.status(404);
      return next(new Error('Class not found'));
    }

    if (maxStudents) classObj.maxStudents = maxStudents;

    if (classTeacherId) {
      const teacherUser = await User.findOne({ _id: classTeacherId, role: 'teacher' });
      if (!teacherUser) {
        res.status(400);
        return next(new Error('Teacher not found'));
      }
      
      // Remove class from former teacher's list
      if (classObj.classTeacher && classObj.classTeacher.toString() !== classTeacherId) {
        await Teacher.findOneAndUpdate(
          { user: classObj.classTeacher },
          { $pull: { classes: classObj._id } }
        );
      }

      classObj.classTeacher = teacherUser._id;
      // Add class to new teacher's list
      await Teacher.findOneAndUpdate(
        { user: teacherUser._id },
        { $addToSet: { classes: classObj._id } }
      );
    }

    if (subjects && Array.isArray(subjects)) {
      classObj.subjects = subjects;
    }

    await classObj.save();
    const updatedClass = await Class.findById(id)
      .populate({ path: 'classTeacher', select: 'name email phone' })
      .populate('subjects');
      
    res.json(updatedClass);
  } catch (error) {
    next(error);
  }
};

export const createSubject = async (req, res, next) => {
  const { subName, subCode, classId, teacherId } = req.body;

  try {
    const classObj = await Class.findById(classId);
    if (!classObj) {
      res.status(404);
      return next(new Error('Target class not found'));
    }

    let teacherUser = null;
    if (teacherId) {
      teacherUser = await User.findOne({ _id: teacherId, role: 'teacher' });
      if (!teacherUser) {
        res.status(400);
        return next(new Error('Assigned teacher user not found'));
      }
    }

    const subject = await Subject.create({
      subName,
      subCode,
      class: classObj._id,
      teacher: teacherUser ? teacherUser._id : undefined
    });

    // Add subject to class list
    await Class.findByIdAndUpdate(classId, {
      $addToSet: { subjects: subject._id }
    });

    // Add subject to teacher profile
    if (teacherUser) {
      await Teacher.findOneAndUpdate(
        { user: teacherUser._id },
        { 
          $addToSet: { 
            subjects: subject._id,
            classes: classObj._id 
          }
        }
      );
    }

    res.status(201).json(subject);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// TIMETABLE GENERATION & CONFLICT CHECK
// ==========================================

export const createOrUpdateTimetable = async (req, res, next) => {
  const { classId, slots } = req.body;

  try {
    const classObj = await Class.findById(classId);
    if (!classObj) {
      res.status(404);
      return next(new Error('Class not found'));
    }

    // Run Conflict Detection
    // Slots structure: [ { day, period, subjectId, teacherId, timeSlot } ]
    for (const slot of slots) {
      const { day, period, subject, teacher, timeSlot } = slot;

      // 1. Conflict Check: Is the teacher already booked in another class at this specific day/period?
      const teacherClash = await Timetable.findOne({
        class: { $ne: classObj._id }, // in a different class
        slots: {
          $elemMatch: {
            day,
            period,
            teacher
          }
        }
      }).populate('class');

      if (teacherClash) {
        const teacherUser = await User.findById(teacher);
        res.status(400);
        return next(new Error(`Conflict detected: Teacher "${teacherUser ? teacherUser.name : 'Selected Teacher'}" is already scheduled in "${teacherClash.class.sclassName}" during Period ${period} on ${day}.`));
      }
    }

    let timetable = await Timetable.findOne({ class: classId });

    if (timetable) {
      timetable.slots = slots;
      await timetable.save();
    } else {
      timetable = await Timetable.create({
        class: classId,
        slots
      });
    }

    res.json({
      message: 'Timetable saved successfully',
      timetable
    });
  } catch (error) {
    next(error);
  }
};

export const getTimetableForClass = async (req, res, next) => {
  const { classId } = req.params;
  try {
    const timetable = await Timetable.findOne({ class: classId })
      .populate({
        path: 'slots.subject',
        model: 'Subject'
      })
      .populate({
        path: 'slots.teacher',
        model: 'User',
        select: 'name email'
      });
    
    if (!timetable) {
      return res.status(200).json({ class: classId, slots: [] });
    }
    res.json(timetable);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// FEE MANAGEMENT
// ==========================================

export const createOrUpdateFeeStructure = async (req, res, next) => {
  const { classId, tuitionFee, examFee, otherFee } = req.body;

  try {
    let feeStruct = await FeeStructure.findOne({ class: classId });

    if (feeStruct) {
      feeStruct.tuitionFee = tuitionFee;
      feeStruct.examFee = examFee;
      feeStruct.otherFee = otherFee;
      await feeStruct.save();
    } else {
      feeStruct = await FeeStructure.create({
        class: classId,
        tuitionFee,
        examFee,
        otherFee
      });
    }

    res.json(feeStruct);
  } catch (error) {
    next(error);
  }
};

export const getFeeStructures = async (req, res, next) => {
  try {
    const structures = await FeeStructure.find({}).populate('class');
    res.json(structures);
  } catch (error) {
    next(error);
  }
};

export const createFeeBill = async (req, res, next) => {
  const { classId } = req.body;

  try {
    const feeStruct = await FeeStructure.findOne({ class: classId });
    if (!feeStruct) {
      res.status(404);
      return next(new Error('Fee structure not configured for this class!'));
    }

    const students = await Student.find({ class: classId });
    if (students.length === 0) {
      res.status(404);
      return next(new Error('No students enrolled in this class!'));
    }

    let billsGenerated = 0;
    for (const student of students) {
      // Check if bill already exists for this term/month (we check if there's any unpaid/partial record)
      const billingExists = await FeeRecord.findOne({
        student: student.user,
        class: classId,
        status: { $ne: 'Paid' }
      });

      if (!billingExists) {
        await FeeRecord.create({
          student: student.user,
          class: classId,
          amountPaid: 0,
          amountDue: feeStruct.totalAmount,
          status: 'Unpaid'
        });

        // Push alert notification to the student
        const userObj = await User.findById(student.user);
        const alert = await Notification.create({
          user: student.user,
          title: 'New Fees Invoice Generated',
          content: `Fees invoice of $${feeStruct.totalAmount} has been generated for ${classId.sclassName || 'your class'}. Please complete payment.`,
          type: 'fee'
        });
        sendNotificationToUser(student.user, alert);

        // Alert parent too
        if (student.parent) {
          const parentAlert = await Notification.create({
            user: student.parent,
            title: `Fees Invoice for ${userObj ? userObj.name : 'Child'}`,
            content: `A new term fee of $${feeStruct.totalAmount} is due for ${userObj ? userObj.name : 'your child'}.`,
            type: 'fee'
          });
          sendNotificationToUser(student.parent, parentAlert);
        }

        billsGenerated++;
      }
    }

    res.json({
      message: `Bills successfully generated for ${billsGenerated} students.`,
      billsGenerated
    });
  } catch (error) {
    next(error);
  }
};

export const getFeeRecords = async (req, res, next) => {
  try {
    const records = await FeeRecord.find({})
      .populate({ path: 'student', select: 'name email phone' })
      .populate('class');
    res.json(records);
  } catch (error) {
    next(error);
  }
};
