const express = require('express');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');
const { createRegistration, getStudentRegistrations, getEventRegistrations, cancelRegistration } = require('../controllers/registrationController');

const router = express.Router();

router.post('/', authMiddleware, authorizeRoles('student'), createRegistration);
router.get('/student/:studentId', authMiddleware, authorizeRoles('student', 'admin', 'organizer'), getStudentRegistrations);
router.get('/event/:eventId', authMiddleware, authorizeRoles('organizer', 'admin'), getEventRegistrations);
router.delete('/:id', authMiddleware, authorizeRoles('student'), cancelRegistration);

module.exports = router;
