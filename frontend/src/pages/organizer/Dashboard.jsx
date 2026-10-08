import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, CalendarClock, Ticket, Users } from 'lucide-react';
import PageTitle from '../../components/PageTitle';
import { Badge, Card, EmptyState, Table, Td, Th, Button } from '../../components/ui';
import { useRoleApi } from '../../hooks/useRoleApi';
import { api, formatDate, formatTime } from '../../lib/api';
import { userId } from '../../lib/auth';

export default function Dashboard() {
  const call = useRoleApi('organizer');
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = userId('organizer');
    Promise.all([call(`/organizers/${id}`), api('/events')])
      .then(([profileData, allEvents]) => {
        setProfile(profileData);
        setEvents(allEvents.filter((event) => event.organizer_id === id));
      })
      .catch((err) => setError(err.message));
  }, [call]);

  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!events) return <p className="text-sm text-zinc-500">Loading your dashboard...</p>;

  const active = events.filter((event) => event.status === 'Upcoming' || event.status === 'Ongoing');
  const stats = [
    { label: 'Total events', value: events.length, icon: CalendarCheck },
    { label: 'Upcoming', value: events.filter((event) => event.status === 'Upcoming').length, icon: CalendarClock },
    { label: 'Registrations', value: events.reduce((sum, event) => sum + Number(event.registered_count || 0), 0), icon: Users },
    { label: 'Completed', value: events.filter((event) => event.status === 'Completed').length, icon: Ticket },
  ];

  return (
    <>
      <PageTitle title={`Welcome back, ${profile.full_name}`} subtitle="Here's an overview of your events.">
        <Link to="/organizer/create"><Button>Create event</Button></Link>
      </PageTitle>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-sm">{label}</span>
              <Icon size={18} />
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          </Card>
        ))}
      </div>

      <h2 className="mt-8 mb-3 text-base font-semibold">Upcoming and ongoing</h2>
      {active.length === 0 ? (
        <EmptyState>
          You have no upcoming events. <Link to="/organizer/create" className="font-medium text-zinc-900 underline">Create your first event</Link>
        </EmptyState>
      ) : (
        <Card>
          <Table>
            <thead>
              <tr><Th>Event</Th><Th>When</Th><Th>Venue</Th><Th>Seats</Th><Th>Status</Th></tr>
            </thead>
            <tbody>
              {active.map((event) => (
                <tr key={event.event_id}>
                  <Td className="font-medium">{event.title}</Td>
                  <Td>{formatDate(event.event_date)}<span className="text-zinc-500"> &middot; {formatTime(event.start_time)}</span></Td>
                  <Td>{event.venue}</Td>
                  <Td>{event.registered_count} / {event.seat_limit}</Td>
                  <Td><Badge value={event.status} /></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  );
}
