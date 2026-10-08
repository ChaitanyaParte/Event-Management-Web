const express = require('express');
const { registerStudent, loginStudent, loginOrganizer, loginAdmin, registerAdmin, registerOrganizer } = require('../controllers/authController');

const router = express.Router();

router.post('/student/register', registerStudent);
router.post('/student/login', loginStudent);
router.post('/organizer/register', registerOrganizer);
router.post('/organizer/login', loginOrganizer);
router.post('/admin/register', registerAdmin);
router.post('/admin/login', loginAdmin);

module.exports = router;
