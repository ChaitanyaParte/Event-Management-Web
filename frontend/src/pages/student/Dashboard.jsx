import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRoleApi } from '../../hooks/useRoleApi';
import { formatDate, formatTime } from '../../lib/api';
import { getToken, parseToken } from '../../lib/auth';
import { card, chip } from '../../lib/ui';

export default function Dashboard() {
  const call = useRoleApi('student');
  const [profile, setProfile] = useState(null);
  const [registrations, setRegistrations] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const studentId = parseToken(getToken('student'))?.id;
    Promise.all([call(`/students/${studentId}`), call(`/registrations/student/${studentId}`)])
      .then(([profileData, registrationData]) => {
        setProfile(profileData);
        setRegistrations(registrationData);
      })
      .catch((err) => setError(err.message));
  }, [call]);

  if (error) return <p>{error}</p>;
  if (!registrations) return <p>Loading your dashboard...</p>;

  const upcoming = registrations.filter(
    (item) => item.status === 'Registered' && (item.event_status === 'Upcoming' || item.event_status === 'Ongoing'),
  );
  const stats = [
    { label: 'Upcoming events', value: upcoming.length, color: 'bg-pop-cyan' },
    { label: 'Total registrations', value: registrations.length, color: 'bg-pop-pink' },
    { label: 'Attended', value: registrations.filter((item) => item.attendance_status === 'Present').length, color: 'bg-pop-lime' },
    { label: 'Certificates', value: registrations.filter((item) => item.certificate_id).length, color: 'bg-pop-orange' },
  ];

  return (
    <>
      <h1 className="text-4xl font-bold">Hi, {profile.full_name}</h1>
      <p className="mt-1">Here's what's happening with your events.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`${stat.color} rounded-xl border-2 border-ink p-5 shadow-[5px_5px_0_0_var(--color-ink)]`}>
            <p className="text-4xl font-bold">{stat.value}</p>
            <p className="mt-1 text-sm font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 mb-4 text-2xl font-bold">Your upcoming events</h2>
      {upcoming.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-ink p-8 text-center">
          <p>You haven't registered for anything upcoming.</p>
          <Link to="/" className="mt-3 inline-block font-semibold underline">Browse events</Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {upcoming.map((item) => (
            <Link key={item.registration_id} to={`/events/${item.event_id}`} className={`${card} block p-5 transition hover:-translate-y-0.5`}>
              <span className={chip(item.event_status)}>{item.event_status}</span>
              <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
              <p className="text-sm">{formatDate(item.event_date)} &middot; {formatTime(item.start_time)}</p>
              <p className="text-sm">{item.venue}</p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
