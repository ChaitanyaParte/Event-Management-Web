const { pool } = require('../config/db');
const bcrypt = require('bcrypt');
const { removeEventImage } = require('../utils/imageFiles');
const { REQUIREMENTS_COLUMN } = require('../utils/eventQueries');

// ============================================
// DASHBOARD & STATISTICS
// ============================================

const getAdminStats = async (req, res, next) => {
  try {
    const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM Students) AS total_students,
        (SELECT COUNT(*) FROM Organizers) AS total_organizers,
        (SELECT COUNT(*) FROM Events WHERE approval_status = 'Approved') AS total_events,
        (SELECT COUNT(*) FROM Events WHERE approval_status = 'Pending') AS pending_events,
        (SELECT COUNT(*) FROM Registrations WHERE status = 'Registered') AS total_registrations,
        (SELECT COUNT(*) FROM Events WHERE approval_status = 'Approved' AND status = 'Upcoming') AS upcoming_events,
        (SELECT COUNT(*) FROM Events WHERE approval_status = 'Approved' AND status = 'Ongoing') AS ongoing_events,
        (SELECT COUNT(*) FROM Events WHERE approval_status = 'Approved' AND status = 'Completed') AS completed_events,
        (SELECT COUNT(*) FROM Certificates) AS total_certificates
    `;
    const { rows } = await pool.query(statsQuery);
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

const getDashboardActivity = async (req, res, next) => {
  try {
    const query = `
      (SELECT 'student_registration' AS type, s.full_name AS name, s.created_at AS timestamp
       FROM Students s ORDER BY s.created_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'organizer_registration', o.full_name, o.created_at
       FROM Organizers o ORDER BY o.created_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'event_created', e.title, e.created_at
       FROM Events e ORDER BY e.created_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'certificate_issued', CONCAT(s.full_name, ' - ', e.title), c.issue_date
       FROM Certificates c
       JOIN Registrations r ON c.registration_id = r.registration_id
       JOIN Students s ON r.student_id = s.student_id
       JOIN Events e ON r.event_id = e.event_id
       ORDER BY c.issue_date DESC LIMIT 5)
      ORDER BY timestamp DESC
      LIMIT 15
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const getRegistrationChart = async (req, res, next) => {
  try {
    const query = `
      SELECT DATE(registration_date) AS date, COUNT(*) AS count
      FROM Registrations
      WHERE registration_date >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(registration_date)
      ORDER BY date ASC
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const getCategoryChart = async (req, res, next) => {
  try {
    const query = `
      SELECT c.category_name, COUNT(e.event_id) AS count
      FROM Event_Categories c
      LEFT JOIN Events e ON c.category_id = e.category_id AND e.approval_status = 'Approved'
      GROUP BY c.category_id, c.category_name
      ORDER BY count DESC
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const getPopularEvents = async (req, res, next) => {
  try {
    const query = `
      SELECT e.event_id, e.title, COUNT(r.registration_id) AS registrations
      FROM Events e
      LEFT JOIN Registrations r ON e.event_id = r.event_id AND r.status = 'Registered'
      WHERE e.approval_status = 'Approved'
      GROUP BY e.event_id, e.title
      ORDER BY registrations DESC
      LIMIT 10
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

// ============================================
// STUDENTS MANAGEMENT
// ============================================

const getAllStudents = async (req, res, next) => {
  try {
    const query = `
      SELECT student_id, roll_number, full_name, email, phone, department, year_of_study, created_at
      FROM Students
      ORDER BY full_name
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const getStudentById = async (req, res, next) => {
  const studentId = parseInt(req.params.id, 10);
  if (Number.isNaN(studentId)) {
    return res.status(400).json({ message: 'Invalid student ID.' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT student_id, roll_number, full_name, email, phone, department, year_of_study, created_at FROM Students WHERE student_id = $1',
      [studentId]
    );
    if (!rows[0]) {
      return res.status(404).json({ message: 'Student not found.' });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

const updateStudent = async (req, res, next) => {
  const studentId = parseInt(req.params.id, 10);
  const { full_name, phone, department, year_of_study } = req.body;

  if (Number.isNaN(studentId)) {
    return res.status(400).json({ message: 'Invalid student ID.' });
  }

  try {
    const query = `
      UPDATE Students
      SET full_name = COALESCE($1, full_name),
          phone = COALESCE($2, phone),
          department = COALESCE($3, department),
          year_of_study = COALESCE($4, year_of_study)
      WHERE student_id = $5
      RETURNING student_id, roll_number, full_name, email, phone, department, year_of_study, created_at
    `;
    const values = [full_name || null, phone || null, department || null, year_of_study || null, studentId];
    const { rows } = await pool.query(query, values);
    if (!rows[0]) {
      return res.status(404).json({ message: 'Student not found.' });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

const deleteStudent = async (req, res, next) => {
  const studentId = parseInt(req.params.id, 10);
  if (Number.isNaN(studentId)) {
    return res.status(400).json({ message: 'Invalid student ID.' });
  }

  try {
    const { rows } = await pool.query('DELETE FROM Students WHERE student_id = $1 RETURNING student_id', [studentId]);
    if (!rows[0]) {
      return res.status(404).json({ message: 'Student not found.' });
    }
    res.json({ message: 'Student deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

const getStudentRegistrations = async (req, res, next) => {
  const studentId = parseInt(req.params.id, 10);
  if (Number.isNaN(studentId)) {
    return res.status(400).json({ message: 'Invalid student ID.' });
  }

  try {
    const query = `
      SELECT r.registration_id, r.registration_date, r.status,
             e.event_id, e.title, e.event_date
      FROM Registrations r
      JOIN Events e ON r.event_id = e.event_id
      WHERE r.student_id = $1
      ORDER BY r.registration_date DESC
    `;
    const { rows } = await pool.query(query, [studentId]);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const getStudentAttendance = async (req, res, next) => {
  const studentId = parseInt(req.params.id, 10);
  if (Number.isNaN(studentId)) {
    return res.status(400).json({ message: 'Invalid student ID.' });
  }

  try {
    const query = `
      SELECT a.attendance_id, a.attendance_status, a.marked_at AS attendance_date,
             e.event_id, e.title
      FROM Attendance a
      JOIN Registrations r ON a.registration_id = r.registration_id
      JOIN Events e ON r.event_id = e.event_id
      WHERE r.student_id = $1
      ORDER BY a.marked_at DESC
    `;
    const { rows } = await pool.query(query, [studentId]);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const getStudentCertificates = async (req, res, next) => {
  const studentId = parseInt(req.params.id, 10);
  if (Number.isNaN(studentId)) {
    return res.status(400).json({ message: 'Invalid student ID.' });
  }

  try {
    const query = `
      SELECT c.certificate_id, c.certificate_code, c.issue_date,
             e.event_id, e.title
      FROM Certificates c
      JOIN Registrations r ON c.registration_id = r.registration_id
      JOIN Events e ON r.event_id = e.event_id
      WHERE r.student_id = $1
      ORDER BY c.issue_date DESC
    `;
    const { rows } = await pool.query(query, [studentId]);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

// ============================================
// ORGANIZERS MANAGEMENT
// ============================================

const getAllOrganizers = async (req, res, next) => {
  try {
    const query = `
      SELECT o.organizer_id, o.full_name, o.email, o.phone, o.department, o.approved_by, o.created_at,
             CASE WHEN o.approved_by IS NOT NULL THEN 'Approved' ELSE 'Pending' END AS approval_status
      FROM Organizers o
      ORDER BY o.full_name
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const getOrganizerById = async (req, res, next) => {
  const organizerId = parseInt(req.params.id, 10);
  if (Number.isNaN(organizerId)) {
    return res.status(400).json({ message: 'Invalid organizer ID.' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT o.organizer_id, o.full_name, o.email, o.phone, o.department, o.approved_by, o.created_at,
              CASE WHEN o.approved_by IS NOT NULL THEN 'Approved' ELSE 'Pending' END AS approval_status
       FROM Organizers o WHERE o.organizer_id = $1`,
      [organizerId]
    );
    if (!rows[0]) {
      return res.status(404).json({ message: 'Organizer not found.' });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

const updateOrganizer = async (req, res, next) => {
  const organizerId = parseInt(req.params.id, 10);
  const { full_name, phone, department } = req.body;

  if (Number.isNaN(organizerId)) {
    return res.status(400).json({ message: 'Invalid organizer ID.' });
  }

  try {
    const query = `
      UPDATE Organizers
      SET full_name = COALESCE($1, full_name),
          phone = COALESCE($2, phone),
          department = COALESCE($3, department)
      WHERE organizer_id = $4
      RETURNING organizer_id, full_name, email, phone, department, approved_by, created_at
    `;
    const values = [full_name || null, phone || null, department || null, organizerId];
    const { rows } = await pool.query(query, values);
    if (!rows[0]) {
      return res.status(404).json({ message: 'Organizer not found.' });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

const approveOrganizer = async (req, res, next) => {
  const organizerId = parseInt(req.params.id, 10);
  const adminId = req.user.id;

  if (Number.isNaN(organizerId)) {
    return res.status(400).json({ message: 'Invalid organizer ID.' });
  }

  try {
    const query = `
      UPDATE Organizers
      SET approved_by = $1
      WHERE organizer_id = $2 AND approved_by IS NULL
      RETURNING organizer_id, full_name, email, approved_by
    `;
    const { rows } = await pool.query(query, [adminId, organizerId]);
    if (!rows[0]) {
      return res.status(404).json({ message: 'Organizer not found or already approved.' });
    }
    res.json({ message: 'Organizer approved successfully.', organizer: rows[0] });
  } catch (error) {
    next(error);
  }
};

const deleteOrganizer = async (req, res, next) => {
  const organizerId = parseInt(req.params.id, 10);
  if (Number.isNaN(organizerId)) {
    return res.status(400).json({ message: 'Invalid organizer ID.' });
  }

  try {
    const { rows } = await pool.query('DELETE FROM Organizers WHERE organizer_id = $1 RETURNING organizer_id', [organizerId]);
    if (!rows[0]) {
      return res.status(404).json({ message: 'Organizer not found.' });
    }
    res.json({ message: 'Organizer deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ============================================
// EVENTS MANAGEMENT
// ============================================

const getAllEvents = async (req, res, next) => {
  try {
    const query = `
      SELECT e.event_id, e.title, e.venue, e.event_date, e.start_time, e.end_time, e.seat_limit, e.status, e.image_url, e.approval_status, e.review_note,
             c.category_name, c.category_id,
             o.full_name AS organizer_name, o.organizer_id,
             COALESCE(r.registered_count, 0) AS registered_count,
             e.seat_limit - COALESCE(r.registered_count, 0) AS available_seats
      FROM Events e
      JOIN Event_Categories c ON e.category_id = c.category_id
      JOIN Organizers o ON e.organizer_id = o.organizer_id
      LEFT JOIN (
        SELECT event_id, COUNT(*) AS registered_count
        FROM Registrations
        WHERE status = 'Registered'
        GROUP BY event_id
      ) r ON e.event_id = r.event_id
      ORDER BY (e.approval_status = 'Pending') DESC, e.event_date DESC
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const getEventById = async (req, res, next) => {
  const eventId = parseInt(req.params.id, 10);
  if (Number.isNaN(eventId)) {
    return res.status(400).json({ message: 'Invalid event ID.' });
  }

  try {
    const query = `
      SELECT e.event_id, e.title, e.description, e.venue, e.event_date, e.start_time, e.end_time, 
             e.seat_limit, e.status, e.category_id, e.organizer_id, e.image_url,
             e.approval_status, e.review_note, e.reviewed_at, e.requirements_notes,
             c.category_name,
             o.full_name AS organizer_name, o.email AS organizer_email,
             COALESCE(r.registered_count, 0) AS registered_count,
             ${REQUIREMENTS_COLUMN}
      FROM Events e
      JOIN Event_Categories c ON e.category_id = c.category_id
      JOIN Organizers o ON e.organizer_id = o.organizer_id
      LEFT JOIN (
        SELECT event_id, COUNT(*) AS registered_count
        FROM Registrations
        WHERE status = 'Registered'
        GROUP BY event_id
      ) r ON e.event_id = r.event_id
      WHERE e.event_id = $1
    `;
    const { rows } = await pool.query(query, [eventId]);
    if (!rows[0]) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  const eventId = parseInt(req.params.id, 10);
  const { title, description, venue, event_date, start_time, end_time, seat_limit, status, category_id } = req.body;

  if (Number.isNaN(eventId)) {
    return res.status(400).json({ message: 'Invalid event ID.' });
  }

  try {
    const query = `
      UPDATE Events
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          venue = COALESCE($3, venue),
          event_date = COALESCE($4, event_date),
          start_time = COALESCE($5, start_time),
          end_time = COALESCE($6, end_time),
          seat_limit = COALESCE($7, seat_limit),
          status = COALESCE($8, status),
          category_id = COALESCE($9, category_id)
      WHERE event_id = $10
      RETURNING event_id, title, description, venue, event_date, start_time, end_time, seat_limit, status, category_id
    `;
    const values = [title || null, description || null, venue || null, event_date || null, 
                    start_time || null, end_time || null, seat_limit || null, status || null, category_id || null, eventId];
    const { rows } = await pool.query(query, values);
    if (!rows[0]) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

const reviewEvent = async (req, res, next) => {
  const eventId = parseInt(req.params.id, 10);
  const { decision } = req.body;
  const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';

  if (Number.isNaN(eventId)) {
    return res.status(400).json({ message: 'Invalid event ID.' });
  }
  if (!['approve', 'reject'].includes(decision)) {
    return res.status(400).json({ message: 'Decision must be approve or reject.' });
  }
  if (decision === 'reject' && !note) {
    return res.status(400).json({ message: 'Give a reason so the organizer knows what to fix.' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE Events
       SET approval_status = $1, review_note = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP
       WHERE event_id = $4 AND approval_status = 'Pending'
       RETURNING event_id, title, approval_status`,
      [decision === 'approve' ? 'Approved' : 'Rejected', note || null, req.user.id, eventId],
    );
    if (!rows[0]) {
      return res.status(404).json({ message: 'This event is not waiting for approval.' });
    }
    res.json({ message: decision === 'approve' ? 'Event approved.' : 'Event rejected.', event: rows[0] });
  } catch (error) {
    next(error);
  }
};

const cancelEvent = async (req, res, next) => {
  const eventId = parseInt(req.params.id, 10);
  if (Number.isNaN(eventId)) {
    return res.status(400).json({ message: 'Invalid event ID.' });
  }

  try {
    const query = `
      UPDATE Events
      SET status = 'Cancelled'
      WHERE event_id = $1
      RETURNING event_id, title, status
    `;
    const { rows } = await pool.query(query, [eventId]);
    if (!rows[0]) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    res.json({ message: 'Event cancelled successfully.', event: rows[0] });
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  const eventId = parseInt(req.params.id, 10);
  if (Number.isNaN(eventId)) {
    return res.status(400).json({ message: 'Invalid event ID.' });
  }

  try {
    const { rows } = await pool.query('DELETE FROM Events WHERE event_id = $1 RETURNING event_id, image_url', [eventId]);
    if (!rows[0]) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    removeEventImage(rows[0].image_url);
    res.json({ message: 'Event deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ============================================
// CATEGORIES MANAGEMENT
// ============================================

const getAllCategories = async (req, res, next) => {
  try {
    const query = `
      SELECT c.category_id, c.category_name, COUNT(e.event_id) AS events_count
      FROM Event_Categories c
      LEFT JOIN Events e ON c.category_id = e.category_id
      GROUP BY c.category_id, c.category_name
      ORDER BY c.category_name
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  const { category_name } = req.body;

  if (!category_name || category_name.trim().length === 0) {
    return res.status(400).json({ message: 'Category name is required.' });
  }

  try {
    const query = `
      INSERT INTO Event_Categories (category_name)
      VALUES ($1)
      RETURNING category_id, category_name
    `;
    const { rows } = await pool.query(query, [category_name]);
    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Category already exists.' });
    }
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  const categoryId = parseInt(req.params.id, 10);
  const { category_name } = req.body;

  if (Number.isNaN(categoryId)) {
    return res.status(400).json({ message: 'Invalid category ID.' });
  }

  if (!category_name || category_name.trim().length === 0) {
    return res.status(400).json({ message: 'Category name is required.' });
  }

  try {
    const query = `
      UPDATE Event_Categories
      SET category_name = $1
      WHERE category_id = $2
      RETURNING category_id, category_name
    `;
    const { rows } = await pool.query(query, [category_name, categoryId]);
    if (!rows[0]) {
      return res.status(404).json({ message: 'Category not found.' });
    }
    res.json(rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Category name already exists.' });
    }
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  const categoryId = parseInt(req.params.id, 10);
  if (Number.isNaN(categoryId)) {
    return res.status(400).json({ message: 'Invalid category ID.' });
  }

  try {
    const eventCheck = await pool.query('SELECT COUNT(*) FROM Events WHERE category_id = $1', [categoryId]);
    if (parseInt(eventCheck.rows[0].count, 10) > 0) {
      return res.status(409).json({ message: `Cannot delete category. ${eventCheck.rows[0].count} event(s) depend on this category.` });
    }

    const { rows } = await pool.query('DELETE FROM Event_Categories WHERE category_id = $1 RETURNING category_id', [categoryId]);
    if (!rows[0]) {
      return res.status(404).json({ message: 'Category not found.' });
    }
    res.json({ message: 'Category deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ============================================
// REGISTRATIONS MANAGEMENT
// ============================================

const getAllRegistrations = async (req, res, next) => {
  try {
    const query = `
      SELECT r.registration_id, r.registration_date, r.status,
             s.student_id, s.full_name AS student_name, s.email,
             e.event_id, e.title AS event_title, e.event_date
      FROM Registrations r
      JOIN Students s ON r.student_id = s.student_id
      JOIN Events e ON r.event_id = e.event_id
      ORDER BY r.registration_date DESC
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const getRegistrationById = async (req, res, next) => {
  const registrationId = parseInt(req.params.id, 10);
  if (Number.isNaN(registrationId)) {
    return res.status(400).json({ message: 'Invalid registration ID.' });
  }

  try {
    const query = `
      SELECT r.registration_id, r.registration_date, r.status,
             s.student_id, s.full_name AS student_name, s.email,
             e.event_id, e.title AS event_title
      FROM Registrations r
      JOIN Students s ON r.student_id = s.student_id
      JOIN Events e ON r.event_id = e.event_id
      WHERE r.registration_id = $1
    `;
    const { rows } = await pool.query(query, [registrationId]);
    if (!rows[0]) {
      return res.status(404).json({ message: 'Registration not found.' });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

const cancelRegistration = async (req, res, next) => {
  const registrationId = parseInt(req.params.id, 10);
  if (Number.isNaN(registrationId)) {
    return res.status(400).json({ message: 'Invalid registration ID.' });
  }

  try {
    const query = `
      UPDATE Registrations
      SET status = 'Cancelled'
      WHERE registration_id = $1 AND status = 'Registered'
      RETURNING registration_id, status
    `;
    const { rows } = await pool.query(query, [registrationId]);
    if (!rows[0]) {
      return res.status(404).json({ message: 'Registration not found or already cancelled.' });
    }
    res.json({ message: 'Registration cancelled successfully.', registration: rows[0] });
  } catch (error) {
    next(error);
  }
};

// ============================================
// ATTENDANCE MANAGEMENT
// ============================================

const getAllAttendance = async (req, res, next) => {
  try {
    const query = `
      SELECT a.attendance_id, a.attendance_status, a.marked_at AS attendance_date,
             s.student_id, s.full_name AS student_name,
             e.event_id, e.title AS event_title,
             o.full_name AS marked_by
      FROM Attendance a
      JOIN Registrations r ON a.registration_id = r.registration_id
      JOIN Students s ON r.student_id = s.student_id
      JOIN Events e ON r.event_id = e.event_id
      LEFT JOIN Organizers o ON a.marked_by = o.organizer_id
      ORDER BY a.marked_at DESC
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const getAttendanceByEvent = async (req, res, next) => {
  const eventId = parseInt(req.params.eventId, 10);
  if (Number.isNaN(eventId)) {
    return res.status(400).json({ message: 'Invalid event ID.' });
  }

  try {
    const query = `
      SELECT a.attendance_id, a.attendance_status, a.marked_at AS attendance_date,
             s.student_id, s.full_name AS student_name,
             o.full_name AS marked_by
      FROM Attendance a
      JOIN Registrations r ON a.registration_id = r.registration_id
      JOIN Students s ON r.student_id = s.student_id
      JOIN Events e ON r.event_id = e.event_id
      LEFT JOIN Organizers o ON a.marked_by = o.organizer_id
      WHERE e.event_id = $1
      ORDER BY a.marked_at DESC
    `;
    const { rows } = await pool.query(query, [eventId]);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const updateAttendance = async (req, res, next) => {
  const attendanceId = parseInt(req.params.id, 10);
  const { attendance_status } = req.body;

  if (Number.isNaN(attendanceId)) {
    return res.status(400).json({ message: 'Invalid attendance ID.' });
  }

  if (!attendance_status || !['Present', 'Absent'].includes(attendance_status)) {
    return res.status(400).json({ message: 'Valid attendance status required (Present/Absent).' });
  }

  try {
    const query = `
      UPDATE Attendance
      SET attendance_status = $1
      WHERE attendance_id = $2
      RETURNING attendance_id, attendance_status, marked_at AS attendance_date
    `;
    const { rows } = await pool.query(query, [attendance_status, attendanceId]);
    if (!rows[0]) {
      return res.status(404).json({ message: 'Attendance record not found.' });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

// ============================================
// CERTIFICATES MANAGEMENT
// ============================================

const getAllCertificates = async (req, res, next) => {
  try {
    const query = `
      SELECT c.certificate_id, c.certificate_code, c.issue_date,
             s.student_id, s.full_name AS student_name,
             e.event_id, e.title AS event_title
      FROM Certificates c
      JOIN Registrations r ON c.registration_id = r.registration_id
      JOIN Students s ON r.student_id = s.student_id
      JOIN Events e ON r.event_id = e.event_id
      ORDER BY c.issue_date DESC
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const getCertificateById = async (req, res, next) => {
  const certificateId = parseInt(req.params.id, 10);
  if (Number.isNaN(certificateId)) {
    return res.status(400).json({ message: 'Invalid certificate ID.' });
  }

  try {
    const query = `
      SELECT c.certificate_id, c.certificate_code, c.issue_date,
             s.student_id, s.full_name AS student_name,
             e.event_id, e.title AS event_title
      FROM Certificates c
      JOIN Registrations r ON c.registration_id = r.registration_id
      JOIN Students s ON r.student_id = s.student_id
      JOIN Events e ON r.event_id = e.event_id
      WHERE c.certificate_id = $1
    `;
    const { rows } = await pool.query(query, [certificateId]);
    if (!rows[0]) {
      return res.status(404).json({ message: 'Certificate not found.' });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

// ============================================
// REPORTS
// ============================================

const getEventReport = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        e.event_id, e.title, e.event_date, e.seat_limit, e.status,
        c.category_name,
        o.full_name AS organizer_name,
        COUNT(DISTINCT r.registration_id) AS total_registrations,
        COUNT(DISTINCT CASE WHEN a.attendance_status = 'Present' THEN a.attendance_id END) AS attended_count,
        ROUND(COUNT(DISTINCT CASE WHEN a.attendance_status = 'Present' THEN a.attendance_id END)::NUMERIC / 
              NULLIF(COUNT(DISTINCT r.registration_id), 0) * 100, 2) AS attendance_percentage
      FROM Events e
      JOIN Event_Categories c ON e.category_id = c.category_id
      JOIN Organizers o ON e.organizer_id = o.organizer_id
      LEFT JOIN Registrations r ON e.event_id = r.event_id AND r.status = 'Registered'
      LEFT JOIN Attendance a ON r.registration_id = a.registration_id
      GROUP BY e.event_id, e.title, e.event_date, e.seat_limit, e.status, c.category_name, o.full_name
      ORDER BY e.event_date DESC
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const getStudentReport = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        s.student_id, s.full_name, s.roll_number, s.department,
        COUNT(DISTINCT r.event_id) AS events_registered,
        COUNT(DISTINCT CASE WHEN a.attendance_status = 'Present' THEN r.event_id END) AS events_attended,
        COUNT(DISTINCT cert.certificate_id) AS certificates_earned
      FROM Students s
      LEFT JOIN Registrations r ON s.student_id = r.student_id AND r.status = 'Registered'
      LEFT JOIN Attendance a ON r.registration_id = a.registration_id
      LEFT JOIN Certificates cert ON r.registration_id = cert.registration_id
      GROUP BY s.student_id, s.full_name, s.roll_number, s.department
      ORDER BY s.full_name
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const getOrganizerReport = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        o.organizer_id, o.full_name, o.email,
        COUNT(DISTINCT e.event_id) AS events_created,
        COUNT(DISTINCT r.registration_id) AS total_registrations,
        ROUND(COUNT(DISTINCT CASE WHEN a.attendance_status = 'Present' THEN a.attendance_id END)::NUMERIC /
              NULLIF(COUNT(DISTINCT r.registration_id), 0) * 100, 2) AS average_attendance_percentage,
        CASE WHEN o.approved_by IS NOT NULL THEN 'Approved' ELSE 'Pending' END AS status
      FROM Organizers o
      LEFT JOIN Events e ON o.organizer_id = e.organizer_id
      LEFT JOIN Registrations r ON e.event_id = r.event_id AND r.status = 'Registered'
      LEFT JOIN Attendance a ON r.registration_id = a.registration_id
      GROUP BY o.organizer_id, o.full_name, o.email, o.approved_by
      ORDER BY o.full_name
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const getCategoryReport = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        c.category_id, c.category_name,
        COUNT(DISTINCT e.event_id) AS events_count,
        COUNT(DISTINCT r.registration_id) AS total_registrations,
        COUNT(DISTINCT CASE WHEN a.attendance_status = 'Present' THEN a.attendance_id END) AS attended,
        ROUND(COUNT(DISTINCT CASE WHEN a.attendance_status = 'Present' THEN a.attendance_id END)::NUMERIC / 
              NULLIF(COUNT(DISTINCT r.registration_id), 0) * 100, 2) AS attendance_percentage
      FROM Event_Categories c
      LEFT JOIN Events e ON c.category_id = e.category_id
      LEFT JOIN Registrations r ON e.event_id = r.event_id AND r.status = 'Registered'
      LEFT JOIN Attendance a ON r.registration_id = a.registration_id
      GROUP BY c.category_id, c.category_name
      ORDER BY c.category_name
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

// ============================================
// ADMIN PROFILE
// ============================================

const getAdminProfile = async (req, res, next) => {
  const adminId = req.user.id;

  try {
    const { rows } = await pool.query(
      'SELECT admin_id, username, full_name, email FROM Admin WHERE admin_id = $1',
      [adminId]
    );
    if (!rows[0]) {
      return res.status(404).json({ message: 'Admin not found.' });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

const updateAdminProfile = async (req, res, next) => {
  const adminId = req.user.id;
  const { full_name, email } = req.body;

  try {
    const query = `
      UPDATE Admin
      SET full_name = COALESCE($1, full_name),
          email = COALESCE($2, email)
      WHERE admin_id = $3
      RETURNING admin_id, username, full_name, email
    `;
    const values = [full_name || null, email || null, adminId];
    const { rows } = await pool.query(query, values);
    if (!rows[0]) {
      return res.status(404).json({ message: 'Admin not found.' });
    }
    res.json(rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Email already in use.' });
    }
    next(error);
  }
};

const changeAdminPassword = async (req, res, next) => {
  const adminId = req.user.id;
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ message: 'Current and new password are required.' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters.' });
  }

  try {
    const { rows: adminRows } = await pool.query('SELECT password_hash FROM Admin WHERE admin_id = $1', [adminId]);
    if (!adminRows[0]) {
      return res.status(404).json({ message: 'Admin not found.' });
    }

    const passwordMatch = await bcrypt.compare(current_password, adminRows[0].password_hash);
    if (!passwordMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    const query = `
      UPDATE Admin
      SET password_hash = $1
      WHERE admin_id = $2
      RETURNING admin_id, username, full_name, email
    `;
    const { rows } = await pool.query(query, [hashedPassword, adminId]);
    res.json({ message: 'Password changed successfully.', admin: rows[0] });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Dashboard
  getAdminStats,
  getDashboardActivity,
  getRegistrationChart,
  getCategoryChart,
  getPopularEvents,
  // Students
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentRegistrations,
  getStudentAttendance,
  getStudentCertificates,
  // Organizers
  getAllOrganizers,
  getOrganizerById,
  updateOrganizer,
  approveOrganizer,
  deleteOrganizer,
  // Events
  getAllEvents,
  getEventById,
  updateEvent,
  cancelEvent,
  reviewEvent,
  deleteEvent,
  // Categories
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  // Registrations
  getAllRegistrations,
  getRegistrationById,
  cancelRegistration,
  // Attendance
  getAllAttendance,
  getAttendanceByEvent,
  updateAttendance,
  // Certificates
  getAllCertificates,
  getCertificateById,
  // Reports
  getEventReport,
  getStudentReport,
  getOrganizerReport,
  getCategoryReport,
  // Admin Profile
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
};
