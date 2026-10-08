const { pool } = require('../config/db');

const createRegistration = async (req, res, next) => {
  const { student_id, event_id } = req.body;
  const requesterId = req.user.id;

  if (!student_id || !event_id) {
    return res.status(400).json({ message: 'student_id and event_id are required.' });
  }

  if (requesterId !== student_id) {
    return res.status(403).json({ message: 'Students can only register themselves.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const studentQuery = 'SELECT student_id FROM Students WHERE student_id = $1';
    const studentResult = await client.query(studentQuery, [student_id]);
    if (studentResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Student not found.' });
    }

    const eventQuery = 'SELECT event_id, status, seat_limit FROM Events WHERE event_id = $1';
    const eventResult = await client.query(eventQuery, [event_id]);
    if (eventResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Event not found.' });
    }

    const event = eventResult.rows[0];
    if (event.status === 'Cancelled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Cannot register for a cancelled event.' });
    }
    if (event.status === 'Completed') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Cannot register for a completed event.' });
    }

    const existingQuery = 'SELECT registration_id, status FROM Registrations WHERE student_id = $1 AND event_id = $2';
    const existingResult = await client.query(existingQuery, [student_id, event_id]);
    const existing = existingResult.rows[0];
    if (existing && existing.status !== 'Cancelled') {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'You are already registered for this event.' });
    }

    const seatQuery = `
      SELECT COUNT(*) AS registered_count
      FROM Registrations
      WHERE event_id = $1 AND status = 'Registered'
    `;
    const seatResult = await client.query(seatQuery, [event_id]);
    const registeredCount = parseInt(seatResult.rows[0].registered_count, 10);
    if (registeredCount >= event.seat_limit) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Seat limit reached for this event.' });
    }

    const writeQuery = existing
      ? `UPDATE Registrations
         SET status = 'Registered', registration_date = CURRENT_TIMESTAMP
         WHERE registration_id = $1
         RETURNING registration_id, student_id, event_id, registration_date, status`
      : `INSERT INTO Registrations (student_id, event_id)
         VALUES ($1, $2)
         RETURNING registration_id, student_id, event_id, registration_date, status`;
    const writeValues = existing ? [existing.registration_id] : [student_id, event_id];
    const writeResult = await client.query(writeQuery, writeValues);
    await client.query('COMMIT');
    res.status(201).json(writeResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

const getStudentRegistrations = async (req, res, next) => {
  const studentId = parseInt(req.params.studentId, 10);
  if (Number.isNaN(studentId)) {
    return res.status(400).json({ message: 'Invalid student ID.' });
  }

  if (req.user.role === 'student' && req.user.id !== studentId) {
    return res.status(403).json({ message: 'Students can only view their own registrations.' });
  }

  try {
    const query = `
      SELECT r.registration_id, r.registration_date, r.status,
             e.event_id, e.title, e.venue, e.event_date, e.start_time, e.end_time, e.status AS event_status,
             c.category_name,
             o.full_name AS organizer_name,
             e.seat_limit,
             COALESCE(reg_count, 0) AS registered_count,
             e.seat_limit - COALESCE(reg_count, 0) AS available_seats,
             att.attendance_status,
             cert.certificate_id
      FROM Registrations r
      JOIN Events e ON r.event_id = e.event_id
      JOIN Event_Categories c ON e.category_id = c.category_id
      JOIN Organizers o ON e.organizer_id = o.organizer_id
      LEFT JOIN Attendance att ON att.registration_id = r.registration_id
      LEFT JOIN Certificates cert ON cert.registration_id = r.registration_id
      LEFT JOIN (
        SELECT event_id, COUNT(*) AS reg_count
        FROM Registrations
        WHERE status = 'Registered'
        GROUP BY event_id
      ) RTT ON e.event_id = RTT.event_id
      WHERE r.student_id = $1
      ORDER BY r.registration_date DESC
    `;
    const { rows } = await pool.query(query, [studentId]);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const getEventRegistrations = async (req, res, next) => {
  const eventId = parseInt(req.params.eventId, 10);
  if (Number.isNaN(eventId)) {
    return res.status(400).json({ message: 'Invalid event ID.' });
  }

  try {
    const eventResult = await pool.query('SELECT organizer_id FROM Events WHERE event_id = $1', [eventId]);
    if (eventResult.rowCount === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    if (req.user.role === 'organizer' && eventResult.rows[0].organizer_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only view registrations for your own events.' });
    }

    const query = `
      SELECT r.registration_id, r.registration_date, r.status,
             s.student_id, s.full_name AS student_name, s.roll_number, s.department,
             a.attendance_status,
             c.certificate_id
      FROM Registrations r
      JOIN Students s ON r.student_id = s.student_id
      LEFT JOIN Attendance a ON a.registration_id = r.registration_id
      LEFT JOIN Certificates c ON c.registration_id = r.registration_id
      WHERE r.event_id = $1
      ORDER BY s.full_name
    `;
    const { rows } = await pool.query(query, [eventId]);
    res.json(rows);
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
    const selectQuery = 'SELECT student_id, status FROM Registrations WHERE registration_id = $1';
    const { rows } = await pool.query(selectQuery, [registrationId]);
    const registration = rows[0];
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found.' });
    }

    if (req.user.role !== 'admin' && req.user.id !== registration.student_id) {
      return res.status(403).json({ message: 'Students can only cancel their own registrations.' });
    }

    if (registration.status === 'Cancelled') {
      return res.status(400).json({ message: 'Registration is already cancelled.' });
    }

    const updateQuery = `
      UPDATE Registrations
      SET status = 'Cancelled'
      WHERE registration_id = $1
      RETURNING registration_id, status
    `;
    const updateResult = await pool.query(updateQuery, [registrationId]);
    res.json(updateResult.rows[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRegistration,
  getStudentRegistrations,
  getEventRegistrations,
  cancelRegistration,
};
