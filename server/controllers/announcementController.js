import Announcement from '../models/Announcement.js';
import Notification from '../models/Notification.js';
import { sendNotificationToRole } from '../socket/socket.js';

export const createAnnouncement = async (req, res, next) => {
  const { title, content, targetAudience } = req.body; // e.g. ['all'] or ['teacher', 'parent']
  try {
    const announcement = await Announcement.create({
      title,
      content,
      targetAudience: targetAudience || ['all'],
      createdBy: req.user._id
    });

    // Generate notification alerts for role groups
    const audiences = targetAudience || ['all'];
    for (const aud of audiences) {
      // In real-time socket, broadcast to role room
      const alert = {
        title: `New Announcement: ${title}`,
        content,
        type: 'info'
      };

      if (aud === 'all') {
        sendNotificationToRole('student', alert);
        sendNotificationToRole('teacher', alert);
        sendNotificationToRole('parent', alert);
      } else {
        sendNotificationToRole(aud, alert);
      }
    }

    res.status(201).json(announcement);
  } catch (error) {
    next(error);
  }
};

export const getAnnouncements = async (req, res, next) => {
  try {
    // If not authenticated (though route is guarded), retrieve all.
    // If authenticated, filter announcements where targetAudience includes 'all' OR the user's role.
    const userRole = req.user ? req.user.role : 'all';
    
    const announcements = await Announcement.find({
      $or: [
        { targetAudience: 'all' },
        { targetAudience: userRole }
      ]
    })
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    next(error);
  }
};
