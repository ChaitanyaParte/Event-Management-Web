import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardPath } from '../lib/auth';
import ThemeToggle from './ThemeToggle';

export default function PublicLayout() {
  const { roles } = useAuth();
  const homeTarget = roles.length > 0 ? dashboardPath(roles[0]) : '/';

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-3">
          <ThemeToggle className="border-2 border-ink bg-white text-ink hover:bg-pop-cyan hover:text-black" />
          <Link to={homeTarget} className="rounded-md bg-ink px-3 py-1.5 text-2xl leading-none font-bold text-paper">
            CampusX
          </Link>
        </div>
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link to="/" className="hover:underline">Events</Link>
          {roles.length === 0 && (
            <>
              <Link to="/login" className="hover:underline">Log in</Link>
              <Link
                to="/register"
                className="rounded-md border-2 border-ink bg-pop-pink px-4 py-1.5 font-semibold shadow-[3px_3px_0_0_var(--color-ink)] transition hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_0_var(--color-ink)]"
              >
                Join in
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16">
        <Outlet />
      </main>

      <footer className="border-t-2 border-ink px-4 py-6 text-center text-sm">
        CampusX Events. Find it, join it, get certified.
      </footer>
    </div>
  );
}
