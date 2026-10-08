-- Adds an optional banner image to each event.
-- Run once against the College_Event_Management database.
ALTER TABLE Events ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);
