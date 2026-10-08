import { toDateInput } from './api';

const compact = (date, time) => `${date.replace(/-/g, '')}T${String(time).slice(0, 5).replace(':', '')}00`;

const eventTimes = (event) => {
  const date = toDateInput(event.event_date);
  return { start: compact(date, event.start_time), end: compact(date, event.end_time) };
};

export const googleCalendarUrl = (event, pageUrl) => {
  const { start, end } = eventTimes(event);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: `${event.description || ''}\n\n${pageUrl}`.trim(),
    location: event.venue || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const escapeIcs = (text) =>
  String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');

export const downloadIcs = (event, pageUrl) => {
  const { start, end } = eventTimes(event);
  const stamp = `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CampusX Events//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:event-${event.event_id}@campusx`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(`${event.description || ''}\n\n${pageUrl}`.trim())}`,
    `LOCATION:${escapeIcs(event.venue)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'event'}.ics`;
  link.click();
  URL.revokeObjectURL(url);
};
