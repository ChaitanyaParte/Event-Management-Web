import { useMemo, useState } from 'react';
import EventForm from '../../components/EventForm';
import PageTitle from '../../components/PageTitle';
import { Badge, Button, Card, Dialog, EmptyState, Input, Notice, Select, Table, Td, Th } from '../../components/ui';
import { useAdminData } from '../../hooks/useAdminData';
import { api, formatDate, toDateInput, toTimeInput } from '../../lib/api';

export default function Events() {
  const { data: events, error, reload, call } = useAdminData('/admin/events');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState(null);
  const [categories, setCategories] = useState([]);
  const [notice, setNotice] = useState('');
  const [problem, setProblem] = useState('');

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (events || []).filter(
      (e) => (!term || e.title.toLowerCase().includes(term) || e.organizer_name.toLowerCase().includes(term)) && (!status || e.status === status),
    );
  }, [events, search, status]);

  const openEdit = async (event) => {
    setProblem('');
    try {
      const [details, categoryList] = await Promise.all([call(`/admin/events/${event.event_id}`), api('/categories')]);
      setCategories(categoryList);
      setEditing(details);
    } catch (err) {
      setProblem(err.message);
    }
  };

  const save = async (payload) => {
    await call(`/admin/events/${editing.event_id}`, { method: 'PUT', body: payload });
    setEditing(null);
    setNotice('Event updated.');
    await reload();
  };

  const run = async (action, message) => {
    setNotice('');
    setProblem('');
    try {
      await action();
      setNotice(message);
      await reload();
    } catch (err) {
      setProblem(err.message);
    }
  };

  const cancelEvent = (event) => {
    if (!window.confirm(`Cancel "${event.title}"?`)) return;
    run(() => call(`/admin/events/${event.event_id}/cancel`, { method: 'PUT' }), 'Event cancelled.');
  };

  const deleteEvent = (event) => {
    if (!window.confirm(`Permanently delete "${event.title}" and all its registrations? This can't be undone.`)) return;
    run(() => call(`/admin/events/${event.event_id}`, { method: 'DELETE' }), 'Event deleted.');
  };

  return (
    <>
      <PageTitle title="Events" subtitle="View, edit and control every event." />

      <div className="space-y-3">
        {notice && <Notice>{notice}</Notice>}
        {(problem || error) && <Notice type="error">{problem || error}</Notice>}
      </div>

      <div className="my-4 flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="Search by title or organizer" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select className="max-w-[10rem]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['Upcoming', 'Ongoing', 'Completed', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
        </Select>
      </div>

      {!events ? (
        <p className="text-sm text-zinc-500">Loading events...</p>
      ) : visible.length === 0 ? (
        <EmptyState>No events found.</EmptyState>
      ) : (
        <Card>
          <Table>
            <thead>
              <tr><Th>Event</Th><Th>Date</Th><Th>Organizer</Th><Th>Registered</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr>
            </thead>
            <tbody>
              {visible.map((e) => {
                const open = e.status === 'Upcoming' || e.status === 'Ongoing';
                return (
                  <tr key={e.event_id}>
                    <Td className="font-medium">{e.title}<span className="block text-xs font-normal text-zinc-500">{e.category_name} &middot; {e.venue}</span></Td>
                    <Td>{formatDate(e.event_date)}</Td>
                    <Td>{e.organizer_name}</Td>
                    <Td>{e.registered_count} / {e.seat_limit}</Td>
                    <Td><Badge value={e.status} /></Td>
                    <Td>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(e)}>Edit</Button>
                        {open && <Button size="sm" variant="ghost" onClick={() => cancelEvent(e)}>Cancel</Button>}
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteEvent(e)}>Delete</Button>
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
