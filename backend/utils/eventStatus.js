const { pool } = require('../config/db');

// Moves events forward based on the clock: Upcoming -> Ongoing -> Completed.
// Cancelled events are never touched.
const syncEventStatuses = async () => {
  const completed = await pool.query(
    `UPDATE Events SET status = 'Completed'
     WHERE status IN ('Upcoming', 'Ongoing') AND (event_date + end_time) <= LOCALTIMESTAMP`,
  );
  const ongoing = await pool.query(
    `UPDATE Events SET status = 'Ongoing'
     WHERE status = 'Upcoming' AND (event_date + start_time) <= LOCALTIMESTAMP`,
  );
  return { completed: completed.rowCount, ongoing: ongoing.rowCount };
};

const runSync = async () => {
  try {
    const { completed, ongoing } = await syncEventStatuses();
    if (completed || ongoing) {
      console.log(`Event statuses updated: ${ongoing} now ongoing, ${completed} now completed.`);
    }
  } catch (error) {
    console.error('Could not update event statuses:', error.message);
  }
};

const startEventStatusSync = (intervalMs = 60 * 1000) => {
  runSync();
  setInterval(runSync, intervalMs).unref();
};

module.exports = { syncEventStatuses, startEventStatusSync };
