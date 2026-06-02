import Library from '../models/Library.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import Notification from '../models/Notification.js';
import { sendNotificationToUser } from '../socket/socket.js';
import Student from '../models/Student.js';

export const uploadLibraryMaterial = async (req, res, next) => {
  const { title, description, classId, subjectId } = req.body;

  if (!req.file) {
    res.status(400);
    return next(new Error('Please upload a material file'));
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  try {
    const classObj = await Class.findById(classId);
    if (!classObj) {
      res.status(404);
      return next(new Error('Target class not found'));
    }

    const subjectObj = await Subject.findById(subjectId);
    if (!subjectObj) {
      res.status(404);
      return next(new Error('Subject not found'));
    }

    const material = await Library.create({
      title,
      description,
      class: classId,
      subject: subjectId,
      fileUrl,
      fileType: req.file.mimetype.includes('pdf') ? 'pdf' : 'document',
      uploadedBy: req.user._id
    });

    // Notify students of new study materials
    const students = await Student.find({ class: classId });
    for (const student of students) {
      const alert = await Notification.create({
        user: student.user,
        title: 'New Study Material Available',
        content: `"${title}" has been uploaded to the Digital Library for ${subjectObj.subName}.`,
        type: 'info'
      });
      sendNotificationToUser(student.user, alert);
    }

    res.status(201).json(material);
  } catch (error) {
    next(error);
  }
};

export const deleteLibraryMaterial = async (req, res, next) => {
  const { id } = req.params;
  try {
    const material = await Library.findById(id);
    if (!material) {
      res.status(404);
      return next(new Error('Library item not found'));
    }

    await Library.findByIdAndDelete(id);
    res.json({ message: 'Study material deleted successfully' });
  } catch (error) {
    next(error);
  }
};
