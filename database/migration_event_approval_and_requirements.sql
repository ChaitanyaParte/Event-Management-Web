-- 1) Admin approval for events created by organizers.
--    Existing events stay visible: they default to 'Approved'.
ALTER TABLE Events ADD COLUMN IF NOT EXISTS approval_status VARCHAR(10) NOT NULL DEFAULT 'Approved';
ALTER TABLE Events ADD COLUMN IF NOT EXISTS review_note TEXT;
ALTER TABLE Events ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES Admin(admin_id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE Events ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_approval_status_check') THEN
    ALTER TABLE Events ADD CONSTRAINT events_approval_status_check CHECK (approval_status IN ('Pending', 'Approved', 'Rejected'));
  END IF;
END $$;

-- 2) Venue requirements checklist (many-to-many between events and requirement items).
ALTER TABLE Events ADD COLUMN IF NOT EXISTS requirements_notes TEXT;

CREATE TABLE IF NOT EXISTS Requirement_Items (
  item_id   SERIAL PRIMARY KEY,
  item_name VARCHAR(80) NOT NULL UNIQUE,
  category  VARCHAR(40) NOT NULL
);

CREATE TABLE IF NOT EXISTS Event_Requirements (
  event_id INTEGER NOT NULL REFERENCES Events(event_id) ON UPDATE CASCADE ON DELETE CASCADE,
  item_id  INTEGER NOT NULL REFERENCES Requirement_Items(item_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  PRIMARY KEY (event_id, item_id)
);

INSERT INTO Requirement_Items (item_name, category) VALUES
  ('Microphones', 'Audio and video'),
  ('Speakers / sound system', 'Audio and video'),
  ('Projector', 'Audio and video'),
  ('Projection screen', 'Audio and video'),
  ('Laptop / computer', 'Audio and video'),
  ('HDMI and display cables', 'Audio and video'),
  ('Podium', 'Stage and seating'),
  ('Stage', 'Stage and seating'),
  ('Chairs', 'Stage and seating'),
  ('Tables', 'Stage and seating'),
  ('Registration desk', 'Stage and seating'),
  ('Extra power points / extension boards', 'Power and internet'),
  ('Wi-Fi / internet', 'Power and internet'),
  ('Power backup (generator / UPS)', 'Power and internet'),
  ('Stage lighting', 'Lighting and decor'),
  ('Banner / backdrop', 'Lighting and decor'),
  ('Standees and sign boards', 'Lighting and decor'),
  ('Air conditioning', 'Safety and comfort'),
  ('Drinking water', 'Safety and comfort'),
  ('Security staff', 'Safety and comfort'),
  ('First aid / medical support', 'Safety and comfort'),
  ('Cleaning crew', 'Safety and comfort'),
  ('Photography / video coverage', 'Logistics'),
  ('Whiteboard and markers', 'Logistics'),
  ('Refreshments / catering', 'Logistics'),
  ('Parking arrangement', 'Logistics')
ON CONFLICT (item_name) DO NOTHING;
