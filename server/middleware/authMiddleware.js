import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Parses cookies from the request headers manually
const getCookieToken = (req) => {
  if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';');
    const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
  }
  return null;
};

export const protect = async (req, res, next) => {
  let token = getCookieToken(req);

  // Fallback to Bearer token header
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, no token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'edunexus_super_secure_secret_key_67890');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized, user not found'));
    }
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    res.status(401);
    return next(new Error('Not authorized, token validation failed'));
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error(`Not authorized as role: ${req.user ? req.user.role : 'Guest'}`));
    }
    next();
  };
};
