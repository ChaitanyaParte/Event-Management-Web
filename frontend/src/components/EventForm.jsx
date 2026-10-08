import { useState } from 'react';
import { Button, Field, Input, Notice, Select, Textarea } from './ui';

export const emptyEvent = {
  title: '',
  description: '',
  category_id: '',
  venue: '',
  event_date: '',
  start_time: '',
  end_time: '',
  seat_limit: '',
  status: 'Upcoming',
};

export default function EventForm({ initial = emptyEvent, categories, onSubmit, onCancel, submitLabel, showStatus = false, minSeats = 1 }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.end_time <= form.start_time) {
      setError('End time must be after the start time.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category_id: Number(form.category_id),
      venue: form.venue.trim(),
      event_date: form.event_date,
      start_time: form.start_time,
      end_time: form.end_time,
      seat_limit: Number(form.seat_limit),
    };
    if (showStatus) payload.status = form.status;

    setBusy(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Event title">
        <Input name="title" value={form.title} onChange={update} placeholder="Annual tech fest" required />
      </Field>
      <Field label="Description">
        <Textarea name="description" value={form.description} onChange={update} placeholder="What is this event about?" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category">
          <Select name="category_id" value={form.category_id} onChange={update} required>
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.category_id} value={category.category_id}>{category.category_name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Venue">
          <Input name="venue" value={form.venue} onChange={update} placeholder="Main auditorium" required />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Date">
          <Input type="date" name="event_date" value={form.event_date} onChange={update} required />
        </Field>
        <Field label="Start time">
          <Input type="time" name="start_time" value={form.start_time} onChange={update} required />
        </Field>
        <Field label="End time">
          <Input type="time" name="end_time" value={form.end_time} onChange={update} required />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Seat limit" hint={minSeats > 1 ? `At least ${minSeats}, since that many students are registered.` : undefined}>
          <Input type="number" min={minSeats} name="seat_limit" value={form.seat_limit} onChange={update} placeholder="100" required />
        </Field>
        {showStatus && (
          <Field label="Status">
            <Select name="status" value={form.status} onChange={update}>
              {['Upcoming', 'Ongoing', 'Completed', 'Cancelled'].map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </Select>
          </Field>
        )}
      </div>

      {error && <Notice type="error">{error}</Notice>}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && <Button variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={busy}>{busy ? 'Saving...' : submitLabel}</Button>
      </div>
    </form>
  );
}
