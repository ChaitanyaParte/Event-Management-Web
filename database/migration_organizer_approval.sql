-- Organizers register first and an admin approves them afterwards, so
-- approved_by must be NULL until an admin approves the account.
-- Run once against the College_Event_Management database.
ALTER TABLE Organizers ALTER COLUMN approved_by DROP NOT NULL;
