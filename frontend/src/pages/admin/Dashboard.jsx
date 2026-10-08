import { useEffect, useState } from 'react';
import { Award, Briefcase, CalendarCheck, CalendarPlus, GraduationCap, Ticket, UserPlus } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import PageTitle from '../../components/PageTitle';
import { Card, EmptyState } from '../../components/ui';
import { useRoleApi } from '../../hooks/useRoleApi';
import { formatDate } from '../../lib/api';

const activityIcons = {
  student_registration: { icon: UserPlus, label: 'New student' },
  organizer_registration: { icon: Briefcase, label: 'New organizer' },
  event_created: { icon: CalendarPlus, label: 'Event created' },
  certificate_issued: { icon: Award, label: 'Certificate issued' },
};

export default function Dashboard() {
  const call = useRoleApi('admin');
  const [state, setState] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      call('/admin/stats'),
      call('/admin/dashboard/activity'),
      call('/admin/dashboard/charts/registrations'),
      call('/admin/dashboard/charts/categories'),
      call('/admin/dashboard/charts/popular-events'),
    ])
      .then(([stats, activity, registrations, categories, popular]) => setState({ stats, activity, registrations, categories, popular }))
      .catch((err) => setError(err.message));
  }, [call]);

  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!state) return <p className="text-sm text-zinc-500">Loading the dashboard...</p>;

  const { stats, activity, registrations, categories, popular } = state;
  const tiles = [
    { label: 'Students', value: stats.total_students, icon: GraduationCap },
    { label: 'Organizers', value: stats.total_organizers, icon: Briefcase },
    { label: 'Events', value: stats.total_events, icon: CalendarCheck },
    { label: 'Registrations', value: stats.total_registrations, icon: Ticket },
  ];
  const secondary = [
    ['Upcoming', stats.upcoming_events],
    ['Ongoing', stats.ongoing_events],
    ['Completed', stats.completed_events],
    ['Certificates', stats.total_certificates],
  ];

  const registrationData = registrations.map((row) => ({ date: formatDate(row.date).replace(/, \d{4}/, ''), count: Number(row.count) }));
  const categoryData = categories.map((row) => ({ name: row.category_name, events: Number(row.count) }));
  const maxPopular = Math.max(1, ...popular.map((row) => Number(row.registrations)));

  return (
    <>
      <PageTitle title="Dashboard" subtitle="Overview of your college event system." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-sm">{label}</span>
              <Icon size={18} />
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {secondary.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Registrations, last 30 days</h2>
          {registrationData.length === 0 ? (
            <EmptyState>No registrations in the last 30 days.</EmptyState>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={registrationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" name="Registrations" stroke="#18181b" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Events by category</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="events" name="Events" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Most popular events</h2>
          {popular.length === 0 ? (
            <p className="text-sm text-zinc-500">No events yet.</p>
          ) : (
            <ul className="space-y-3">
              {popular.map((row) => (
                <li key={row.event_id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{row.title}</span>
                    <span className="text-zinc-500">{row.registrations}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-100">
                    <div className="h-1.5 rounded-full bg-zinc-900" style={{ width: `${(Number(row.registrations) / maxPopular) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-zinc-500">Nothing yet.</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((item, index) => {
                const { icon: Icon, label } = activityIcons[item.type] || activityIcons.event_created;
                return (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 rounded-md bg-zinc-100 p-1.5 text-zinc-600"><Icon size={14} /></span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="text-xs text-zinc-500">
                        {label} &middot; {item.type === 'certificate_issued' ? formatDate(item.timestamp) : new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
