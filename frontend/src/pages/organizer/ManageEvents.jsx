import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import EventForm from '../../components/EventForm';
import PageTitle from '../../components/PageTitle';
import { Badge, Button, Card, Dialog, EmptyState, Input, Notice, Select, Table, Td, Th } from '../../components/ui';
import { useRoleApi } from '../../hooks/useRoleApi';
import { api, formatDate, formatTime, toDateInput, toTimeInput } from '../../lib/api';
import { userId } from '../../lib/auth';

export default function ManageEvents() {
  const call = useRoleApi('organizer');
  const location = useLocation();
  const [events, setEvents] = useState(null);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const all = await api('/events');
      setEvents(all.filter((event) => event.organizer_id === userId('organizer')));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
    api('/categories').then(setCategories).catch(() => {});
  }, [load]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (events || []).filter(
      (event) => (!term || event.title.toLowerCase().includes(term)) && (!statusFilter || event.status === statusFilter),
    );
  }, [events, search, statusFilter]);

  const save = async (payload) => {
    await call(`/events/${editing.event_id}`, { method: 'PUT', body: payload });
    setEditing(null);
    setNotice('Event updated.');
    await load();
  };

  const cancelEvent = async (event) => {
    if (!window.confirm(`Cancel "${event.title}"? Students will no longer be able to register.`)) return;
    setError('');
    try {
      await call(`/events/${event.event_id}`, { method: 'PUT', body: { status: 'Cancelled' } });
      setNotice('Event cancelled.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <PageTitle title="Manage events" subtitle="Edit details, update status, or cancel your events.">
        <Link to="/organizer/create"><Button>Create event</Button></Link>
      </PageTitle>

      <div className="space-y-3">
        {notice && <Notice>{notice}</Notice>}
        {error && <Notice type="error">{error}</Notice>}
      </div>

      <div className="my-4 flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="Search by title" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Select className="max-w-[10rem]" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All statuses</option>
          {['Upcoming', 'Ongoing', 'Completed', 'Cancelled'].map((status) => <option key={status}>{status}</option>)}
        </Select>
      </div>

      {!events ? (
        <p className="text-sm text-zinc-500">Loading your events...</p>
      ) : visible.length === 0 ? (
        <EmptyState>{events.length === 0 ? "You haven't created any events yet." : 'No events match your filters.'}</EmptyState>
      ) : (
        <Card>
          <Table>
            <thead>
              <tr><Th>Event</Th><Th>When</Th><Th>Venue</Th><Th>Registered</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr>
            </thead>
            <tbody>
              {visible.map((event) => {
                const open = event.status === 'Upcoming' || event.status === 'Ongoing';
                return (
                  <tr key={event.event_id}>
                    <Td className="font-medium">{event.title}</Td>
                    <Td>{formatDate(event.event_date)}<span className="text-zinc-500"> &middot; {formatTime(event.start_time)}</span></Td>
                    <Td>{event.venue}</Td>
                    <Td>{event.registered_count} / {event.seat_limit}</Td>
                    <Td><Badge value={event.status} /></Td>
                    <Td>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditing(event)}>Edit</Button>
                        {open && <Button size="sm" variant="ghost" onClick={() => cancelEvent(event)}>Cancel event</Button>}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      )}

      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit event">
        {editing && (
          <EventForm
            key={editing.event_id}
            categories={categories}
            showStatus
            minSeats={Math.max(1, Number(editing.registered_count || 0))}
            submitLabel="Save changes"
            onCancel={() => setEditing(null)}
            onSubmit={save}
            initial={{
              title: editing.title,
              description: editing.description || '',
              category_id: String(editing.category_id),
              venue: editing.venue,
              event_date: toDateInput(editing.event_date),
              start_time: toTimeInput(editing.start_time),
              end_time: toTimeInput(editing.end_time),
              seat_limit: String(editing.seat_limit),
              status: editing.status,
            }}
          />
        )}
      </Dialog>
    </>
  );
}
