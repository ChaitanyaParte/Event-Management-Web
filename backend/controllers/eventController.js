const { pool } = require('../config/db');

const checkEventOwnership = async (req, eventId) => {
  const { rows } = await pool.query('SELECT organizer_id FROM Events WHERE event_id = $1', [eventId]);
  if (!rows[0]) {
    return { error: 'Event not found.', status: 404 };
  }
  if (req.user.role === 'organizer' && rows[0].organizer_id !== req.user.id) {
    return { error: 'You can only modify your own events.', status: 403 };
  }
  return {};
};

const getEvents = async (req, res, next) => {
  try {
    const query = `
      SELECT
        e.event_id,
        e.title,
        e.description,
        e.venue,
        e.event_date,
        e.start_time,
        e.end_time,
        e.seat_limit,
        e.status,
        e.category_id,
        e.organizer_id,
        c.category_name,
        o.full_name AS organizer_name,
        a.full_name AS created_by_name,
        COALESCE(registered_count, 0) AS registered_count,
        e.seat_limit - COALESCE(registered_count, 0) AS available_seats
      FROM Events e
      JOIN Event_Categories c ON e.category_id = c.category_id
      JOIN Organizers o ON e.organizer_id = o.organizer_id
      JOIN Admin a ON e.created_by = a.admin_id
      LEFT JOIN (
        SELECT event_id, COUNT(*) AS registered_count
        FROM Registrations
        WHERE status = 'Registered'
        GROUP BY event_id
      ) r ON e.event_id = r.event_id
      ORDER BY e.event_date ASC, e.start_time ASC
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
      SELECT
        e.event_id,
        e.title,
        e.description,
        e.venue,
        e.event_date,
        e.start_time,
        e.end_time,
        e.seat_limit,
        e.status,
        e.category_id,
        e.organizer_id,
        c.category_name,
        o.full_name AS organizer_name,
        a.full_name AS created_by_name,
        COALESCE(registered_count, 0) AS registered_count,
        e.seat_limit - COALESCE(registered_count, 0) AS available_seats
      FROM Events e
      JOIN Event_Categories c ON e.category_id = c.category_id
      JOIN Organizers o ON e.organizer_id = o.organizer_id
      JOIN Admin a ON e.created_by = a.admin_id
      LEFT JOIN (
        SELECT event_id, COUNT(*) AS registered_count
        FROM Registrations
        WHERE status = 'Registered'
        GROUP BY event_id
      ) r ON e.event_id = r.event_id
      WHERE e.event_id = $1
    `;
    const { rows } = await pool.query(query, [eventId]);
    const event = rows[0];
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    res.json(event);
  } catch (error) {
    next(error);
  }
};

const createEvent = async (req, res, next) => {
  const { title, description, category_id, venue, event_date, start_time, end_time, seat_limit, status } = req.body;
  const requesterRole = req.user.role;
  const requesterId = req.user.id;
  const organizer_id = requesterRole === 'organizer' ? requesterId : req.body.organizer_id;

  if (!title || !category_id || !organizer_id || !venue || !event_date || !start_time || !end_time || !seat_limit) {
    return res.status(400).json({ message: 'Missing required event fields.' });
  }

  try {
    let createdBy = requesterId;
    if (requesterRole === 'organizer') {
      const organizerResult = await pool.query('SELECT approved_by FROM Organizers WHERE organizer_id = $1', [requesterId]);
      const approvedBy = organizerResult.rows[0]?.approved_by;
      if (!approvedBy) {
        return res.status(403).json({ message: 'Your organizer account is awaiting admin approval.' });
      }
      createdBy = approvedBy;
    }

    const query = `
      INSERT INTO Events (title, description, category_id, organizer_id, created_by, venue, event_date, start_time, end_time, seat_limit, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11::event_status_enum, 'Upcoming'))
      RETURNING event_id, title, description, venue, event_date, start_time, end_time, seat_limit, status, category_id, organizer_id, created_by
    `;
    const values = [title, description || null, category_id, organizer_id, createdBy, venue, event_date, start_time, end_time, seat_limit, status];
    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
};

const getPublicStats = async (req, res, next) => {
  try {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM Events) AS total_events,
        (SELECT COUNT(*) FROM Students) AS total_students,
        (SELECT COUNT(*) FROM Organizers) AS total_organizers,
        (SELECT COUNT(*) FROM Events WHERE status = 'Completed') AS completed_events
    `;
    const { rows } = await pool.query(query);
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  const eventId = parseInt(req.params.id, 10);
  const { title, description, category_id, venue, event_date, start_time, end_time, seat_limit, status } = req.body;

  if (Number.isNaN(eventId)) {
    return res.status(400).json({ message: 'Invalid event ID.' });
  }

  try {
    const ownership = await checkEventOwnership(req, eventId);
    if (ownership.error) {
      return res.status(ownership.status).json({ message: ownership.error });
    }
    const organizer_id = req.user.role === 'organizer' ? null : req.body.organizer_id;

    const query = `
      UPDATE Events
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          category_id = COALESCE($3, category_id),
          organizer_id = COALESCE($4, organizer_id),
          venue = COALESCE($5, venue),
          event_date = COALESCE($6, event_date),
          start_time = COALESCE($7, start_time),
          end_time = COALESCE($8, end_time),
          seat_limit = COALESCE($9, seat_limit),
          status = COALESCE($10, status)
      WHERE event_id = $11
      RETURNING *
    `;
    const values = [title, description || null, category_id, organizer_id, venue, event_date, start_time, end_time, seat_limit, status, eventId];
    const { rows } = await pool.query(query, values);
    const event = rows[0];
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    res.json(event);
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
    const ownership = await checkEventOwnership(req, eventId);
    if (ownership.error) {
      return res.status(ownership.status).json({ message: ownership.error });
    }

    const { rowCount } = await pool.query('DELETE FROM Events WHERE event_id = $1', [eventId]);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    res.json({ message: 'Event deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT category_id, category_name, description FROM Event_Categories ORDER BY category_name');
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  const { category_name, description } = req.body;
  if (!category_name) {
    return res.status(400).json({ message: 'Category name is required.' });
  }

  try {
    const query = `INSERT INTO Event_Categories (category_name, description)
                   VALUES ($1, $2)
                   RETURNING *`;
    const values = [category_name, description || null];
    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Category name already exists.' });
    }
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  const categoryId = parseInt(req.params.id, 10);
  const { category_name, description } = req.body;
  if (Number.isNaN(categoryId)) {
    return res.status(400).json({ message: 'Invalid category ID.' });
  }

  try {
    const query = `
      UPDATE Event_Categories
      SET category_name = COALESCE($1, category_name),
          description = COALESCE($2, description)
      WHERE category_id = $3
      RETURNING *
    `;
    const values = [category_name, description || null, categoryId];
    const { rows } = await pool.query(query, values);
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
    const { rowCount } = await pool.query('DELETE FROM Event_Categories WHERE category_id = $1', [categoryId]);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Category not found.' });
    }
    res.json({ message: 'Category deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getPublicStats,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
