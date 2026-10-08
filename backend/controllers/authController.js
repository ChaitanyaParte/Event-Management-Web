const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const generateToken = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '8h' });
};

const registerStudent = async (req, res, next) => {
  const { roll_number, full_name, email, password, phone, department, year_of_study } = req.body;

  if (!roll_number || !full_name || !email || !password || !department || !year_of_study) {
    return res.status(400).json({ message: 'Missing required student information.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `INSERT INTO Students (roll_number, full_name, email, password_hash, phone, department, year_of_study)
                   VALUES ($1, $2, $3, $4, $5, $6, $7)
                   RETURNING student_id, roll_number, full_name, email, department, year_of_study, created_at`;
    const values = [roll_number, full_name, email, hashedPassword, phone || null, department, year_of_study];
    const { rows } = await pool.query(query, values);
    const student = rows[0];
    const token = generateToken({ id: student.student_id, role: 'student', email: student.email });
    res.status(201).json({ student, token });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Student roll number or email already exists.' });
    }
    next(error);
  }
};

const loginStudent = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM Students WHERE email = $1', [email]);
    const student = rows[0];
    if (!student) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const passwordMatch = await bcrypt.compare(password, student.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = generateToken({ id: student.student_id, role: 'student', email: student.email });
    res.json({ student: { student_id: student.student_id, roll_number: student.roll_number, full_name: student.full_name, email: student.email, phone: student.phone, department: student.department, year_of_study: student.year_of_study }, token });
  } catch (error) {
    next(error);
  }
};

const loginOrganizer = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM Organizers WHERE email = $1', [email]);
    const organizer = rows[0];
    if (!organizer) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const passwordMatch = await bcrypt.compare(password, organizer.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (!organizer.approved_by) {
      return res.status(403).json({ message: 'Your account is awaiting admin approval.' });
    }

    const token = generateToken({ id: organizer.organizer_id, role: 'organizer', email: organizer.email });
    res.json({ organizer: { organizer_id: organizer.organizer_id, full_name: organizer.full_name, email: organizer.email, phone: organizer.phone, department: organizer.department, approved_by: organizer.approved_by }, token });
  } catch (error) {
    next(error);
  }
};

const loginAdmin = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM Admin WHERE email = $1', [email]);
    const admin = rows[0];
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = generateToken({ id: admin.admin_id, role: 'admin', email: admin.email });
    res.json({ admin: { admin_id: admin.admin_id, username: admin.username, full_name: admin.full_name, email: admin.email }, token });
  } catch (error) {
    next(error);
  }
};

const registerAdmin = async (req, res, next) => {
  const { username, full_name, email, password } = req.body;

  if (!username || !full_name || !email || !password) {
    return res.status(400).json({ message: 'Missing required admin information.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `INSERT INTO Admin (username, full_name, email, password_hash)
                   VALUES ($1, $2, $3, $4)
                   RETURNING admin_id, username, full_name, email, created_at`;
    const values = [username, full_name, email, hashedPassword];
    const { rows } = await pool.query(query, values);
    const admin = rows[0];
    const token = generateToken({ id: admin.admin_id, role: 'admin', email: admin.email });
    res.status(201).json({ admin, token });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Admin email or username already exists.' });
    }
    next(error);
  }
};

const registerOrganizer = async (req, res, next) => {
  const { full_name, email, password, phone, department } = req.body;

  if (!full_name || !email || !password || !department) {
    return res.status(400).json({ message: 'Missing required organizer information.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `INSERT INTO Organizers (full_name, email, password_hash, phone, department)
                   VALUES ($1, $2, $3, $4, $5)
                   RETURNING organizer_id, full_name, email, phone, department, created_at`;
    const values = [full_name, email, hashedPassword, phone || null, department];
    const { rows } = await pool.query(query, values);
    res.status(201).json({
      organizer: rows[0],
      message: 'Registration received. An admin must approve your account before you can log in.',
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Organizer email already exists.' });
    }
    next(error);
  }
};

module.exports = {
  registerStudent,
  loginStudent,
  loginOrganizer,
  loginAdmin,
  registerAdmin,
  registerOrganizer,
};
