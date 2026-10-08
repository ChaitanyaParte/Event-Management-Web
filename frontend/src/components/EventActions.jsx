import { useState } from 'react';
import { CalendarPlus, Check, Share2 } from 'lucide-react';
import { downloadIcs, googleCalendarUrl } from '../lib/calendar';
import { btnLight } from '../lib/ui';

const optionClass = 'block w-full rounded px-3 py-2 text-left text-sm font-medium hover:bg-pop-cyan hover:text-black';

export default function EventActions({ event }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const pageUrl = `${window.location.origin}/events/${event.event_id}`;

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text: `Join me at ${event.title} on CampusX`, url: pageUrl });
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(pageUrl);
    } catch {
      window.prompt('Copy this link to share the event:', pageUrl);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={share} className={`${btnLight} inline-flex items-center gap-2`}>
          {copied ? <Check size={16} /> : <Share2 size={16} />}
          {copied ? 'Link copied' : 'Share'}
        </button>
        <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} className={`${btnLight} inline-flex items-center gap-2`}>
          <CalendarPlus size={16} /> Add to calendar
        </button>
      </div>

      {menuOpen && (
        <div className="mt-3 w-full max-w-xs rounded-md border-2 border-ink p-1">
          <a
            href={googleCalendarUrl(event, pageUrl)}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMenuOpen(false)}
            className={optionClass}
          >
            Google Calendar
          </a>
          <button
            type="button"
            onClick={() => {
              downloadIcs(event, pageUrl);
              setMenuOpen(false);
            }}
            className={optionClass}
          >
            Apple, Outlook and others (.ics)
          </button>
        </div>
      )}
    </div>
  );
}
