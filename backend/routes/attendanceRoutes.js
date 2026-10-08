const express = require('express');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');
const { markAttendance, getAttendanceByEvent, getCheckinToken, checkIn } = require('../controllers/attendanceController');

const router = express.Router();

router.post('/', authMiddleware, authorizeRoles('organizer'), markAttendance);
router.get('/event/:eventId', authMiddleware, authorizeRoles('organizer', 'admin'), getAttendanceByEvent);
router.get('/event/:eventId/checkin-token', authMiddleware, authorizeRoles('organizer', 'admin'), getCheckinToken);
router.post('/checkin', authMiddleware, authorizeRoles('student'), checkIn);

module.exports = router;
