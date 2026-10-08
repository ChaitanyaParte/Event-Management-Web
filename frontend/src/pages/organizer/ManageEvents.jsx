import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import EventForm from '../../components/EventForm';
import PageTitle from '../../components/PageTitle';
import { Badge, Button, Card, Dialog, EmptyState, Input, Notice, Select, Table, Td, Th } from '../../components/ui';
import { useRoleApi } from '../../hooks/useRoleApi';
import { api, formatDate, formatTime, saveEventImage, toDateInput, toTimeInput } from '../../lib/api';

export default function ManageEvents() {
  const call = useRoleApi('organizer');
  const location = useLocation();
  const [events, setEvents] = useState(null);
  const [categories, setCategories] = useState([]);
  const [requirementItems, setRequirementItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setEvents(await call('/events/mine'));
    } catch (err) {
      setError(err.message);
    }
  }, [call]);

  useEffect(() => {
    load();
    api('/categories').then(setCategories).catch(() => {});
    api('/requirements').then(setRequirementItems).catch(() => {});
  }, [load]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (events || []).filter(
      (event) => (!term || event.title.toLowerCase().includes(term)) && (!statusFilter || (statusFilter === 'Pending' || statusFilter === 'Rejected' ? event.approval_status === statusFilter : event.status === statusFilter)),
    );
  }, [events, search, statusFilter]);

  const save = async (payload, image) => {
    await call(`/events/${editing.event_id}`, { method: 'PUT', body: payload });
    let message = editing.approval_status === 'Rejected' ? 'Event updated and sent back to the admin for approval.' : 'Event updated.';
    try {
      await saveEventImage(call, editing.event_id, image);
    } catch (err) {
      message = `Event saved, but the image could not be saved: ${err.message}`;
    }
    setEditing(null);
    setNotice(message);
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
          <option value="">Any status</option>
          {['Pending', 'Rejected', 'Upcoming', 'Ongoing', 'Completed', 'Cancelled'].map((status) => <option key={status}>{status}</option>)}
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
              <tr><Th>Event</Th><Th>When</Th><Th>Venue</Th><Th>Registered</Th><Th>Approval</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr>
            </thead>
            <tbody>
              {visible.map((event) => {
                const approved = event.approval_status === 'Approved';
                const open = approved && (event.status === 'Upcoming' || event.status === 'Ongoing');
                return (
                  <tr key={event.event_id}>
                    <Td className="font-medium">{event.title}</Td>
                    <Td>{formatDate(event.event_date)}<span className="text-zinc-500"> &middot; {formatTime(event.start_time)}</span></Td>
                    <Td>{event.venue}</Td>
                    <Td>{event.registered_count} / {event.seat_limit}</Td>
                    <Td>
                      <Badge value={event.approval_status} />
                      {event.approval_status === 'Rejected' && event.review_note && (
                        <p className="mt-1 max-w-[14rem] text-xs text-red-700">Admin: {event.review_note}</p>
                      )}
                    </Td>
                    <Td>{approved ? <Badge value={event.status} /> : <span className="text-zinc-400">-</span>}</Td>
                    <Td>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditing(event)}>{event.approval_status === 'Rejected' ? 'Fix and resubmit' : 'Edit'}</Button>
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
            requirementItems={requirementItems}
            showStatus={editing.approval_status === 'Approved'}
            minSeats={Math.max(1, Number(editing.registered_count || 0))}
            submitLabel={editing.approval_status === 'Rejected' ? 'Resubmit for approval' : 'Save changes'}
            onCancel={() => setEditing(null)}
            onSubmit={save}
            currentImage={editing.image_url}
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
              requirements: (editing.requirements || []).map((item) => item.item_id),
              requirements_notes: editing.requirements_notes || '',
              no_requirements: (editing.requirements || []).length === 0,
            }}
          />
        )}
      </Dialog>
    </>
  );
}
