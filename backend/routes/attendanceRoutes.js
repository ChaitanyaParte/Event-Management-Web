const express = require('express');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');
const { markAttendance, getAttendanceByEvent } = require('../controllers/attendanceController');

const router = express.Router();

router.post('/', authMiddleware, authorizeRoles('organizer'), markAttendance);
router.get('/event/:eventId', authMiddleware, authorizeRoles('organizer', 'admin'), getAttendanceByEvent);

module.exports = router;
