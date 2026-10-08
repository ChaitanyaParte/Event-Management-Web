const express = require('express');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');
const { getEvents, getEventById, createEvent, updateEvent, deleteEvent, getPublicStats } = require('../controllers/eventController');

const router = express.Router();

router.get('/', getEvents);
router.get('/summary', getPublicStats);
router.get('/:id', getEventById);
router.post('/', authMiddleware, authorizeRoles('admin', 'organizer'), createEvent);
router.put('/:id', authMiddleware, authorizeRoles('admin', 'organizer'), updateEvent);
router.delete('/:id', authMiddleware, authorizeRoles('admin', 'organizer'), deleteEvent);

module.exports = router;
