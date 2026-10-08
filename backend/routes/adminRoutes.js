const express = require('express');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getAdminStats,
  getDashboardActivity,
  getRegistrationChart,
  getCategoryChart,
  getPopularEvents,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentRegistrations,
  getStudentAttendance,
  getStudentCertificates,
  getAllOrganizers,
  getOrganizerById,
  updateOrganizer,
  approveOrganizer,
  deleteOrganizer,
  getAllEvents,
  getEventById,
  updateEvent,
  cancelEvent,
  reviewEvent,
  deleteEvent,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllRegistrations,
  getRegistrationById,
  cancelRegistration,
  getAllAttendance,
  getAttendanceByEvent,
  updateAttendance,
  getAllCertificates,
  getCertificateById,
  getEventReport,
  getStudentReport,
  getOrganizerReport,
  getCategoryReport,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
} = require('../controllers/adminController');

const router = express.Router();

// Middleware
router.use(authMiddleware, authorizeRoles('admin'));

// ============================================
// DASHBOARD & STATISTICS
// ============================================
router.get('/stats', getAdminStats);
router.get('/dashboard/activity', getDashboardActivity);
router.get('/dashboard/charts/registrations', getRegistrationChart);
router.get('/dashboard/charts/categories', getCategoryChart);
router.get('/dashboard/charts/popular-events', getPopularEvents);

// ============================================
// STUDENTS MANAGEMENT
// ============================================
router.get('/students', getAllStudents);
router.get('/students/:id', getStudentById);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);
router.get('/students/:id/registrations', getStudentRegistrations);
router.get('/students/:id/attendance', getStudentAttendance);
router.get('/students/:id/certificates', getStudentCertificates);

// ============================================
// ORGANIZERS MANAGEMENT
// ============================================
router.get('/organizers', getAllOrganizers);
router.get('/organizers/:id', getOrganizerById);
router.put('/organizers/:id', updateOrganizer);
router.put('/organizers/:id/approve', approveOrganizer);
router.delete('/organizers/:id', deleteOrganizer);

// ============================================
// EVENTS MANAGEMENT
// ============================================
router.get('/events', getAllEvents);
router.get('/events/:id', getEventById);
router.put('/events/:id', updateEvent);
router.put('/events/:id/cancel', cancelEvent);
router.put('/events/:id/review', reviewEvent);
router.delete('/events/:id', deleteEvent);

// ============================================
// CATEGORIES MANAGEMENT
// ============================================
router.get('/categories', getAllCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// ============================================
// REGISTRATIONS MANAGEMENT
// ============================================
router.get('/registrations', getAllRegistrations);
router.get('/registrations/:id', getRegistrationById);
router.put('/registrations/:id/cancel', cancelRegistration);

// ============================================
// ATTENDANCE MANAGEMENT
// ============================================
router.get('/attendance', getAllAttendance);
router.get('/attendance/event/:eventId', getAttendanceByEvent);
router.put('/attendance/:id', updateAttendance);

// ============================================
// CERTIFICATES MANAGEMENT
// ============================================
router.get('/certificates', getAllCertificates);
router.get('/certificates/:id', getCertificateById);

// ============================================
// REPORTS
// ============================================
router.get('/reports/events', getEventReport);
router.get('/reports/students', getStudentReport);
router.get('/reports/organizers', getOrganizerReport);
router.get('/reports/categories', getCategoryReport);

// ============================================
// ADMIN PROFILE
// ============================================
router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);
router.put('/profile/change-password', changeAdminPassword);

module.exports = router;
