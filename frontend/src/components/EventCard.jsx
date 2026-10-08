import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatTime } from '../lib/api';

const palettes = ['bg-pop-pink', 'bg-pop-cyan', 'bg-pop-lime', 'bg-pop-orange', 'bg-pop-violet'];

export default function EventCard({ event, index }) {
  const { roles } = useAuth();
  const color = palettes[index % palettes.length];
  const detailsPath = roles.length > 0 ? `/events/${event.event_id}` : '/login';

  return (
    <article className={`${color} flex flex-col justify-between rounded-xl border-2 border-ink p-5 shadow-[5px_5px_0_0_#111]`}>
      <div>
        <div className="mb-3 flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-full border-[1.5px] border-ink bg-white px-2.5 py-0.5">{event.category_name}</span>
          <span className="rounded-full border-[1.5px] border-ink bg-white px-2.5 py-0.5">{event.status}</span>
        </div>
        <h3 className="text-xl font-semibold leading-snug">{event.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm">{event.description || 'Details coming soon.'}</p>
      </div>
      <div className="mt-5">
        <p className="text-sm font-medium">
          {formatDate(event.event_date)} &middot; {formatTime(event.start_time)}
        </p>
        <p className="text-sm">{event.venue} &middot; {event.available_seats} seats left</p>
        <Link
          to={detailsPath}
          className="mt-4 inline-block rounded-md border-2 border-ink bg-ink px-4 py-1.5 text-sm font-semibold text-paper transition hover:bg-white hover:text-ink"
        >
          View details
        </Link>
      </div>
    </article>
  );
}
