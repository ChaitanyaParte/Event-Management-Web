import { getToken } from './auth';

export async function api(path, { method = 'GET', body, role } = {}) {
  const isUpload = body instanceof FormData;
  const headers = isUpload ? {} : { 'Content-Type': 'application/json' };
  const token = role ? getToken(role) : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body: isUpload ? body : body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.message || 'Something went wrong. Try again.');
    error.status = response.status;
    throw error;
  }
  return data;
}

export const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

const pad = (number) => String(number).padStart(2, '0');

export const toDateInput = (value) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const toTimeInput = (value) => String(value || '').slice(0, 5);

export const formatTime = (value) => {
  if (!value) return '';
  const [hours, minutes] = String(value).split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes));
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

// Uploads, replaces or removes an event banner after the event itself has been saved.
export async function saveEventImage(call, eventId, { file, remove }) {
  if (file) {
    const form = new FormData();
    form.append('image', file);
    await call(`/events/${eventId}/image`, { method: 'POST', body: form });
  } else if (remove) {
    await call(`/events/${eventId}/image`, { method: 'DELETE' });
  }
}
