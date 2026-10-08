export const card = 'rounded-xl border-2 border-ink bg-white shadow-[5px_5px_0_0_#111]';

export const btnDark =
  'rounded-md border-2 border-ink bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:bg-pop-cyan hover:text-ink disabled:opacity-60';

export const btnLight =
  'rounded-md border-2 border-ink bg-white px-4 py-2 text-sm font-semibold transition hover:bg-pop-pink disabled:opacity-60';

export const statusColor = {
  Upcoming: 'bg-pop-cyan',
  Ongoing: 'bg-pop-lime',
  Completed: 'bg-white',
  Cancelled: 'bg-pop-orange',
  Registered: 'bg-pop-lime',
};

export const chip = (status) =>
  `inline-block rounded-full border-[1.5px] border-ink px-2.5 py-0.5 text-xs font-medium ${statusColor[status] || 'bg-white'}`;
