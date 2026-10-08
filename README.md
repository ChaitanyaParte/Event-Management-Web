# CampusX Events — College Event Management System

A full-stack college event management system. Students browse and register for events, organizers create events and take attendance, and admins manage everything and issue certificates.

## Features
- **Students:** browse upcoming events, register and cancel, see registration history, view and print certificates, edit profile.
- **Organizers:** register (an admin must approve the account), create and edit events, mark attendance, issue certificates, edit profile.
- **Admins:** dashboard with charts, manage students, organizers (approve), events, categories, registrations, attendance and certificates, reports with CSV export, profile and password change.
- Role-based login with JWT. Each role keeps its own session, so you can be logged in as several roles at once.

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
│   └── .env            your local settings (not committed)
├── frontend/           React app (Vite)
│   └── src/
├── database/
│   ├── queries.sql                       example SQL queries for the DBMS concepts
│   └── migration_organizer_approval.sql  run once, see Database setup
└── unused/             the previous plain HTML frontend, kept for reference
```

## Requirements
- Node.js 18 or later
- PostgreSQL, running, with the project's database and tables already created

## Database setup
1. Make sure PostgreSQL is running and your database exists with its tables.
2. Run `database/migration_organizer_approval.sql` once. It lets `organizers.approved_by` be empty, which is how an organizer waits for admin approval.
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

## First-time use
1. Register an **Admin** account on the Join in page.
2. Register an **Organizer**. Their login stays blocked until an admin approves them under **Organizers → Approve**.
3. As the organizer, create an event. Register a **Student** and sign up for it.
4. As the organizer, open **Attendance**, mark the student present, and click **Issue certificates**. The student can then view and print the certificate.

## Database structure
Tables: `Admin`, `Students`, `Organizers`, `Event_Categories`, `Events`, `Registrations`, `Attendance`, `Certificates`.

ENUM types: `event_status_enum` (Upcoming, Ongoing, Completed, Cancelled), `registration_status_enum` (Registered, Cancelled), `attendance_status_enum` (Present, Absent).

Relationships:
- Admin 1:M Organizers (approval) and Admin 1:M Events
- Organizer 1:M Events, Category 1:M Events
- Student 1:M Registrations, Event 1:M Registrations
- Registration 1:0..1 Attendance, Registration 1:0..1 Certificates

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
| Events | `GET /events`, `GET /events/:id`, `POST /events`, `PUT /events/:id`, `DELETE /events/:id` |
| Categories | `GET /categories` (admin manages through `/admin/categories`) |
| Registrations | `POST /registrations`, `GET /registrations/student/:id`, `GET /registrations/event/:id`, `DELETE /registrations/:id` |
| Attendance | `POST /attendance`, `GET /attendance/event/:id` |
| Certificates | `POST /certificates/issue`, `GET /certificates/student/:id` |
| Students and organizers | `GET`/`PUT /students/:id`, `GET`/`PUT /organizers/:id` |
| Admin | `/admin/stats`, `/admin/students`, `/admin/organizers`, `/admin/events`, `/admin/categories`, `/admin/registrations`, `/admin/attendance`, `/admin/certificates`, `/admin/reports/*`, `/admin/profile` |
