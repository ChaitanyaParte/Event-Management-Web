const { pool } = require('../config/db');

const getRequirementItems = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT item_id, item_name, category FROM Requirement_Items ORDER BY category, item_name');
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

module.exports = { getRequirementItems };
