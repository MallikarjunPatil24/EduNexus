import Message from '../models/Message.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Parent from '../models/Parent.js';

// Send Chat Message
export const sendChatMessage = async (req, res, next) => {
  const { receiverId, content } = req.body;
  try {
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      res.status(404);
      return next(new Error('Recipient user not found'));
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      content
    });

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

// Retrieve chat history between current user and specified peer
export const getChatHistory = async (req, res, next) => {
  const { peerId } = req.params;
  try {
    const history = await Message.find({
      $or: [
        { sender: req.user._id, receiver: peerId },
        { sender: peerId, receiver: req.user._id }
      ]
    }).sort({ createdAt: 1 });
    
    // Mark received messages as read
    await Message.updateMany(
      { sender: peerId, receiver: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json(history);
  } catch (error) {
    next(error);
  }
};

// Fetch listing of messaging contacts for parent/teacher portal chat
export const getChatContacts = async (req, res, next) => {
  try {
    let contacts = [];
    
    if (req.user.role === 'parent') {
      // Parents can chat with their children's teachers
      const parentProfile = await Parent.findOne({ user: req.user._id });
      if (parentProfile) {
        const studentProfiles = await Student.find({ user: { $in: parentProfile.children } }).populate('class');
        
        const teacherIds = [];
        for (const sp of studentProfiles) {
          if (sp.class && sp.class.classTeacher) {
            teacherIds.push(sp.class.classTeacher);
          }
        }

        contacts = await User.find({ _id: { $in: teacherIds } }).select('name email role avatar');
      }
    } 
    else if (req.user.role === 'teacher') {
      // Teachers can chat with the parents of students in their assigned classes
      const teacherProfile = await Teacher.findOne({ user: req.user._id });
      if (teacherProfile) {
        const classes = teacherProfile.classes;
        const studentProfiles = await Student.find({ class: { $in: classes } }).populate('parent');
        
        const parentUserIds = studentProfiles
          .filter(sp => sp.parent)
          .map(sp => sp.parent);

        contacts = await User.find({ _id: { $in: parentUserIds } }).select('name email role avatar');
      }
    } 
    else {
      // General fallback (admins can chat with teachers/parents)
      contacts = await User.find({ role: { $in: ['teacher', 'parent'] } }).select('name email role avatar');
    }

    res.json(contacts);
  } catch (error) {
    next(error);
  }
};
