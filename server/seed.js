import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Class from './models/Class.js';
import Subject from './models/Subject.js';
import Student from './models/Student.js';
import Teacher from './models/Teacher.js';
import Parent from './models/Parent.js';
import Timetable from './models/Timetable.js';
import Attendance from './models/Attendance.js';
import Exam from './models/Exam.js';
import Result from './models/Result.js';
import FeeStructure from './models/FeeStructure.js';
import FeeRecord from './models/FeeRecord.js';
import Announcement from './models/Announcement.js';

dotenv.config();

const classesList = [
  '1st Standard', '2nd Standard', '3rd Standard', '4th Standard', '5th Standard',
  '6th Standard', '7th Standard', '8th Standard', '9th Standard', '10th Standard'
];
const sections = ['A', 'B'];

const subjectsList = [
  'English', 'Mathematics', 'Science', 'Social Studies', 'Computer Science',
  'General Knowledge', 'Hindi', 'Kannada', 'Telugu', 'Sanskrit', 'Physical Education', 'Art & Craft'
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edunexus');
    console.log('Connected to database for seeding...');

    // Clear all existing data
    console.log('Clearing old records...');
    await User.deleteMany({});
    await Class.deleteMany({});
    await Subject.deleteMany({});
    await Student.deleteMany({});
    await Teacher.deleteMany({});
    await Parent.deleteMany({});
    await Timetable.deleteMany({});
    await Attendance.deleteMany({});
    await Exam.deleteMany({});
    await Result.deleteMany({});
    await FeeStructure.deleteMany({});
    await FeeRecord.deleteMany({});
    await Announcement.deleteMany({});

    console.log('Database cleared.');

    // 1. Create 1 Admin
    console.log('Creating Admin...');
    const adminUser = await User.create({
      name: 'School Administrator',
      email: 'admin@edunexus.edu',
      password: 'password123',
      role: 'admin',
      phone: '9999999999'
    });
    console.log('Admin created.');

    // 2. Create 10 Teachers
    console.log('Creating Teachers...');
    const teachers = [];
    for (let i = 1; i <= 10; i++) {
      const user = await User.create({
        name: `Teacher ${i}`,
        email: `teacher${i}@edunexus.edu`,
        password: 'password123',
        role: 'teacher',
        phone: `888888800${i}`
      });
      const profile = await Teacher.create({
        user: user._id,
        classes: [],
        subjects: []
      });
      teachers.push({ user, profile });
    }
    console.log('10 Teachers created.');

    // 3. Create Classes (1st to 10th Standard, sections A and B)
    console.log('Creating Classes & Assigning Class Teachers...');
    const classes = [];
    let teacherIndex = 0;
    
    for (const className of classesList) {
      for (const section of sections) {
        // Assign a teacher as class teacher
        const assignedTeacher = teachers[teacherIndex % teachers.length];
        
        const newClass = await Class.create({
          className,
          section,
          maxStudents: 40,
          classTeacher: assignedTeacher.user._id
        });

        // Link class to teacher profile
        await Teacher.findOneAndUpdate(
          { user: assignedTeacher.user._id },
          { $addToSet: { classes: newClass._id } }
        );

        classes.push(newClass);
        teacherIndex++;
      }
    }
    console.log(`${classes.length} Class Sections created.`);

    // 4. Create Subjects for each Class and Assign Teachers
    console.log('Creating Subjects & Assigning Course Teachers...');
    const subjectsMap = {}; // classId -> list of subjects
    
    for (const cls of classes) {
      subjectsMap[cls._id] = [];
      // Assign 5 subjects to each class
      for (let sIdx = 0; sIdx < 5; sIdx++) {
        const subName = subjectsList[(cls.className.charCodeAt(0) + sIdx) % subjectsList.length];
        const teacherObj = teachers[(cls.className.charCodeAt(0) + sIdx) % teachers.length];
        
        const subject = await Subject.create({
          subName,
          subCode: `${subName.substring(0, 3).toUpperCase()}-${cls.className.replace(/\D/g, '')}${cls.section}`,
          class: cls._id,
          teacher: teacherObj.user._id
        });

        // Add to class subjects list
        await Class.findByIdAndUpdate(cls._id, {
          $addToSet: { subjects: subject._id }
        });

        // Add subject and class to teacher profile
        await Teacher.findOneAndUpdate(
          { user: teacherObj.user._id },
          { 
            $addToSet: { 
              subjects: subject._id,
              classes: cls._id 
            }
          }
        );

        subjectsMap[cls._id].push(subject);
      }
    }
    console.log('Subjects generated.');

    // 5. Create 10 Parents
    console.log('Creating Parents...');
    const parents = [];
    for (let i = 1; i <= 10; i++) {
      const user = await User.create({
        name: `Parent ${i}`,
        email: `parent${i}@edunexus.edu`,
        password: 'password123',
        role: 'parent',
        phone: `777777700${i}`
      });
      const profile = await Parent.create({
        user: user._id,
        children: []
      });
      parents.push({ user, profile });
    }
    console.log('10 Parents created.');

    // 6. Create 50 Students distributed across classes
    console.log('Creating 50 Students & linking Parents...');
    const studentUsers = [];
    for (let i = 1; i <= 50; i++) {
      // Determine class (cycle through 20 class sections)
      const targetClass = classes[i % classes.length];
      
      const parentObj = parents[i % parents.length];

      const user = await User.create({
        name: `Student ${i}`,
        email: `student${i}@edunexus.edu`,
        password: 'password123',
        role: 'student',
        phone: `666666600${i}`
      });

      const profile = await Student.create({
        user: user._id,
        rollNum: `100${i}`,
        class: targetClass._id,
        parent: parentObj.user._id,
        attendanceStreak: 12,
        badges: [
          {
            title: 'Attendance Star',
            description: 'Unblemished 10-day attendance streak!',
            icon: 'award'
          }
        ]
      });

      // Update parent details
      await Parent.findOneAndUpdate(
        { user: parentObj.user._id },
        { $addToSet: { children: user._id } }
      );

      studentUsers.push(user);
    }
    console.log('50 Students created.');

    // 7. Create Timetables
    console.log('Creating Timetables for Classes...');
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = [
      '09:00 AM - 09:45 AM',
      '09:45 AM - 10:30 AM',
      '10:45 AM - 11:30 AM',
      '11:30 AM - 12:15 PM',
      '01:15 PM - 02:00 PM',
      '02:00 PM - 02:45 PM'
    ];

    for (const cls of classes) {
      const slots = [];
      const classSubjects = subjectsMap[cls._id];

      for (const day of weekdays) {
        for (let pNum = 1; pNum <= 4; pNum++) {
          const subject = classSubjects[pNum % classSubjects.length];
          slots.push({
            day,
            period: pNum,
            subject: subject._id,
            teacher: subject.teacher,
            timeSlot: timeSlots[pNum - 1]
          });
        }
      }

      await Timetable.create({
        class: cls._id,
        slots
      });
    }
    console.log('Timetables generated.');

    // 8. Create Fee Structures & records
    console.log('Creating Fee Structures and bills...');
    for (const cls of classes) {
      const feeStruct = await FeeStructure.create({
        class: cls._id,
        tuitionFee: 10000 + (parseInt(cls.className.replace(/\D/g, '')) * 1000),
        examFee: 1500,
        otherFee: 500
      });

      // Generate invoice for each student in this class
      const clsStudents = await Student.find({ class: cls._id });
      for (const student of clsStudents) {
        // Some students will have paid, some unpaid
        const isPaid = student.rollNum.endsWith('2') || student.rollNum.endsWith('5') || student.rollNum.endsWith('8');
        
        await FeeRecord.create({
          student: student.user,
          class: cls._id,
          amountPaid: isPaid ? feeStruct.totalAmount : 0,
          amountDue: isPaid ? 0 : feeStruct.totalAmount,
          status: isPaid ? 'Paid' : 'Unpaid',
          paymentMethod: isPaid ? 'Card' : 'Simulator',
          paymentDate: isPaid ? new Date() : undefined,
          transactionId: isPaid ? `TXN-${Math.floor(10000000 + Math.random() * 90000000)}` : ''
        });
      }
    }
    console.log('Fee details created.');

    // 9. Generate Mock Attendance
    console.log('Creating Mock Attendance...');
    const today = new Date();
    for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
      const attendanceDate = new Date(today);
      attendanceDate.setDate(today.getDate() - dayOffset);
      attendanceDate.setHours(0, 0, 0, 0);

      for (const cls of classes) {
        const clsStudents = await Student.find({ class: cls._id });
        for (const student of clsStudents) {
          // 95% present rate
          const isAbsent = Math.random() < 0.05;
          await Attendance.create({
            student: student.user,
            class: cls._id,
            date: attendanceDate,
            status: isAbsent ? 'Absent' : 'Present',
            markedBy: cls.classTeacher
          });
        }
      }
    }
    console.log('Mock Attendance created.');

    // 10. Generate Announcements
    console.log('Creating Announcements...');
    await Announcement.create({
      title: 'School Reopening & Term Schedules',
      content: 'We are excited to welcome all students back for the academic term. Standard class timings will remain from 9:00 AM to 3:00 PM. Please ensure your child wears the full academic uniform.',
      targetAudience: ['all'],
      createdBy: adminUser._id
    });
    
    await Announcement.create({
      title: 'Staff Meeting: Curriculum Planning',
      content: 'All teachers are requested to attend the upcoming planning session in the conference hall this Friday at 3:30 PM. Please bring your syllabus outlines.',
      targetAudience: ['teacher'],
      createdBy: adminUser._id
    });

    await Announcement.create({
      title: 'Parent-Teacher Meet (PTM)',
      content: 'The monthly PTM is scheduled for Saturday from 9:30 AM to 1:00 PM. Discussion will focus on Term 1 progress cards. Attendance is mandatory for all parents.',
      targetAudience: ['parent'],
      createdBy: adminUser._id
    });
    console.log('Announcements created.');

    console.log('====================================');
    console.log('Database seeded successfully!');
    console.log('Demo Credentials:');
    console.log('Admin:    admin@edunexus.edu / password123');
    console.log('Teacher:  teacher1@edunexus.edu / password123');
    console.log('Parent:   parent1@edunexus.edu / password123');
    console.log('Student:  student1@edunexus.edu / password123');
    console.log('====================================');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
