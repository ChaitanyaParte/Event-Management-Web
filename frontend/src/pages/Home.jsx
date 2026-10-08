import { useEffect, useMemo, useState } from 'react';
import EventCard from '../components/EventCard';
import { api } from '../lib/api';

export default function Home() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    Promise.all([api('/events'), api('/categories')])
      .then(([eventList, categoryList]) => {
        setEvents(eventList);
        setCategories(categoryList);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  const visibleEvents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return events.filter(
      (event) =>
        (event.status === 'Upcoming' || event.status === 'Ongoing') &&
        (category === 'All' || event.category_name === category) &&
        (!term || event.title.toLowerCase().includes(term)),
    );
  }, [events, category, search]);

  return (
    <>
      <section className="py-10 sm:py-14">
        <h1 className="max-w-3xl text-5xl font-bold leading-tight sm:text-6xl">Fest season is here</h1>
        <p className="mt-4 max-w-xl text-lg">
          Pick an event, grab a seat, collect your certificate. Everything happening on campus, in one place.
        </p>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search events"
          className="mt-6 w-full max-w-md rounded-md border-2 border-ink bg-white px-4 py-2.5 outline-none focus:bg-pop-lime/40"
        />
      </section>

      <section>
        <div className="mb-6 flex flex-wrap gap-2">
          {['All', ...categories.map((item) => item.category_name)].map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setCategory(name)}
              className={`rounded-full border-2 border-ink px-4 py-1 text-sm font-medium transition ${
                category === name ? 'bg-ink text-paper' : 'bg-white hover:bg-pop-cyan'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {status === 'loading' && <p>Loading events...</p>}
        {status === 'error' && <p>Couldn't load events. Check that the server is running.</p>}
        {status === 'ready' && visibleEvents.length === 0 && (
          <p className="rounded-xl border-2 border-dashed border-ink p-8 text-center">No events match right now. Check back soon.</p>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleEvents.map((event, index) => (
            <EventCard key={event.event_id} event={event} index={index} />
          ))}
        </div>
      </section>
    </>
  );
}
