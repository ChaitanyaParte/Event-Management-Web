const express = require('express');
const { authMiddleware, authorizeRoles, authorizeSelfOrAdmin } = require('../middleware/authMiddleware');
const { getStudentById, updateStudent } = require('../controllers/adminController');

const router = express.Router();

router.get('/:id', authMiddleware, authorizeRoles('student', 'admin'), authorizeSelfOrAdmin(), getStudentById);
router.put('/:id', authMiddleware, authorizeRoles('student'), authorizeSelfOrAdmin(), updateStudent);

module.exports = router;
