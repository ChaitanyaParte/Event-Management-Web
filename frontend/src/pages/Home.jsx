import { useEffect, useMemo, useState } from 'react';
import EventCard from '../components/EventCard';
import { api, toDateInput } from '../lib/api';

const sortOptions = [
  { value: 'soonest', label: 'Soonest first' },
  { value: 'latest', label: 'Latest first' },
  { value: 'popular', label: 'Most popular' },
];

const startOf = (event) => `${toDateInput(event.event_date)} ${event.start_time}`;

const sorters = {
  soonest: (a, b) => startOf(a).localeCompare(startOf(b)),
  latest: (a, b) => startOf(b).localeCompare(startOf(a)),
  popular: (a, b) => Number(b.registered_count) - Number(a.registered_count) || startOf(a).localeCompare(startOf(b)),
};

const fieldClass = 'rounded-md border-2 border-ink bg-white px-3 py-2 text-sm outline-none focus:bg-pop-lime/40';

export default function Home() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState('soonest');
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
    return events
      .filter((event) => {
        const day = toDateInput(event.event_date);
        return (
          (event.status === 'Upcoming' || event.status === 'Ongoing') &&
          (category === 'All' || event.category_name === category) &&
          (!term || event.title.toLowerCase().includes(term)) &&
          (!from || day >= from) &&
          (!to || day <= to)
        );
      })
      .sort(sorters[sort]);
  }, [events, category, search, from, to, sort]);

  const filtersActive = Boolean(search || from || to || category !== 'All' || sort !== 'soonest');
  const clearFilters = () => {
    setSearch('');
    setFrom('');
    setTo('');
    setCategory('All');
    setSort('soonest');
  };

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
          aria-label="Search events"
          className="mt-6 w-full max-w-md rounded-md border-2 border-ink bg-white px-4 py-2.5 outline-none focus:bg-pop-lime/40"
        />
      </section>

      <section>
        <div className="mb-4 flex flex-wrap gap-2">
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

        <div className="mb-6 flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold uppercase tracking-wide">
            From
            <input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} className={`${fieldClass} mt-1 block normal-case`} />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide">
            To
            <input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} className={`${fieldClass} mt-1 block normal-case`} />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide">
            Sort by
            <select value={sort} onChange={(event) => setSort(event.target.value)} className={`${fieldClass} mt-1 block normal-case`}>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          {filtersActive && (
            <button type="button" onClick={clearFilters} className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm font-semibold hover:bg-pop-pink hover:text-black">
              Clear filters
            </button>
          )}
        </div>

        {status === 'loading' && <p>Loading events...</p>}
        {status === 'error' && <p>Couldn't load events. Check that the server is running.</p>}
        {status === 'ready' && visibleEvents.length === 0 && (
          <p className="rounded-xl border-2 border-dashed border-ink p-8 text-center">No events match right now. Try different dates or clear the filters.</p>
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
