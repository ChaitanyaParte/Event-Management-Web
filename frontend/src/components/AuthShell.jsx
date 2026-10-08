const roles = [
  { id: 'student', label: 'Student' },
  { id: 'organizer', label: 'Organizer' },
  { id: 'admin', label: 'Admin' },
];

export function RoleTabs({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2" role="tablist">
      {roles.map((role) => (
        <button
          key={role.id}
          type="button"
          role="tab"
          aria-selected={value === role.id}
          onClick={() => onChange(role.id)}
          className={`rounded-md border-2 border-ink px-3 py-2 text-sm font-semibold transition ${
            value === role.id ? 'bg-pop-pink shadow-[3px_3px_0_0_var(--color-ink)]' : 'bg-white hover:bg-pop-cyan'
          }`}
        >
          {role.label}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, ...props }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        {...props}
        className="mt-1 w-full rounded-md border-2 border-ink bg-white px-3 py-2 outline-none focus:bg-pop-lime/40"
      />
    </label>
  );
}

export function AuthCard({ title, subtitle, children }) {
  return (
    <div className="mx-auto mt-6 w-full max-w-md rounded-xl border-2 border-ink bg-white p-6 shadow-[6px_6px_0_0_var(--color-ink)]">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-1 mb-5 text-sm">{subtitle}</p>
      {children}
    </div>
  );
}
