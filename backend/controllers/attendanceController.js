const { pool } = require('../config/db');

const markAttendance = async (req, res, next) => {
  const { registration_id, attendance_status } = req.body;
  const marked_by = req.user.id;
  if (!registration_id || !attendance_status) {
    return res.status(400).json({ message: 'registration_id and attendance_status are required.' });
  }

  if (!['Present', 'Absent'].includes(attendance_status)) {
    return res.status(400).json({ message: 'attendance_status must be Present or Absent.' });
  }

  try {
    const registrationQuery = `
      SELECT r.registration_id, r.status, e.organizer_id
      FROM Registrations r
      JOIN Events e ON r.event_id = e.event_id
      WHERE r.registration_id = $1
    `;
    const registrationResult = await pool.query(registrationQuery, [registration_id]);
    if (registrationResult.rowCount === 0) {
      return res.status(404).json({ message: 'Registration not found.' });
    }
    const registration = registrationResult.rows[0];
    if (registration.organizer_id !== marked_by) {
      return res.status(403).json({ message: 'You can only mark attendance for your own events.' });
    }
    if (registration.status !== 'Registered') {
      return res.status(400).json({ message: 'Cannot mark attendance for a cancelled registration.' });
    }

    const existingQuery = 'SELECT attendance_id FROM Attendance WHERE registration_id = $1';
    const existingResult = await pool.query(existingQuery, [registration_id]);
    if (existingResult.rowCount > 0) {
      const updateQuery = `
        UPDATE Attendance
        SET attendance_status = $1,
            marked_by = $2,
            marked_at = CURRENT_TIMESTAMP
        WHERE registration_id = $3
        RETURNING *
      `;
      const { rows } = await pool.query(updateQuery, [attendance_status, marked_by, registration_id]);
      return res.json(rows[0]);
    }

    const insertQuery = `
      INSERT INTO Attendance (registration_id, attendance_status, marked_by)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const { rows } = await pool.query(insertQuery, [registration_id, attendance_status, marked_by]);
    res.status(201).json(rows[0]);
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
    if (req.user.role === 'organizer') {
      const owner = await pool.query('SELECT organizer_id FROM Events WHERE event_id = $1', [eventId]);
      if (owner.rowCount === 0) {
        return res.status(404).json({ message: 'Event not found.' });
      }
      if (owner.rows[0].organizer_id !== req.user.id) {
        return res.status(403).json({ message: 'You can only view attendance for your own events.' });
      }
    }

    const query = `
      SELECT a.attendance_id, a.attendance_status, a.marked_at,
             a.registration_id,
             r.student_id,
             s.full_name AS student_name,
             e.event_id,
             e.title AS event_title,
             o.full_name AS marked_by_name
      FROM Attendance a
      JOIN Registrations r ON a.registration_id = r.registration_id
      JOIN Students s ON r.student_id = s.student_id
      JOIN Events e ON r.event_id = e.event_id
      JOIN Organizers o ON a.marked_by = o.organizer_id
      WHERE e.event_id = $1
      ORDER BY a.marked_at DESC
    `;
    const { rows } = await pool.query(query, [eventId]);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markAttendance,
  getAttendanceByEvent,
};
