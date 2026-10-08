const express = require('express');
const { authMiddleware, authorizeRoles, authorizeSelfOrAdmin } = require('../middleware/authMiddleware');
const { issueCertificates, getStudentCertificates } = require('../controllers/certificateController');

const router = express.Router();

router.post('/issue', authMiddleware, authorizeRoles('organizer', 'admin'), issueCertificates);
router.get('/student/:studentId', authMiddleware, authorizeRoles('student', 'admin'), authorizeSelfOrAdmin('studentId'), getStudentCertificates);

module.exports = router;
