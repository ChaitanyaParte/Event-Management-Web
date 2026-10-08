const express = require('express');
const { authMiddleware, authorizeRoles, authorizeSelfOrAdmin } = require('../middleware/authMiddleware');
const { getOrganizerById, updateOrganizer } = require('../controllers/adminController');

const router = express.Router();

router.get('/:id', authMiddleware, authorizeRoles('organizer', 'admin'), authorizeSelfOrAdmin(), getOrganizerById);
router.put('/:id', authMiddleware, authorizeRoles('organizer'), authorizeSelfOrAdmin(), updateOrganizer);

module.exports = router;
