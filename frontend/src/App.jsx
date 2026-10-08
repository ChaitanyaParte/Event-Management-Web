import { Route, Routes } from 'react-router-dom';
import PublicLayout from './components/PublicLayout';
import StaffLayout from './components/StaffLayout';
import StudentArea from './components/StudentArea';
import { adminLinks, organizerLinks } from './lib/staffNav';
import CheckIn from './pages/CheckIn';
import EventDetails from './pages/EventDetails';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminAttendance from './pages/admin/Attendance';
import AdminCategories from './pages/admin/Categories';
import AdminCertificates from './pages/admin/Certificates';
import AdminDashboard from './pages/admin/Dashboard';
import AdminEvents from './pages/admin/Events';
import AdminOrganizers from './pages/admin/Organizers';
import AdminProfile from './pages/admin/Profile';
import AdminRegistrations from './pages/admin/Registrations';
import AdminReports from './pages/admin/Reports';
import AdminStudents from './pages/admin/Students';
import OrganizerAttendance from './pages/organizer/Attendance';
import OrganizerCreateEvent from './pages/organizer/CreateEvent';
import OrganizerDashboard from './pages/organizer/Dashboard';
import OrganizerManageEvents from './pages/organizer/ManageEvents';
import OrganizerProfile from './pages/organizer/Profile';
import Certificates from './pages/student/Certificates';
import Dashboard from './pages/student/Dashboard';
import MyEvents from './pages/student/MyEvents';
import Profile from './pages/student/Profile';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/checkin" element={<CheckIn />} />

        <Route path="/student" element={<StudentArea />}>
          <Route index element={<Dashboard />} />
          <Route path="events" element={<MyEvents />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<p className="py-20 text-center text-xl">Page not found.</p>} />
      </Route>

      <Route path="/organizer" element={<StaffLayout role="organizer" links={organizerLinks} />}>
        <Route index element={<OrganizerDashboard />} />
        <Route path="create" element={<OrganizerCreateEvent />} />
        <Route path="events" element={<OrganizerManageEvents />} />
        <Route path="attendance" element={<OrganizerAttendance />} />
        <Route path="profile" element={<OrganizerProfile />} />
      </Route>

      <Route path="/admin" element={<StaffLayout role="admin" links={adminLinks} />}>
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="organizers" element={<AdminOrganizers />} />
        <Route path="events" element={<AdminEvents />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="registrations" element={<AdminRegistrations />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="certificates" element={<AdminCertificates />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>
    </Routes>
  );
}
