const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.code === '23503' || err.code === '23001') {
    const message = /update or delete/.test(err.message)
      ? "This can't be deleted because other records depend on it, for example an organizer who still has events."
      : 'A related record does not exist.';
    return res.status(409).json({ message });
  }
  if (err.code === '23505') {
    return res.status(409).json({ message: 'That value already exists.' });
  }
  if (err.code === '23514') {
    return res.status(400).json({ message: 'One of the values is not allowed, for example the end time must be after the start time and seats must be at least 1.' });
  }
  if (err.code === '22P02' || err.code === '22007') {
    return res.status(400).json({ message: 'One of the values is not in a valid format.' });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'The image must be 3 MB or smaller.' });
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({ message: 'Upload one image file.' });
  }
  if (err.code === 'P0001') {
    return res.status(400).json({ message: err.message });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: statusCode === 500 ? 'Something went wrong on the server. Please try again.' : err.message,
  });
};

module.exports = {
  errorHandler,
};
