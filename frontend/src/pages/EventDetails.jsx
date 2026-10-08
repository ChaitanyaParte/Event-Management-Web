import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Banner from '../components/Banner';
import EventActions from '../components/EventActions';
import { useAuth } from '../context/AuthContext';
import { useRoleApi } from '../hooks/useRoleApi';
import { api, formatDate, formatTime } from '../lib/api';
import { getToken, parseToken } from '../lib/auth';
import { btnDark, card, chip } from '../lib/ui';

export default function EventDetails() {
  const { id } = useParams();
  const { roles } = useAuth();
  const callStudent = useRoleApi('student');
  const isStudent = roles.includes('student');

  const [event, setEvent] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [state, setState] = useState('loading');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const eventData = await api(`/events/${id}`);
      setEvent(eventData);

      if (isStudent) {
        const studentId = parseToken(getToken('student'))?.id;
        const registrations = await callStudent(`/registrations/student/${studentId}`);
        const active = registrations.find((item) => item.event_id === eventData.event_id && item.status === 'Registered');
        setRegistration(active || null);
      }
      setState('ready');
    } catch (error) {
      setState(error.status === 404 ? 'notfound' : 'error');
    }
  }, [id, isStudent, callStudent]);

  useEffect(() => {
    load();
  }, [load]);

  if (roles.length === 0) return <Navigate to="/login" replace />;

  const register = async () => {
    setBusy(true);
    setMessage('');
    try {
      const studentId = parseToken(getToken('student'))?.id;
      await callStudent('/registrations', { method: 'POST', body: { student_id: studentId, event_id: event.event_id } });
      await load();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  if (state === 'loading') return <p className="py-10">Loading event...</p>;
  if (state === 'notfound') return <p className="py-10">We couldn't find that event. <Link to="/" className="font-semibold underline">Back to events</Link></p>;
  if (state === 'error') return <p className="py-10">Couldn't load this event. Check that the server is running.</p>;

  const closed = event.status === 'Cancelled' || event.status === 'Completed';
  const full = Number(event.available_seats) <= 0;

  let action;
  if (registration) {
    action = (
      <p className="rounded-md border-2 border-ink bg-pop-lime px-4 py-3 text-sm font-medium">
        You're registered for this event. <Link to="/student/events" className="font-semibold underline">View my events</Link>
      </p>
    );
  } else if (closed) {
    action = <p className="text-sm">Registration is closed because this event is {event.status.toLowerCase()}.</p>;
  } else if (!isStudent) {
    action = (
      <p className="text-sm">
        Only student accounts can register. <Link to="/login" className="font-semibold underline">Log in as a student</Link>
      </p>
    );
  } else if (full) {
    action = <p className="text-sm">This event is full. No seats are left.</p>;
  } else {
    action = (
      <button type="button" onClick={register} disabled={busy} className={btnDark}>
        {busy ? 'Registering...' : 'Register for this event'}
      </button>
    );
  }

  const facts = [
    ['Date', formatDate(event.event_date)],
    ['Time', `${formatTime(event.start_time)} - ${formatTime(event.end_time)}`],
    ['Venue', event.venue],
    ['Organizer', event.organizer_name],
    ['Seats left', `${event.available_seats} of ${event.seat_limit}`],
  ];

  return (
    <article className={`${card} mx-auto mt-4 max-w-3xl overflow-hidden`}>
      {event.image_url && (
        <Banner src={event.image_url} alt={`Banner for ${event.title}`} className="h-52 border-b-2 border-ink sm:h-80" />
      )}
      <div className="border-b-2 border-ink bg-pop-cyan p-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className={chip('')}>{event.category_name}</span>
          <span className={chip(event.status)}>{event.status}</span>
        </div>
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{event.title}</h1>
      </div>
      <div className="p-6">
        <p className="whitespace-pre-line">{event.description || 'More details coming soon.'}</p>
        <dl className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-semibold uppercase tracking-wide">{label}</dt>
              <dd className="text-base">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8">
          {action}
          {message && <p className="mt-3 rounded-md border-2 border-ink bg-pop-orange px-3 py-2 text-sm">{message}</p>}
        </div>
        <EventActions event={event} />
      </div>
    </article>
  );
}
