-- --------------------------------------------------
-- PostgreSQL queries for CampusX Events (existing schema)
-- --------------------------------------------------

-- 1. Find all students registered for a particular event
SELECT s.student_id, s.full_name, s.email, r.registration_date, r.status
FROM Students s
JOIN Registrations r ON s.student_id = r.student_id
WHERE r.event_id = 1
ORDER BY r.registration_date;

-- 2. Find the most popular events by registered count
SELECT e.event_id, e.title, COUNT(r.registration_id) AS registered_students
FROM Events e
LEFT JOIN Registrations r ON e.event_id = r.event_id AND r.status = 'Registered'
GROUP BY e.event_id
ORDER BY registered_students DESC, e.event_date DESC;

-- 3. Count registrations by category
SELECT c.category_id, c.category_name, COUNT(r.registration_id) AS registrations
FROM Event_Categories c
JOIN Events e ON c.category_id = e.category_id
LEFT JOIN Registrations r ON e.event_id = r.event_id AND r.status = 'Registered'
GROUP BY c.category_id, c.category_name
ORDER BY registrations DESC;

-- 4. Find events with available seats
SELECT e.event_id, e.title, e.seat_limit,
       COALESCE(reg_count, 0) AS registered_count,
       e.seat_limit - COALESCE(reg_count, 0) AS available_seats
FROM Events e
LEFT JOIN (
  SELECT event_id, COUNT(*) AS reg_count
  FROM Registrations
  WHERE status = 'Registered'
  GROUP BY event_id
) r ON e.event_id = r.event_id
WHERE e.seat_limit - COALESCE(reg_count, 0) > 0;

-- 5. Calculate attendance percentage for an event
SELECT e.event_id, e.title,
       COUNT(a.attendance_id) FILTER (WHERE a.attendance_status = 'Present')::DECIMAL * 100.0 / NULLIF(COUNT(a.attendance_id), 0) AS attendance_percentage
FROM Events e
JOIN Registrations r ON e.event_id = r.event_id
JOIN Attendance a ON r.registration_id = a.registration_id
WHERE e.event_id = 1
GROUP BY e.event_id, e.title;

-- 6. Find students who attended multiple events
SELECT s.student_id, s.full_name, COUNT(DISTINCT e.event_id) AS events_attended
FROM Students s
JOIN Registrations r ON s.student_id = r.student_id
JOIN Attendance a ON r.registration_id = a.registration_id AND a.attendance_status = 'Present'
GROUP BY s.student_id, s.full_name
HAVING COUNT(DISTINCT e.event_id) > 1;

-- 7. Find organizers and their events
SELECT o.organizer_id, o.full_name AS organizer_name, e.event_id, e.title, e.event_date
FROM Organizers o
JOIN Events e ON o.organizer_id = e.organizer_id
ORDER BY o.full_name, e.event_date;

-- 8. Find students who registered but were absent
SELECT s.student_id, s.full_name, e.event_id, e.title, a.attendance_status
FROM Students s
JOIN Registrations r ON s.student_id = r.student_id
JOIN Attendance a ON r.registration_id = a.registration_id
JOIN Events e ON r.event_id = e.event_id
WHERE a.attendance_status = 'Absent';

-- 9. Find all certificates issued
SELECT c.certificate_id, c.certificate_code, c.issue_date, c.certificate_url,
       s.student_id, s.full_name, e.event_id, e.title
FROM Certificates c
JOIN Registrations r ON c.registration_id = r.registration_id
JOIN Students s ON r.student_id = s.student_id
JOIN Events e ON r.event_id = e.event_id
ORDER BY c.issue_date DESC;

-- 10. Generate admin dashboard statistics
SELECT
  (SELECT COUNT(*) FROM Students) AS total_students,
  (SELECT COUNT(*) FROM Organizers) AS total_organizers,
  (SELECT COUNT(*) FROM Events) AS total_events,
  (SELECT COUNT(*) FROM Registrations WHERE status = 'Registered') AS total_active_registrations,
  (SELECT COUNT(*) FROM Events WHERE status = 'Upcoming') AS upcoming_events,
  (SELECT COUNT(*) FROM Events WHERE status = 'Completed') AS completed_events;

-- Transaction example for safe event registration
BEGIN;
INSERT INTO Registrations (student_id, event_id) VALUES (1, 2);
-- If a seat limit exception occurs, rollback will prevent overbooking.
COMMIT;
