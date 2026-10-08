const express = require('express');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');
const { getEvents, getEventById, createEvent, updateEvent, deleteEvent, getPublicStats, uploadEventImage, deleteEventImage, getMyEvents } = require('../controllers/eventController');
const { uploadImage } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', getEvents);
router.get('/summary', getPublicStats);
router.get('/mine', authMiddleware, authorizeRoles('organizer'), getMyEvents);
router.get('/:id', getEventById);
router.post('/', authMiddleware, authorizeRoles('admin', 'organizer'), createEvent);
router.put('/:id', authMiddleware, authorizeRoles('admin', 'organizer'), updateEvent);
router.delete('/:id', authMiddleware, authorizeRoles('admin', 'organizer'), deleteEvent);
router.post('/:id/image', authMiddleware, authorizeRoles('admin', 'organizer'), uploadImage.single('image'), uploadEventImage);
router.delete('/:id/image', authMiddleware, authorizeRoles('admin', 'organizer'), deleteEventImage);

module.exports = router;
