const multer = require('multer');
const { extensionFor } = require('../utils/imageFiles');

const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (extensionFor[file.mimetype]) return callback(null, true);
    const error = new Error('Upload a JPG, PNG or WebP image.');
    error.statusCode = 400;
    return callback(error);
  },
});

module.exports = { uploadImage };
