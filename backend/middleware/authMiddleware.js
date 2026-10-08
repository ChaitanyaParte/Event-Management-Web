const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token missing.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden. Insufficient permissions.' });
    }
    next();
  };
};

const authorizeSelfOrAdmin = (paramName = 'id') => {
  return (req, res, next) => {
    if (req.user.role === 'admin' || String(req.user.id) === String(req.params[paramName])) {
      return next();
    }
    return res.status(403).json({ message: 'Forbidden. You can only access your own data.' });
  };
};

module.exports = {
  authMiddleware,
  authorizeRoles,
  authorizeSelfOrAdmin,
};
