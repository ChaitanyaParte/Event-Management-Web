const { pool } = require('../config/db');

const issueCertificates = async (req, res, next) => {
  const eventId = parseInt(req.body.event_id, 10);
  if (Number.isNaN(eventId)) {
    return res.status(400).json({ message: 'event_id is required.' });
  }

  try {
    const eventResult = await pool.query('SELECT organizer_id, status FROM Events WHERE event_id = $1', [eventId]);
    const event = eventResult.rows[0];
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    if (req.user.role === 'organizer' && event.organizer_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only issue certificates for your own events.' });
    }
    if (event.status === 'Cancelled') {
      return res.status(400).json({ message: 'Cannot issue certificates for a cancelled event.' });
    }

    const query = `
      INSERT INTO Certificates (registration_id, certificate_code, issue_date)
      SELECT r.registration_id,
             'CERT-' || r.event_id || '-' || r.registration_id || '-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6)),
             CURRENT_DATE
      FROM Registrations r
      JOIN Attendance a ON a.registration_id = r.registration_id
      WHERE r.event_id = $1
        AND r.status = 'Registered'
        AND a.attendance_status = 'Present'
        AND NOT EXISTS (SELECT 1 FROM Certificates c WHERE c.registration_id = r.registration_id)
      RETURNING certificate_id
    `;
    const { rowCount } = await pool.query(query, [eventId]);
    res.status(201).json({
      issued: rowCount,
      message: rowCount > 0
        ? `Issued ${rowCount} certificate(s).`
        : 'No new certificates to issue. Students must be marked Present first, and each student gets one certificate.',
    });
  } catch (error) {
    next(error);
  }
};

const getStudentCertificates = async (req, res, next) => {
  const studentId = parseInt(req.params.studentId, 10);
  if (Number.isNaN(studentId)) {
    return res.status(400).json({ message: 'Invalid student ID.' });
  }

  try {
    const query = `
      SELECT c.certificate_id, c.certificate_code, c.issue_date,
             s.full_name AS student_name, s.roll_number,
             e.event_id, e.title AS event_title, e.event_date, e.venue,
             o.full_name AS organizer_name
      FROM Certificates c
      JOIN Registrations r ON c.registration_id = r.registration_id
      JOIN Students s ON r.student_id = s.student_id
      JOIN Events e ON r.event_id = e.event_id
      JOIN Organizers o ON e.organizer_id = o.organizer_id
      WHERE r.student_id = $1
      ORDER BY c.issue_date DESC, c.certificate_id DESC
    `;
    const { rows } = await pool.query(query, [studentId]);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  issueCertificates,
  getStudentCertificates,
};
