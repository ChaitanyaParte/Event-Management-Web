import { useEffect, useMemo, useState } from 'react';
import Banner from './Banner';
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
  requirements: [],
  requirements_notes: '',
  no_requirements: false,
};

const venueSuggestions = [
  'Main Auditorium',
  'Seminar Hall',
  'Conference Room',
  'Computer Lab',
  'Classroom',
  'Library Hall',
  'Amphitheatre',
  'Indoor Stadium',
  'Open Ground',
  'Cafeteria',
];

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxImageBytes = 3 * 1024 * 1024;

export default function EventForm({
  initial = emptyEvent,
  categories,
  requirementItems = [],
  onSubmit,
  onCancel,
  submitLabel,
  showStatus = false,
  showRequirements = true,
  minSeats = 1,
  currentImage = null,
}) {
  const [form, setForm] = useState({ ...emptyEvent, ...initial });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [inputKey, setInputKey] = useState(0);
  const preview = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile]);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const groups = useMemo(() => {
    const byCategory = new Map();
    requirementItems.forEach((item) => {
      if (!byCategory.has(item.category)) byCategory.set(item.category, []);
      byCategory.get(item.category).push(item);
    });
    return [...byCategory.entries()];
  }, [requirementItems]);

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const toggleItem = (itemId) => {
    const selected = form.requirements.includes(itemId)
      ? form.requirements.filter((id) => id !== itemId)
      : [...form.requirements, itemId];
    setForm({ ...form, requirements: selected, no_requirements: false });
  };

  const toggleNone = (checked) => setForm({ ...form, no_requirements: checked, requirements: checked ? [] : form.requirements });

  const chooseImage = (event) => {
    const file = event.target.files?.[0];
    setError('');
    if (!file) return;
    if (!allowedImageTypes.includes(file.type)) {
      setError('Choose a JPG, PNG or WebP image.');
      event.target.value = '';
      return;
    }
    if (file.size > maxImageBytes) {
      setError('The image must be 3 MB or smaller.');
      event.target.value = '';
      return;
    }
    setImageFile(file);
    setRemoveImage(false);
  };

  const shownImage = preview || (removeImage ? null : currentImage);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.end_time <= form.start_time) {
      setError('End time must be after the start time.');
      return;
    }
    if (showRequirements && !form.no_requirements && form.requirements.length === 0) {
      setError("Go through the venue checklist: tick what you need at the venue, or confirm that you don't need anything.");
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
    if (showRequirements) {
      payload.requirements = form.requirements;
      payload.requirements_notes = form.requirements_notes.trim();
      payload.no_requirements = form.no_requirements;
    }

    setBusy(true);
    try {
      await onSubmit(payload, { file: imageFile, remove: removeImage && !imageFile });
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

      <div className="space-y-2">
        <p className="text-sm font-medium text-zinc-800">Banner image <span className="font-normal text-zinc-500">(optional)</span></p>
        {shownImage && <Banner src={shownImage} alt="Event banner preview" className="h-40 rounded-md border border-zinc-200" />}
        <div className="flex flex-wrap items-center gap-2">
          <input
            key={inputKey}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={chooseImage}
            className="block max-w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border file:border-zinc-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-900 hover:file:bg-zinc-100"
          />
          {(currentImage || imageFile) && !removeImage && (
            <Button size="sm" variant="ghost" onClick={() => { setImageFile(null); setRemoveImage(Boolean(currentImage)); setInputKey((key) => key + 1); }}>
              Remove image
            </Button>
          )}
        </div>
        <p className="text-xs text-zinc-500">JPG, PNG or WebP, up to 3 MB. The whole picture is shown, so any shape works.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category">
          <Select name="category_id" value={form.category_id} onChange={update} required>
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.category_id} value={category.category_id}>{category.category_name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Venue" hint="Pick a suggestion or type your own.">
          <Input name="venue" value={form.venue} onChange={update} list="venue-suggestions" placeholder="Main Auditorium" required />
          <datalist id="venue-suggestions">
            {venueSuggestions.map((venue) => <option key={venue} value={venue} />)}
          </datalist>
        </Field>
      </div>

      {showRequirements && (
        <fieldset className="rounded-lg border border-zinc-200 p-4">
          <legend className="px-2 text-sm font-semibold text-zinc-900">
            What do you need at {form.venue.trim() ? `the ${form.venue.trim()}` : 'the venue'}?
          </legend>
          <p className="mb-3 text-xs text-zinc-500">
            Tick everything your event needs. The admin reviews this checklist before approving the event.
          </p>

          <div className="space-y-4">
            {groups.map(([category, items]) => (
              <div key={category}>
                <p className="mb-1.5 text-xs font-semibold tracking-wide text-zinc-500 uppercase">{category}</p>
                <div className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                  {items.map((item) => (
                    <label key={item.item_id} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800">
                      <input
                        type="checkbox"
                        checked={form.requirements.includes(item.item_id)}
                        onChange={() => toggleItem(item.item_id)}
                        className="h-4 w-4 rounded border-zinc-300 accent-blue-600"
                      />
                      {item.item_name}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {groups.length === 0 && <p className="text-sm text-zinc-500">Loading the checklist...</p>}
          </div>

          <div className="mt-4 space-y-3 border-t border-zinc-200 pt-4">
            <Field label="Anything else? (optional)">
              <Textarea name="requirements_notes" value={form.requirements_notes} onChange={update} placeholder="For example: two cordless mics and a lectern" />
            </Field>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-800">
              <input
                type="checkbox"
                checked={form.no_requirements}
                onChange={(event) => toggleNone(event.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 accent-blue-600"
              />
              I don't need any equipment or arrangements for this event
            </label>
          </div>
        </fieldset>
      )}

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
