import { useMemo, useState } from 'react';
import Banner from '../../components/Banner';
import EventForm from '../../components/EventForm';
import PageTitle from '../../components/PageTitle';
import { Badge, Button, Card, Dialog, EmptyState, Input, Notice, Select, Table, Td, Th } from '../../components/ui';
import { useAdminData } from '../../hooks/useAdminData';
import { api, formatDate, formatTime, saveEventImage, toDateInput, toTimeInput } from '../../lib/api';

export default function Events() {
  const { data: events, error, reload, call } = useAdminData('/admin/events');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [approval, setApproval] = useState('');
  const [reviewing, setReviewing] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [categories, setCategories] = useState([]);
  const [notice, setNotice] = useState('');
  const [problem, setProblem] = useState('');

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (events || []).filter(
      (e) => (!term || e.title.toLowerCase().includes(term) || e.organizer_name.toLowerCase().includes(term)) && (!status || e.status === status) && (!approval || e.approval_status === approval),
    );
  }, [events, search, status, approval]);
  const pendingCount = (events || []).filter((e) => e.approval_status === 'Pending').length;

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

  const openReview = async (event) => {
    setProblem('');
    setReviewNote('');
    setReviewError('');
    try {
      setReviewing(await call(`/admin/events/${event.event_id}`));
    } catch (err) {
      setProblem(err.message);
    }
  };

  const decide = async (decision) => {
    setReviewError('');
    if (decision === 'reject' && !reviewNote.trim()) {
      setReviewError('Give a reason so the organizer knows what to fix.');
      return;
    }
    setReviewBusy(true);
    try {
      await call(`/admin/events/${reviewing.event_id}/review`, { method: 'PUT', body: { decision, note: reviewNote.trim() } });
      setNotice(decision === 'approve' ? `"${reviewing.title}" was approved and is now live.` : `"${reviewing.title}" was sent back to the organizer.`);
      setReviewing(null);
      await reload();
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewBusy(false);
    }
  };

  const groupedRequirements = useMemo(() => {
    const groups = new Map();
    (reviewing?.requirements || []).forEach((item) => {
      if (!groups.has(item.category)) groups.set(item.category, []);
      groups.get(item.category).push(item.item_name);
    });
    return [...groups.entries()];
  }, [reviewing]);

  const save = async (payload, image) => {
    await call(`/admin/events/${editing.event_id}`, { method: 'PUT', body: payload });
    let message = 'Event updated.';
    try {
      await saveEventImage(call, editing.event_id, image);
    } catch (err) {
      message = `Event updated, but the image could not be saved: ${err.message}`;
    }
    setEditing(null);
    setNotice(message);
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

      {pendingCount > 0 && (
        <div className="mt-4">
          <Notice>
            {pendingCount} {pendingCount === 1 ? 'event is' : 'events are'} waiting for your approval.{' '}
            <button type="button" className="font-semibold underline" onClick={() => setApproval('Pending')}>Show them</button>
          </Notice>
        </div>
      )}

      <div className="my-4 flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="Search by title or organizer" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select className="max-w-[11rem]" value={approval} onChange={(e) => setApproval(e.target.value)}>
          <option value="">Any approval</option>
          {['Pending', 'Approved', 'Rejected'].map((s) => <option key={s}>{s}</option>)}
        </Select>
        <Select className="max-w-[10rem]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
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
              <tr><Th>Event</Th><Th>Date</Th><Th>Organizer</Th><Th>Registered</Th><Th>Approval</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr>
            </thead>
            <tbody>
              {visible.map((e) => {
                const open = e.approval_status === 'Approved' && (e.status === 'Upcoming' || e.status === 'Ongoing');
                return (
                  <tr key={e.event_id}>
                    <Td className="font-medium">{e.title}<span className="block text-xs font-normal text-zinc-500">{e.category_name} &middot; {e.venue}</span></Td>
                    <Td>{formatDate(e.event_date)}</Td>
                    <Td>{e.organizer_name}</Td>
                    <Td>{e.registered_count} / {e.seat_limit}</Td>
                    <Td>
                      <Badge value={e.approval_status} />
                      {e.approval_status === 'Rejected' && e.review_note && <p className="mt-1 max-w-[12rem] text-xs text-red-700">{e.review_note}</p>}
                    </Td>
                    <Td>{e.approval_status === 'Approved' ? <Badge value={e.status} /> : <span className="text-zinc-400">-</span>}</Td>
                    <Td>
                      <div className="flex justify-end gap-2">
                        {e.approval_status === 'Pending' && <Button size="sm" onClick={() => openReview(e)}>Review</Button>}
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

      <Dialog open={Boolean(reviewing)} onClose={() => setReviewing(null)} title="Review event">
        {reviewing && (
          <div className="space-y-4">
            {reviewing.image_url && <Banner src={reviewing.image_url} alt="" className="h-40 rounded-md border border-zinc-200" />}
            <div>
              <h3 className="text-base font-semibold text-zinc-900">{reviewing.title}</h3>
              <p className="text-sm text-zinc-500">{reviewing.category_name}</p>
            </div>
            {reviewing.description && <p className="text-sm whitespace-pre-line text-zinc-700">{reviewing.description}</p>}
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {[
                ['Organizer', `${reviewing.organizer_name}${reviewing.organizer_email ? ` (${reviewing.organizer_email})` : ''}`],
                ['Date', formatDate(reviewing.event_date)],
                ['Time', `${formatTime(reviewing.start_time)} - ${formatTime(reviewing.end_time)}`],
                ['Venue', reviewing.venue],
                ['Seats', reviewing.seat_limit],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-medium tracking-wide text-zinc-500 uppercase">{label}</dt>
                  <dd className="text-zinc-900">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="rounded-md border border-zinc-200 p-3">
              <p className="mb-2 text-sm font-semibold text-zinc-900">Needed at the venue</p>
              {groupedRequirements.length === 0 ? (
                <p className="text-sm text-zinc-500">The organizer said they don't need anything.</p>
              ) : (
                <div className="space-y-2">
                  {groupedRequirements.map(([category, names]) => (
                    <div key={category}>
                      <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">{category}</p>
                      <p className="text-sm text-zinc-800">{names.join(', ')}</p>
                    </div>
                  ))}
                </div>
              )}
              {reviewing.requirements_notes && (
                <p className="mt-3 border-t border-zinc-200 pt-2 text-sm text-zinc-700">Note: {reviewing.requirements_notes}</p>
              )}
            </div>
            <label className="block text-sm font-medium text-zinc-800">
              Reason (required if you send it back)
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                placeholder="For example: the auditorium is booked on this date."
              />
            </label>
            {reviewError && <Notice type="error">{reviewError}</Notice>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReviewing(null)}>Close</Button>
              <Button variant="outline" className="text-red-600" disabled={reviewBusy} onClick={() => decide('reject')}>Send back</Button>
              <Button disabled={reviewBusy} onClick={() => decide('approve')}>Approve</Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit event">
        {editing && (
          <EventForm
            key={editing.event_id}
            categories={categories}
            showStatus
            showRequirements={false}
            minSeats={Math.max(1, Number(editing.registered_count || 0))}
            submitLabel="Save changes"
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
            }}
          />
        )}
      </Dialog>
    </>
  );
}
