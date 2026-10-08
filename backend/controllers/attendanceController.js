const jwt = require('jsonwebtoken');
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

// Signed token that goes into the venue QR code. It is only valid for one event
// and stops working a few hours after the event ends.
const getCheckinToken = async (req, res, next) => {
  const eventId = parseInt(req.params.eventId, 10);
  if (Number.isNaN(eventId)) {
    return res.status(400).json({ message: 'Invalid event ID.' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT organizer_id, status, approval_status,
              GREATEST(EXTRACT(EPOCH FROM ((event_date + end_time) + INTERVAL '3 hours' - LOCALTIMESTAMP)), 3600)::int AS seconds_left
       FROM Events WHERE event_id = $1`,
      [eventId],
    );
    const event = rows[0];
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    if (req.user.role === 'organizer' && event.organizer_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only create a check-in code for your own events.' });
    }
    if (event.approval_status !== 'Approved') {
      return res.status(400).json({ message: "This event hasn't been approved yet." });
    }
    if (event.status === 'Cancelled') {
      return res.status(400).json({ message: 'This event was cancelled.' });
    }

    const token = jwt.sign({ type: 'checkin', eventId }, process.env.JWT_SECRET, { expiresIn: event.seconds_left });
    res.json({ token });
  } catch (error) {
    next(error);
  }
};

const checkIn = async (req, res, next) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: 'The check-in code is missing.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(400).json({ message: 'This check-in code is invalid or has expired.' });
  }
  if (payload.type !== 'checkin' || !payload.eventId) {
    return res.status(400).json({ message: 'This check-in code is invalid or has expired.' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT event_id, title, organizer_id, status,
              ((event_date + start_time) - INTERVAL '30 minutes' <= LOCALTIMESTAMP
               AND LOCALTIMESTAMP <= (event_date + end_time) + INTERVAL '3 hours') AS window_open
       FROM Events WHERE event_id = $1`,
      [payload.eventId],
    );
    const event = rows[0];
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    if (event.status === 'Cancelled') {
      return res.status(400).json({ message: 'This event was cancelled.' });
    }
    if (!event.window_open) {
      return res.status(400).json({ message: 'Check-in is only open from 30 minutes before the event until 3 hours after it ends.' });
    }

    const registration = await pool.query(
      "SELECT registration_id FROM Registrations WHERE student_id = $1 AND event_id = $2 AND status = 'Registered'",
      [req.user.id, event.event_id],
    );
    if (registration.rowCount === 0) {
      return res.status(403).json({ message: "You're not registered for this event." });
    }

    await pool.query(
      `INSERT INTO Attendance (registration_id, attendance_status, marked_by)
       VALUES ($1, 'Present', $2)
       ON CONFLICT (registration_id)
       DO UPDATE SET attendance_status = 'Present', marked_by = EXCLUDED.marked_by, marked_at = CURRENT_TIMESTAMP`,
      [registration.rows[0].registration_id, event.organizer_id],
    );
    res.json({ message: "You're checked in.", event_title: event.title });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markAttendance,
  getAttendanceByEvent,
  getCheckinToken,
  checkIn,
};
