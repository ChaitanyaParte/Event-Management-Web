import {
  Award,
  Briefcase,
  CalendarDays,
  CalendarPlus,
  ClipboardCheck,
  FileBarChart,
  GraduationCap,
  LayoutDashboard,
  Tags,
  Ticket,
  User,
} from 'lucide-react';

export const organizerLinks = [
  { to: '/organizer', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/organizer/create', label: 'Create event', icon: CalendarPlus },
  { to: '/organizer/events', label: 'Manage events', icon: CalendarDays },
  { to: '/organizer/attendance', label: 'Attendance', icon: ClipboardCheck },
  { to: '/organizer/profile', label: 'Profile', icon: User },
];

export const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/students', label: 'Students', icon: GraduationCap },
  { to: '/admin/organizers', label: 'Organizers', icon: Briefcase },
  { to: '/admin/events', label: 'Events', icon: CalendarDays },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/registrations', label: 'Registrations', icon: Ticket },
  { to: '/admin/attendance', label: 'Attendance', icon: ClipboardCheck },
  { to: '/admin/certificates', label: 'Certificates', icon: Award },
  { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
  { to: '/admin/profile', label: 'Profile', icon: User },
];
