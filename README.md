# CampusX Events — College Event Management System

A full-stack college event management system. Students browse and register for events, organizers create events and take attendance, and admins manage everything and issue certificates.

## Features
- **Students:** browse upcoming events (search, date range, sort by date or popularity), register and cancel, share an event or add it to a calendar, check in by scanning the venue QR code, see registration history, view and print certificates, edit profile.
- **Organizers:** register (an admin must approve the account), create events with an optional banner image and a venue requirements checklist (mic, speakers, projector and more), then wait for an admin to approve each one, mark attendance by hand or show a check-in QR code at the venue, issue certificates, edit profile.
- **Admins:** dashboard with charts, manage students, organizers (approve), events (review organizer events, with their venue checklist, and approve or send them back with a reason), categories, registrations, attendance and certificates, reports with CSV export, profile and password change.
- **Approval workflow:** an event created by an organizer starts as Pending and is hidden from students until an admin approves it. A rejected event shows the admin's reason, and the organizer can fix it and resubmit. Events created by an admin are approved straight away.
- Role-based login with JWT. Each role keeps its own session, so you can be logged in as several roles at once.
- Event statuses update on their own (Upcoming, Ongoing, Completed) from each event's date and times.
- Light and dark mode.

## Tech stack
- **Frontend:** React, Vite, Tailwind CSS, React Router, Recharts, lucide-react
- **Backend:** Node.js, Express, `pg`, `bcrypt`, `jsonwebtoken`, `dotenv`, `cors`
- **Database:** PostgreSQL

## Folder structure
```
college-event-management/
├── backend/            Express API (also serves the built frontend)
│   ├── config/db.js
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── server.js
│   ├── uploads/        event banner images (created automatically, not committed)
│   └── .env            your local settings (not committed)
├── frontend/           React app (Vite)
│   └── src/
├── database/
│   ├── queries.sql                       example SQL queries for the DBMS concepts
│   ├── migration_organizer_approval.sql  run once, see Database setup
│   ├── migration_event_images.sql        run once, see Database setup
│   └── migration_event_approval_and_requirements.sql  run once, see Database setup
└── unused/             the previous plain HTML frontend, kept for reference
```

## Requirements
- Node.js 18 or later
- PostgreSQL, running, with the project's database and tables already created

## Database setup
1. Make sure PostgreSQL is running and your database exists with its tables.
2. Run these three files once, in any order:
   - `database/migration_organizer_approval.sql` lets `organizers.approved_by` be empty, which is how an organizer waits for admin approval.
   - `database/migration_event_images.sql` adds the optional `events.image_url` column used for banner images.
   - `database/migration_event_approval_and_requirements.sql` adds event approval (`events.approval_status`, review note and reviewer), the `requirement_items` catalog (26 items such as microphones, speakers, projector, stage, Wi-Fi, power backup) and the `event_requirements` link table. Events that already exist are marked Approved.
3. Copy `backend/.env.example` to `backend/.env` and fill in your values:

```
PORT=5000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=your_database_name
DB_PASSWORD=your_password
DB_PORT=5432
JWT_SECRET=a_long_random_string
```

Never commit `backend/.env`. It is already in `.gitignore`.

## Run the app
From the `backend` folder:

```
npm install
npm run build
npm start
```

Then open **http://localhost:5000**.

- `npm run build` installs the frontend packages and builds the React app. Run it once, and again whenever you change anything in `frontend/`.
- `npm start` starts the API and serves the built app from the same address.

## Develop the frontend
Run the backend (`npm start` in `backend`) and, in a second terminal:

```
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. It reloads as you edit and sends `/api` requests to the backend on port 5000.

## QR check-in
On the organizer **Attendance** page, pick an event to see its check-in QR code. A registered student scans it with their phone, logs in if needed, and taps **Check me in**. The code is signed, only works for that event, and is valid from 30 minutes before the event until 3 hours after it ends.

## First-time use
1. Register an **Admin** account on the Join in page.
2. Register an **Organizer**. Their login stays blocked until an admin approves them under **Organizers → Approve**.
3. As the organizer, create an event. Register a **Student** and sign up for it.
4. As the organizer, open **Attendance**, mark the student present, and click **Issue certificates**. The student can then view and print the certificate.

## Database structure
Tables: `Admin`, `Students`, `Organizers`, `Event_Categories`, `Events`, `Registrations`, `Attendance`, `Certificates`, `Requirement_Items`, `Event_Requirements`.

ENUM types: `event_status_enum` (Upcoming, Ongoing, Completed, Cancelled), `registration_status_enum` (Registered, Cancelled), `attendance_status_enum` (Present, Absent).

Relationships:
- Admin 1:M Organizers (approval) and Admin 1:M Events
- Organizer 1:M Events, Category 1:M Events
- Student 1:M Registrations, Event 1:M Registrations
- Registration 1:0..1 Attendance, Registration 1:0..1 Certificates
- Event M:N Requirement_Items through `Event_Requirements` (what the organizer needs at the venue)

## DBMS concepts demonstrated
- Relational schema with foreign keys, unique constraints, check constraints and ENUM types
- Transactions for safe event registration
- A trigger (`trg_check_seat_limit`) that prevents overbooking
- Aggregation and joins for dashboards and reports
- Referential integrity with cascade and restrict rules

Available seats are calculated in SQL as the event's `seat_limit` minus the number of `Registered` registrations, so they are never stored separately.

## API overview
All routes are under `/api`. Protected routes need an `Authorization: Bearer <token>` header.

| Area | Routes |
|---|---|
| Auth | `POST /auth/{student,organizer,admin}/register`, `POST /auth/{student,organizer,admin}/login` |
| Events | `GET /events` and `GET /events/:id` (approved events only), `POST /events`, `PUT /events/:id`, `DELETE /events/:id`, `POST`/`DELETE /events/:id/image` (JPG, PNG or WebP, up to 3 MB) |
| Event approval | `GET /events/mine` (organizer: own events with approval state), `PUT /admin/events/:id/review` (admin: `{decision: 'approve' or 'reject', note}`) |
| Venue requirements | `GET /requirements` (the checklist catalog); events carry `requirements`, `requirements_notes` and `no_requirements` on create and edit |
| Categories | `GET /categories` (admin manages through `/admin/categories`) |
| Registrations | `POST /registrations`, `GET /registrations/student/:id`, `GET /registrations/event/:id`, `DELETE /registrations/:id` |
| Attendance | `POST /attendance`, `GET /attendance/event/:id`, `GET /attendance/event/:id/checkin-token` (organizer, for the QR code), `POST /attendance/checkin` (student, scans the QR code) |
| Certificates | `POST /certificates/issue`, `GET /certificates/student/:id` |
| Students and organizers | `GET`/`PUT /students/:id`, `GET`/`PUT /organizers/:id` |
| Admin | `/admin/stats`, `/admin/students`, `/admin/organizers`, `/admin/events`, `/admin/categories`, `/admin/registrations`, `/admin/attendance`, `/admin/certificates`, `/admin/reports/*`, `/admin/profile` |
