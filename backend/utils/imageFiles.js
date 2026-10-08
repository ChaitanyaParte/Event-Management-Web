const fs = require('fs');
const path = require('path');

const uploadsRoot = path.join(__dirname, '..', 'uploads');
const eventImagesDir = path.join(uploadsRoot, 'events');

fs.mkdirSync(eventImagesDir, { recursive: true });

const extensionFor = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const saveEventImage = (eventId, file) => {
  const fileName = `event-${eventId}-${Date.now()}${extensionFor[file.mimetype]}`;
  fs.writeFileSync(path.join(eventImagesDir, fileName), file.buffer);
  return `/uploads/events/${fileName}`;
};

const removeEventImage = (imageUrl) => {
  if (!imageUrl || !imageUrl.startsWith('/uploads/events/')) return;
  const filePath = path.join(eventImagesDir, path.basename(imageUrl));
  fs.rm(filePath, { force: true }, () => {});
};

module.exports = { uploadsRoot, extensionFor, saveEventImage, removeEventImage };
