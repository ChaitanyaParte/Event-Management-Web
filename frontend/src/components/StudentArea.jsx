import { useRef } from 'react';
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/student', label: 'Dashboard', end: true },
  { to: '/student/events', label: 'My events' },
  { to: '/student/certificates', label: 'Certificates' },
  { to: '/student/profile', label: 'Profile' },
];

export default function StudentArea() {
  const { roles, logout } = useAuth();
  const navigate = useNavigate();
  const leaving = useRef(false);

  if (!roles.includes('student') && !leaving.current) return <Navigate to="/login" replace />;

  const handleLogout = () => {
    leaving.current = true;
    logout('student');
    navigate('/');
  };

  return (
    <>
      <nav className="mb-8 flex flex-wrap items-center gap-2 border-b-2 border-ink pb-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `rounded-full border-2 border-ink px-4 py-1 text-sm font-semibold transition ${
                isActive ? 'bg-ink text-paper' : 'bg-white hover:bg-pop-cyan'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={handleLogout}
          className="ml-auto rounded-full border-2 border-ink bg-white px-4 py-1 text-sm font-semibold hover:bg-pop-pink"
        >
          Log out
        </button>
      </nav>
      <Outlet />
    </>
  );
}
