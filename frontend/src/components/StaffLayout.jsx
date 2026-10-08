import { useRef } from 'react';
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const roleTitle = { organizer: 'Organizer', admin: 'Admin' };

export default function StaffLayout({ role, links }) {
  const { roles, logout } = useAuth();
  const navigate = useNavigate();
  const leaving = useRef(false);

  if (!roles.includes(role) && !leaving.current) return <Navigate to="/login" replace />;

  const handleLogout = () => {
    leaving.current = true;
    logout(role);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 md:flex">
      <aside className="border-b border-zinc-200 bg-white md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:border-r md:border-b-0">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-lg font-semibold tracking-tight">CampusX</p>
            <p className="text-xs text-zinc-500">{roleTitle[role]} workspace</p>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden space-y-1 border-t border-zinc-200 p-3 md:block">
          <NavLink to="/" className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100">
            <ArrowLeft size={17} /> Back to site
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
          >
            <LogOut size={17} /> Log out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex justify-end gap-2 md:hidden">
            <NavLink to="/" className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium">Back to site</NavLink>
            <button type="button" onClick={handleLogout} className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium">
              Log out
            </button>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
