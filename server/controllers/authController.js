import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Parent from '../models/Parent.js';
import Class from '../models/Class.js';
import mongoose from 'mongoose';

// Generate Token
const generateToken = (res, id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET || 'edunexus_super_secure_secret_key_67890', {
    expiresIn: '30d',
  });

  // Set httpOnly cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  return token;
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      res.status(400);
      return next(new Error('Please provide an email and password'));
    }

    const { role } = req.body;
    let user;

    if (role) {
      user = await User.findOne({ email, role });
    }

    if (!user) {
      const users = await User.find({ email });
      for (const u of users) {
        if (await u.matchPassword(password)) {
          user = u;
          break;
        }
      }
    }

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(res, user._id);
      
      res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        status: user.status,
        token
      });
    } else {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    let profileDetails = {};

    if (user.role === 'student') {
      const studentProfile = await Student.findOne({ user: user._id })
        .populate('class')
        .populate({ path: 'parent', select: 'name email phone' });
      profileDetails = studentProfile;
    } else if (user.role === 'teacher') {
      const teacherProfile = await Teacher.findOne({ user: user._id })
        .populate('classes')
        .populate('subjects');
      profileDetails = teacherProfile;
    } else if (user.role === 'parent') {
      const parentProfile = await Parent.findOne({ user: user._id })
        .populate({
          path: 'children',
          select: 'name email role phone',
          populate: {
            path: 'class',
            model: 'Class'
          }
        });
      
      const childrenProfiles = [];
      if (parentProfile && parentProfile.children) {
        for (const childUser of parentProfile.children) {
          const sProf = await Student.findOne({ user: childUser._id }).populate('class');
          childrenProfiles.push({
            user: childUser,
            studentInfo: sProf
          });
        }
      }
      profileDetails = {
        _id: parentProfile ? parentProfile._id : null,
        user: parentProfile ? parentProfile.user : null,
        children: childrenProfiles
      };
    }

    res.json({
      success: true,
      user,
      profileDetails
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new public user
// @route   POST /api/auth/register
// @access  Public
export const registerPublicUser = async (req, res, next) => {
  const { name, email, password, role = 'admin', phone = '', rollNum = '', className = '', section = '' } = req.body;

  try {
    // Allow up to 3 accounts per email (and max 1 account per role for the same email)
    const existingRoleAccount = await User.findOne({ email, role });
    if (existingRoleAccount) {
      res.status(400);
      return next(new Error(`An account for ${email} with role '${role}' already exists.`));
    }

    const existingCount = await User.countDocuments({ email });
    if (existingCount >= 3) {
      res.status(400);
      return next(new Error('Maximum limit of 3 accounts per email address reached.'));
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone
    });

    if (role === 'teacher') {
      await Teacher.create({
        user: user._id,
        classes: [],
        subjects: []
      });
    } 
    else if (role === 'parent') {
      await Parent.create({
        user: user._id,
        children: []
      });
    } 
    else if (role === 'student') {
      let classObj = await Class.findOne({ className, section });
      if (!classObj) {
        classObj = await Class.findOne({});
      }

      await Student.create({
        user: user._id,
        rollNum: rollNum || `100${Math.floor(100 + Math.random() * 900)}`,
        class: classObj ? classObj._id : new mongoose.Types.ObjectId()
      });
    }

    const token = generateToken(res, user._id);

    res.status(201).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      token
    });
  } catch (error) {
    next(error);
  }
};

// Explicit Role Registration Handlers (Req #5)
export const registerSchoolUser = (req, res, next) => {
  req.body.role = 'admin';
  return registerPublicUser(req, res, next);
};

export const registerTeacherUser = (req, res, next) => {
  req.body.role = 'teacher';
  return registerPublicUser(req, res, next);
};

export const registerParentUser = (req, res, next) => {
  req.body.role = 'parent';
  return registerPublicUser(req, res, next);
};

export const registerStudentUser = (req, res, next) => {
  req.body.role = 'student';
  return registerPublicUser(req, res, next);
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};
