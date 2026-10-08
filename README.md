# CampusX Events — College Event Management System

## Project Overview
CampusX Events is a college event management system built around an already existing PostgreSQL database schema. The backend is Node.js with Express and the frontend uses vanilla HTML, CSS, and JavaScript.

## Features
- Student authentication and event registration
- Organizer event management and attendance marking
- Admin dashboard, student/organizer/event/category management
- Dynamic event listings, categories, registration history, attendance, and certificates
- PostgreSQL-driven statistics, seat-limit calculation, and reporting

## Tech Stack
- Frontend: HTML5, CSS3, JavaScript, Font Awesome
- Backend: Node.js, Express.js, PostgreSQL, `pg`, `dotenv`, `bcrypt`, `cors`, JWT
- Database: Existing PostgreSQL schema with tables and triggers already created

## Existing PostgreSQL Database Structure
The backend uses the following existing tables exactly as implemented in PostgreSQL:
- `Admin`
- `Students`
- `Organizers`
- `Event_Categories`
- `Events`
- `Registrations`
- `Attendance`
- `Certificates`

### ENUM types
- `event_status_enum` (`Upcoming`, `Ongoing`, `Completed`, `Cancelled`)
- `registration_status_enum` (`Registered`, `Cancelled`)
- `attendance_status_enum` (`Present`, `Absent`)

## ER Relationships
- `Admin` 1:M `Organizers`
- `Admin` 1:M `Events`
- `Organizer` 1:M `Events`
- `Category` 1:M `Events`
- `Student` 1:M `Registrations`
- `Event` 1:M `Registrations`
- `Registration` 1:0..1 `Attendance`
- `Registration` 1:0..1 `Certificates`

## Folder Structure
```
college-event-management/
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── index.html
│   ├── events.html
│   ├── event-details.html
│   ├── login.html
│   ├── register.html
│   ├── student/
│   ├── organizer/
│   ├── admin/
│   └── assets/
└── database/queries.sql
```

## Installation Requirements
- Node.js 16+ or later
- PostgreSQL running with the existing database already created
- npm

## PostgreSQL Database Setup
1. Ensure PostgreSQL is running.
2. Use your existing database and schema.
3. Create a `.env` file with your PostgreSQL connection details.

## Environment Variables
```
PORT=5000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=your_database_name
DB_PASSWORD=your_password
DB_PORT=5432
JWT_SECRET=your_jwt_secret
```

## How to Run Backend
1. `cd backend`
2. `npm install`
3. `npm run dev`

## How to Run Frontend
Open the `frontend` files in a browser or use a simple local server.

## API Documentation
- `POST /api/auth/student/register`
- `POST /api/auth/student/login`
- `POST /api/auth/organizer/login`
- `POST /api/auth/admin/login`
- `GET /api/events`
- `GET /api/events/:id`
- `POST /api/events`
- `PUT /api/events/:id`
- `DELETE /api/events/:id`
- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`
- `POST /api/registrations`
- `GET /api/registrations/student/:studentId`
- `DELETE /api/registrations/:id`
- `POST /api/attendance`
- `GET /api/attendance/event/:eventId`
- `GET /api/students/:id`
- `PUT /api/students/:id`
- `GET /api/organizers/:id`
- `PUT /api/organizers/:id`
- `GET /api/admin/stats`
- `GET /api/admin/students`
- `GET /api/admin/organizers`
- `GET /api/admin/events`
- `GET /api/admin/registrations`

## Sample Login Credentials
Use actual user records from your existing PostgreSQL database. The backend verifies credentials against the `Students`, `Organizers`, and `Admin` tables.

## DBMS Concepts Demonstrated
- Relational schema using foreign keys and ENUM types
- Transaction handling for registration logic
- Trigger-based seat-limit enforcement
- Aggregation and joins for reporting
- Referential integrity and cascade rules

## Transaction and Trigger Usage
- Existing trigger `trg_check_seat_limit` prevents overbooking on `Registrations` inserts.
- Backend validates seat availability before insert and uses transactions for safe registration.

## Seat-Limit System
Available seats are calculated using `Events.seat_limit` minus the count of `Registered` registrations.
This is computed in SQL and displayed in the frontend, not stored as a separate column.
